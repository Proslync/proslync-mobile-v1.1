// Wallet Screen - Membership card, offers, and events
import React, { useRef, useMemo, useCallback } from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import { View, StyleSheet, ScrollView, TouchableOpacity, Pressable, Modal, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '@/lib/providers/wallet-provider';
import { useAuth } from '@/lib/providers/auth-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useMembershipCard } from '@/hooks/use-membership-card';
import { useMyVenues } from '@/hooks/use-venues-query';
import {
  liquidGlass,
  glassBorder,
  glassText,
} from '@/constants/glass/liquid-glass';
import { GlassView } from 'expo-glass-effect';
import {
  Gesture,
  GestureDetector,
  TouchableOpacity as GHTouchableOpacity,
} from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  MembershipCard,
  IncompleteMembershipCard,
  StatusCardMenuSheet,
  TicketList,
  WalletSkeleton,
} from '@/components/wallet';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

// ─── Profile Selector Modal ────────────────────────────────────

function ProfileSelectorModal({
  visible,
  currentUser,
  venues,
  selectedVenueId,
  onClose,
  onSelectPersonal,
  onSelectVenue,
  onCreateOrg,
}: {
  visible: boolean;
  currentUser: { id: number; userName?: string; firstName?: string; lastName?: string; avatar?: { url: string } | null };
  venues: { id: number; name: string; imageUrl?: string }[];
  selectedVenueId: number | null;
  onClose: () => void;
  onSelectPersonal: () => void;
  onSelectVenue: (venue: { id: number; name: string }) => void;
  onCreateOrg: () => void;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(400);

  React.useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const dismiss = React.useCallback(() => {
    translateY.value = withTiming(400, { duration: 200 });
    setTimeout(onClose, 200);
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 500) {
        translateY.value = withTiming(400, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  const displayName = currentUser.firstName
    ? `${currentUser.firstName}${currentUser.lastName ? ' ' + currentUser.lastName : ''}`
    : currentUser.userName || 'User';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={selectorStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={dismiss} />

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[selectorStyles.sheet, sheetAnimStyle]}>
            <View style={selectorStyles.content}>
              <GlassView {...liquidGlass.surface} borderRadius={20} style={StyleSheet.absoluteFillObject} />

              <View style={selectorStyles.handle} />

              <View style={selectorStyles.header}>
                <Text style={selectorStyles.title}>Switch Profile</Text>
                <GHTouchableOpacity onPress={dismiss} style={selectorStyles.closeButton}>
                  <Ionicons name="close-circle" size={24} color="rgba(0,0,0,0.3)" />
                </GHTouchableOpacity>
              </View>

              {/* Current user — personal account */}
              <GHTouchableOpacity
                style={selectorStyles.item}
                activeOpacity={selectedVenueId === null ? 1 : 0.7}
                onPress={() => selectedVenueId !== null && onSelectPersonal()}
              >
                <Image
                  source={currentUser.avatar?.url ? { uri: currentUser.avatar.url } : DefaultAvatarImage}
                  style={[selectorStyles.avatar, selectedVenueId === null && selectorStyles.avatarActive]}
                />
                <View style={selectorStyles.info}>
                  <Text style={selectorStyles.nameText}>{displayName}</Text>
                  <Text style={selectorStyles.subtitleText}>Personal Account</Text>
                </View>
                {selectedVenueId === null && (
                  <Ionicons name="checkmark-circle" size={22} color="#1A1A1A" />
                )}
              </GHTouchableOpacity>

              {/* Venues */}
              {venues.length > 0 && (
                <>
                  <View style={selectorStyles.sectionHeader}>
                    <Ionicons name="business-outline" size={14} color="rgba(0,0,0,0.3)" />
                    <Text style={selectorStyles.sectionTitle}>Your Venues</Text>
                  </View>
                  {venues.map((venue) => {
                    const isSelected = selectedVenueId === venue.id;
                    return (
                      <GHTouchableOpacity
                        key={`venue-${venue.id}`}
                        style={selectorStyles.item}
                        onPress={() => !isSelected && onSelectVenue(venue)}
                        activeOpacity={isSelected ? 1 : 0.7}
                      >
                        <Image
                          source={venue.imageUrl ? { uri: venue.imageUrl } : DefaultAvatarImage}
                          style={[selectorStyles.avatar, isSelected && selectorStyles.avatarActive]}
                        />
                        <View style={selectorStyles.info}>
                          <Text style={selectorStyles.nameText}>{venue.name}</Text>
                          <Text style={selectorStyles.subtitleText}>Venue</Text>
                        </View>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={22} color="#1A1A1A" />
                        ) : (
                          <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.25)" />
                        )}
                      </GHTouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* Create New Organization */}
              <GHTouchableOpacity
                style={[selectorStyles.createOrgButton, { paddingBottom: insets.bottom + 14 }]}
                onPress={onCreateOrg}
                activeOpacity={0.7}
              >
                <View style={selectorStyles.createOrgIcon}>
                  <GlassView {...liquidGlass.fillFaint} borderRadius={22} style={StyleSheet.absoluteFillObject} />
                  <Ionicons name="add" size={22} color="rgba(0,0,0,0.5)" />
                </View>
                <Text style={selectorStyles.createOrgText}>Create New Organization</Text>
              </GHTouchableOpacity>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

// ─── Dashboard Menu (shown when venue selected) ────────────────

interface DashboardMenuItem {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

function DashboardMenuGroup({
  title,
  items,
  delay,
  onItemPress,
}: {
  title: string;
  items: DashboardMenuItem[];
  delay: number;
  onItemPress: (route: string) => void;
}) {
  const t = glassText['light'];
  const border = glassBorder['light'];

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500).springify()} style={dashStyles.section}>
      <Text style={[dashStyles.sectionTitle, { color: t.muted }]}>{title}</Text>
      <View style={[dashStyles.sectionCard, { borderColor: border }]}>
        {items.map((item, index) => (
          <React.Fragment key={item.route}>
            <TouchableOpacity style={dashStyles.menuItem} onPress={() => onItemPress(item.route)} activeOpacity={0.7}>
              <View style={dashStyles.menuItemIcon}>
                <Ionicons name={item.icon} size={18} color={t.primary} />
              </View>
              <View style={dashStyles.menuItemContent}>
                <Text style={[dashStyles.menuItemTitle, { color: t.primary }]}>{item.title}</Text>
                <Text style={[dashStyles.menuItemSubtitle, { color: t.muted }]}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={t.muted} />
            </TouchableOpacity>
            {index < items.length - 1 && <View style={[dashStyles.divider, { backgroundColor: border }]} />}
          </React.Fragment>
        ))}
      </View>
    </Animated.View>
  );
}

function VenueDashboardContent({ venueId }: { venueId: number }) {
  const router = useStableRouter();
  const insets = useSafeAreaInsets();

  const handleNav = useCallback(
    (route: string) => router.push(route as any),
    [router],
  );

  const manageItems: DashboardMenuItem[] = [
    { title: 'Create Event', subtitle: 'Set up a new event', icon: 'add-circle-outline', route: '/create-event' },
    { title: 'My Events', subtitle: 'View and edit your events', icon: 'calendar-outline', route: '/my-events' },
    { title: 'My List', subtitle: "Everyone who RSVP'd", icon: 'list-outline', route: '/dashboard/attendees' },
  ];

  const insightsItems: DashboardMenuItem[] = [
    { title: 'Analytics', subtitle: 'View detailed insights', icon: 'bar-chart-outline', route: '/dashboard/analytics' },
    { title: 'Revenue', subtitle: 'Track earnings and trends', icon: 'trending-up-outline', route: '/dashboard/revenue' },
    { title: 'Wallet', subtitle: 'View earnings and payouts', icon: 'wallet-outline', route: '/dashboard/payments' },
  ];

  const toolsItems: DashboardMenuItem[] = [
    { title: 'Text Blast', subtitle: 'SMS to all your contacts', icon: 'chatbubble-outline', route: '/dashboard/text-blast' },
  ];

  return (
    <ScrollView
      style={dashStyles.scrollView}
      contentContainerStyle={[dashStyles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      <DashboardMenuGroup title="MANAGE" items={manageItems} delay={100} onItemPress={handleNav} />
      <DashboardMenuGroup title="INSIGHTS" items={insightsItems} delay={200} onItemPress={handleNav} />
      <DashboardMenuGroup title="TOOLS" items={toolsItems} delay={300} onItemPress={handleNav} />
    </ScrollView>
  );
}

export default function WalletScreen() {
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { colors, isDark } = useAppTheme();
  const { user: authUser } = useAuth();
  const {
    user,
    offers,
    events,
    isLoading,
    claimOffer,
    refreshWallet,
  } = useWallet();
  const { data: myVenues = [] } = useMyVenues();

  const [cardMenuVisible, setCardMenuVisible] = React.useState(false);
  const [profileSelectorVisible, setProfileSelectorVisible] = React.useState(false);
  const [selectedVenue, setSelectedVenue] = React.useState<{ id: number; name: string } | null>(null);
  const [activeTab, setActiveTab] = React.useState<'Tickets' | 'Tables' | 'Offers'>('Tickets');

  const { data: membershipCard, isLoading: isLoadingCard } = useMembershipCard(
    !!user?.isProfileComplete
  );

  const handleExpandQR = useCallback(() => {
    if (membershipCard?.pdf417Payload) {
      setCardMenuVisible(false);
      router.push({
        pathname: '/qr-card',
        params: {
          payload: membershipCard.pdf417Payload,
          cardNumber: membershipCard.cardNumber ?? '',
        },
      });
    }
  }, [membershipCard, router]);

  // RSVP-only events (no ticketId) that haven't ended yet — passed to TicketList separately
  const rsvpEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => {
      if (e.ticketId) return false; // Only RSVP events
      const end = e.endDateTime ? new Date(e.endDateTime).getTime() : NaN;
      const start = new Date(e.dateTime).getTime();
      // Use endDateTime if valid, otherwise startDate + 12h
      const cutoff = !isNaN(end) ? end : (!isNaN(start) ? start + 12 * 60 * 60 * 1000 : 0);
      return cutoff > now;
    });
  }, [events]);

  // Pull-to-refresh with haptic feedback
  const { refreshControl } = useRefreshControl({
    onRefresh: refreshWallet,
  });

  if (isLoading || !user) {
    return <WalletSkeleton />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <DarkGradientBg />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.headerScrollContent}
        style={styles.headerScroll}
      >
        <TouchableOpacity style={styles.headerPill} activeOpacity={0.7} onPress={() => setProfileSelectorVisible(true)}>
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView {...liquidGlass.surface} tintColor="transparent" borderRadius={19} style={StyleSheet.absoluteFill} />
          </View>
          <Image
            source={
              selectedVenue
                ? (myVenues.find((v) => v.id === selectedVenue.id)?.imageUrl
                    ? { uri: myVenues.find((v) => v.id === selectedVenue.id)!.imageUrl }
                    : DefaultAvatarImage)
                : (authUser?.avatar?.url ? { uri: authUser.avatar.url } : DefaultAvatarImage)
            }
            style={styles.headerPillAvatar}
          />
          <Ionicons name="menu" size={22} color="#000" style={styles.headerPillIcon} />
        </TouchableOpacity>

        {!selectedVenue && (['Tickets', 'Tables', 'Offers'] as const).map((label) => {
          const isActive = activeTab === label;
          return (
            <Pressable
              key={label}
              style={styles.tabPill}
              onPress={() => setActiveTab(label)}
            >
              <View style={styles.glassLayer} pointerEvents="none">
                <GlassView
                  {...liquidGlass.surface}
                  tintColor={isActive ? 'rgba(0,0,0,0.12)' : 'transparent'}
                  borderRadius={19}
                  style={StyleSheet.absoluteFill}
                />
              </View>
              <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedVenue ? (
        <VenueDashboardContent venueId={selectedVenue.id} />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name={activeTab === 'Tickets' ? 'ticket-outline' : activeTab === 'Tables' ? 'restaurant-outline' : 'pricetag-outline'}
            size={48}
            color="rgba(0,0,0,0.2)"
          />
          <Text style={styles.emptyStateText}>
            {activeTab === 'Tickets' ? 'No upcoming tickets' : activeTab === 'Tables' ? 'No upcoming tables' : 'No available offers'}
          </Text>
        </View>
      )}

      {/* Profile Selector */}
      {authUser && (
        <ProfileSelectorModal
          visible={profileSelectorVisible}
          currentUser={authUser}
          venues={myVenues.map((v) => ({ id: v.id, name: v.name, imageUrl: v.imageUrl }))}
          selectedVenueId={selectedVenue?.id ?? null}
          onClose={() => setProfileSelectorVisible(false)}
          onSelectPersonal={() => {
            setSelectedVenue(null);
            setProfileSelectorVisible(false);
          }}
          onSelectVenue={(venue) => {
            setSelectedVenue(venue);
            setProfileSelectorVisible(false);
          }}
          onCreateOrg={() => {
            setProfileSelectorVisible(false);
            // TODO: navigate to create organization screen
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  scrollView: {
    flex: 1,
  },
  headerScroll: {
    flexGrow: 0,
  },
  headerScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 19,
    paddingLeft: 2,
    paddingRight: 12,
  },
  headerPillAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  headerPillIcon: {
    marginLeft: 8,
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 19,
  },
  tabPill: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  tabPillTextActive: {
    color: 'rgba(0,0,0,0.8)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 80,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.35)',
  },
});

const selectorStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    paddingHorizontal: 0,
  },
  content: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  title: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#1A1A1A',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  avatarActive: {
    borderColor: '#1A1A1A',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nameText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#1A1A1A',
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.45)',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(0,0,0,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  createOrgButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  createOrgIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  createOrgText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#1A1A1A',
    marginLeft: 12,
  },
});

const dashStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
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
    backgroundColor: '#ffffff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
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
  divider: {
    height: 1,
    marginLeft: 62,
  },
});
