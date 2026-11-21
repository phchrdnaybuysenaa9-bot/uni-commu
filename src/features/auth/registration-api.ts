import { Platform } from 'react-native';

export const apiUrl = process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ && Platform.OS === 'web' ? 'http://127.0.0.1:3001' :
    __DEV__ && Platform.OS === 'android' ? 'http://10.0.2.2:3001' : undefined);
// Real delivery is the default; local test codes require an explicit opt-in.
export const usesTestOtp = __DEV__ && process.env.EXPO_PUBLIC_EMAIL_VERIFICATION === 'test';

const messages: Record<string, string> = {
  university_email_required: 'กรุณาใช้อีเมลมหาวิทยาลัย @rmutp.ac.th',
  invalid_display_name: 'กรุณากรอกชื่อแสดงผลไม่เกิน 100 ตัวอักษร',
  invalid_password_length: 'กรุณาใช้รหัสผ่าน 9–128 ตัวอักษร',
  password_too_common: 'รหัสผ่านนี้เดาง่ายหรือใช้กันบ่อย กรุณาใช้วลีที่ยาวและไม่ซ้ำกับชื่อหรืออีเมล',
  email_already_registered: 'อีเมลนี้ถูกใช้สมัครบัญชีแล้ว กรุณาใช้อีเมลอื่น',
  local_verification_disabled: 'กรุณาเปิดโหมดทดสอบการยืนยันใน Backend แล้วลองอีกครั้ง',
  invalid_otp: 'รหัสไม่ถูกต้องหรือใช้ไม่ได้แล้ว ลองตรวจรหัสหรือขอรหัสใหม่',
  otp_resend_wait: 'กรุณารอ 1 นาทีหลังขอรหัสครั้งล่าสุด',
  otp_daily_limit: 'อีเมลนี้ขอรหัสครบ 10 ครั้งในวันนี้แล้ว กรุณาลองใหม่หลังเที่ยงคืนตามเวลาไทย',
  email_delivery_unavailable: 'ส่งรหัสยืนยันไม่ได้ กรุณาลองอีกครั้ง',
  invalid_credentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  email_not_verified: 'กรุณายืนยันอีเมลด้วย OTP ก่อนเข้าสู่ระบบ',
  login_rate_limited: 'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองอีกครั้ง',
  login_busy: 'มีผู้ใช้งานพร้อมกันหลายคน กรุณาลองอีกครั้งสักครู่',
  login_unavailable: 'ระบบเข้าสู่ระบบยังไม่พร้อม กรุณาลองอีกครั้ง',
  session_expired: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
};

async function post(path: string, data: object, token?: string) {
  if (!apiUrl) throw new Error('ยังไม่ได้ตั้งค่าที่อยู่ Backend สำหรับอุปกรณ์นี้');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(usesTestOtp ? { 'X-UniCommu-Verification': 'local' } : {}),
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(messages[result.error] ?? 'ระบบยังทำรายการไม่ได้ กรุณาลองอีกครั้ง');
    }
    return result;
  } catch (error) {
    if (controller.signal.aborted || error instanceof TypeError || error instanceof SyntaxError) {
      throw new Error('ติดต่อระบบไม่ได้ กรุณาตรวจว่า Backend เปิดอยู่แล้วลองอีกครั้ง');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export type AuthSession = {
  token: string;
  expiresAt: string;
  user: { id: string; name: string; role: 'student' | 'department' | 'admin' };
};

export async function loginAccount(email: string, password: string): Promise<AuthSession> {
  const result = await post('/auth/login', { email, password });
  if (typeof result.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(result.token) ||
      typeof result.expiresAt !== 'string' || !(Date.parse(result.expiresAt) > Date.now()) ||
      typeof result.user?.id !== 'string' || typeof result.user?.name !== 'string' ||
      !['student', 'department', 'admin'].includes(result.user?.role)) {
    throw new Error('ข้อมูลเข้าสู่ระบบไม่ครบ กรุณาลองอีกครั้ง');
  }
  return result as AuthSession;
}

export async function logoutAccount(token: string) {
  await post('/auth/logout', {}, token);
}

export async function registerAccount(email: string, displayName: string, password: string) {
  const result = await post('/auth/register', { email, displayName, password });
  if (typeof result.challenge !== 'string') {
    throw new Error('ระบบไม่ส่งข้อมูลยืนยันกลับมา กรุณาตรวจการตั้งค่า Backend');
  }
  return { challenge: result.challenge as string, testCode: readTestCode(result.testCode) };
}

export async function confirmEmail(challenge: string, code: string) {
  await post('/auth/verify-email', { challenge, code });
}

export async function resendEmailOtp(challenge: string) {
  const result = await post('/auth/resend-otp', { challenge });
  return readTestCode(result.testCode);
}

function readTestCode(value: unknown) {
  return usesTestOtp && typeof value === 'string' ? value : '';
}
