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
import { LinearGradient } from 'expo-linear-gradient';
import { liquidGlass, activeGradient, activeGradientLight, glassBorder, glassText, glassSurfaceTint } from '@/constants/glass/liquid-glass';
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

interface NavItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  action?: string;
}

const CONNECTIONS_ITEMS: NavItem[] = [
  { label: 'Blocked Accounts', icon: 'ban-outline' },
  { label: 'Muted Accounts', icon: 'volume-mute-outline' },
  { label: 'Restricted Accounts', icon: 'shield-outline' },
];

const DATA_ITEMS: NavItem[] = [
  { label: 'Download Your Data', icon: 'download-outline', action: 'download' },
  { label: 'Clear Search History', icon: 'trash-outline', action: 'clear-search' },
];

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { data: preferences, isLoading } = useUserPreferences();
  const updatePreference = useUpdatePreference();

  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];
  const gradient = isDark ? activeGradient : activeGradientLight;

  const handleToggle = React.useCallback(
    (key: keyof UserPreferences, value: boolean) => {
      updatePreference.mutate({ [key]: value });
    },
    [updatePreference],
  );

  const handleDataAction = React.useCallback((action?: string) => {
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
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <LinearGradient
        colors={[...gradient.colors]}
        locations={[...gradient.locations]}
        start={gradient.start}
        end={gradient.end}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { borderColor: border }]}
        >
          {/* @ts-expect-error — augmented GlassViewProps */}
          <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={18} style={StyleSheet.absoluteFill} />
          <Ionicons name="chevron-back" size={20} color={t.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.primary }]}>Privacy</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading || !preferences ? (
        <View style={styles.loading}>
          <ActivityIndicator color={t.muted} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Account Privacy */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.muted }]}>ACCOUNT PRIVACY</Text>
            <View style={[styles.sectionCard, { borderColor: border }]}>
              {/* @ts-expect-error — augmented GlassViewProps */}
              <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={14} style={styles.cardGlass} />
              {PRIVACY_TOGGLES.map((item) => (
                <View key={item.key} style={styles.toggleRow}>
                  <View style={styles.toggleLeft}>
                    <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                      <Ionicons name={item.icon} size={18} color={t.primary} />
                    </View>
                    <View style={styles.toggleText}>
                      <Text style={[styles.toggleLabel, { color: t.primary }]}>{item.label}</Text>
                      <Text style={[styles.toggleDesc, { color: t.muted }]}>{item.description}</Text>
                    </View>
                  </View>
                  <Switch
                    value={preferences[item.key] as boolean}
                    onValueChange={(val) => handleToggle(item.key, val)}
                    trackColor={{
                      false: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                      true: '#34c759',
                    }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Connections */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.muted }]}>CONNECTIONS</Text>
            <View style={[styles.sectionCard, { borderColor: border }]}>
              {/* @ts-expect-error — augmented GlassViewProps */}
              <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={14} style={styles.cardGlass} />
              {CONNECTIONS_ITEMS.map((item, index) => (
                <React.Fragment key={item.label}>
                  <TouchableOpacity style={styles.navRow} activeOpacity={0.7}>
                    <View style={styles.navLeft}>
                      <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                        <Ionicons name={item.icon} size={18} color={t.primary} />
                      </View>
                      <Text style={[styles.navLabel, { color: t.primary }]}>{item.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={t.muted} />
                  </TouchableOpacity>
                  {index < CONNECTIONS_ITEMS.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: border }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Your Data */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.muted }]}>YOUR DATA</Text>
            <View style={[styles.sectionCard, { borderColor: border }]}>
              {/* @ts-expect-error — augmented GlassViewProps */}
              <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={14} style={styles.cardGlass} />
              {DATA_ITEMS.map((item, index) => (
                <React.Fragment key={item.label}>
                  <TouchableOpacity
                    style={styles.navRow}
                    activeOpacity={0.7}
                    onPress={() => handleDataAction(item.action)}
                  >
                    <View style={styles.navLeft}>
                      <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                        <Ionicons name={item.icon} size={18} color={t.primary} />
                      </View>
                      <Text style={[styles.navLabel, { color: t.primary }]}>{item.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={t.muted} />
                  </TouchableOpacity>
                  {index < DATA_ITEMS.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: border }]} />
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
  container: { flex: 1 },
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
  headerTitle: { fontSize: 17, fontFamily: 'Lato_700Bold' },
  headerRight: { width: 36 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 24 },
  section: { marginBottom: 28 },
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
  cardGlass: { ...StyleSheet.absoluteFillObject },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: { flex: 1 },
  toggleLabel: { fontSize: 15, fontFamily: 'Lato_600SemiBold' },
  toggleDesc: { fontSize: 12, fontFamily: 'Lato_400Regular', marginTop: 2 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navLabel: { fontSize: 15, fontFamily: 'Lato_600SemiBold' },
  divider: { height: 1, marginLeft: 58 },
});
