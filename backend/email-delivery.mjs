import nodemailer from 'nodemailer';

export function emailConfiguration(env = process.env) {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'];
  const missing = required.filter((key) => !env[key]?.trim());
  const port = Number(env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) missing.push('SMTP_PORT');
  return { missing, port };
}

export function createEmailTransport(env = process.env) {
  const { missing, port } = emailConfiguration(env);
  if (missing.length) throw new Error(`Missing or invalid email settings: ${missing.join(', ')}`);
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: true,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 7000,
  });
}

export function otpMessage(email, code, from) {
  if (!/^\d{6}$/.test(code)) throw new Error('OTP must contain exactly six digits');
  return {
    from, to: email, subject: 'รหัสยืนยันอีเมล UniCommu',
    text: `รหัสยืนยันอีเมลของคุณคือ ${code}\nรหัสนี้ใช้ได้ 10 นาที และใช้ได้ครั้งเดียว\nหากคุณไม่ได้สมัคร UniCommu กรุณาเพิกเฉยต่ออีเมลนี้ และอย่าแบ่งปันรหัสกับผู้อื่น`,
    html: `<!doctype html><html lang="th"><body style="margin:0;background:#EEEFF1;font-family:Arial,sans-serif;color:#1F2937">
      <table role="presentation" style="width:100%;padding:32px 16px"><tr><td align="center">
      <table role="presentation" style="width:100%;max-width:480px;background:#FFFFFF;border-radius:20px;padding:32px"><tr><td>
      <p style="color:#7747B8;font-size:24px;font-weight:bold;margin:0 0 24px">UniCommu</p>
      <h1 style="font-size:24px;line-height:1.5;margin:0 0 16px">ยืนยันอีเมลมหาวิทยาลัย</h1>
      <p style="line-height:1.7">นำรหัสนี้ไปกรอกในหน้าสมัครสมาชิก เพื่อยืนยันอีเมลของคุณ</p>
      <p style="padding:20px 12px;text-align:center;background:#EADFF7;color:#563573;font-size:36px;font-weight:bold;letter-spacing:6px">${code}</p>
      <p style="line-height:1.7">รหัสใช้ได้ <strong>10 นาที</strong> และใช้ได้ครั้งเดียว</p>
      <p style="font-size:14px;line-height:1.7;color:#5B6472">หากคุณไม่ได้สมัคร UniCommu กรุณาเพิกเฉยต่ออีเมลนี้ และอย่าแบ่งปันรหัสกับผู้อื่น</p>
      </td></tr></table></td></tr></table></body></html>`,
  };
}

const transport = emailConfiguration().missing.length ? undefined : createEmailTransport();
export const sendEmailOtp = transport
  ? async (email, code) => {
    const info = await transport.sendMail(otpMessage(email, code, process.env.SMTP_FROM));
    if (!info.accepted?.length || info.rejected?.length) {
      const error = new Error('SMTP did not accept the recipient');
      error.code = 'EMAIL_RECIPIENT_REJECTED';
      throw error;
    }
  }
  : undefined;
