import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStableRouter } from '@/hooks/use-stable-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAdminStats, useAdminActivity } from '@/hooks/use-admin';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';

function StatCard({
  title,
  value,
  icon,
  colors,
}: {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
      <Ionicons name={icon} size={20} color="rgba(255,255,255,0.5)" />
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );
}

function MenuItem({
  title,
  subtitle,
  icon,
  onPress,
  colors,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuItemIcon, { backgroundColor: colors.cardElevated }]}>
        <Ionicons name={icon} size={22} color={colors.text} />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={[styles.menuItemTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.iconSecondary} />
    </TouchableOpacity>
  );
}

const ACTIVITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  user_joined: 'person-add-outline',
  event_created: 'calendar-outline',
  post_created: 'document-text-outline',
};

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { colors, isDark } = useAppTheme();
  const { data: stats, isLoading, refetch } = useAdminStats();
  const { data: activity } = useAdminActivity(15);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatTimeAgo = (dateStr: string) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Admin</Text>
        <View style={styles.backBtn} />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        {/* Stats Grid */}
        {stats && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.statsGrid}>
            <StatCard title="Users" value={stats.users.total} icon="people-outline" colors={colors} />
            <StatCard title="Active" value={stats.users.active} icon="checkmark-circle-outline" colors={colors} />
            <StatCard title="Events" value={stats.events.total} icon="calendar-outline" colors={colors} />
            <StatCard title="Posts" value={stats.posts.total} icon="document-text-outline" colors={colors} />
            <StatCard title="New (7d)" value={stats.users.newThisWeek} icon="trending-up-outline" colors={colors} />
            <StatCard title="Verified" value={stats.users.verified} icon="shield-checkmark-outline" colors={colors} />
          </Animated.View>
        )}

        {/* Menu Items */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500).springify()}
          style={styles.section}
        >
          <View style={[styles.menuList, { backgroundColor: colors.cardElevated }]}>
            <MenuItem
              title="Users"
              subtitle={`${stats?.users.total ?? 0} total, ${stats?.users.blocked ?? 0} blocked`}
              icon="people-outline"
              onPress={() => router.push('/admin/users')}
              colors={colors}
            />
            <MenuItem
              title="Events"
              subtitle={`${stats?.events.total ?? 0} total, ${stats?.events.published ?? 0} published`}
              icon="calendar-outline"
              onPress={() => router.push('/admin/events')}
              colors={colors}
            />
            <MenuItem
              title="Posts"
              subtitle={`${stats?.posts.total ?? 0} total`}
              icon="document-text-outline"
              onPress={() => router.push('/admin/posts')}
              colors={colors}
            />
            <MenuItem
              title="Moderation"
              subtitle="AI event moderation log"
              icon="shield-outline"
              onPress={() => router.push('/admin/moderation')}
              colors={colors}
            />
            <MenuItem
              title="Moderation Rules"
              subtitle="Configure AI content rules"
              icon="settings-outline"
              onPress={() => router.push('/admin/rules')}
              colors={colors}
            />
          </View>
        </Animated.View>

        {/* Recent Activity */}
        {activity && activity.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Recent Activity
            </Text>
            <View style={[styles.activityList, { backgroundColor: colors.cardElevated }]}>
              {activity.slice(0, 10).map((item, i) => (
                <View
                  key={`${item.type}-${item.id}-${i}`}
                  style={[styles.activityRow, i < 9 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                >
                  <Ionicons
                    name={ACTIVITY_ICONS[item.type] || 'ellipse-outline'}
                    size={18}
                    color={colors.textTertiary}
                  />
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.activitySub, { color: colors.textTertiary }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Text style={[styles.activityTime, { color: colors.textTertiary }]}>
                    {formatTimeAgo(item.createdAt)}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Lato_700Bold' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    width: '31%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: 22, fontFamily: 'Lato_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Lato_400Regular' },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  menuList: { borderRadius: 12, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: { flex: 1 },
  menuItemTitle: { fontSize: 15, fontFamily: 'Lato_700Bold' },
  menuItemSubtitle: { fontSize: 13, fontFamily: 'Lato_400Regular', marginTop: 2 },
  activityList: { borderRadius: 12, overflow: 'hidden' },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 13, fontFamily: 'Lato_700Bold' },
  activitySub: { fontSize: 11, fontFamily: 'Lato_400Regular', marginTop: 1 },
  activityTime: { fontSize: 11, fontFamily: 'Lato_400Regular' },
});
