import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useUserPreferences, useUpdatePreference } from '@/hooks';
import type { UserPreferences } from '@/lib/types/preferences.types';

interface ToggleItem {
  key: keyof UserPreferences;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PRIVACY_TOGGLES: ToggleItem[] = [
  { key: 'privateAccount', label: 'Private Account', description: 'Only followers can see your posts', icon: 'lock-closed-outline' },
];

interface ConnectionItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CONNECTIONS_ITEMS: ConnectionItem[] = [
  { label: 'Blocked Accounts', icon: 'ban-outline' },
  { label: 'Muted Accounts', icon: 'volume-mute-outline' },
  { label: 'Restricted Accounts', icon: 'shield-outline' },
];

interface DataActionItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: 'download' | 'clear-search';
}

const DATA_ITEMS: DataActionItem[] = [
  { label: 'Download Your Data', icon: 'download-outline', action: 'download' },
  { label: 'Clear Search History', icon: 'trash-outline', action: 'clear-search' },
];

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { data: preferences, isLoading } = useUserPreferences();
  const updatePreference = useUpdatePreference();

  const handleToggle = React.useCallback(
    (key: keyof UserPreferences, value: boolean) => {
      updatePreference.mutate({ [key]: value });
    },
    [updatePreference],
  );

  const handleDataAction = React.useCallback((action: string) => {
    if (action === 'clear-search') {
      Alert.alert(
        'Clear Search History',
        'Are you sure you want to clear your search history? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: () => {} },
        ],
      );
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DarkGradientBg />
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Privacy
        </Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading || !preferences ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Account Privacy */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
              ACCOUNT PRIVACY
            </Text>
            <View
              style={[
                styles.sectionContent,
                { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
              ]}
            >
              <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFill} />
              {PRIVACY_TOGGLES.map((item, index) => (
                <React.Fragment key={item.key}>
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLeft}>
                      <View
                        style={[
                          styles.iconContainer,
                          isDark ? { overflow: 'hidden' } : { backgroundColor: 'rgba(0,0,0,0.05)' },
                        ]}
                      >
                        {isDark && (
                          <GlassView
                            {...liquidGlass.fill}
                            borderRadius={8}
                            style={StyleSheet.absoluteFillObject}
                          />
                        )}
                        <Ionicons name={item.icon} size={18} color={colors.text} />
                      </View>
                      <View style={styles.toggleText}>
                        <Text style={[styles.toggleLabel, { color: colors.text }]}>
                          {item.label}
                        </Text>
                        <Text style={[styles.toggleDescription, { color: colors.textTertiary }]}>
                          {item.description}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={preferences[item.key] as boolean}
                      onValueChange={(val) => handleToggle(item.key, val)}
                      trackColor={{
                        false: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                        true: colors.buttonPrimary,
                      }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                  {index < PRIVACY_TOGGLES.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: colors.separator }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Connections */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
              CONNECTIONS
            </Text>
            <View
              style={[
                styles.sectionContent,
                { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
              ]}
            >
              <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFill} />
              {CONNECTIONS_ITEMS.map((item, index) => (
                <React.Fragment key={item.label}>
                  <TouchableOpacity style={styles.navRow} activeOpacity={0.7}>
                    <View style={styles.navLeft}>
                      <View
                        style={[
                          styles.iconContainer,
                          isDark ? { overflow: 'hidden' } : { backgroundColor: 'rgba(0,0,0,0.05)' },
                        ]}
                      >
                        {isDark && (
                          <GlassView
                            {...liquidGlass.fill}
                            borderRadius={8}
                            style={StyleSheet.absoluteFillObject}
                          />
                        )}
                        <Ionicons name={item.icon} size={18} color={colors.text} />
                      </View>
                      <Text style={[styles.navLabel, { color: colors.text }]}>
                        {item.label}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                  {index < CONNECTIONS_ITEMS.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: colors.separator }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Your Data */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
              YOUR DATA
            </Text>
            <View
              style={[
                styles.sectionContent,
                { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
              ]}
            >
              <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFill} />
              {DATA_ITEMS.map((item, index) => (
                <React.Fragment key={item.label}>
                  <TouchableOpacity
                    style={styles.navRow}
                    activeOpacity={0.7}
                    onPress={() => handleDataAction(item.action)}
                  >
                    <View style={styles.navLeft}>
                      <View
                        style={[
                          styles.iconContainer,
                          isDark ? { overflow: 'hidden' } : { backgroundColor: 'rgba(0,0,0,0.05)' },
                        ]}
                      >
                        {isDark && (
                          <GlassView
                            {...liquidGlass.fill}
                            borderRadius={8}
                            style={StyleSheet.absoluteFillObject}
                          />
                        )}
                        <Ionicons name={item.icon} size={18} color={colors.text} />
                      </View>
                      <Text style={[styles.navLabel, { color: colors.text }]}>
                        {item.label}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                  {index < DATA_ITEMS.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: colors.separator }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
  },
  toggleDescription: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navLabel: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
  },
  separator: {
    height: 1,
    marginLeft: 60,
  },
});
