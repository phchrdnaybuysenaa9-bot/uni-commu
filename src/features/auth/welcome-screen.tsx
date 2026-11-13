import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLogo } from '@/components/brand-logo';
import { colors, fontSize, lineHeight, radius, size, spacing } from '@/constants/design-tokens';
import { LaunchOverlay } from './launch-overlay';
import { WelcomeArtwork } from './welcome-artwork';

export function WelcomeScreen({ onContinue }: { onContinue: (step: 'login' | 'register') => void }) {
  const [artworkReady, setArtworkReady] = useState(false);
  const finishLaunch = useCallback(() => setArtworkReady(true), []);
  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.shell}>
            <View style={styles.brand}>
              <BrandLogo dimension={80} />
              <Text style={styles.name}>UniCommu</Text>
            </View>
            <View style={styles.copy}>
              <Text accessibilityRole="header" style={styles.title}>พื้นที่ของคุณ{'\n'}ในรั้วมหาวิทยาลัย</Text>
              <Text style={styles.subtitle}>เรื่องเรียน เรื่องเพื่อน{'\n'}และทุกวันของพวกเรา</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => onContinue('login')}
                style={({ pressed }) => [styles.start, pressed && styles.pressed]}>
                <Text style={styles.startText}>เริ่มต้นใช้งาน</Text>
              </Pressable>
            </View>
            <View style={styles.artwork}>
              <WelcomeArtwork ready={artworkReady} />
            </View>
            <Link href="https://storyset.com/illustration/group-discussion/amico" target="_blank" style={styles.credit}>ภาพประกอบโดย Storyset</Link>
            <Text style={styles.note}>ฟีดชุมชนใช้ข้อมูลจำลอง</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      <LaunchOverlay onComplete={finishLaunch} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.purple },
  scroll: { flexGrow: 1 },
  shell: { flexGrow: 1, width: '100%', maxWidth: size.contentWidth, alignSelf: 'center', paddingTop: spacing.xxxl },
  brand: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xxxl },
  name: { fontSize: fontSize.brand, fontWeight: '800', color: colors.surface },
  copy: { paddingHorizontal: spacing.xxxl, gap: spacing.lg },
  title: { fontSize: fontSize.display, lineHeight: 48, fontWeight: '700', color: colors.surface },
  subtitle: { fontSize: fontSize.body, lineHeight: lineHeight.body, color: colors.nightText },
  start: { alignSelf: 'flex-start', minHeight: size.touchTarget, justifyContent: 'center', paddingHorizontal: spacing.xxl, backgroundColor: colors.surface, borderRadius: radius.control, marginTop: spacing.sm },
  startText: { fontSize: fontSize.body, fontWeight: '700', color: colors.purple },
  pressed: { opacity: 0.8 },
  artwork: { flexGrow: 1, minHeight: 280, marginTop: spacing.xl, overflow: 'hidden' },
  credit: { color: colors.nightText, fontSize: fontSize.caption, textAlign: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, textDecorationLine: 'underline', minHeight: size.touchTarget },
  note: { fontSize: fontSize.caption, lineHeight: lineHeight.caption, textAlign: 'center', color: colors.nightText, padding: spacing.md },
});
