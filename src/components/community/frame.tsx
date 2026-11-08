import { CanvasGradient } from './gradient-surface';
import { createContext, useContext, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { size } from '@/constants/design-tokens';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { Icon } from './icon';
import { palette, s } from './styles';
const HeaderContext = createContext({ title: '', subtitle: '' });
/** Render inside the screen's list/scroll view so the entire header scrolls naturally. */
export function PageHeader() {
  const { title, subtitle } = useContext(HeaderContext);
  return <View style={s.pageHeader}>
    <View style={s.brand}><View style={s.brandMark}><Icon name="community" color={palette.surface} /></View><Text style={s.brandName}>UniCommu</Text><View style={s.badge}><Text style={s.small}>ข้อมูลจำลอง</Text></View><View style={s.grow} /><Pressable accessibilityRole="button" accessibilityLabel="เปิดโปรไฟล์" onPress={() => router.navigate('/profile')} style={[s.avatar, { minWidth: size.touchTarget, minHeight: size.touchTarget }]}><Icon name="profile" large /></Pressable></View>
    <View style={s.heading}><Text accessibilityRole="header" style={s.title}>{title}</Text><Text style={s.canvasMuted}>{subtitle}</Text></View>
  </View>;
}
export function Frame({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { contentWidth } = useResponsiveLayout();
  return <HeaderContext.Provider value={{ title, subtitle }}><SafeAreaView edges={['top', 'left', 'right']} style={s.safe}><KeyboardAvoidingView style={s.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={[s.frame, { maxWidth: contentWidth }]}><CanvasGradient />{children}</View></KeyboardAvoidingView></SafeAreaView></HeaderContext.Provider>;
}
