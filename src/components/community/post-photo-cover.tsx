import { useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import type { PostPhoto } from '@/features/community/mock-data';
import { colors, spacing, radius, fontSize } from '@/constants/design-tokens';
export const postPhotos = {
  study: require('@/assets/images/unicommu/study.jpg'),
  people: require('@/assets/images/unicommu/campus-people.jpg'),
};
export function PostPhotoCover({ photo, title, category }: { photo: PostPhoto; title: string; category: string }) {
  const [failed, setFailed] = useState(false);
  return <View style={v.cover}>
    <ImageBackground source={failed ? undefined : postPhotos[photo]} onError={() => setFailed(true)} resizeMode="cover" style={v.image} accessibilityLabel={failed ? 'ไม่สามารถแสดงภาพตัวอย่าง' : 'ภาพประกอบโพสต์จำลอง ไม่ใช่ภาพจากมหาวิทยาลัยจริง'}>
      <View style={v.top}><Text style={v.badge}>{category}</Text><Text style={v.badge}>ภาพประกอบ</Text></View>
      <View style={v.caption}><Text style={v.title}>{title}</Text><Text style={v.note}>{failed ? 'โหลดภาพไม่สำเร็จ · ยังอ่านโพสต์ได้ด้านล่าง' : 'เรื่องราวในรั้วมหาวิทยาลัย'}</Text></View>
    </ImageBackground>
  </View>;
}
const v = StyleSheet.create({
  cover: { borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.selected },
  image: { width: '100%', minHeight: 280, justifyContent: 'space-between' },
  top: { padding: spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  badge: { color: colors.ink, backgroundColor: colors.surface, fontSize: fontSize.caption, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  caption: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.photoOverlay },
  title: { color: colors.nightText, fontSize: fontSize.brand, lineHeight: 34, fontWeight: '700' },
  note: { color: colors.nightText, fontSize: fontSize.caption, lineHeight: 20 },
});
