import { ScrollView, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/design-tokens';
import { Action } from './action';

/** Shared horizontal filter row. Options keep their natural width and never wrap. */
export function Chips({ values, value, onChange, dark = false }: { values: string[]; value: string; onChange: (value: string) => void; dark?: boolean }) {
  return <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator style={c.viewport} contentContainerStyle={c.row} keyboardShouldPersistTaps="handled" accessibilityLabel="ตัวเลือกตัวกรอง เลื่อนซ้ายหรือขวาเพื่อดูเพิ่มเติม">
    {values.map(option => <View key={option} style={[c.chip, dark && c.darkChip]}><Action dark={dark} label={option} selected={value === option} onPress={() => onChange(option)} /></View>)}
  </ScrollView>;
}
const c = StyleSheet.create({
  viewport: { width: '100%', minWidth: 0, flexGrow: 0, flexShrink: 0 },
  row: { flexDirection: 'row', flexWrap: 'nowrap', gap: spacing.sm, paddingVertical: spacing.sm, alignItems: 'center' },
  chip: { flexShrink: 0, backgroundColor: colors.surface, borderRadius: radius.full },
  darkChip: { backgroundColor: colors.nightInput },
});
