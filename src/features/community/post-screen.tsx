import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fontSize, lineHeight, size, spacing } from '@/constants/design-tokens';
import { ContentList, Frame, Icon } from '@/components/community';
import { useDemo } from './demo-context';
import { seedItems } from './mock-data';

export function PostScreen() {
  const { id, from } = useLocalSearchParams<{ id?: string; from?: string }>();
  const demo = useDemo();
  const item = demo.items.find(post => post.id === id);
  const loadPost=demo.loadPost;
  useEffect(()=>{if(id && !seedItems.some(item=>item.kind==='announcement'&&item.id===id))void loadPost(id);},[id,loadPost]);
  function back() {
    if (router.canGoBack()) router.back();
    else router.replace(from === 'profile' ? '/profile' : '/explore');
  }
  const header = <View style={p.header}>
    <Pressable accessibilityRole="button" accessibilityLabel="กลับจากโพสต์" onPress={back} style={p.back}><View style={p.backIcon}><Icon name="arrow" color={colors.nightText} large /></View></Pressable>
    <Text accessibilityRole="header" style={p.title}>{item?.kind === 'announcement' ? 'ประกาศ' : 'โพสต์'}</Text>
    <View style={p.back} />
  </View>;
  return <Frame title="โพสต์" subtitle="เรื่องราวในชุมชน" maxWidth={size.contentWidth}>
    <ContentList layout="feed" items={item ? [item] : []} header={header} emptyText="ไม่พบโพสต์นี้ ลองกลับไปค้นหาโพสต์อื่น" />
  </Frame>;
}

const p = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 64, padding: spacing.sm, backgroundColor: colors.gradientGray },
  back: { width: size.touchTarget, minHeight: size.touchTarget, justifyContent: 'center', alignItems: 'center' },
  backIcon: { transform: [{ rotate: '180deg' }] },
  title: { flex: 1, color: colors.nightText, fontSize: fontSize.section, lineHeight: lineHeight.heading, fontWeight: '700', textAlign: 'center' },
});
