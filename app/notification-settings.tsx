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
  colors,
  isDark,
  isLast,
}: {
  item: ToggleItem;
  value: boolean;
  onToggle: (key: keyof UserPreferences, val: boolean) => void;
  colors: any;
  isDark: boolean;
  isLast: boolean;
}) {
  return (
    <>
      <View style={styles.toggleRow}>
        <View style={styles.toggleLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
            ]}
          >
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
          value={value}
          onValueChange={(val) => onToggle(item.key, val)}
          trackColor={{
            false: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
            true: colors.buttonPrimary,
          }}
          thumbColor="#FFFFFF"
        />
      </View>
      {!isLast && (
        <View style={[styles.separator, { backgroundColor: colors.separator }]} />
      )}
    </>
  );
}

function Section({
  title,
  items,
  preferences,
  onToggle,
  colors,
  isDark,
}: {
  title: string;
  items: ToggleItem[];
  preferences: UserPreferences;
  onToggle: (key: keyof UserPreferences, val: boolean) => void;
  colors: any;
  isDark: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
        {title}
      </Text>
      <View
        style={[
          styles.sectionContent,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {items.map((item, index) => (
          <ToggleRow
            key={item.key}
            item={item}
            value={preferences[item.key] as boolean}
            onToggle={onToggle}
            colors={colors}
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
  const { colors, isDark } = useAppTheme();
  const { data: preferences, isLoading } = useUserPreferences();
  const updatePreference = useUpdatePreference();

  const handleToggle = React.useCallback(
    (key: keyof UserPreferences, value: boolean) => {
      updatePreference.mutate({ [key]: value });
    },
    [updatePreference],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          Notifications
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
          <Section
            title="ACTIVITY"
            items={ACTIVITY_ITEMS}
            preferences={preferences}
            onToggle={handleToggle}
            colors={colors}
            isDark={isDark}
          />
          <Section
            title="MESSAGES"
            items={MESSAGES_ITEMS}
            preferences={preferences}
            onToggle={handleToggle}
            colors={colors}
            isDark={isDark}
          />
          <Section
            title="OTHER"
            items={OTHER_ITEMS}
            preferences={preferences}
            onToggle={handleToggle}
            colors={colors}
            isDark={isDark}
          />
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
  separator: {
    height: 1,
    marginLeft: 60,
  },
});
