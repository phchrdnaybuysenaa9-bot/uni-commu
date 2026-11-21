import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useReducedMotion } from 'react-native-reanimated';
import { colors, fontSize, lineHeight, radius, size, spacing } from '@/constants/design-tokens';
import { Icon, type IconName } from './icon';

const destinations: Record<string, IconName> = {
  index: 'community',
  announcements: 'announcement',
  explore: 'search',
  notifications: 'bell',
  profile: 'profile',
};

const barHeight = 72;

function TabButton({ label, icon, focused, badge, onPress, onLongPress, onArrow, buttonRef }: {
  label: string;
  icon: IconName;
  focused: boolean;
  badge?: string | number;
  onPress: () => void;
  onLongPress: () => void;
  onArrow: (direction: number) => void;
  buttonRef: (node: View | null) => void;
}) {
  const [pointerFocus, setPointerFocus] = useState(false);
  const webProps = Platform.OS === 'web' ? {
    dataSet: { navigationTab: 'true', pointerFocus: String(pointerFocus) },
    tabIndex: focused ? 0 as const : -1 as const,
    onPointerDown: () => setPointerFocus(true),
    onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      setPointerFocus(false);
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        onArrow(event.key === 'ArrowRight' ? 1 : -1);
      }
    },
  } : {};
  const color = focused ? colors.nightText : colors.nightMuted;
  return <Pressable
    {...webProps}
    ref={buttonRef}
    accessibilityRole="tab"
    accessibilityLabel={badge ? `${label}, ยังไม่ได้อ่าน ${badge} รายการ` : label}
    accessibilityState={{ selected: focused }}
    aria-selected={focused}
    onBlur={() => setPointerFocus(false)}
    onPress={onPress}
    onLongPress={onLongPress}
    style={({ pressed }) => [t.tab, pressed && { opacity: 0.7 }]}
  >
    <View>
      <Icon name={icon} color={color} large />
      {badge !== undefined && <View style={t.badge}><Text style={t.badgeText}>{typeof badge === 'number' && badge > 99 ? '99+' : badge}</Text></View>}
    </View>
    <Text numberOfLines={1} style={[t.label, { color }]}>{label}</Text>
  </Pressable>;
}

export function FloatingTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [position] = useState(() => new Animated.Value(0));
  const [stretch] = useState(() => new Animated.Value(1));
  const previousWidth = useRef(0);
  const buttons = useRef<(View | null)[]>([]);
  const routes = state.routes.filter(route => destinations[route.name]);
  const currentRoute = state.routes[state.index];
  const from = (currentRoute?.params as { from?: string } | undefined)?.from;
  const activeName = currentRoute?.name === 'saved' ? 'profile'
    : currentRoute?.name === 'post/[id]' ? from === 'profile' ? 'profile' : 'explore'
      : currentRoute?.name;
  const activeIndex = routes.findIndex(route => route.name === activeName);
  const slotWidth = Math.max(0, width - spacing.sm * 2) / routes.length;
  const nativeGlass = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

  useEffect(() => {
    if (!slotWidth || activeIndex < 0) return;
    const resized = previousWidth.current !== slotWidth;
    previousWidth.current = slotWidth;
    if (reduceMotion || resized) {
      position.setValue(activeIndex * slotWidth);
      stretch.setValue(1);
      return;
    }
    const animation = Animated.parallel([
      Animated.spring(position, { toValue: activeIndex * slotWidth, stiffness: 280, damping: 29, mass: 0.9, overshootClamping: true, useNativeDriver: Platform.OS !== 'web' }),
      Animated.sequence([
        Animated.timing(stretch, { toValue: 1.08, duration: 90, useNativeDriver: Platform.OS !== 'web' }),
        Animated.spring(stretch, { toValue: 1, stiffness: 300, damping: 24, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    ]);
    animation.start();
    return () => animation.stop();
  }, [activeIndex, position, reduceMotion, slotWidth, stretch]);

  function select(index: number) {
    const route = routes[index];
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (route.key !== state.routes[state.index]?.key && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  }

  const contents = <View
    accessibilityRole="tablist"
    accessibilityLabel="เมนูหลัก"
    style={t.barContent}
    onLayout={event => {
      const nextWidth = event.nativeEvent.layout.width;
      if (nextWidth !== width) {
        setWidth(nextWidth);
      }
    }}
  >
    {slotWidth > 0 && activeIndex >= 0 && <Animated.View
      {...(Platform.OS === 'web' ? { dataSet: { navigationIndicator: 'true' } } : {})}
      pointerEvents="none"
      style={[t.indicator, { width: slotWidth, transform: [{ translateX: position }, { scaleX: stretch }] }]}
    />}
    {routes.map((route, index) => <TabButton
      key={route.key}
      label={descriptors[route.key].options.title ?? route.name}
      icon={destinations[route.name]}
      focused={index === activeIndex}
      badge={descriptors[route.key].options.tabBarBadge}
      buttonRef={node => { buttons.current[index] = node; }}
      onPress={() => select(index)}
      onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
      onArrow={direction => {
        const nextIndex = (index + direction + routes.length) % routes.length;
        select(nextIndex);
        buttons.current[nextIndex]?.focus();
      }}
    />)}
  </View>;

  return <View style={[t.container, { paddingBottom: Math.max(insets.bottom, spacing.sm), paddingLeft: Math.max(insets.left, spacing.lg), paddingRight: Math.max(insets.right, spacing.lg) }]}>
    <View style={t.shadow}>
      {nativeGlass
        ? <GlassView glassEffectStyle="regular" colorScheme="dark" tintColor={colors.navigationGlass} isInteractive style={t.material}>{contents}</GlassView>
        : <View {...(Platform.OS === 'web' ? { dataSet: { navigationGlass: 'true' } } : {})} style={[t.material, t.fallback]}>{contents}</View>}
    </View>
  </View>;
}

const t = StyleSheet.create({
  container: { paddingTop: spacing.sm, alignItems: 'center', backgroundColor: colors.gradientGray },
  shadow: { width: '100%', maxWidth: size.tabletContentWidth, borderRadius: radius.full, boxShadow: [{ offsetX: 0, offsetY: 6, blurRadius: 18, color: colors.authPhotoTint }] },
  material: { borderRadius: radius.full, overflow: 'hidden' },
  fallback: { backgroundColor: colors.navigationGlass, borderWidth: size.border, borderColor: colors.navigationBorder },
  barContent: { height: barHeight, flexDirection: 'row', padding: spacing.sm },
  indicator: { position: 'absolute', top: spacing.sm, bottom: spacing.sm, left: spacing.sm, borderRadius: radius.full, backgroundColor: colors.navigationHighlight },
  tab: { flex: 1, minWidth: size.touchTarget, minHeight: size.touchTarget, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.full },
  label: { fontSize: fontSize.caption, lineHeight: lineHeight.caption, fontWeight: '600', maxWidth: '100%' },
  badge: { position: 'absolute', top: -spacing.xs, left: size.tabIcon - spacing.sm, minWidth: spacing.lg, minHeight: spacing.lg, paddingHorizontal: spacing.xs, borderRadius: radius.full, backgroundColor: colors.selected, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: fontSize.caption, lineHeight: spacing.lg, fontWeight: '700', color: colors.ink },
});
