import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSize, size, spacing } from '@/constants/design-tokens';

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
};

/** One native input preserves paste/autofill and backspace across six visual cells. */
export function OtpCodeInput({ value, onChange, disabled = false, invalid = false }: Props) {
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, 5);
  return <View style={styles.container}>
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.cells}>
      {Array.from({ length: 6 }, (_, index) => <View key={index} style={[
        styles.cell,
        focused && index === active && styles.active,
        invalid && styles.invalid,
        disabled && styles.disabled,
      ]}><Text style={styles.digit}>{value[index] || ''}</Text></View>)}
    </View>
    <TextInput
      accessibilityLabel="รหัสยืนยัน 6 หลัก"
      accessibilityHint="พิมพ์หรือวางรหัส 6 หลักจากอีเมล"
      autoComplete="one-time-code"
      autoCapitalize="none"
      autoCorrect={false}
      caretHidden
      editable={!disabled}
      inputMode="numeric"
      keyboardType="number-pad"
      maxLength={6}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 6))}
      selectTextOnFocus
      style={styles.input}
      value={value}
    />
  </View>;
}

const styles = StyleSheet.create({
  container: { position: 'relative', width: '100%', maxWidth: 360, alignSelf: 'center' },
  cells: { flexDirection: 'row', gap: spacing.sm },
  cell: {
    flex: 1, minWidth: 0, minHeight: size.touchTarget + spacing.sm,
    justifyContent: 'center', alignItems: 'center', borderRadius: spacing.md,
    backgroundColor: colors.background, borderWidth: size.border, borderColor: colors.inputBorder,
  },
  active: { borderColor: colors.purple, backgroundColor: colors.selected },
  invalid: { borderColor: colors.urgentText },
  disabled: { opacity: 0.5 },
  digit: { fontSize: fontSize.brand, color: colors.ink, fontWeight: '600', fontVariant: ['tabular-nums'] },
  input: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0, fontSize: fontSize.body },
});
