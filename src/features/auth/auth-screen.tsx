import { Checkbox } from '@/components/community/checkbox';
import { CanvasGradient, GradientSurface } from '@/components/community/gradient-surface';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action, Icon } from '@/components/community';
import { colors } from '@/constants/design-tokens';
import { useAuth } from './auth-context';
import { a } from './styles';
type Step = 'login' | 'register' | 'verify' | 'profile' | 'forgot';
export function AuthScreen() {
  const { enter } = useAuth();
  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [name, setName] = useState(''); const [code, setCode] = useState('');
  const [show, setShow] = useState(false); const [agreed, setAgreed] = useState(false); const [error, setError] = useState(''); const [sent, setSent] = useState(false);
  function change(next: Step) { setStep(next); setError(''); setPassword(''); setConfirm(''); setSent(false); }
  function submit() {
    setError('');
    if (step === 'profile') { if (!name.trim()) return setError('กรุณากรอกชื่อแสดงผล'); enter(name.trim()); return; }
    if (step === 'verify') { if (code !== '123456') return setError('รหัสไม่ถูกต้อง ลองใช้รหัสจำลอง 123456'); change('profile'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('กรุณากรอกอีเมลให้ถูกต้อง');
    if (step === 'forgot') { setSent(true); return; }
    if (password.length < 8) return setError('กรุณาใช้รหัสผ่านจำลองอย่างน้อย 8 ตัวอักษร');
    if (step === 'register') { if (password !== confirm) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); if (!agreed) return setError('กรุณายอมรับกติกาก่อนเริ่มใช้งาน'); change('verify'); return; }
    setPassword(''); enter();
  }
  const titles: Record<Step, string> = { login: 'พื้นที่ของคุณ\nในรั้วมหาวิทยาลัย', register: 'เรื่องดี ๆ เริ่มที่\nการรู้จักกัน', verify: 'อีกนิดเดียว\nก็ได้เจอกันแล้ว', profile: 'ให้ชุมชน\nรู้จักคุณ', forgot: 'กลับมาคุยกัน\nได้เสมอ' };
  function input(label: string, value: string, set: (v: string) => void, secure = false) { return <View style={a.field}><Text style={a.label}>{label}</Text><View style={a.inputRow}><TextInput accessibilityLabel={label} value={value} onChangeText={set} secureTextEntry={secure && !show} autoCapitalize="none" autoCorrect={false} keyboardType={label.includes('อีเมล') ? 'email-address' : label.includes('6 หลัก') ? 'number-pad' : 'default'} maxLength={label.includes('6 หลัก') ? 6 : 120} style={a.input} placeholderTextColor={colors.muted} placeholder={label.includes('อีเมล') ? 'student@university.ac.th' : label} />{secure && <Pressable accessibilityRole="button" accessibilityLabel={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} onPress={() => setShow(!show)} style={a.reveal}><Text style={a.link}>{show ? 'ซ่อน' : 'แสดง'}</Text></Pressable>}</View></View>; }
  return <SafeAreaView style={a.safe}><CanvasGradient /><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={a.scroll}>
    <View style={a.header}><View style={a.brand}><View style={a.mark}><Icon name="community" color={colors.surface} /></View><Text style={a.wordmark}>UniCommu</Text></View><Pressable accessibilityRole="button" onPress={() => change(step === 'login' ? 'register' : 'login')} style={a.demo}><Text style={a.caption}>{step === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</Text></Pressable></View>
    <GradientSurface style={a.hero}><Text style={a.title}>{titles[step]}</Text><Text style={a.subtitle}>เรื่องเรียน เรื่องเพื่อน และทุกวันของพวกเรา</Text></GradientSurface>
    <View style={a.form}><View style={a.formHeading}><Text style={a.formTitle}>{{login:'เข้าสู่ระบบ',register:'สร้างบัญชีใหม่',verify:'ยืนยันอีเมล',profile:'ตั้งค่าโปรไฟล์',forgot:'ลืมรหัสผ่าน'}[step]}</Text><Text style={a.caption}>ข้อมูลจำลอง · ไม่เชื่อมระบบจริง</Text></View>
      {step !== 'profile' && step !== 'verify' && input('อีเมลมหาวิทยาลัย', email, setEmail)}
      {(step === 'login' || step === 'register') && input('รหัสผ่านจำลอง', password, setPassword, true)}
      {step === 'register' && <>{input('ยืนยันรหัสผ่าน', confirm, setConfirm, true)}<Checkbox checked={agreed} onChange={setAgreed} label="ยอมรับกติกาทดลอง: ไม่โพสต์เนื้อหา 18+ ไม่คุกคาม และไม่เผยข้อมูลส่วนตัวของผู้อื่น" /></>}
      {step === 'verify' && <><Text style={a.caption}>ไม่มีการส่งอีเมลจริง ใช้รหัสตัวอย่าง 123456 เพื่อทดลองขั้นตอนถัดไป</Text>{input('รหัสยืนยัน 6 หลัก', code, setCode)}</>}
      {step === 'profile' && <>{input('ชื่อแสดงผล', name, setName)}<Text style={a.caption}>ไม่จำเป็นต้องใช้ชื่อจริง อีเมลไม่แสดงต่อสาธารณะ</Text></>}
      {step === 'login' && <Pressable onPress={() => change('forgot')} accessibilityRole="button" style={a.forgot}><Text style={a.link}>ลืมรหัสผ่าน?</Text></Pressable>}
      {!!error && <Text accessibilityLiveRegion="polite" style={a.error}>{error}</Text>}
      {sent && <Text accessibilityLiveRegion="polite" style={a.caption}>จำลองคำขอสำเร็จ หากอีเมลนี้มีบัญชี คุณจะได้รับลิงก์ตั้งรหัสผ่านใหม่ · ในต้นแบบไม่มีการส่งจริง</Text>}
      <Action icon="arrow" primary label={{login:'เข้าสู่ระบบจำลอง',register:'สมัครและรับรหัสจำลอง',verify:'ยืนยันรหัส',profile:'เริ่มใช้งาน UniCommu',forgot:'ส่งลิงก์จำลอง'}[step]} onPress={submit} />
      {step === 'login' ? <><View style={a.bottomRow}><Text style={a.caption}>ยังไม่มีบัญชี?</Text><Action label="สมัครสมาชิก" onPress={() => change('register')} /></View><Action label="เปิดดูตัวอย่างโดยไม่กรอกข้อมูล" selected onPress={() => enter()} /></> : <Action label="กลับไปเข้าสู่ระบบ" onPress={() => change('login')} />}
    </View><Text style={a.privacy}>ไม่ต้องกรอกอีเมลหรือรหัสผ่านจริง ข้อมูลทดลองไม่ส่งออกและหายเมื่อรีโหลด</Text>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
