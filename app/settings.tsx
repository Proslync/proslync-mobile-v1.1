import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme, type ThemeMode } from '@/hooks/use-app-theme';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, themeMode, setThemeMode } = useAppTheme();

  const themeOptions: { mode: ThemeMode; label: string; description: string }[] = [
    { mode: 'light', label: 'Light', description: 'Always use light theme' },
    { mode: 'dark', label: 'Dark', description: 'Always use dark theme' },
    { mode: 'system', label: 'System', description: 'Follow system settings' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            PREFERENCES
          </Text>

          <View
            style={[
              styles.sectionContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Theme Options */}
            <View style={styles.themeHeader}>
              <View style={styles.themeHeaderLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                  ]}
                >
                  <Ionicons
                    name={isDark ? 'moon' : 'sunny'}
                    size={20}
                    color={colors.text}
                  />
                </View>
                <View>
                  <Text style={[styles.themeTitle, { color: colors.text }]}>
                    Appearance
                  </Text>
                  <Text style={[styles.themeSubtitle, { color: colors.textSecondary }]}>
                    {themeMode === 'system'
                      ? `System (${isDark ? 'Dark' : 'Light'})`
                      : themeMode === 'dark'
                      ? 'Dark theme enabled'
                      : 'Light theme enabled'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.separator }]} />

            {/* Theme Selection */}
            {themeOptions.map((option, index) => (
              <React.Fragment key={option.mode}>
                <TouchableOpacity
                  style={styles.themeOption}
                  onPress={() => setThemeMode(option.mode)}
                  activeOpacity={0.7}
                >
                  <View style={styles.themeOptionLeft}>
                    <Ionicons
                      name={
                        option.mode === 'light'
                          ? 'sunny-outline'
                          : option.mode === 'dark'
                          ? 'moon-outline'
                          : 'phone-portrait-outline'
                      }
                      size={22}
                      color={colors.textSecondary}
                    />
                    <View style={styles.themeOptionText}>
                      <Text style={[styles.optionLabel, { color: colors.text }]}>
                        {option.label}
                      </Text>
                      <Text style={[styles.optionDescription, { color: colors.textTertiary }]}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      {
                        borderColor:
                          themeMode === option.mode
                            ? colors.buttonPrimary
                            : colors.border,
                      },
                    ]}
                  >
                    {themeMode === option.mode && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: colors.buttonPrimary },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
                {index < themeOptions.length - 1 && (
                  <View
                    style={[
                      styles.optionSeparator,
                      { backgroundColor: colors.separator },
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Future sections placeholder */}
        {/*
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
            ACCOUNT
          </Text>
          ...
        </View>
        */}
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_600SemiBold',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  themeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeTitle: {
    fontSize: 16,
    fontFamily: 'Lato_600SemiBold',
  },
  themeSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  themeOptionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  optionSeparator: {
    height: 1,
    marginLeft: 50,
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
