import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, lineHeight, spacing, radius } from '@/constants/design-tokens';
import { GradientSurface } from './gradient-surface';
import { Icon, type IconName } from './icon';
export function AccentBanner({ title, subtitle, icon }: { title: string; subtitle: string; icon: IconName }) {
  return <GradientSurface style={b.panel}><View style={b.row}><Icon name={icon} color={colors.nightText} large /><Text style={b.title}>{title}</Text></View><Text style={b.subtitle}>{subtitle}</Text></GradientSurface>;
}
const b = StyleSheet.create({
  panel: { padding: spacing.xl, gap: spacing.sm, borderRadius: radius.card },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  title: { flex: 1, fontSize: fontSize.section, lineHeight: lineHeight.heading, fontWeight: '700', color: colors.nightText },
  subtitle: { fontSize: fontSize.label, lineHeight: lineHeight.label, color: colors.nightText },
});
