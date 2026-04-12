// Wallet Screen - Membership card, offers, and events
import React, { useRef, useMemo, useCallback } from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import { View, StyleSheet, ScrollView, TouchableOpacity, Pressable, Modal, Text, Image, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '@/lib/providers/wallet-provider';
import { useAuth } from '@/lib/providers/auth-provider';
import { UserRole } from '@/lib/types/auth.types';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useMembershipCard } from '@/hooks/use-membership-card';
import { useMyVenues } from '@/hooks/use-venues-query';
import { useMyEvents, useDebounce } from '@/hooks';
import type { Event as StatusEvent, OwnerContact } from '@/lib/types/events.types';
import { EventStatus } from '@/lib/types/events.types';
import { eventsApi } from '@/lib/api/events';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  liquidGlass,
  glassBorder,
  glassText,
} from '@/constants/glass/liquid-glass';
import { GlassView } from 'expo-glass-effect';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
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
import { FeedMediaPlayer } from '@/components/feed/feed-media-player';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

const personalTabs = ['Tickets', 'Tables', 'Offers'] as const;
const personalAdminTabs = ['Tickets', 'Tables', 'Offers', 'Admin'] as const;
const venueTabs = ['Overview', 'Insights', 'Audience'] as const;

// ─── Profile Selector Modal ────────────────────────────────────

function ProfileSelectorModal({
  visible,
  currentUser,
  venues,
  organizations,
  selectedVenueId,
  selectedOrgId,
  onClose,
  onSelectPersonal,
  onSelectVenue,
  onSelectOrg,
  onCreateOrg,
}: {
  visible: boolean;
  currentUser: { id: number; userName?: string; firstName?: string; lastName?: string; avatar?: { url: string } | null };
  venues: { id: number; name: string; imageUrl?: string }[];
  organizations: { id: number; name: string; logo?: { url: string } | null }[];
  selectedVenueId: number | null;
  selectedOrgId: number | null;
  onClose: () => void;
  onSelectPersonal: () => void;
  onSelectVenue: (venue: { id: number; name: string }) => void;
  onSelectOrg: (org: { id: number; name: string }) => void;
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

  const isPersonal = selectedVenueId === null && selectedOrgId === null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={selectorStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={dismiss} />

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[selectorStyles.sheet, sheetAnimStyle]}>
            <View style={selectorStyles.content}>
              <GlassView {...liquidGlass.surface} borderRadius={20} style={StyleSheet.absoluteFillObject} />

              <View style={selectorStyles.handle} />

              <View style={selectorStyles.listContainer}>
                {/* Current user — personal account */}
                <GHTouchableOpacity
                  style={selectorStyles.item}
                  activeOpacity={isPersonal ? 1 : 0.7}
                  onPress={() => !isPersonal && onSelectPersonal()}
                >
                  <Image
                    source={currentUser.avatar?.url ? { uri: currentUser.avatar.url } : DefaultAvatarImage}
                    style={[selectorStyles.avatar, isPersonal && selectorStyles.avatarActive]}
                  />
                  <View style={selectorStyles.info}>
                    <Text style={selectorStyles.nameText}>{displayName}</Text>
                    <Text style={selectorStyles.subtitleText}>Personal Account</Text>
                  </View>
                  {isPersonal && (
                    <Ionicons name="checkmark-circle" size={22} color="#1A1A1A" />
                  )}
                </GHTouchableOpacity>

                {/* Venues */}
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

                {/* Organizations */}
                {organizations.map((org) => {
                  const isSelected = selectedOrgId === org.id;
                  return (
                    <GHTouchableOpacity
                      key={`org-${org.id}`}
                      style={selectorStyles.item}
                      onPress={() => !isSelected && onSelectOrg(org)}
                      activeOpacity={isSelected ? 1 : 0.7}
                    >
                      <Image
                        source={org.logo?.url ? { uri: org.logo.url } : DefaultAvatarImage}
                        style={[selectorStyles.avatar, isSelected && selectorStyles.avatarActive]}
                      />
                      <View style={selectorStyles.info}>
                        <Text style={selectorStyles.nameText}>{org.name}</Text>
                        <Text style={selectorStyles.subtitleText}>Organization</Text>
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={22} color="#1A1A1A" />
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.25)" />
                      )}
                    </GHTouchableOpacity>
                  );
                })}

                {/* Create New Organization */}
                <GHTouchableOpacity
                  style={selectorStyles.createOrgButton}
                  onPress={onCreateOrg}
                  activeOpacity={0.7}
                >
                  <View style={selectorStyles.createOrgIcon}>
                    <Ionicons name="add" size={24} color="#1a1a1a" />
                  </View>
                  <Text style={selectorStyles.createOrgText}>Create New Organization</Text>
                </GHTouchableOpacity>
              </View>
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

function VenueDashboardContent({ venueId, organizationId, activeSection }: { venueId: number; organizationId?: number; activeSection: string }) {
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const handleNav = useCallback(
    (route: string) => router.push(route as any),
    [router],
  );

  const orgQuery = organizationId ? `?organizationId=${organizationId}` : '';

  const insightsItems: DashboardMenuItem[] = [
    ...(venueId ? [{ title: 'Manage Venue' as const, subtitle: 'Manage your venue' as const, icon: 'business-outline' as const, route: `/manage-venue/${venueId}` }] : []),
    { title: 'Analytics', subtitle: 'View detailed insights', icon: 'bar-chart-outline', route: `/dashboard/analytics${orgQuery}` },
    { title: 'Revenue', subtitle: 'Track earnings and trends', icon: 'trending-up-outline', route: `/dashboard/revenue${orgQuery}` },
    { title: 'Wallet', subtitle: 'View earnings and payouts', icon: 'wallet-outline', route: `/dashboard/payments${orgQuery}` },
  ];

  const sectionMap: Record<string, { title: string; items: DashboardMenuItem[] }> = {
    Insights: { title: 'INSIGHTS', items: insightsItems },
  };

  if (activeSection === 'Overview') {
    return (
      <View style={dashStyles.scrollView}>
        <OverviewEventsList organizationId={organizationId} insetsBottom={insets.bottom} />
        <View style={[dashStyles.createEventButtonWrapper, { paddingBottom: insets.bottom + 13 }]}>
          <TouchableOpacity
            style={dashStyles.createEventButton}
            onPress={() => handleNav(`/create-event${orgQuery}`)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={dashStyles.createEventButtonText}>Create Event</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (activeSection === 'Audience') {
    return <AudienceContent organizationId={organizationId} insetsBottom={insets.bottom} />;
  }

  const section = sectionMap[activeSection];
  if (!section || section.items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="construct-outline" size={48} color="rgba(0,0,0,0.2)" />
        <Text style={styles.emptyStateText}>No items</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={dashStyles.scrollView}
      contentContainerStyle={[dashStyles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      <DashboardMenuGroup title={section.title} items={section.items} delay={100} onItemPress={handleNav} />
    </ScrollView>
  );
}

// Inline event list shown on the Overview tab
function OverviewEventsList({ organizationId, insetsBottom }: { organizationId?: number; insetsBottom: number }) {
  const router = useStableRouter();
  const { data: events = [], isLoading } = useMyEvents(organizationId);

  if (isLoading) {
    return (
      <View style={dashStyles.overviewEmpty}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={dashStyles.overviewEmpty}>
        <Ionicons name="calendar-outline" size={48} color="rgba(255,255,255,0.2)" />
        <Text style={dashStyles.overviewEmptyText}>No events yet</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={dashStyles.scrollView}
      contentContainerStyle={[dashStyles.overviewListContent, { paddingBottom: insetsBottom + 180 }]}
      showsVerticalScrollIndicator={false}
    >
      {events.map((event) => (
        <OverviewEventCard
          key={event.id}
          event={event}
          onPress={() => router.push({ pathname: '/manage-event/[id]', params: { id: event.id } } as any)}
        />
      ))}
    </ScrollView>
  );
}

function OverviewEventCard({ event, onPress }: { event: StatusEvent; onPress: () => void }) {
  const flyerUrl = event.flyer?.url || event.imageUrl || '';
  const isVideo = event.flyer?.mimeType?.startsWith('video/') || false;

  const dateStr = new Date(event.startDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const statusLabel =
    event.status === EventStatus.DRAFT
      ? 'Draft'
      : event.status === EventStatus.PUBLISHED
        ? 'Published'
        : event.status === EventStatus.ACTIVE
          ? 'Live'
          : event.status === EventStatus.FINISHED
            ? 'Ended'
            : 'Cancelled';

  return (
    <TouchableOpacity style={dashStyles.eventCard} onPress={onPress} activeOpacity={0.85}>
      {/* Blurred backdrop */}
      {flyerUrl ? (
        <>
          <Image
            source={{ uri: flyerUrl }}
            style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
            resizeMode="cover"
          />
          <BlurView
            intensity={50}
            tint="dark"
            style={[StyleSheet.absoluteFill, { borderRadius: 18, overflow: 'hidden' }]}
          />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFill, { borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)' }]} />
      )}

      {/* Main media */}
      {flyerUrl ? (
        isVideo ? (
          <View style={dashStyles.eventImage}>
            <FeedMediaPlayer
              mediaType="video"
              videoUrl={flyerUrl}
              imageUrl={flyerUrl}
              poster={flyerUrl}
              isActive={true}
            />
          </View>
        ) : (
          <Image source={{ uri: flyerUrl }} style={dashStyles.eventImage} resizeMode="cover" />
        )
      ) : (
        <View style={[dashStyles.eventImage, dashStyles.eventImagePlaceholder]}>
          <Ionicons name="calendar-outline" size={40} color="rgba(255,255,255,0.3)" />
        </View>
      )}
      <View style={dashStyles.eventCardBody}>
        <Text style={dashStyles.eventName} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={dashStyles.eventMeta} numberOfLines={1}>
          {dateStr}
          {event.location ? ` · ${event.location}` : ''}
        </Text>
        <View style={dashStyles.eventStatsRow}>
          <View style={dashStyles.eventStat}>
            <Text style={dashStyles.eventStatValue}>{event.attendeeCount ?? 0}</Text>
            <Text style={dashStyles.eventStatLabel}>RSVPs</Text>
          </View>
          <View style={dashStyles.eventStatusPill}>
            <Text style={dashStyles.eventStatusText}>{statusLabel}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Audience Content (inline My List + Text Blast flow) ──────

const PAGE_SIZE = 20;

function AudienceContent({ organizationId, insetsBottom }: { organizationId?: number; insetsBottom: number }) {
  const router = useStableRouter();
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [searchText, setSearchText] = React.useState('');
  const [filterEventIds, setFilterEventIds] = React.useState<Set<number>>(new Set());
  const [filterModalVisible, setFilterModalVisible] = React.useState(false);
  const debouncedSearch = useDebounce(searchText, 300);

  const { data: myEvents = [] } = useMyEvents(organizationId);
  const filterCount = filterEventIds.size;
  const filterLabel = filterCount === 0 ? null : filterCount === 1 ? myEvents.find((e) => filterEventIds.has(e.id))?.name : `${filterCount} events`;

  const toggleFilterEvent = React.useCallback((id: number) => {
    setFilterEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const query = useInfiniteQuery({
    queryKey: ['owner-contacts-audience', debouncedSearch, organizationId, [...filterEventIds]],
    queryFn: async ({ pageParam }) => {
      return eventsApi.getOwnerContacts({
        page: pageParam as number,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        organizationId,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext && lastPage.page) return lastPage.page + 1;
      return undefined;
    },
    staleTime: 1000 * 60 * 2,
  });

  const contacts: OwnerContact[] = React.useMemo(
    () => query.data?.pages.flatMap((p) => p.contacts) ?? [],
    [query.data],
  );

  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));

  const toggleSelect = React.useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = React.useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  }, [allSelected, contacts]);

  const handleNext = React.useCallback(() => {
    if (selectedIds.size === 0) return;
    router.push({
      pathname: '/text-blast-compose',
      params: { count: String(selectedIds.size) },
    } as any);
  }, [selectedIds.size, router]);

  return (
    <View style={audStyles.flex}>
      {/* Search + Filter */}
      <View style={audStyles.searchRow}>
        <View style={audStyles.searchBar}>
          <Ionicons name="search" size={18} color="rgba(0,0,0,0.4)" />
          <TextInput
            style={audStyles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search contacts"
            placeholderTextColor="rgba(0,0,0,0.35)"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color="rgba(0,0,0,0.3)" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[audStyles.filterButton, filterCount > 0 && audStyles.filterButtonActive]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="funnel-outline" size={16} color={filterCount > 0 ? '#fff' : '#000'} />
          {filterLabel ? (
            <Text style={[audStyles.filterButtonText, audStyles.filterButtonTextActive]} numberOfLines={1}>{filterLabel}</Text>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity style={audStyles.selectAllPill} onPress={handleSelectAll} activeOpacity={0.7}>
          <Text style={audStyles.selectAllText}>{allSelected ? 'Deselect' : 'Select All'}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFilterModalVisible(false)}>
        <View style={audStyles.filterModal}>
          <View style={audStyles.filterModalHeader}>
            <Text style={audStyles.filterModalTitle}>Filter By Events</Text>
            <TouchableOpacity
              style={audStyles.filterModalDone}
              onPress={() => setFilterModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={audStyles.filterModalDoneText}>Done{filterCount > 0 ? ` (${filterCount})` : ''}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[audStyles.filterModalAllRow, filterCount === 0 && audStyles.filterModalAllRowActive]}
            onPress={() => setFilterEventIds(new Set())}
            activeOpacity={0.7}
          >
            <Ionicons name="people" size={20} color={filterCount === 0 ? '#fff' : '#000'} />
            <Text style={[audStyles.filterModalAllText, filterCount === 0 && audStyles.filterModalAllTextActive]}>All Events</Text>
            {filterCount === 0 && <Ionicons name="checkmark" size={20} color="#fff" />}
          </TouchableOpacity>

          <ScrollView contentContainerStyle={audStyles.filterModalGrid} showsVerticalScrollIndicator={false}>
            {myEvents.map((ev) => {
              const isActive = filterEventIds.has(ev.id);
              const flyerUrl = ev.flyer?.url || ev.imageUrl;
              return (
                <TouchableOpacity
                  key={ev.id}
                  style={audStyles.filterModalCard}
                  onPress={() => toggleFilterEvent(ev.id)}
                  activeOpacity={0.7}
                >
                  {flyerUrl ? (
                    <Image source={{ uri: flyerUrl }} style={[audStyles.filterModalCardImage, isActive && audStyles.filterModalCardImageActive]} resizeMode="cover" />
                  ) : (
                    <View style={[audStyles.filterModalCardImage, audStyles.filterModalCardImagePlaceholder, isActive && audStyles.filterModalCardImageActive]}>
                      <Ionicons name="calendar-outline" size={28} color="rgba(0,0,0,0.2)" />
                    </View>
                  )}
                  {isActive && (
                    <View style={audStyles.filterModalCheckmark}>
                      <Ionicons name="checkmark-circle" size={24} color="#000" />
                    </View>
                  )}
                  <Text style={[audStyles.filterModalCardName, isActive && audStyles.filterModalCardNameActive]} numberOfLines={2}>{ev.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* List */}
      <FlatList
        style={audStyles.list}
        data={contacts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AudienceRow
            contact={item}
            selected={selectedIds.has(item.id)}
            onToggle={() => toggleSelect(item.id)}
          />
        )}
        contentContainerStyle={[audStyles.listContent, { paddingBottom: insetsBottom + 100 }]}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          query.isLoading ? (
            <View style={audStyles.empty}>
              <ActivityIndicator color="#000" />
            </View>
          ) : (
            <View style={audStyles.empty}>
              <Ionicons name="people-outline" size={44} color="rgba(0,0,0,0.2)" />
              <Text style={audStyles.emptyText}>No contacts yet</Text>
            </View>
          )
        }
      />

      {/* Next button */}
      <View style={[audStyles.nextBar, { paddingBottom: insetsBottom + 13 }]}>
        <TouchableOpacity
          style={[audStyles.nextButton, selectedIds.size === 0 && audStyles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={selectedIds.size === 0}
          activeOpacity={0.85}
        >
          <Text style={audStyles.nextButtonText}>
            {selectedIds.size > 0 ? `Next (${selectedIds.size})` : 'Select recipients'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AudienceRow({
  contact,
  selected,
  onToggle,
}: {
  contact: OwnerContact;
  selected: boolean;
  onToggle: () => void;
}) {
  const displayName =
    contact.firstName || contact.lastName
      ? `${contact.firstName ?? ''}${contact.lastName ? ' ' + contact.lastName : ''}`.trim()
      : contact.userName || 'User';
  const subtitle = contact.userName ? `@${contact.userName}` : contact.phoneNumber || '';

  return (
    <TouchableOpacity style={audStyles.row} onPress={onToggle} activeOpacity={0.7}>
      <Image
        source={contact.avatar ? { uri: contact.avatar } : DefaultAvatarImage}
        style={audStyles.rowAvatar}
      />
      <View style={audStyles.rowInfo}>
        <Text style={audStyles.rowName} numberOfLines={1}>
          {displayName}
        </Text>
        {subtitle ? (
          <Text style={audStyles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[audStyles.checkbox, selected && audStyles.checkboxChecked]}>
        {selected ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
      </View>
    </TouchableOpacity>
  );
}

function PersonalAdminContent() {
  const router = useStableRouter();
  const insets = useSafeAreaInsets();

  const handleNav = useCallback(
    (route: string) => router.push(route as any),
    [router],
  );

  const adminItems: DashboardMenuItem[] = [
    { title: 'Admin Panel', subtitle: 'Manage users, events, and posts', icon: 'shield-checkmark-outline', route: '/admin' },
  ];

  return (
    <ScrollView
      style={dashStyles.scrollView}
      contentContainerStyle={[dashStyles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      <DashboardMenuGroup title="ADMIN" items={adminItems} delay={100} onItemPress={handleNav} />
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
  const [selectedOrg, setSelectedOrg] = React.useState<{ id: number; name: string } | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>('Tickets');

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
    <View style={styles.container}>

      {/* Floating pill row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.headerScrollContent, { paddingTop: insets.top + 16 }]}
        style={styles.headerScrollFixed}
      >
        <Pressable style={styles.headerPill} onPress={() => setProfileSelectorVisible(true)}>
          <Image
            source={
              selectedVenue
                ? (myVenues.find((v) => v.id === selectedVenue.id)?.imageUrl
                    ? { uri: myVenues.find((v) => v.id === selectedVenue.id)!.imageUrl }
                    : DefaultAvatarImage)
                : selectedOrg
                  ? (authUser?.organizations?.find((o) => o.id === selectedOrg.id)?.logo?.url
                      ? { uri: authUser!.organizations!.find((o) => o.id === selectedOrg.id)!.logo!.url }
                      : DefaultAvatarImage)
                  : (authUser?.avatar?.url ? { uri: authUser.avatar.url } : DefaultAvatarImage)
            }
            style={styles.headerPillAvatar}
          />
          <Ionicons name="menu" size={22} color="#fff" style={styles.headerPillIcon} />
        </Pressable>

        {(selectedVenue || selectedOrg
          ? venueTabs
          : authUser?.role === UserRole.ADMIN ? personalAdminTabs : personalTabs
        ).map((label) => {
          const isActive = activeTab === label;
          return (
            <Pressable
              key={label}
              style={styles.tabPill}
              onPress={() => setActiveTab(label)}
            >
              {isLiquidGlassSupported ? (
                <LiquidGlassView effect="regular" tintColor="rgba(255,255,255,0.25)" colorScheme="dark" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={styles.glassLayer} pointerEvents="none">
                  <GlassView
                    {...liquidGlass.surface}
                    tintColor={isActive ? 'rgba(0,0,0,0.12)' : 'transparent'}
                    borderRadius={19}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              )}
              <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Top fade — dims content as it scrolls behind the pill row */}
      <LinearGradient
        colors={['#000', 'rgba(0,0,0,0)']}
        style={styles.topFade}
        pointerEvents="none"
      />

      {(selectedVenue || selectedOrg) ? (
        <VenueDashboardContent venueId={selectedVenue?.id ?? 0} organizationId={selectedOrg?.id} activeSection={activeTab} />
      ) : activeTab === 'Admin' ? (
        <PersonalAdminContent />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name={activeTab === 'Tickets' ? 'ticket-outline' : activeTab === 'Tables' ? 'restaurant-outline' : 'pricetag-outline'}
            size={48}
            color="rgba(255,255,255,0.2)"
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
          organizations={(authUser?.organizations ?? []).map((o) => ({ id: o.id, name: o.name, logo: o.logo }))}
          selectedVenueId={selectedVenue?.id ?? null}
          selectedOrgId={selectedOrg?.id ?? null}
          onClose={() => setProfileSelectorVisible(false)}
          onSelectPersonal={() => {
            setSelectedVenue(null);
            setSelectedOrg(null);
            setActiveTab('Tickets');
            setProfileSelectorVisible(false);
          }}
          onSelectVenue={(venue) => {
            setSelectedVenue(venue);
            setSelectedOrg(null);
            setActiveTab('Overview');
            setProfileSelectorVisible(false);
          }}
          onSelectOrg={(org) => {
            setSelectedOrg(org);
            setSelectedVenue(null);
            setActiveTab('Overview');
            setProfileSelectorVisible(false);
          }}
          onCreateOrg={() => {
            setProfileSelectorVisible(false);
            router.push('/create-organization');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  headerScrollFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexGrow: 0,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    zIndex: 99,
  },
  headerScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingLeft: 5,
    paddingRight: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerPillAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
    overflow: 'hidden',
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
  },
  tabPillTextActive: {
    color: '#fff',
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
    color: 'rgba(255,255,255,0.35)',
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
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  createOrgIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingTop: 140,
  },
  createEventButtonWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    width: 240,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  createEventButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  overviewEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  overviewEmptyText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.4)',
  },
  overviewListContent: {
    padding: 16,
    paddingTop: 140,
    gap: 14,
  },
  eventCard: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCardBody: {
    paddingTop: 12,
    paddingHorizontal: 4,
    gap: 6,
  },
  eventName: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  eventMeta: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  eventStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  eventStatValue: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  eventStatLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  eventStatusPill: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
  },
  eventStatusText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
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

const audStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#000',
  },
  selectAllPill: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: '#000',
  },
  filterButton: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 130,
  },
  filterButtonActive: {
    backgroundColor: '#000',
  },
  filterButtonText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: '#000',
    flexShrink: 1,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  // Filter modal
  filterModal: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingTop: 16,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterModalTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#000',
  },
  filterModalDone: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalDoneText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  filterModalAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  filterModalAllRowActive: {
    backgroundColor: '#000',
  },
  filterModalAllText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#000',
  },
  filterModalAllTextActive: {
    color: '#fff',
  },
  filterModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 40,
  },
  filterModalCard: {
    width: '47%' as any,
    marginBottom: 4,
  },
  filterModalCardImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterModalCardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalCardImageActive: {
    borderWidth: 3,
    borderColor: '#000',
  },
  filterModalCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  filterModalCardName: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(0,0,0,0.6)',
    marginTop: 6,
  },
  filterModalCardNameActive: {
    color: '#000',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  rowAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#000',
  },
  rowSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.5)',
    marginTop: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.4)',
  },
  nextBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    width: 240,
    borderRadius: 26,
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  composeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  composeBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  composeHeaderInfo: {
    flex: 1,
    alignItems: 'center',
  },
  composeHeaderTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#000',
  },
  composeHeaderSubtitle: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.5)',
    marginTop: 1,
  },
  composeBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  composeHint: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.4)',
  },
  composeInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#f2f2f2',
  },
  composeInputWrapper: {
    flex: 1,
    minHeight: 38,
    maxHeight: 120,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  composeInput: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#000',
    padding: 0,
    margin: 0,
    maxHeight: 100,
  },
  composeSend: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  composeSendDisabled: {
    opacity: 0.3,
  },
});
