import { LinearGradient } from 'expo-linear-gradient';
import { Icon, type IconName } from './icon';
import { opacity } from '@/constants/design-tokens';
import { Pressable, StyleSheet, Text } from 'react-native';
import { palette, s } from './styles';

export function Action({ label, onPress, selected = false, primary = false, disabled = false, dark = false, icon }: { label: string; onPress: () => void; selected?: boolean; primary?: boolean; disabled?: boolean; dark?: boolean; icon?: IconName }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} onPress={onPress} disabled={disabled} style={({ pressed }) => [s.action, selected && s.selected, primary && s.primary, (pressed || disabled) && { opacity: opacity.disabled }]}>{primary && <LinearGradient pointerEvents="none" colors={[palette.gradientPurple, palette.gradientGray]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}{icon && <Icon name={icon} color={primary || (dark && !selected) ? palette.surface : palette.purple} />}<Text style={[s.actionText, dark && !selected && !primary && { color: palette.nightText }, selected && { color: palette.purple }, primary && { color: palette.surface }]}>{label}</Text></Pressable>;
}
