import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import { AuthScreen } from '@/features/auth/auth-screen';
import { WelcomeScreen } from '@/features/auth/welcome-screen';
import { useState } from 'react';
import '@/global.css';
import { colors, fontSize, spacing } from '@/constants/design-tokens';
import { Tabs } from 'expo-router';
import { View, type ColorValue } from 'react-native';
import { Icon, type IconName } from '@/components/community/icon';
import { DemoProvider, useDemo } from '@/features/community/demo-context';
import { CommentsProvider } from '@/features/community/comments-context';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
function Navigation() {
  const insets = useSafeAreaInsets();
  const { navigationInset } = useResponsiveLayout();
  const demo = useDemo();
  const { session } = useAuth();
  const [authStep, setAuthStep] = useState<'login' | 'register' | null>(null);
  const unread = demo.items.filter(i => i.kind === 'announcement' && (i.urgent || demo.following.includes(i.author)) && !demo.read.includes(i.id)).length;
  const tabIcon = (name: IconName) => function TabIcon({ focused, color }: { focused: boolean; color: ColorValue }) { return <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: focused ? colors.selected : 'transparent', borderRadius: spacing.md }}><Icon name={name} color={color} large /></View>; };
  if (!session && !authStep) return <WelcomeScreen onContinue={setAuthStep} />;
  if (!session) return <AuthScreen initialStep={authStep ?? 'login'} />;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.purple, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border, height: 72 + insets.bottom, paddingHorizontal: Math.max(navigationInset, insets.left, insets.right), paddingTop: spacing.sm, paddingBottom: Math.max(insets.bottom, spacing.sm) }, tabBarLabelStyle: { fontSize: fontSize.caption, lineHeight: 20, marginTop: spacing.xs }, sceneStyle: { backgroundColor: colors.background } }}>
    <Tabs.Screen name="index" options={{ title: 'ชุมชน', tabBarIcon: tabIcon('community') }} />
    <Tabs.Screen name="announcements" options={{ title: 'ประกาศ', tabBarIcon: tabIcon('announcement') }} />
    <Tabs.Screen name="saved" options={{ title: 'บันทึก', tabBarIcon: tabIcon('bookmark') }} />
    <Tabs.Screen name="notifications" options={{ title: 'แจ้งเตือน', tabBarIcon: tabIcon('bell'), tabBarBadge: unread || undefined }} />
    <Tabs.Screen name="profile" options={{ title: 'โปรไฟล์', tabBarIcon: tabIcon('profile') }} />
    <Tabs.Screen name="explore" options={{ href: null }} />
  </Tabs>;
}
export default function RootLayout() { return <AuthProvider><DemoProvider><CommentsProvider><Navigation /></CommentsProvider></DemoProvider></AuthProvider>; }
