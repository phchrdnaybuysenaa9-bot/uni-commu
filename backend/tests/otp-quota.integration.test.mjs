import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createDatabase } from '../src/database/connection.mjs';
import { reserveOtpRequest } from '../src/auth/otp-quota.mjs';
import { Readable } from 'node:stream';
import { register } from '../src/auth/register.mjs';
import { resendOtp, verifyOtp } from '../src/auth/email-otp.mjs';

function request(input) {
  const stream = Readable.from([Buffer.from(JSON.stringify(input))]);
  stream.headers = { 'content-type': 'application/json' };
  return stream;
}

test('registration and resend share the quota without counting duplicates or cooldown rejections', {
  skip: process.env.RUN_DB_TESTS !== 'true',
}, async () => {
  const database = createDatabase(process.env);
  const email = `quota-${randomUUID()}@rmutp.ac.th`;
  const emailHash = createHash('sha256').update(email).digest('hex');
  const input = { email, displayName: 'Quota integration test', password: 'OnlyForTest123456' };
  const count = async () => {
    const [rows] = await database.execute(`SELECT request_count FROM ${database.otpRequests} WHERE email_hash = ?`, [emailHash]);
    return Number(rows[0].request_count);
  };
  const allowResend = () => database.execute(
    `UPDATE ${database.users} SET email_verification_expires_at = ${database.now} WHERE email = ?`, [email],
  );
  try {
    const created = await register(request(input), database, undefined, true);
    assert.equal(created.status, 201);
    const challenge = created.body.challenge;
    assert.equal((await register(request(input), database, undefined, true)).status, 409);
    assert.equal((await resendOtp(request({ challenge }), database, undefined, true)).body.error, 'otp_resend_wait');
    assert.equal(await count(), 1);
    let code;
    for (let index = 1; index < 10; index++) {
      await allowResend();
      const resent = await resendOtp(request({ challenge }), database, undefined, true);
      assert.equal(resent.status, 200);
      code = resent.body.testCode;
    }
    assert.equal(await count(), 10);
    const blocked = await resendOtp(request({ challenge }), database, undefined, true);
    assert.equal(blocked.status, 429);
    assert.equal(blocked.body.error, 'otp_daily_limit');
    assert.equal(await count(), 10);
    // Denying a new request must leave the last valid code usable.
    assert.equal((await verifyOtp({ challenge, code }, database)).status, 200);
  } finally {
    await database.execute(`DELETE FROM ${database.users} WHERE email = ?`, [email]);
    await database.execute(`DELETE FROM ${database.otpRequests} WHERE email_hash = ?`, [emailHash]);
    await database.close();
  }
});

test('database serializes simultaneous requests and rolls back denied OTP changes', {
  skip: process.env.RUN_DB_TESTS !== 'true',
}, async () => {
  const database = createDatabase(process.env);
  const email = `quota-test-${randomUUID()}@example.invalid`;
  const emailHash = createHash('sha256').update(email).digest('hex');
  const day = new Date('2026-11-12T12:00:00Z');
  const request = () => database.transaction((tx) => reserveOtpRequest(tx, email, day));
  try {
    await assert.rejects(database.transaction(async (tx) => {
      await reserveOtpRequest(tx, email, day);
      throw new Error('simulated rejected OTP update');
    }));
    const [empty] = await database.execute(`SELECT request_count FROM ${database.otpRequests} WHERE email_hash = ?`, [emailHash]);
    assert.equal(empty.length, 0);
    let successes = 0;
    let blocked = 0;
    // Five concurrent requests fit both configured connection pools.
    for (let batch = 0; batch < 5; batch++) {
      const results = await Promise.allSettled(Array.from({ length: 5 }, request));
      for (const result of results) {
        if (result.status === 'fulfilled') successes++;
        else { assert.equal(result.reason.code, 'otp_daily_limit'); blocked++; }
      }
    }
    assert.equal(successes, 10);
    assert.equal(blocked, 15);
    await database.transaction((tx) => reserveOtpRequest(tx, email, new Date('2026-11-12T17:00:00Z')));
    const [rows] = await database.execute(`SELECT request_count FROM ${database.otpRequests} WHERE email_hash = ? ORDER BY request_day`, [emailHash]);
    assert.deepEqual(rows.map((row) => Number(row.request_count)), [10, 1]);
  } finally {
    await database.execute(`DELETE FROM ${database.otpRequests} WHERE email_hash = ?`, [emailHash]);
    await database.close();
  }
});
