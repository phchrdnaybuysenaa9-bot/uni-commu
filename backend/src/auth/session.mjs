import { createHash, randomBytes } from 'node:crypto';

export const sessionLifetimeMs = 24 * 60 * 60 * 1000;
export const hashSessionToken = (token) => createHash('sha256').update(token).digest();
const invalidSession = () => ({ status: 401, body: { error: 'session_expired' } });

export function publicUser(user) {
  return { id: String(user.id), name: user.display_name, role: user.role };
}

export async function createSession(pool, user) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  await pool.execute(
    `INSERT INTO ${pool.sessions} (token_hash, user_id, expires_at) VALUES (?, ?, ?)`,
    [hashSessionToken(token), user.id, expiresAt],
  );
  return { token, expiresAt: expiresAt.toISOString(), user: publicUser(user) };
}

function bearerToken(request) {
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(request.headers.authorization ?? '');
  return match?.[1];
}

export async function currentSession(request, pool) {
  const token = bearerToken(request);
  if (!token) return invalidSession();
  try {
    const [users] = await pool.execute(
      `SELECT u.id, u.display_name, u.role, s.expires_at FROM ${pool.sessions} s
       JOIN ${pool.users} u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ${pool.now}
         AND u.email_verified_at IS NOT NULL`,
      [hashSessionToken(token)],
    );
    if (!users.length) return invalidSession();
    return { status: 200, body: { user: publicUser(users[0]), expiresAt: new Date(users[0].expires_at).toISOString() } };
  } catch (error) {
    console.error('Session check failed:', error.code ?? error.name);
    return { status: 503, body: { error: 'login_unavailable' } };
  }
}

export async function logout(request, pool) {
  const token = bearerToken(request);
  if (!token) return invalidSession();
  try {
    await pool.execute(`DELETE FROM ${pool.sessions} WHERE token_hash = ?`, [hashSessionToken(token)]);
    return { status: 200, body: { status: 'logged_out' } };
  } catch (error) {
    console.error('Logout failed:', error.code ?? error.name);
    return { status: 503, body: { error: 'login_unavailable' } };
  }
}
