import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import { AuthScreen } from '@/features/auth/auth-screen';
import { WelcomeScreen } from '@/features/auth/welcome-screen';
import { useState } from 'react';
import '@/global.css';
import { colors } from '@/constants/design-tokens';
import { Tabs } from 'expo-router';
import { FloatingTabBar } from '@/components/community/floating-tab-bar';
import { DemoProvider, useDemo } from '@/features/community/demo-context';
import { CommentsProvider } from '@/features/community/comments-context';
function Navigation() {
  const demo = useDemo();
  const { session } = useAuth();
  const [authStep, setAuthStep] = useState<'login' | 'register' | null>(null);
  const unread = demo.items.filter(i => i.kind === 'announcement' && (i.urgent || demo.following.includes(i.author)) && !demo.read.includes(i.id)).length;
  if (!session && !authStep) return <WelcomeScreen onContinue={setAuthStep} />;
  if (!session) return <AuthScreen initialStep={authStep ?? 'login'} />;
  return <Tabs backBehavior="history" tabBar={props => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.gradientGray } }}>
    <Tabs.Screen name="index" options={{ title: 'ชุมชน' }} />
    <Tabs.Screen name="announcements" options={{ title: 'ประกาศ' }} />
    <Tabs.Screen name="explore" options={{ title: 'ค้นหา' }} />
    <Tabs.Screen name="notifications" options={{ title: 'แจ้งเตือน', tabBarBadge: unread || undefined }} />
    <Tabs.Screen name="profile" options={{ title: 'โปรไฟล์' }} />
    <Tabs.Screen name="saved" options={{ href: null }} />
    <Tabs.Screen name="post/[id]" options={{ href: null }} />
  </Tabs>;
}
export default function RootLayout() { return <AuthProvider><DemoProvider><CommentsProvider><Navigation /></CommentsProvider></DemoProvider></AuthProvider>; }
