import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStableRouter } from '@/hooks/use-stable-router';
import { useAdminStats, useAdminActivity } from '@/hooks/use-admin';
import { liquidGlass } from '@/constants/glass/liquid-glass';

type AdminTab = 'overview' | 'manage' | 'activity';

const ACTIVITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  user_joined: 'person-add-outline',
  event_created: 'calendar-outline',
  post_created: 'document-text-outline',
};

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { data: stats, isLoading, refetch } = useAdminStats();
  const { data: activity } = useAdminActivity(15);
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<AdminTab>('overview');

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
      <View style={[s.container, s.center]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Pill row */}
      <View style={[s.pillRow, { paddingTop: insets.top + 16 }]}>
        <Pressable style={s.pillIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </Pressable>
        {(['overview', 'manage', 'activity'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === 'overview' ? 'Overview' : tab === 'manage' ? 'Manage' : 'Activity';
          return (
            <Pressable key={tab} style={s.pillFilter} onPress={() => setActiveTab(tab)}>
              {isLiquidGlassSupported ? (
                <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={s.pillGlassLayer} pointerEvents="none">
                  <GlassView {...liquidGlass.surface} tintColor={isActive ? 'rgba(0,0,0,0.12)' : 'transparent'} borderRadius={19} style={StyleSheet.absoluteFill} />
                </View>
              )}
              <Text style={[s.pillText, isActive && s.pillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <LinearGradient colors={['#000000', 'rgba(0,0,0,0)']} style={s.topFade} pointerEvents="none" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
      >
        {/* Overview — Stats */}
        {activeTab === 'overview' && stats && (
          <Animated.View entering={FadeInDown.duration(300)} style={s.statsGrid}>
            {[
              { title: 'Users', value: stats.users.total, icon: 'people-outline' as const },
              { title: 'Active', value: stats.users.active, icon: 'checkmark-circle-outline' as const },
              { title: 'Events', value: stats.events.total, icon: 'calendar-outline' as const },
              { title: 'Posts', value: stats.posts.total, icon: 'document-text-outline' as const },
              { title: 'New (7d)', value: stats.users.newThisWeek, icon: 'trending-up-outline' as const },
              { title: 'Verified', value: stats.users.verified, icon: 'shield-checkmark-outline' as const },
            ].map((item) => (
              <View key={item.title} style={s.statCard}>
                <Ionicons name={item.icon} size={18} color="rgba(0,0,0,0.4)" />
                <Text style={s.statValue}>{item.value}</Text>
                <Text style={s.statLabel}>{item.title}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Manage — Menu Items */}
        {activeTab === 'manage' && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={s.menuList}>
              {[
                { title: 'Users', subtitle: `${stats?.users.total ?? 0} total, ${stats?.users.blocked ?? 0} blocked`, icon: 'people-outline' as const, route: '/admin/users' },
                { title: 'Events', subtitle: `${stats?.events.total ?? 0} total, ${stats?.events.published ?? 0} published`, icon: 'calendar-outline' as const, route: '/admin/events' },
                { title: 'Posts', subtitle: `${stats?.posts.total ?? 0} total`, icon: 'document-text-outline' as const, route: '/admin/posts' },
                { title: 'Moderation', subtitle: 'AI event moderation log', icon: 'shield-outline' as const, route: '/admin/moderation' },
                { title: 'Moderation Rules', subtitle: 'Configure AI content rules', icon: 'settings-outline' as const, route: '/admin/rules' },
              ].map((item, i, arr) => (
                <TouchableOpacity
                  key={item.title}
                  style={[s.menuItem, i < arr.length - 1 && s.menuItemBorder]}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={s.menuItemIcon}>
                    <Ionicons name={item.icon} size={20} color="#000" />
                  </View>
                  <View style={s.menuItemContent}>
                    <Text style={s.menuItemTitle}>{item.title}</Text>
                    <Text style={s.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.3)" />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Activity */}
        {activeTab === 'activity' && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {activity && activity.length > 0 ? (
              <View style={s.activityList}>
                {activity.slice(0, 15).map((item, i, arr) => (
                  <View
                    key={`${item.type}-${item.id}-${i}`}
                    style={[s.activityRow, i < arr.length - 1 && s.activityRowBorder]}
                  >
                    <Ionicons
                      name={ACTIVITY_ICONS[item.type] || 'ellipse-outline'}
                      size={18}
                      color="rgba(0,0,0,0.4)"
                    />
                    <View style={s.activityContent}>
                      <Text style={s.activityTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={s.activitySub}>{item.subtitle}</Text>
                    </View>
                    <Text style={s.activityTime}>{formatTimeAgo(item.createdAt)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={s.empty}>
                <Ionicons name="time-outline" size={40} color="rgba(0,0,0,0.2)" />
                <Text style={s.emptyText}>No recent activity</Text>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { justifyContent: 'center', alignItems: 'center' },

  pillRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingBottom: 8, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  pillIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  pillFilter: { height: 38, borderRadius: 19, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  pillGlassLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: 19 },
  pillText: { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.5)' },
  pillTextActive: { color: 'rgba(0,0,0,0.8)' },

  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 9 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 130 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  statCard: { width: '31%' as any, flexGrow: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  statValue: { fontSize: 22, color: '#000' },
  statLabel: { fontSize: 11, color: 'rgba(0,0,0,0.5)' },

  menuList: { borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  menuItemIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: 'rgba(0,0,0,0.05)' },
  menuItemContent: { flex: 1 },
  menuItemTitle: { fontSize: 15, color: '#000' },
  menuItemSubtitle: { fontSize: 13, color: 'rgba(0,0,0,0.5)', marginTop: 2 },

  activityList: { borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  activityRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 14, color: '#000' },
  activitySub: { fontSize: 12, color: 'rgba(0,0,0,0.5)', marginTop: 1 },
  activityTime: { fontSize: 12, color: 'rgba(0,0,0,0.4)' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: 'rgba(0,0,0,0.4)' },
});
