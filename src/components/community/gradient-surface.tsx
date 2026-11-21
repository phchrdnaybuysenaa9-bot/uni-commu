import type { ReactNode } from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/design-tokens';
/** Shared purple-to-gray treatment, with an ordinary surface for announcements. */
export function GradientSurface({ children, style, enabled = true, testID }: { children: ReactNode; style?: StyleProp<ViewStyle>; enabled?: boolean; testID?: string }) {
  return <View testID={testID} style={[style, { overflow: 'hidden' }]}>{enabled && <LinearGradient pointerEvents="none" colors={[colors.gradientPurple, colors.gradientGray]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}{children}</View>;
}
export function CanvasGradient() {
  return <LinearGradient pointerEvents="none" colors={[colors.canvasPurple, colors.canvasGray]} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />;
}
