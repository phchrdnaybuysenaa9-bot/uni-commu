import { useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import type { PostPhoto } from '@/features/community/mock-data';
import { colors, spacing, radius, fontSize } from '@/constants/design-tokens';
export const postPhotos = {
  study: require('@/assets/images/unicommu/study.jpg'),
  people: require('@/assets/images/unicommu/campus-people.jpg'),
};
const photoDimensions = {
  study: { width: 1000, height: 706 },
  people: { width: 1000, height: 667 },
};
export const postPhotoSource = (photo: PostPhoto) => typeof photo === 'string' ? postPhotos[photo] : { uri: photo.uri };
export function PostPhotoCover({ photo, title, category, layout = 'card' }: { photo: PostPhoto; title: string; category: string; layout?: 'card' | 'feed' }) {
  const [failed, setFailed] = useState(false);
  const dimensions = typeof photo === 'string' ? photoDimensions[photo] : photo;
  const feedAspectRatio = Math.max(4 / 5, Math.min(1.91, dimensions.width / dimensions.height));
  if (layout === 'feed') return <View testID="feed-post-media" style={[v.cover, v.feedCover]}>
    <ImageBackground source={failed ? undefined : postPhotoSource(photo)} onError={() => setFailed(true)} resizeMode="cover" imageStyle={v.imageFill} style={[v.feedImage, { aspectRatio: feedAspectRatio }]} accessibilityLabel={failed ? 'โหลดภาพไม่สำเร็จ' : `รูปโพสต์: ${title}`}>
      {typeof photo === 'string' && <Text style={[v.badge, v.feedBadge]}>ภาพประกอบ</Text>}
      {failed && <View style={v.feedFailure}><Text style={v.failureText}>โหลดภาพไม่สำเร็จ</Text></View>}
    </ImageBackground>
  </View>;
  return <View style={v.cover}>
    <ImageBackground source={failed ? undefined : postPhotoSource(photo)} onError={() => setFailed(true)} resizeMode="cover" imageStyle={v.imageFill} style={v.image} accessibilityLabel={failed ? 'โหลดภาพไม่สำเร็จ' : `รูปโพสต์: ${title}`}>
      <View style={v.top}><Text style={v.badge}>{category}</Text><Text style={v.badge}>ภาพประกอบ</Text></View>
      <View style={v.caption}><Text style={v.title}>{title}</Text><Text style={v.note}>{failed ? 'โหลดภาพไม่สำเร็จ · ยังอ่านโพสต์ได้ด้านล่าง' : 'เรื่องราวในรั้วมหาวิทยาลัย'}</Text></View>
    </ImageBackground>
  </View>;
}
const v = StyleSheet.create({
  cover: { borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.selected },
  image: { width: '100%', minHeight: 280, justifyContent: 'space-between' },
  imageFill: { width: '100%', height: '100%' },
  top: { padding: spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  badge: { color: colors.ink, backgroundColor: colors.surface, fontSize: fontSize.caption, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  caption: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.photoOverlay },
  title: { color: colors.nightText, fontSize: fontSize.brand, lineHeight: 34, fontWeight: '700' },
  note: { color: colors.nightText, fontSize: fontSize.caption, lineHeight: 20 },
  feedCover: { borderRadius: 0 },
  feedImage: { width: '100%' },
  feedBadge: { position: 'absolute', right: spacing.md, top: spacing.md },
  feedFailure: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  failureText: { color: colors.ink, fontSize: fontSize.body },
});
