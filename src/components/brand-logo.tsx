import { Image } from 'react-native';
import { radius, size } from '@/constants/design-tokens';

export function BrandLogo({ dimension = size.touchTarget }: { dimension?: number }) {
  return (
    <Image
      accessible={false}
      source={require('@/assets/images/branding/unicommu-logo-v1.png')}
      resizeMode="contain"
      style={{ width: dimension, height: dimension, borderRadius: Math.min(radius.control, dimension / 3) }}
    />
  );
}
