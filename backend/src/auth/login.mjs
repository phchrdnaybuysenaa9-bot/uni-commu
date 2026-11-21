import { createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { readJson } from '../http/read-json.mjs';
import { normalizeUniversityEmail } from './university-email.mjs';
import { createSession } from './session.mjs';

const deriveKey = promisify(scrypt);
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
// Missing users still perform the same password derivation.
const dummyHash = `scrypt$32768$8$3$${'00'.repeat(16)}$${'00'.repeat(32)}`;

export async function verifyPassword(password, encoded) {
  const match = /^scrypt\$32768\$8\$3\$([a-f0-9]{32})\$([a-f0-9]{64})$/.exec(encoded ?? '');
  const actual = match ?? /^scrypt\$32768\$8\$3\$([a-f0-9]{32})\$([a-f0-9]{64})$/.exec(dummyHash);
  const derived = await deriveKey(password.normalize('NFC'), Buffer.from(actual[1], 'hex'), 32, options);
  return timingSafeEqual(derived, Buffer.from(actual[2], 'hex')) && Boolean(match);
}

// Bounded per-process limiter. Do not trust client-supplied X-Forwarded-For.
export function createLoginHandler({ now = Date.now } = {}) {
  const attempts = new Map();
  let active = 0;
  function allow(key, maximum) {
    const time = now();
    for (const [id, entry] of attempts) if (entry.until <= time) attempts.delete(id);
    const entry = attempts.get(key);
    if (entry) {
      if (entry.count >= maximum) return false;
      entry.count++;
    } else {
      if (attempts.size >= 10000) return false;
      attempts.set(key, { count: 1, until: time + 15 * 60 * 1000 });
    }
    return true;
  }
  return async function login(request, pool) {
    const result = await readJson(request);
    if (result.status) return result;
    const email = normalizeUniversityEmail(result.input?.email);
    if (!email) return { status: 400, body: { error: 'university_email_required' } };
    const password = result.input?.password;
    if (typeof password !== 'string' || !password || password.length > 512 || [...password.normalize('NFC')].length > 128) {
      return { status: 401, body: { error: 'invalid_credentials' } };
    }
    const identity = createHash('sha256').update(email).digest('hex');
    if (!allow(`ip:${request.socket?.remoteAddress ?? 'unknown'}`, 100) || !allow(`email:${identity}`, 20)) {
      return { status: 429, body: { error: 'login_rate_limited' } };
    }
    if (active >= 4) return { status: 503, body: { error: 'login_busy' } };
    active++;
    try {
      const [users] = await pool.execute(
        `SELECT id, display_name, role, password_hash, email_verified_at FROM ${pool.users} WHERE email = ?`, [email],
      );
      const user = users[0];
      const valid = await verifyPassword(password, user?.password_hash ?? dummyHash);
      if (!user || !valid) return { status: 401, body: { error: 'invalid_credentials' } };
      if (!user.email_verified_at) return { status: 403, body: { error: 'email_not_verified' } };
      return { status: 200, body: await createSession(pool, user) };
    } catch (error) {
      console.error('Login failed:', error.code ?? error.name);
      return { status: 503, body: { error: 'login_unavailable' } };
    } finally {
      active--;
    }
  };
}
