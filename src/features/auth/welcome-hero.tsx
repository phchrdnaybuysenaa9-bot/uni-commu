import { useState } from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientSurface } from '@/components/community/gradient-surface';
import { colors } from '@/constants/design-tokens';
import { a } from './styles';

export function WelcomeHero({ title, wide }: { title: string; wide: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  return <GradientSurface style={[a.hero, wide && a.wideHero]}>
    {!imageFailed && <>
      <Image
        source={require('@/assets/images/unicommu/campus-welcome-v1.png')}
        resizeMode="cover"
        accessible={false}
        onError={() => setImageFailed(true)}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[colors.authPhotoShade, colors.authPhotoTint]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </>}
    <Text style={a.title}>{title}</Text>
    <Text style={a.subtitle}>เรื่องเรียน เรื่องเพื่อน และทุกวันของพวกเรา</Text>
  </GradientSurface>;
}
