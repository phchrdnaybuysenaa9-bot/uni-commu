import { Animated, Image, StyleSheet } from 'react-native';

// Generated 3D PNG cutouts; prompts are recorded alongside the assets.
// Each object follows its own shallow elliptical arc after the scatter beat.
const objects = [
  { name: 'backpack', source: require('@/assets/images/launch/generated-v1/backpack.png'), angle: -126, arc: 38, tilt: -16, size: 1.08, depth: 0.2 },
  { name: 'laptop', source: require('@/assets/images/launch/generated-v1/laptop.png'), angle: -43, arc: 29, tilt: 14, size: 1.25, depth: 0.65 },
  { name: 'basketball', source: require('@/assets/images/launch/generated-v1/basketball.png'), angle: -185, arc: 46, tilt: -10, size: 0.95, depth: 0.5 },
  { name: 'camera', source: require('@/assets/images/launch/generated-v1/camera.png'), angle: 28, arc: 35, tilt: 12, size: 1.05, depth: 0.9 },
  { name: 'coffee', source: require('@/assets/images/launch/generated-v1/coffee.png'), angle: 112, arc: 32, tilt: -14, size: 1.1, depth: 0.35 },
];
const samples = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

export function LaunchOrbit({ width, height, spread, progress, opacity }: {
  width: number;
  height: number;
  spread: Animated.Value;
  progress: Animated.Value;
  opacity: Animated.Value;
}) {
  const horizontalReach = Math.min(width * 0.36, 225);
  const verticalReach = Math.min(height * 0.25, 235);
  const objectSize = Math.min(76, width * 0.17, height * 0.14);

  return (
    <Animated.View testID="launch-orbit" pointerEvents="none" style={[styles.scene, { opacity }]}>
      {objects.map((object) => {
        const size = objectSize * object.size;
        const angles = samples.map((step) => (object.angle + step * object.arc) * Math.PI / 180);
        const x = progress.interpolate({ inputRange: samples, outputRange: angles.map((angle) => Math.cos(angle) * horizontalReach) });
        const y = progress.interpolate({ inputRange: samples, outputRange: angles.map((angle) => Math.sin(angle) * verticalReach) });
        const depth = samples.map((step) => 0.8 + object.depth * 0.2 + Math.sin(step * Math.PI) * 0.12);
        return (
          <Animated.View key={object.name} testID={`launch-object-${object.name}`} style={[
            styles.object,
            {
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              zIndex: object.depth > 0.5 ? 2 : 0,
              opacity: progress.interpolate({ inputRange: samples, outputRange: depth.map((value) => Math.min(1, value)) }),
              transform: [
                { translateX: Animated.multiply(spread, x) },
                { translateY: Animated.multiply(spread, y) },
                { scale: Animated.multiply(
                  spread.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
                  progress.interpolate({ inputRange: samples, outputRange: depth }),
                ) },
              ],
            },
          ]}>
            <Animated.View style={[styles.image, { transform: [{ rotate: progress.interpolate({
              inputRange: [0, 0.5, 1], outputRange: [`${object.tilt}deg`, `${object.tilt + 8}deg`, `${object.tilt + 14}deg`],
            }) }] }]}>
              <Image accessible={false} source={object.source} resizeMode="contain" style={styles.image} />
            </Animated.View>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scene: { ...StyleSheet.absoluteFill },
  object: { position: 'absolute', left: '50%', top: '50%' },
  image: { width: '100%', height: '100%' },
});

