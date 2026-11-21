import { StatusBar } from 'expo-status-bar';
import { createContext, useContext, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fontSize, size, spacing } from '@/constants/design-tokens';
import { useDemo } from '@/features/community/demo-context';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { Icon } from './icon';
import { BrandLogo } from '@/components/brand-logo';
import { s } from './styles';
const HeaderContext = createContext({ title: '', subtitle: '' });
/** Render inside the screen's list/scroll view so the entire header scrolls naturally. */
export function PageHeader() {
  const { title, subtitle } = useContext(HeaderContext);
  return <View style={s.pageHeader}>
    <View style={s.brand}><BrandLogo dimension={size.avatar} /><Text style={s.brandName}>UniCommu</Text><View style={s.badge}><Text style={s.small}>ข้อมูลจำลอง</Text></View><View style={s.grow} /><Pressable accessibilityRole="button" accessibilityLabel="เปิดโปรไฟล์" onPress={() => router.navigate('/profile')} style={[s.avatar, { minWidth: size.touchTarget, minHeight: size.touchTarget }]}><Icon name="profile" large /></Pressable></View>
    <View style={s.heading}><Text accessibilityRole="header" style={s.title}>{title}</Text><Text style={s.canvasMuted}>{subtitle}</Text></View>
  </View>;
}
export function Frame({ title, subtitle, children, maxWidth }: { title: string; subtitle: string; children: ReactNode; maxWidth?: number }) {
  const { contentWidth } = useResponsiveLayout();
  const community=useDemo();
  return <HeaderContext.Provider value={{ title, subtitle }}><SafeAreaView edges={['top', 'left', 'right']} style={s.safe}><StatusBar style="light" /><KeyboardAvoidingView style={s.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={[s.frame, { maxWidth: maxWidth ?? contentWidth }]}>
    {!!community.error && <View style={{padding:spacing.md,backgroundColor:colors.gradientPurple}}><Text accessibilityLiveRegion="assertive" style={{color:colors.nightText,fontSize:fontSize.label}}>{community.error}</Text><Pressable accessibilityRole="button" onPress={()=>void community.refresh()} style={{minHeight:size.touchTarget,justifyContent:'center'}}><Text style={{color:colors.selected}}>โหลดใหม่</Text></Pressable></View>}
    {children}</View></KeyboardAvoidingView></SafeAreaView></HeaderContext.Provider>;
}
