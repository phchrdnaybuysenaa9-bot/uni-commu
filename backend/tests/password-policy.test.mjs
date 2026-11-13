import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { register } from '../register.mjs';
import { checkRegistrationPassword } from '../password-policy.mjs';

function request(password) {
  const stream = Readable.from([Buffer.from(JSON.stringify({
    email: 'policy-test@rmutp.ac.th', displayName: 'Policy test', password,
  }))]);
  stream.headers = { 'content-type': 'application/json' };
  return stream;
}

test('short or invalid passwords fail before database or delivery access', async () => {
  for (const password of ['', 'short123', 'ไทย', undefined, 123456, 'A'.repeat(8)]) {
    const result = await register(request(password), undefined, undefined, true);
    assert.equal(result.status, 400);
    assert.equal(result.body.error, 'invalid_password_length');
  }
});

test('passphrases without uppercase, numbers or symbols work in real and test modes', async () => {
  for (const local of [true, false]) {
    let inserted = false;
    let delivered = false;
    const pool = {
      users: 'users', otpExpiry: 'CURRENT_TIMESTAMP',
      async transaction(work) {
        return work({ dialect: 'postgres', otpRequests: 'otp_daily_requests',
          async execute(sql) {
            if (sql.includes('INSERT INTO users')) inserted = true;
            return [{ affectedRows: 1 }];
          },
        });
      },
    };
    const result = await register(request('purple campus afternoon'), pool, async () => { delivered = true; }, local);
    assert.equal(result.status, 201);
    assert.equal(inserted, true);
    assert.equal(delivered, !local);
  }
});

test('common and contextual whole passwords are blocked without rejecting words in phrases', () => {
  const check = (value) => checkRegistrationPassword(value, 'policy-test@rmutp.ac.th', 'Test Student');
  assert.equal(check('calmriver').error, undefined);
  assert.equal(check('123456789012345').error, 'password_too_common');
  assert.equal(check('policy-test123456').error, 'password_too_common');
  assert.equal(check('a password for my purple campus').error, undefined);
  assert.equal(check('é'.repeat(9)).error, undefined);
  assert.equal(check('e\u0301'.repeat(9)).password, 'é'.repeat(9));
  assert.equal(check('e\u0301'.repeat(8)).error, 'invalid_password_length');
  assert.equal(check('🟣'.repeat(128)).error, undefined);
});

test('oversized passwords remain bounded before hashing', async () => {
  const result = await register(request('A'.repeat(129)), undefined, undefined, false);
  assert.equal(result.body.error, 'invalid_password_length');
});
