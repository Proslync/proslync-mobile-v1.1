import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { liquidGlass, activeGradient, activeGradientLight, glassBorder, glassText, glassSurfaceTint } from '@/constants/glass/liquid-glass';
import { useAppTheme, type ThemeMode } from '@/hooks/use-app-theme';
import { AnimatedCollapsible } from '@/components/ui/animated-collapsible';

function AnimatedChevron({ expanded, color }: { expanded: boolean; color: string }) {
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withTiming(expanded ? '180deg' : '0deg', {
          duration: 250,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
      },
    ],
  }));

  return (
    <Animated.View style={style}>
      <Ionicons name="chevron-down" size={18} color={color} />
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, themeMode, setThemeMode } = useAppTheme();
  const [appearanceExpanded, setAppearanceExpanded] = React.useState(false);

  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];
  const gradient = isDark ? activeGradient : activeGradientLight;

  const themeOptions: { mode: ThemeMode; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: 'light', label: 'Light', description: 'Always use light theme', icon: 'sunny-outline' },
    { mode: 'dark', label: 'Dark', description: 'Always use dark theme', icon: 'moon-outline' },
    { mode: 'system', label: 'System', description: 'Follow system settings', icon: 'phone-portrait-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <LinearGradient
        colors={[...gradient.colors]}
        locations={[...gradient.locations]}
        start={gradient.start}
        end={gradient.end}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { borderColor: border }]}
        >
          {/* @ts-expect-error — augmented GlassViewProps */}
          <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={18} style={StyleSheet.absoluteFill} />
          <Ionicons name="chevron-back" size={20} color={t.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.primary }]}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.muted }]}>PREFERENCES</Text>

          <View style={[styles.sectionCard, { borderColor: border }]}>
            {/* @ts-expect-error — augmented GlassViewProps */}
            <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={14} style={styles.cardGlass} />

            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => setAppearanceExpanded((prev) => !prev)}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={t.primary} />
                </View>
                <View>
                  <Text style={[styles.rowLabel, { color: t.primary }]}>Appearance</Text>
                  <Text style={[styles.rowSub, { color: t.tertiary }]}>
                    {themeMode === 'system'
                      ? `System (${isDark ? 'Dark' : 'Light'})`
                      : themeMode === 'dark'
                      ? 'Dark theme enabled'
                      : 'Light theme enabled'}
                  </Text>
                </View>
              </View>
              <AnimatedChevron expanded={appearanceExpanded} color={t.muted} />
            </TouchableOpacity>

            <AnimatedCollapsible expanded={appearanceExpanded}>
              <View style={[styles.divider, { backgroundColor: border }]} />
              {themeOptions.map((option, index) => (
                <React.Fragment key={option.mode}>
                  <TouchableOpacity
                    style={styles.themeOption}
                    onPress={() => setThemeMode(option.mode)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.themeOptionLeft}>
                      <Ionicons name={option.icon} size={20} color={t.tertiary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowLabel, { color: t.primary }]}>{option.label}</Text>
                        <Text style={[styles.rowSub, { color: t.muted }]}>{option.description}</Text>
                      </View>
                    </View>
                    <View style={[styles.radioOuter, { borderColor: themeMode === option.mode ? '#fff' : border }]}>
                      {themeMode === option.mode && (
                        <View style={[styles.radioInner, { backgroundColor: '#fff' }]} />
                      )}
                    </View>
                  </TouchableOpacity>
                  {index < themeOptions.length - 1 && (
                    <View style={[styles.optionDivider, { backgroundColor: border }]} />
                  )}
                </React.Fragment>
              ))}
            </AnimatedCollapsible>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.muted }]}>ACCOUNT</Text>
          <View style={[styles.sectionCard, { borderColor: border }]}>
            {/* @ts-expect-error — augmented GlassViewProps */}
            <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={14} style={styles.cardGlass} />

            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => router.push('/notification-settings')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                  <Ionicons name="notifications-outline" size={18} color={t.primary} />
                </View>
                <Text style={[styles.rowLabel, { color: t.primary }]}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={t.muted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: border }]} />

            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => router.push('/privacy-settings')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={t.primary} />
                </View>
                <Text style={[styles.rowLabel, { color: t.primary }]}>Privacy</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={t.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  headerRight: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardGlass: {
    ...StyleSheet.absoluteFillObject,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
  },
  rowSub: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionDivider: {
    height: 1,
    marginLeft: 48,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
