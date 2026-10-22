import { Chips } from './chips';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, size, fontSize } from '@/constants/design-tokens';
import { Action } from './action';
export type FilterValues = { faculty: string; category: string; date: string };
export const defaultFilters: FilterValues = { faculty: 'ทุกคณะ', category: 'ทั้งหมด', date: 'ทุกช่วงเวลา' };
const groups: { key: keyof FilterValues; label: string; hint?: string; options: string[] }[] = [
  { key: 'faculty', label: 'คณะ', hint: 'รวมประกาศส่วนกลางเสมอ', options: ['ทุกคณะ', 'วิทยาศาสตร์และเทคโนโลยี', 'บริหารธุรกิจ'] },
  { key: 'category', label: 'หมวดหมู่', options: ['ทั้งหมด', 'บริการนักศึกษา', 'กิจกรรม', 'ทุนการศึกษา'] },
  { key: 'date', label: 'วันที่', hint: 'อ้างอิงวันจำลอง 23 ต.ค. 2569', options: ['ทุกช่วงเวลา', 'วันนี้', '7 วันล่าสุด'] },
];
/** Mount on open: draft edits are discarded on cancel/back/outside tap. */
export function FilterOverlay({ value, onApply, onClose }: { value: FilterValues; onApply: (value: FilterValues) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(value);
  return <Modal transparent visible animationType="none" onRequestClose={onClose}>
    <SafeAreaView style={f.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="ปิดตัวกรองโดยไม่บันทึก" />
      <View style={f.sheet} accessibilityViewIsModal>
        <View style={f.header}><Text accessibilityRole="header" style={f.title}>เลือกข่าวที่สนใจ</Text><Action label="ปิด" onPress={onClose} /></View>
        <ScrollView style={f.scroll} contentContainerStyle={f.content} keyboardShouldPersistTaps="handled">
          {groups.map(group => <View key={group.key} style={f.group}><Text style={f.label}>{group.label}</Text>{group.hint && <Text style={f.hint}>{group.hint}</Text>}<Chips values={group.options} value={draft[group.key]} onChange={option => setDraft(old => ({ ...old, [group.key]: option }))} /></View>)}
        </ScrollView>
        <View style={f.footer}><Action label="ล้างตัวเลือก" onPress={() => setDraft({ ...defaultFilters })} /><Action primary label="ใช้ตัวกรอง" icon="check" onPress={() => onApply(draft)} /></View>
      </View>
    </SafeAreaView>
  </Modal>;
}
const f = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.photoOverlay, justifyContent: 'flex-end', alignItems: 'center', padding: spacing.lg },
  sheet: { width: '100%', maxWidth: size.contentWidth, maxHeight: '90%', backgroundColor: colors.surface, borderRadius: radius.card, overflow: 'hidden', flexShrink: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: size.border, borderColor: colors.border, gap: spacing.sm },
  title: { fontSize: fontSize.section, fontWeight: '700', color: colors.ink, flex: 1 },
  scroll: { flexShrink: 1 },
  content: { padding: spacing.xl, gap: spacing.xxl },
  group: { gap: spacing.sm },
  label: { fontSize: fontSize.body, fontWeight: '600', color: colors.ink },
  hint: { fontSize: fontSize.caption, lineHeight: 20, color: colors.muted },
  footer: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm, borderTopWidth: size.border, borderColor: colors.border },
});
