import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { readJson } from '../http/read-json.mjs';
import { createEmailOtp, hashChallenge, hashOtp } from './email-otp.mjs';
import { reserveOtpRequest } from './otp-quota.mjs';
import { checkRegistrationPassword } from './password-policy.mjs';

const deriveKey = promisify(scrypt);
const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const universityEmail = /^[a-z0-9_+%-]+(?:\.[a-z0-9_+%-]+)*@rmutp\.ac\.th$/;

export async function register(request, pool, deliver, local) {
  const result = await readJson(request);
  if (result.status) return result;
  const { input } = result;

  const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (email.length > 76 || !universityEmail.test(email)) {
    return { status: 400, body: { error: 'university_email_required' } };
  }

  const displayName = typeof input?.displayName === 'string' ? input.displayName.trim() : '';
  if (!displayName || [...displayName].length > 100) {
    return { status: 400, body: { error: 'invalid_display_name' } };
  }

  const checkedPassword = checkRegistrationPassword(input?.password, email, displayName);
  if (checkedPassword.error) return { status: 400, body: { error: checkedPassword.error } };
  const { password } = checkedPassword;

  if (!local && !deliver) return { status: 503, body: { error: 'email_delivery_unavailable' } };

  try {
    const salt = randomBytes(16);
    const hash = await deriveKey(password, salt, 32, scryptOptions);
    const { N, r, p } = scryptOptions;
    const passwordHash = `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${hash.toString('hex')}`;
    const challenge = randomBytes(32).toString('base64url');
    const challengeHash = hashChallenge(challenge);
    const code = createEmailOtp();
    await pool.transaction(async (tx) => {
      await reserveOtpRequest(tx, email);
      await tx.execute(
        `INSERT INTO ${pool.users} (email, display_name, password_hash,
          email_verification_token_hash, email_verification_challenge_hash, email_verification_expires_at)
         VALUES (?, ?, ?, ?, ?, ${pool.otpExpiry})`,
        [email, displayName, passwordHash, hashOtp(challenge, code), challengeHash],
      );
    });
    if (!local) {
      try {
        await deliver(email, code);
      } catch (error) {
        await pool.execute(
          `DELETE FROM ${pool.users} WHERE email_verification_challenge_hash = ? AND email_verified_at IS NULL`,
          [challengeHash],
        );
        console.error('OTP email delivery failed:', error.code ?? error.name);
        return { status: 503, body: { error: 'email_delivery_unavailable' } };
      }
    }
    const body = { status: 'registered', emailVerified: false, challenge };
    if (local) body.testCode = code;
    return { status: 201, body };
  } catch (error) {
    if (error.code === 'otp_daily_limit') return { status: 429, body: { error: error.code } };
    if (error.code === 'ER_DUP_ENTRY' || (error.code === '23505' && error.constraint === 'uq_users_email')) {
      return { status: 409, body: { error: 'email_already_registered' } };
    }
    console.error('Registration failed:', error.code ?? error.name);
    return { status: 503, body: { error: 'registration_unavailable' } };
  }
}
