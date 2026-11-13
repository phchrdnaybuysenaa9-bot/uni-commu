import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bangkokDay, reserveOtpRequest } from '../otp-quota.mjs';

test('daily boundary is midnight in Thailand, regardless of server timezone', () => {
  assert.equal(bangkokDay(new Date('2026-11-12T16:59:59.999Z')), '2026-11-12');
  assert.equal(bangkokDay(new Date('2026-11-12T17:00:00Z')), '2026-11-13');
});

test('daily quota refuses the eleventh request and normalizes email case', async () => {
  const counts = new Map();
  const tx = { dialect: 'postgres', otpRequests: 'otp_daily_requests', async execute(sql, params) {
    const key = params.slice(0, 2).join(':');
    if (sql.startsWith('INSERT')) { if (!counts.has(key)) counts.set(key, 0); return [{ affectedRows: 1 }]; }
    if (counts.get(key) >= params[2]) return [{ affectedRows: 0 }];
    counts.set(key, counts.get(key) + 1);
    return [{ affectedRows: 1 }];
  } };
  const now = new Date('2026-11-12T12:00:00Z');
  for (let i = 0; i < 10; i++) await reserveOtpRequest(tx, i % 2 ? ' Student@rmutp.ac.th ' : 'student@rmutp.ac.th', now);
  await assert.rejects(reserveOtpRequest(tx, 'student@rmutp.ac.th', now), { code: 'otp_daily_limit' });
  await reserveOtpRequest(tx, 'another@rmutp.ac.th', now);
  await reserveOtpRequest(tx, 'student@rmutp.ac.th', new Date('2026-11-12T17:00:00Z'));
  assert.deepEqual([...counts.values()], [10, 1, 1]);
});
