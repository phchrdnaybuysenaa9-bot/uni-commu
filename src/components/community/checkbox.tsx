import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, size, fontSize, lineHeight, opacity, radius } from '@/constants/design-tokens';
export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked }} onPress={() => onChange(!checked)} style={({ pressed }) => [c.row, pressed && { opacity: opacity.disabled }]}>
    <View style={[c.box, checked && c.checked]}>{checked && <Image source={require('@/assets/icons/community/checkbox-check.png')} accessible={false} resizeMode="contain" style={c.tick} />}</View>
    <Text style={c.label}>{label}</Text>
  </Pressable>;
}
const c = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, minHeight: size.touchTarget, paddingVertical: spacing.sm },
  box: { marginTop: (lineHeight.caption - size.checkbox) / 2, width: size.checkbox, height: size.checkbox, borderWidth: size.border, borderColor: colors.purple, borderRadius: radius.checkbox, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checked: { backgroundColor: colors.purple, borderColor: colors.purple },
  tick: { width: size.checkbox - spacing.xs, height: size.checkbox - spacing.xs, tintColor: colors.surface },
  label: { flex: 1, fontSize: fontSize.caption, lineHeight: lineHeight.caption, color: colors.muted },
});
