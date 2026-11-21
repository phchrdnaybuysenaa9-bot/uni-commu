import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { randomBytes, scryptSync } from 'node:crypto';
import { createLoginHandler, verifyPassword } from '../src/auth/login.mjs';
import { currentSession, hashSessionToken, logout } from '../src/auth/session.mjs';
import { normalizeUniversityEmail } from '../src/auth/university-email.mjs';

const password = 'purple campus afternoon';
const salt = randomBytes(16);
const digest = scryptSync(password, salt, 32, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
const encoded = `scrypt$32768$8$3$${salt.toString('hex')}$${digest.toString('hex')}`;
function request(email = 'student@rmutp.ac.th', value = password) {
  const req = Readable.from([Buffer.from(JSON.stringify({ email, password: value }))]);
  req.headers = { 'content-type': 'application/json' };
  req.socket = { remoteAddress: '127.0.0.1' };
  return req;
}
function database(user) {
  const sessions = new Map();
  return {
    users: 'users', sessions: 'sessions', now: 'CURRENT_TIMESTAMP', saved: sessions,
    async execute(sql, params) {
      if (sql.startsWith('INSERT INTO sessions')) {
        sessions.set(params[0].toString('hex'), { userId: params[1], expires: params[2] });
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('DELETE FROM sessions')) {
        return [{ affectedRows: Number(sessions.delete(params[0].toString('hex'))) }];
      }
      if (sql.includes('JOIN users')) {
        const session = sessions.get(params[0].toString('hex'));
        return [session && session.expires > new Date() && user?.email_verified_at
          ? [{ ...user, expires_at: session.expires }] : []];
      }
      assert.equal(params[0], 'student@rmutp.ac.th');
      return [user ? [user] : []];
    },
  };
}
const user = { id: 42, display_name: 'Student', role: 'student', password_hash: encoded, email_verified_at: new Date() };

test('university domain is exact and checked before accessing the database', async () => {
  assert.equal(normalizeUniversityEmail(' STUDENT@RMUTP.AC.TH '), 'student@rmutp.ac.th');
  for (const email of ['student@gmail.com', 'student@rmutp.ac.th.evil.test', 'student@sub.rmutp.ac.th', 'x@@rmutp.ac.th']) {
    assert.equal((await createLoginHandler()(request(email), undefined)).body.error, 'university_email_required');
  }
});

test('wrong password, missing account and unverified account cannot create sessions', async () => {
  for (const [account, candidate, status, error] of [
    [user, 'incorrect password', 401, 'invalid_credentials'],
    [undefined, password, 401, 'invalid_credentials'],
    [{ ...user, email_verified_at: null }, password, 403, 'email_not_verified'],
  ]) {
    const db = database(account);
    const result = await createLoginHandler()(request(undefined, candidate), db);
    assert.equal(result.status, status);
    assert.equal(result.body.error, error);
    assert.equal(db.saved.size, 0);
  }
});

test('valid login hashes the session token; lookup, expiry and logout enforce it', async () => {
  const db = database(user);
  const result = await createLoginHandler()(request(' STUDENT@RMUTP.AC.TH '), db);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.user, { id: '42', name: 'Student', role: 'student' });
  assert.equal(JSON.stringify(result.body).includes('password_hash'), false);
  const token = result.body.token;
  const key = hashSessionToken(token).toString('hex');
  assert.equal(db.saved.has(key), true);
  assert.equal(db.saved.has(token), false);
  const req = { headers: { authorization: `Bearer ${token}` } };
  assert.equal((await currentSession(req, db)).status, 200);
  db.saved.get(key).expires = new Date(Date.now() - 1000);
  assert.equal((await currentSession(req, db)).status, 401);
  db.saved.get(key).expires = new Date(Date.now() + 60000);
  await logout(req, db);
  assert.equal((await currentSession(req, db)).status, 401);
  assert.equal((await currentSession({ headers: {} }, db)).status, 401);
});

test('bounded login limiter stops repeated attempts and permits retry after the window', async () => {
  let time = 1000;
  let queries = 0;
  const login = createLoginHandler({ now: () => time });
  const db = { users: 'users', execute: async () => { queries++; throw { code: 'TEST_OFFLINE' }; } };
  const original = console.error;
  console.error = () => {};
  try {
    for (let i = 0; i < 20; i++) assert.equal((await login(request(), db)).status, 503);
    assert.equal((await login(request(), db)).status, 429);
    assert.equal(queries, 20);
    time += 15 * 60 * 1000;
    assert.equal((await login(request(), db)).status, 503);
    assert.equal(queries, 21);
  } finally { console.error = original; }
});

test('password checking preserves NFC semantics and rejects unsupported hash parameters', async () => {
  const composed = 'café campus';
  const hash = scryptSync(composed, salt, 32, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
  assert.equal(await verifyPassword('cafe\u0301 campus', `scrypt$32768$8$3$${salt.toString('hex')}$${hash.toString('hex')}`), true);
  assert.equal(await verifyPassword(password, encoded.replace('$32768$', '$999999999$')), false);
});
