import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { createDatabase } from '../src/database/connection.mjs';
import { register } from '../src/auth/register.mjs';
import { createLoginHandler } from '../src/auth/login.mjs';
import { currentSession, logout } from '../src/auth/session.mjs';

test('database login requires verification, persists hashed sessions and revokes logout', {
  skip: process.env.RUN_AUTH_DB_TESTS !== 'true',
}, async () => {
  const db = createDatabase(process.env);
  const email = `auth-test-${randomUUID()}@rmutp.ac.th`;
  const password = 'violet rivers flow beside campus';
  function request(extra = {}) {
    const req = Readable.from([Buffer.from(JSON.stringify({ email, displayName: 'Auth test', password, ...extra }))]);
    req.headers = { 'content-type': 'application/json' };
    req.socket = { remoteAddress: '127.0.0.1' };
    return req;
  }
  try {
    assert.equal((await register(request(), db, undefined, true)).status, 201);
    const login = createLoginHandler();
    assert.equal((await login(request(), db)).status, 403);
    await db.execute(`UPDATE ${db.users} SET email_verified_at = ${db.now} WHERE email = ?`, [email]);
    assert.equal((await login(request({ password: 'wrong password' }), db)).status, 401);
    const result = await login(request(), db);
    assert.equal(result.status, 200);
    const req = { headers: { authorization: `Bearer ${result.body.token}` } };
    assert.equal((await currentSession(req, db)).status, 200);
    const other = createDatabase(process.env);
    try { assert.equal((await currentSession(req, other)).status, 200); }
    finally { await other.close(); }
    assert.equal((await logout(req, db)).status, 200);
    assert.equal((await currentSession(req, db)).status, 401);
  } finally {
    // Delete only the synthetic account created by this test; sessions cascade.
    await db.execute(`DELETE FROM ${db.users} WHERE email = ?`, [email]);
    const { createHash } = await import('node:crypto');
    await db.execute(`DELETE FROM ${db.otpRequests} WHERE email_hash = ?`, [createHash('sha256').update(email).digest('hex')]);
    await db.close();
  }
});
