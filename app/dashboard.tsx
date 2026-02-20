import { useAppTheme } from '@/hooks/use-app-theme';
import { useDashboard } from '@/hooks/use-dashboard';
import { useMyEvents } from '@/hooks/use-events-query';
import { useAuth } from '@/lib/providers/auth-provider';
import type { Event } from '@/lib/types/events.types';
import { EventStatus } from '@/lib/types/events.types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subtitle?: string;
  colors: {
    cardElevated: string;
    textSecondary: string;
    text: string;
    textTertiary: string;
  };
}

function StatCard({ title, value, icon, color, subtitle, colors }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, backgroundColor: colors.cardElevated }]}>
      <View style={styles.statCardHeader}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[styles.statCardTitle, { color: colors.textSecondary }]}>{title}</Text>
      </View>
      <Text style={[styles.statCardValue, { color: colors.text }]}>{value}</Text>
      {subtitle && <Text style={[styles.statCardSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>}
    </View>
  );
}

interface MenuItemProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colors: {
    text: string;
    textSecondary: string;
    iconSecondary: string;
    cardElevated: string;
    border: string;
  };
}

function MenuItem({ title, subtitle, icon, onPress, colors }: MenuItemProps) {
  return (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuItemIcon, { backgroundColor: colors.cardElevated }]}>
        <Ionicons name={icon} size={22} color={colors.text} />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={[styles.menuItemTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.iconSecondary} />
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { stats, venues = [], isLoading: statsLoading, error, refetch } = useDashboard();
  const { data: myEvents = [] } = useMyEvents();
  const { colors } = useAppTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showEventPicker, setShowEventPicker] = React.useState(false);
  const [pickerAction, setPickerAction] = React.useState<'scanner' | 'collect'>('scanner');

  // Filter to active/published events for scanning
  const scannerEvents = React.useMemo(() => {
    return myEvents.filter(
      (e) => e.status === EventStatus.PUBLISHED || e.status === EventStatus.ACTIVE
    );
  }, [myEvents]);

  const handleScannerPress = React.useCallback(() => {
    if (scannerEvents.length === 0) {
      // No active events — open scanner without eventId
      router.push('/scan-qr');
    } else if (scannerEvents.length === 1) {
      // Single active event — go straight to scanner
      router.push({ pathname: '/scan-qr', params: { eventId: String(scannerEvents[0].id) } });
    } else {
      // Multiple events — show picker
      setPickerAction('scanner');
      setShowEventPicker(true);
    }
  }, [scannerEvents, router]);

  const handleCollectPress = React.useCallback(() => {
    if (scannerEvents.length === 0) {
      Alert.alert('No Active Events', 'You need an active or published event to collect payments.');
    } else if (scannerEvents.length === 1) {
      router.push({ pathname: '/collect-payments', params: { eventId: String(scannerEvents[0].id) } });
    } else {
      setPickerAction('collect');
      setShowEventPicker(true);
    }
  }, [scannerEvents, router]);

  const pickEvent = React.useCallback((event: Event) => {
    setShowEventPicker(false);
    if (pickerAction === 'collect') {
      router.push({ pathname: '/collect-payments', params: { eventId: String(event.id) } });
    } else {
      router.push({ pathname: '/scan-qr', params: { eventId: String(event.id) } });
    }
  }, [router, pickerAction]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const isLoading = authLoading || statsLoading;

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Dashboard</Text>
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
            tintColor={colors.text}
            colors={[colors.text]}
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
              <Text style={[styles.retryText, { color: colors.buttonPrimary }]}>Retry</Text>
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
            colors={colors}
          />
          <StatCard
            title="Total RSVPs"
            value={stats?.totalRSVPs ?? 0}
            icon="people-outline"
            color="#22c55e"
            subtitle="Attendees"
            colors={colors}
          />
          <StatCard
            title="Check-Ins"
            value={stats?.totalCheckIns ?? 0}
            icon="checkmark-circle-outline"
            color="#10b981"
            subtitle="Verified guests"
            colors={colors}
          />
          <StatCard
            title="Views"
            value={stats?.totalViews ?? 0}
            icon="eye-outline"
            color="#3b82f6"
            subtitle="Event page views"
            colors={colors}
          />
          <StatCard
            title="Engagement"
            value={`${stats?.engagementRate ?? 0}%`}
            icon="trending-up-outline"
            color="#f59e0b"
            subtitle="Conversion rate"
            colors={colors}
          />
        </Animated.View>

        {/* My Venues */}
        {venues.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(150).duration(500).springify()}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Venues</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.venueList}
            >
              {venues.map((venue) => (
                <View
                  key={venue.id}
                  style={[styles.venueCard, { backgroundColor: colors.cardElevated }]}
                >
                  {venue.imageUrl ? (
                    <Image
                      source={{ uri: venue.imageUrl }}
                      style={styles.venueImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.venueImagePlaceholder, { backgroundColor: colors.backgroundSecondary || colors.cardElevated }]}>
                      <Ionicons name="business-outline" size={28} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.venueInfo}>
                    <Text style={[styles.venueName, { color: colors.text }]} numberOfLines={1}>
                      {venue.name}
                    </Text>
                    {(venue.city || venue.address) && (
                      <Text style={[styles.venueLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                        {venue.city || venue.address}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(venues.length > 0 ? 250 : 200).duration(500).springify()}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.8}
              onPress={() => router.push('/create-event')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#000' }]}>
                <Ionicons name="add" size={24} color="#fff" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Create Event</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.8}
              onPress={handleScannerPress}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#000' }]}>
                <Ionicons name="scan-outline" size={24} color="#fff" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Scanner</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.8}
              onPress={handleCollectPress}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#000' }]}>
                <Ionicons name="card-outline" size={24} color="#fff" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Collect</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.8}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#000' }]}>
                <Ionicons name="share-social-outline" size={24} color="#fff" />
              </View>
              <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Promote</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View
          entering={FadeInDown.delay(venues.length > 0 ? 350 : 300).duration(500).springify()}
          style={styles.section}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Manage</Text>
          <View style={[styles.menuList, { backgroundColor: colors.cardElevated }]}>
            <MenuItem
              title="My Events"
              subtitle="View and manage your events"
              icon="calendar-outline"
              onPress={() => router.push('/my-events')}
              colors={colors}
            />
            <MenuItem
              title="Analytics"
              subtitle="View detailed insights"
              icon="bar-chart-outline"
              onPress={() => router.push('/dashboard/analytics')}
              colors={colors}
            />
            <MenuItem
              title="Revenue"
              subtitle="Track earnings and trends"
              icon="trending-up-outline"
              onPress={() => router.push('/dashboard/revenue')}
              colors={colors}
            />
            <MenuItem
              title="Attendees"
              subtitle="Manage event attendees"
              icon="people-outline"
              onPress={() => {}}
              colors={colors}
            />
            <MenuItem
              title="Payments"
              subtitle="View earnings and payouts"
              icon="wallet-outline"
              onPress={() => router.push('/dashboard/payments')}
              colors={colors}
            />
            <MenuItem
              title="Settings"
              subtitle="Account and preferences"
              icon="settings-outline"
              onPress={() => {}}
              colors={colors}
            />
          </View>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>

      {/* Event Picker Modal */}
      <Modal
        visible={showEventPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEventPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEventPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.cardElevated }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {pickerAction === 'collect' ? 'Select Event to Collect' : 'Select Event to Scan'}
            </Text>
            <FlatList
              data={scannerEvents}
              keyExtractor={(item) => String(item.id)}
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.eventPickerItem, { borderBottomColor: colors.border }]}
                  onPress={() => pickEvent(item)}
                  activeOpacity={0.7}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.eventPickerImage} />
                  ) : (
                    <View style={[styles.eventPickerImagePlaceholder, { backgroundColor: colors.backgroundSecondary || colors.cardElevated }]}>
                      <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.eventPickerInfo}>
                    <Text style={[styles.eventPickerName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.eventPickerDate, { color: colors.textSecondary }]}>
                      {new Date(item.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.iconSecondary} />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.modalCancelBtn, { borderTopColor: colors.border }]}
              onPress={() => setShowEventPicker(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: '#ef4444',
  },
  retryText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
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
  },
  statCardValue: {
    fontSize: 28,
    fontFamily: 'Lato_700Bold',
  },
  statCardSubtitle: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
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
    textAlign: 'center',
  },
  venueList: {
    gap: 12,
    paddingRight: 4,
  },
  venueCard: {
    width: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  venueImage: {
    width: '100%',
    height: 100,
  },
  venueImagePlaceholder: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueInfo: {
    padding: 10,
    gap: 2,
  },
  venueName: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  venueLocation: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  menuList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
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
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  menuItemSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalList: {
    maxHeight: 300,
  },
  eventPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  eventPickerImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  eventPickerImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventPickerInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  eventPickerName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  eventPickerDate: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  modalCancelBtn: {
    paddingVertical: 14,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
});
