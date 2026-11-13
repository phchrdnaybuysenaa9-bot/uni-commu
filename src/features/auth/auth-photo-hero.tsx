import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, spacing } from '@/constants/design-tokens';

/** A single photographic backdrop blends into the form, rather than a separate card. */
export function AuthPhotoBackdrop() {
  const [failed, setFailed] = useState(false);
  return <View pointerEvents="none" style={styles.backdrop}>
    {!failed && <Image accessible={false}
      source={require('@/assets/images/unicommu/campus-welcome-v1.png')}
      resizeMode="cover" onError={() => setFailed(true)} style={styles.image} />}
    <LinearGradient colors={[colors.authPhotoTint, colors.authPhotoFade, colors.surface]}
      locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
  </View>;
}

export function AuthPhotoHero({ title }: { title: string }) {
  return <View style={styles.copy}>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>เรื่องเรียน เรื่องเพื่อน และทุกวันของพวกเรา</Text>
  </View>;
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, height: 320, overflow: 'hidden', backgroundColor: colors.selected },
  image: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  copy: { paddingTop: spacing.xxxl * 4, paddingHorizontal: spacing.xxl, paddingBottom: spacing.xxl, gap: spacing.sm },
  title: { color: colors.ink, fontSize: fontSize.title, fontWeight: '800', lineHeight: 38, textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: fontSize.label, lineHeight: 24, textAlign: 'center' },
});
