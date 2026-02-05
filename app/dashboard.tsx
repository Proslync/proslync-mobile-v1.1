import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/lib/providers/auth-provider';
import { useDashboard } from '@/hooks/use-dashboard';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardHeader}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.statCardTitle}>{title}</Text>
      </View>
      <Text style={styles.statCardValue}>{value}</Text>
      {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
    </View>
  );
}

interface MenuItemProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

function MenuItem({ title, subtitle, icon, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemIcon}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { stats, isLoading: statsLoading, error, refetch } = useDashboard();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const isLoading = authLoading || statsLoading;

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#8b5cf6']}
          />
        }
      >
        {/* Error Banner */}
        {error && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.errorBanner}
          >
            <Ionicons name="warning-outline" size={20} color="#f87171" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refetch} activeOpacity={0.7}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Stats Grid */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500).springify()}
          style={styles.statsGrid}
        >
          <StatCard
            title="Total Events"
            value={stats?.totalEvents ?? 0}
            icon="calendar-outline"
            color="#8b5cf6"
            subtitle="Events created"
          />
          <StatCard
            title="Total RSVPs"
            value={stats?.totalRSVPs ?? 0}
            icon="people-outline"
            color="#22c55e"
            subtitle="Attendees"
          />
          <StatCard
            title="Views"
            value={stats?.totalViews ?? 0}
            icon="eye-outline"
            color="#3b82f6"
            subtitle="Event page views"
          />
          <StatCard
            title="Engagement"
            value={`${stats?.engagementRate ?? 0}%`}
            icon="trending-up-outline"
            color="#f59e0b"
            subtitle="Conversion rate"
          />
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.8}
              onPress={() => router.push('/create-event')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#8b5cf6' }]}>
                <Ionicons name="add" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Create Event</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.8}
              onPress={() => router.push('/scan-qr')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#22c55e' }]}>
                <Ionicons name="scan-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Scanner</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.8}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#3b82f6' }]}>
                <Ionicons name="share-social-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Promote</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Manage</Text>
          <View style={styles.menuList}>
            <MenuItem
              title="My Events"
              subtitle="View and manage your events"
              icon="calendar-outline"
              onPress={() => router.push('/my-events')}
            />
            <MenuItem
              title="Analytics"
              subtitle="View detailed insights"
              icon="bar-chart-outline"
              onPress={() => {}}
            />
            <MenuItem
              title="Attendees"
              subtitle="Manage event attendees"
              icon="people-outline"
              onPress={() => {}}
            />
            <MenuItem
              title="Payments"
              subtitle="View earnings and payouts"
              icon="wallet-outline"
              onPress={() => router.push('/dashboard/payments')}
            />
            <MenuItem
              title="Settings"
              subtitle="Account and preferences"
              icon="settings-outline"
              onPress={() => {}}
            />
          </View>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: '#f87171',
  },
  retryText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: '#8b5cf6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  statCardValue: {
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  statCardSubtitle: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  menuList: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  menuItemSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
});
