import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogo } from '@/components/brand-logo';
import { colors, fontSize, spacing } from '@/constants/design-tokens';
import { LaunchOrbit } from './launch-orbit';

const circleSize = 56;
const launchLogoSize = 104;
const welcomeLogoSize = 80;

/** Play once on mount, and skip motion when the device requests reduced motion. */
export function LaunchOverlay({ onComplete }: { onComplete?: () => void }) {
  const insets = useSafeAreaInsets();
  const [bounds, setBounds] = useState<{ width: number; height: number } | null>(null);
  const [visible, setVisible] = useState(true);
  const [fall] = useState(() => new Animated.Value(0));
  const [expansion] = useState(() => new Animated.Value(0));
  const [circleOpacity] = useState(() => new Animated.Value(0));
  const [brandOpacity] = useState(() => new Animated.Value(0));
  const [brandMove] = useState(() => new Animated.Value(0));
  const [spread] = useState(() => new Animated.Value(0));
  const [orbitProgress] = useState(() => new Animated.Value(0));
  const [orbitOpacity] = useState(() => new Animated.Value(0));
  const [overlayOpacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!bounds) return;
    let active = true;
    // Reset before replay, including development effect remounts and Fast Refresh.
    fall.setValue(0);
    expansion.setValue(0);
    circleOpacity.setValue(0);
    brandOpacity.setValue(0);
    brandMove.setValue(0);
    spread.setValue(0);
    orbitProgress.setValue(0);
    orbitOpacity.setValue(0);
    overlayOpacity.setValue(1);
    const animation = Animated.sequence([
      Animated.delay(120),
      Animated.timing(circleOpacity, { toValue: 1, duration: 0, useNativeDriver: true }),
      Animated.timing(fall, {
        toValue: 1,
        duration: 650,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(expansion, {
        toValue: 1,
        duration: 650,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(brandOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(orbitOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(spread, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(orbitProgress, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(orbitOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(brandMove, {
        toValue: 1,
        duration: 600,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]);

    function dismiss() {
      animation.stop();
      if (active) {
        setVisible(false);
        onComplete?.();
      }
    }

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (enabled) dismiss();
    });

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!active) return;
      if (reduceMotion) {
        dismiss();
        return;
      }
      animation.start(({ finished }) => {
        if (active && finished) {
          setVisible(false);
          onComplete?.();
        }
      });
    }).catch(dismiss);

    return () => {
      active = false;
      animation.stop();
      subscription.remove();
    };
  }, [bounds, brandMove, brandOpacity, circleOpacity, expansion, fall, onComplete, orbitOpacity, orbitProgress, overlayOpacity, spread]);

  if (!visible) return null;

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="auto"
      onLayout={({ nativeEvent: { layout } }) => {
        if (layout.width > 0 && layout.height > 0) {
          setBounds((current) => current ?? { width: layout.width, height: layout.height });
        }
      }}
      style={[styles.overlay, { opacity: overlayOpacity }]}>
      <View style={styles.center}>
        {bounds && <Animated.View style={[
          styles.circle,
          { opacity: circleOpacity, transform: [
            { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [-bounds.height / 2 - circleSize * 2, 0] }) },
            { scale: expansion.interpolate({ inputRange: [0, 1], outputRange: [1, Math.hypot(bounds.width, bounds.height) * 2 / circleSize] }) },
          ] },
        ]} />}
      </View>
      {bounds && <LaunchOrbit width={bounds.width} height={bounds.height} spread={spread} progress={orbitProgress} opacity={orbitOpacity} />}
      {bounds && bounds.height >= 600 && <Animated.Text style={[styles.description, {
        bottom: insets.bottom + spacing.xxxl,
        opacity: orbitOpacity,
      }]}>เรื่องเรียน เรื่องเพื่อน{'\n'}เชื่อมถึงกันใน UniCommu</Animated.Text>}
      {bounds && <Animated.View style={[styles.brand, {
        opacity: brandOpacity,
        transform: [
          { translateY: brandMove.interpolate({
            inputRange: [0, 1],
            outputRange: [0, insets.top + spacing.xxxl + welcomeLogoSize / 2 - bounds.height / 2],
          }) },
          { translateX: brandMove.interpolate({ inputRange: [0, 1], outputRange: [0, (insets.left - insets.right) / 2] }) },
        ],
      }]}>
        <Animated.View style={{ transform: [{ scale: brandMove.interpolate({ inputRange: [0, 1], outputRange: [1, welcomeLogoSize / launchLogoSize] }) }] }}>
          <BrandLogo dimension={launchLogoSize} />
        </Animated.View>
        <Animated.Text style={[styles.name, {
          transform: [{ translateY: brandMove.interpolate({ inputRange: [0, 1], outputRange: [0, (welcomeLogoSize - launchLogoSize) / 2] }) }],
        }]}>UniCommu</Animated.Text>
      </Animated.View>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: colors.background, overflow: 'hidden' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  circle: { width: circleSize, height: circleSize, borderRadius: circleSize / 2, backgroundColor: colors.purple },
  brand: { position: 'absolute', top: '50%', left: '50%', width: 240, height: launchLogoSize, marginLeft: -120, marginTop: -launchLogoSize / 2, alignItems: 'center' },
  name: { position: 'absolute', top: launchLogoSize + spacing.sm, width: 240, textAlign: 'center', fontSize: fontSize.brand, fontWeight: '800', color: colors.surface },
  description: { position: 'absolute', alignSelf: 'center', maxWidth: 280, paddingHorizontal: spacing.lg, textAlign: 'center', fontSize: fontSize.body, lineHeight: 26, color: colors.surface },
});
