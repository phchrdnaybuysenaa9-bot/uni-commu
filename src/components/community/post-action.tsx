import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontSize, lineHeight, opacity, radius, size, spacing } from '@/constants/design-tokens';
import { Icon, type IconName } from './icon';

const countFormatter = new Intl.NumberFormat('th-TH', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

type PostActionProps = {
  label: string;
  icon: IconName;
  selectedIcon?: IconName;
  count?: number;
  selected?: boolean;
  expanded?: boolean;
  dark: boolean;
  stacked?: boolean;
  onPress: () => void;
};

export function PostAction({ label, icon, selectedIcon, count, selected, expanded, dark, stacked = false, onPress }: PostActionProps) {
  const [pointerFocus, setPointerFocus] = useState(false);
  const color = dark
    ? selected ? colors.selected : colors.nightText
    : selected ? colors.purple : colors.ink;
  const webProps = Platform.OS === 'web'
    ? {
      dataSet: { postAction: dark ? 'dark' : 'light', pointerFocus: String(pointerFocus) },
      onPointerDown: () => setPointerFocus(true),
      onKeyDown: () => setPointerFocus(false),
      'aria-pressed': selected,
    }
    : {};

  return (
    <Pressable
      {...webProps}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, expanded }}
      aria-expanded={expanded}
      onBlur={() => setPointerFocus(false)}
      onPress={onPress}
      style={({ pressed }) => [styles.action, stacked && styles.stacked, pressed && { opacity: opacity.disabled }]}
    >
      <Icon name={selected && selectedIcon ? selectedIcon : icon} color={color} large />
      {count !== undefined && (
        <Text style={[styles.count, stacked && styles.stackedCount, { color }]}>{countFormatter.format(count)}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: size.touchTarget,
    minWidth: size.touchTarget,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.control,
    flexShrink: 0,
  },
  count: {
    fontSize: fontSize.label,
    lineHeight: lineHeight.label,
    fontWeight: '600',
  },
  stacked: { flexDirection: 'column', gap: spacing.xs },
  stackedCount: { fontSize: fontSize.caption, lineHeight: lineHeight.caption },
});
