import { createHash } from 'node:crypto';

export const dailyOtpLimit = 10;
export const bangkokDay = (now = new Date()) => new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

export class OtpRequestError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

/** Call inside the same transaction as creating/updating the OTP. */
export async function reserveOtpRequest(tx, email, now = new Date()) {
  const emailHash = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
  const day = bangkokDay(now);
  const insert = tx.dialect === 'postgres'
    ? `INSERT INTO ${tx.otpRequests} (email_hash, request_day, request_count) VALUES (?, ?, 0)
       ON CONFLICT (email_hash, request_day) DO NOTHING`
    : `INSERT INTO ${tx.otpRequests} (email_hash, request_day, request_count) VALUES (?, ?, 0)
       ON DUPLICATE KEY UPDATE email_hash = email_hash`;
  await tx.execute(insert, [emailHash, day]);
  // Conditional UPDATE locks the row: simultaneous requests cannot pass the limit.
  const [result] = await tx.execute(
    `UPDATE ${tx.otpRequests} SET request_count = request_count + 1
     WHERE email_hash = ? AND request_day = ? AND request_count < ?`,
    [emailHash, day, dailyOtpLimit],
  );
  if (result.affectedRows !== 1) throw new OtpRequestError('otp_daily_limit');
}
