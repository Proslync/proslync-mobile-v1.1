import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { GlassView } from 'expo-glass-effect';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { liquidGlass, glassBorder, glassText, glassSurfaceTint } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useUserPreferences, useUpdatePreference } from '@/hooks';
import type { UserPreferences } from '@/lib/types/preferences.types';

interface ToggleItem {
  key: keyof UserPreferences;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ACTIVITY_ITEMS: ToggleItem[] = [
  { key: 'notifyLikes', label: 'Likes', description: 'When someone likes your post', icon: 'heart-outline' },
  { key: 'notifyComments', label: 'Comments', description: 'When someone comments on your post', icon: 'chatbubble-outline' },
  { key: 'notifyMentions', label: 'Mentions', description: 'When someone mentions you', icon: 'at-outline' },
  { key: 'notifyNewFollowers', label: 'New Followers', description: 'When someone follows you', icon: 'person-add-outline' },
];

const MESSAGES_ITEMS: ToggleItem[] = [
  { key: 'notifyDirectMessages', label: 'Direct Messages', description: 'When you receive a new message', icon: 'mail-outline' },
];

const OTHER_ITEMS: ToggleItem[] = [
  { key: 'notifyPush', label: 'Push Notifications', description: 'Enable push notifications', icon: 'notifications-outline' },
];

function ToggleRow({
  item,
  value,
  onToggle,
  t,
  border,
  isDark,
  isLast,
}: {
  item: ToggleItem;
  value: boolean;
  onToggle: (key: keyof UserPreferences, val: boolean) => void;
  t: typeof glassText.dark;
  border: string;
  isDark: boolean;
  isLast: boolean;
}) {
  return (
    <>
      <View style={styles.toggleRow}>
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
          value={value}
          onValueChange={(val) => onToggle(item.key, val)}
          trackColor={{
            false: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
            true: '#34c759',
          }}
          thumbColor="#FFFFFF"
        />
      </View>
      {!isLast && <View style={[styles.divider, { backgroundColor: border }]} />}
    </>
  );
}

function Section({
  title,
  items,
  preferences,
  onToggle,
  t,
  border,
  surfaceTint,
  isDark,
}: {
  title: string;
  items: ToggleItem[];
  preferences: UserPreferences;
  onToggle: (key: keyof UserPreferences, val: boolean) => void;
  t: typeof glassText.dark;
  border: string;
  surfaceTint: string;
  isDark: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: t.muted }]}>{title}</Text>
      <View style={[styles.sectionCard, { borderColor: border }]}>
        {/* @ts-expect-error — augmented GlassViewProps */}
        <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={14} style={styles.cardGlass} />
        {items.map((item, index) => (
          <ToggleRow
            key={item.key}
            item={item}
            value={preferences[item.key] as boolean}
            onToggle={onToggle}
            t={t}
            border={border}
            isDark={isDark}
            isLast={index === items.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { data: preferences, isLoading } = useUserPreferences();
  const updatePreference = useUpdatePreference();

  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];

  const handleToggle = React.useCallback(
    (key: keyof UserPreferences, value: boolean) => {
      updatePreference.mutate({ [key]: value });
    },
    [updatePreference],
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <DarkGradientBg />
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
        <Text style={[styles.headerTitle, { color: t.primary }]}>Notifications</Text>
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
          <Section title="ACTIVITY" items={ACTIVITY_ITEMS} preferences={preferences} onToggle={handleToggle} t={t} border={border} surfaceTint={surfaceTint} isDark={isDark} />
          <Section title="MESSAGES" items={MESSAGES_ITEMS} preferences={preferences} onToggle={handleToggle} t={t} border={border} surfaceTint={surfaceTint} isDark={isDark} />
          <Section title="OTHER" items={OTHER_ITEMS} preferences={preferences} onToggle={handleToggle} t={t} border={border} surfaceTint={surfaceTint} isDark={isDark} />
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
  divider: { height: 1, marginLeft: 58 },
});
