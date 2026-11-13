import { createHash, createHmac, randomInt } from 'node:crypto';
import { readJson } from '../http/read-json.mjs';
import { OtpRequestError, reserveOtpRequest } from './otp-quota.mjs';

export const createEmailOtp = () => String(randomInt(1_000_000)).padStart(6, '0');
export const hashChallenge = (challenge) => createHash('sha256').update(challenge).digest();
export const hashOtp = (challenge, code) => createHmac('sha256', challenge).update(code).digest();

export async function verifyOtp(input, pool) {
  const { challenge, code } = input;
  if (!validChallenge(challenge) || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return { status: 400, body: { error: 'invalid_otp' } };
  }

  const challengeHash = hashChallenge(challenge);
  const active = `email_verification_challenge_hash = ? AND email_verified_at IS NULL
    AND email_verification_expires_at > ${pool.now} AND email_verification_attempts < 5`;
  const [update] = await pool.execute(
    `UPDATE ${pool.users} SET email_verified_at = ${pool.now}, email_verification_token_hash = NULL,
       email_verification_challenge_hash = NULL, email_verification_expires_at = NULL,
       email_verification_attempts = 0
     WHERE ${active} AND email_verification_token_hash = ?`,
    [challengeHash, hashOtp(challenge, code)],
  );
  if (update.affectedRows === 1) return { status: 200, body: { status: 'verified' } };

  await pool.execute(
    `UPDATE ${pool.users} SET email_verification_attempts = email_verification_attempts + 1 WHERE ${active}`,
    [challengeHash],
  );
  return { status: 400, body: { error: 'invalid_otp' } };
}

export async function resendOtp(request, pool, deliver, local) {
  const result = await readJson(request);
  if (result.status) return result;
  const challenge = result.input?.challenge;
  if (!validChallenge(challenge)) return { status: 400, body: { error: 'invalid_otp' } };
  if (!local && !deliver) return { status: 503, body: { error: 'email_delivery_unavailable' } };

  try {
    const challengeHash = hashChallenge(challenge);
    const [users] = await pool.execute(
      `SELECT email FROM ${pool.users} WHERE email_verification_challenge_hash = ? AND email_verified_at IS NULL`,
      [challengeHash],
    );
    if (!users.length) return { status: 400, body: { error: 'invalid_otp' } };

    const code = createEmailOtp();
    await pool.transaction(async (tx) => {
      await reserveOtpRequest(tx, users[0].email);
      const [update] = await tx.execute(
        `UPDATE ${pool.users} SET email_verification_token_hash = ?, email_verification_attempts = 0,
           email_verification_expires_at = ${pool.otpExpiry}
         WHERE email_verification_challenge_hash = ? AND email_verified_at IS NULL
           AND email_verification_expires_at <= ${pool.resendCutoff}`,
        [hashOtp(challenge, code), challengeHash],
      );
      if (!update.affectedRows) throw new OtpRequestError('otp_resend_wait');
    });
    if (!local) await deliver(users[0].email, code);
    return { status: 200, body: local ? { testCode: code } : { status: 'sent' } };
  } catch (error) {
    if (error.code === 'otp_daily_limit' || error.code === 'otp_resend_wait') {
      return { status: 429, body: { error: error.code } };
    }
    console.error('OTP resend failed:', error.code ?? error.name);
    return { status: 503, body: { error: 'email_delivery_unavailable' } };
  }
}

function validChallenge(challenge) {
  return typeof challenge === 'string' && /^[A-Za-z0-9_-]{43}$/.test(challenge);
}
