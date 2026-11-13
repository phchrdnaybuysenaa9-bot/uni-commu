import { Checkbox } from '@/components/community/checkbox';
import { CanvasGradient } from '@/components/community/gradient-surface';
import { WelcomeHero } from './welcome-hero';
import { AuthPhotoBackdrop, AuthPhotoHero } from './auth-photo-hero';
import { BrandLogo } from '@/components/brand-logo';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action } from '@/components/community';
import { colors } from '@/constants/design-tokens';
import { useAuth } from './auth-context';
import { confirmEmail, registerAccount, resendEmailOtp, usesTestOtp } from './registration-api';
import { a } from './styles';
import { OtpCodeInput } from './otp-code-input';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
type Step = 'login' | 'register' | 'verify' | 'forgot';
export function AuthScreen({ initialStep = 'login' }: { initialStep?: 'login' | 'register' }) {
  const { isTabletLayout, isWideAuthLayout } = useResponsiveLayout();
  const { enter } = useAuth();
  const [step, setStep] = useState<Step>(initialStep);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [name, setName] = useState('');
  const [show, setShow] = useState(false); const [agreed, setAgreed] = useState(false); const [error, setError] = useState(''); 
  const [challenge, setChallenge] = useState('');
  const [code, setCode] = useState('');
  const [testCode, setTestCode] = useState('');
  const [codeResent, setCodeResent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const hasPhotoHero = step === 'login' || step === 'register';
  const wideLayout = isWideAuthLayout && !hasPhotoHero;

  function change(next: Step) {
    setStep(next);
    setError('');
    setPassword('');
    setConfirm('');
    setShow(false);
    setVerified(false);
    setCode('');
    setCodeResent(false);
    if (next !== 'verify') {
      setChallenge('');
      setTestCode('');
    }
  }

  async function resendCode() {
    if (busy) return;
    setBusy(true);
    setError('');
    setCodeResent(false);
    try {
      setTestCode(await resendEmailOtp(challenge));
      setCode('');
      setCodeResent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'ขอรหัสใหม่ไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (busy) return;
    setError('');
    if (step === 'verify') {
      if (code.length !== 6) return setError('กรุณากรอกรหัส 6 หลัก');
      setBusy(true);
      try {
        await confirmEmail(challenge, code);
        setVerified(true);
        setChallenge('');
        setCode('');
        setTestCode('');
        setPassword('');
        setConfirm('');
        enter(name.trim());
      } catch (error) {
        setError(error instanceof Error ? error.message : 'ยืนยันอีเมลไม่สำเร็จ กรุณาลองอีกครั้ง');
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('กรุณากรอกอีเมลให้ถูกต้อง');
    if (step === 'forgot') return setError('บริการตั้งรหัสผ่านใหม่ยังไม่เปิดใช้งาน กรุณาลองอีกครั้งภายหลัง');
    if (step === 'register') {
      if (!email.trim().toLowerCase().endsWith('@rmutp.ac.th')) return setError('กรุณาใช้อีเมลมหาวิทยาลัย @rmutp.ac.th');
      if (!name.trim()) return setError('กรุณากรอกชื่อแสดงผล');
      const passwordLength = [...password.normalize('NFC')].length;
      if (passwordLength < 9) return setError('กรุณาใช้รหัสผ่านอย่างน้อย 9 ตัวอักษร เช่น วลีหลายคำที่จำง่าย');
      if (passwordLength > 128) return setError('กรุณาใช้รหัสผ่านไม่เกิน 128 ตัวอักษร');
      if (password !== confirm) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      if (!agreed) return setError('กรุณายอมรับกติกาก่อนเริ่มใช้งาน');
      setBusy(true);
      try {
        const registration = await registerAccount(email.trim(), name.trim(), password);
        setChallenge(registration.challenge);
        setTestCode(registration.testCode);
        change('verify');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'สมัครสมาชิกไม่สำเร็จ กรุณาลองอีกครั้ง');
      } finally {
        setBusy(false);
      }
      return;
    }
    if (password.length < 8) return setError('กรุณากรอกรหัสผ่านอย่างน้อย 8 ตัวอักษร');
    setPassword(''); enter();
  }
  const titles: Record<Step, string> = { login: 'พื้นที่ของคุณ\nในรั้วมหาวิทยาลัย', register: 'เรื่องดี ๆ เริ่มที่\nการรู้จักกัน', verify: 'อีกนิดเดียว\nก็ได้เจอกันแล้ว', forgot: 'กลับมาคุยกัน\nได้เสมอ' };
  function input(label: string, value: string, set: (v: string) => void, secure = false) {
    const isEmail = label === 'อีเมลมหาวิทยาลัย';
    return <View style={a.field}>
      <Text style={a.label}>{label}</Text>
      <View style={a.inputRow}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={set}
          editable={!busy}
          secureTextEntry={secure && !show}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={isEmail ? 'email-address' : 'default'}
          maxLength={step === 'register' && secure ? 256 : 120}
          style={a.input}
          placeholderTextColor={colors.muted}
          placeholder={isEmail ? 'student@rmutp.ac.th' : label}
        />
        {secure && <Pressable accessibilityRole="button" accessibilityLabel={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} onPress={() => setShow(!show)} style={a.reveal}><Text style={a.link}>{show ? 'ซ่อน' : 'แสดง'}</Text></Pressable>}
      </View>
    </View>;
  }
  return <SafeAreaView style={[a.safe, hasPhotoHero && a.loginSafe]}>{!hasPhotoHero && <CanvasGradient />}<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[a.scroll, isTabletLayout && a.tabletScroll, hasPhotoHero && a.loginScroll]}>
    <View style={[a.shell, wideLayout && a.wideShell, hasPhotoHero && a.loginShell]}>
    {hasPhotoHero && <AuthPhotoBackdrop />}
    <View style={[a.header, hasPhotoHero && a.loginHeader]}><View style={a.brand}><BrandLogo /><Text style={[a.wordmark, hasPhotoHero && a.loginWordmark]}>UniCommu</Text></View><Pressable accessibilityRole="button" disabled={busy} onPress={() => change(step === 'login' ? 'register' : 'login')} style={a.demo}><Text style={a.caption}>{step === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</Text></Pressable></View>
    <View style={[a.body, wideLayout && a.wideBody, hasPhotoHero && a.loginBody]}>
    {hasPhotoHero ? <AuthPhotoHero title={titles[step]} /> : <WelcomeHero title={titles[step]} wide={wideLayout} />}
    <View style={[a.formColumn, wideLayout && a.wideColumn]}>
    <View style={[a.form, hasPhotoHero && a.loginForm]}><View style={[a.formHeading, hasPhotoHero && a.loginFormHeading]}><Text style={[a.formTitle, hasPhotoHero && a.loginFormTitle]}>{{login:'เข้าสู่ระบบ',register:'สร้างบัญชีใหม่',verify:'ยืนยันอีเมล',forgot:'ลืมรหัสผ่าน'}[step]}</Text>{usesTestOtp && (step === 'register' || step === 'verify') && <Text style={a.caption}>โหมดทดสอบการสมัครสมาชิก</Text>}</View>
      {step !== 'verify' && input('อีเมลมหาวิทยาลัย', email, setEmail)}
      {step === 'register' && input('ชื่อแสดงผล', name, setName)}
      {(step === 'login' || step === 'register') && <View style={a.passwordGroup}>{input('รหัสผ่าน', password, setPassword, true)}{step === 'login' && <Pressable onPress={() => change('forgot')} accessibilityRole="button" style={a.forgot}><Text style={a.link}>ลืมรหัสผ่าน</Text></Pressable>}</View>}
      {step === 'register' && <>
        <Text style={a.caption}>ใช้ 9–128 ตัวอักษร เช่น วลีหลายคำที่จำง่าย ไม่บังคับพิมพ์ใหญ่ ตัวเลข หรือสัญลักษณ์</Text>
        {input('ยืนยันรหัสผ่าน', confirm, setConfirm, true)}
        <Checkbox checked={agreed} onChange={setAgreed} label="ยอมรับกติกาชุมชน: ไม่โพสต์เนื้อหา 18+ ไม่คุกคาม และไม่เผยข้อมูลส่วนตัวของผู้อื่น" />
      </>}
      {step === 'verify' && (verified
        ? <Text accessibilityLiveRegion="polite" style={a.caption}>ยืนยันอีเมลสำเร็จ</Text>
        : <>
          <Text accessibilityLiveRegion="polite" style={a.caption}>
            {usesTestOtp ? `รหัสทดสอบ ${testCode} ใช้ได้ 10 นาที` : `${codeResent ? 'ส่งรหัสใหม่ไปที่' : 'ส่งรหัสไปที่'} ${email.trim()} รหัสใช้ได้ 10 นาที`}
          </Text>
          <View style={a.field}>
            <Text style={a.label}>รหัสยืนยัน 6 หลัก</Text>
            <OtpCodeInput value={code} onChange={(value) => { setCode(value); setError(''); }} disabled={busy} invalid={!!error && error !== 'กรุณารอ 1 นาทีหลังขอรหัสครั้งล่าสุด'} />
          </View>
        </>)}

      {!!error && <Text accessibilityLiveRegion="polite" style={a.error}>{error}</Text>}
      {!verified && <Action primary disabled={busy} label={busy ? 'กำลังดำเนินการ…' : {login:'เข้าสู่ระบบ',register:'สมัครสมาชิก',verify:'ยืนยันรหัส',forgot:'ส่งลิงก์ตั้งรหัสผ่านใหม่'}[step]} onPress={submit} />}
      {step === 'verify' && !verified && <Action label="ส่งรหัสอีกครั้ง" disabled={busy} onPress={resendCode} />}
      {step === 'login' ? <View style={a.secondaryActions}><View style={a.bottomRow}><Text style={a.signupPrompt}>ยังไม่มีบัญชี</Text><Action label="สมัครสมาชิก" onPress={() => change('register')} /></View></View> : <Action label="กลับไปเข้าสู่ระบบ" disabled={busy} onPress={() => change('login')} />}
    </View>{(step === 'login' || step === 'forgot') && <Text style={a.privacy}>อีเมลของคุณใช้สำหรับยืนยันตัวตน และไม่แสดงต่อสาธารณะ</Text>}
    </View></View></View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

