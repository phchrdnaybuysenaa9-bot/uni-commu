import { createHash } from 'node:crypto';
import { readJson } from './read-json.mjs';
import { verifyOtp } from './email-otp.mjs';

export function hashVerificationToken(token) {
  return createHash('sha256').update(token).digest();
}

export async function verifyEmail(request, pool) {
  const result = await readJson(request);
  if (result.status) return result;

  try {
    if (result.input?.challenge !== undefined) return await verifyOtp(result.input, pool);

    const token = result.input?.token;
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      return { status: 400, body: { error: 'invalid_or_expired_token' } };
    }
    const [update] = await pool.execute(
      `UPDATE ${pool.users}
       SET email_verified_at = ${pool.now}, email_verification_token_hash = NULL,
           email_verification_expires_at = NULL
       WHERE email_verification_token_hash = ? AND email_verified_at IS NULL
         AND email_verification_challenge_hash IS NULL
         AND email_verification_expires_at > ${pool.now}`,
      [hashVerificationToken(token)],
    );
    if (update.affectedRows === 0) {
      return { status: 400, body: { error: 'invalid_or_expired_token' } };
    }
    return { status: 200, body: { status: 'verified' } };
  } catch (error) {
    console.error('Email verification failed:', error.code ?? error.name);
    return { status: 503, body: { error: 'verification_unavailable' } };
  }
}

export const verificationPage = `<!doctype html>
<html lang="th">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ยืนยันอีเมล UniCommu</title>
<main>
  <h1>ยืนยันอีเมล UniCommu</h1>
  <button type="button" id="verify" disabled>ยืนยันอีเมล</button>
  <p id="status" role="status"></p>
</main>
<script>
  const button = document.getElementById('verify');
  const status = document.getElementById('status');
  const token = location.hash.slice(1);
  button.disabled = !token;
  if (!token) status.textContent = 'กรุณาเปิดลิงก์ยืนยันอีเมลฉบับเต็ม';

  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const response = await fetch('/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
        history.replaceState(null, '', location.pathname);
        status.textContent = 'ยืนยันอีเมลสำเร็จ';
        return;
      }
      if (response.status === 400) {
        status.textContent = 'ลิงก์ใช้ไม่ได้ หมดอายุ หรือถูกใช้ไปแล้ว';
        return;
      }
    } catch {
      // The button is re-enabled below for temporary connection failures.
    }
    status.textContent = 'ยืนยันอีเมลไม่ได้ในตอนนี้ กรุณาลองอีกครั้ง';
    button.disabled = false;
  });
</script>
</html>`;
