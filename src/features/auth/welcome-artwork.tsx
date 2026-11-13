import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet } from 'react-native';

export function WelcomeArtwork({ ready }: { ready: boolean }) {
  const [entrance] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!ready) return;
    let active = true;
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    function showStill() {
      animation.stop();
      entrance.setValue(1);
    }
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
      if (enabled) showStill();
    });
    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (!active) return;
      if (reduceMotion) showStill();
      else animation.start();
    }).catch(() => { if (active) showStill(); });
    return () => {
      active = false;
      animation.stop();
      subscription.remove();
    };
  }, [entrance, ready]);

  return (
    <Animated.View style={[styles.artwork, {
      opacity: entrance,
      transform: [
        { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [56, 0] }) },
        { translateX: entrance.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
        { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [1.08, 1] }) },
      ],
    }]}>
      <Image
        accessible={false}
        source={require('@/assets/images/unicommu/group-discussion.png')}
        resizeMode="contain"
        style={styles.image}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  artwork: { flex: 1, width: '100%', minHeight: 280 },
  image: { width: '100%', height: '100%', minHeight: 280 },
});
