import * as React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { GlassView } from 'expo-glass-effect';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { LinearGradient } from 'expo-linear-gradient';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import Animated, {
  FadeIn,
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import {
  TerminalProvider,
  useTerminalPayment,
} from "@/lib/providers/terminal-provider";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useEvent } from "@/hooks/use-events-query";
import { useEventAttendees } from "@/hooks/use-event-attendees";
import { useEventSocket } from "@/hooks/use-event-socket";
import { paymentsApi } from "@/lib/api/payments";
import { EventUserStatus } from "@/lib/types/events.types";
import type { EventAttendeesResponse } from "@/lib/types/events.types";
import { ContactDetailModal } from "@/components/check-ins/contact-detail-modal";
import { ContactRow } from "@/components/check-ins/contact-row";
import { type CheckInContact, mapAttendee } from "@/components/check-ins/utils";

const CHECK_IN_STATUSES = [
  EventUserStatus.VERIFIED,
  EventUserStatus.CHECKED_IN,
  EventUserStatus.CONFIRMED,
  EventUserStatus.REJECTED,
  EventUserStatus.CANCELLED,
];

function CheckInsContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useAppTheme();
  const eventId = id ? Number(id) : null;

  const {
    readerStatus,
    isReaderConnected,
    isInitialized,
    connectReader,
    collectPayment,
  } = useTerminalPayment();
  const connectAttemptedRef = React.useRef(false);

  const [collectingGuestId, setCollectingGuestId] = React.useState<
    number | null
  >(null);
  const [paymentFailedAlert, setPaymentFailedAlert] = React.useState<
    string | null
  >(null);
  const [selectedContact, setSelectedContact] =
    React.useState<CheckInContact | null>(null);
  const [activeTab, setActiveTab] = React.useState<"approved" | "denied">(
    "approved",
  );

  // Local paid tracking — survives React Query refetches for free events
  const locallyPaidRef = React.useRef<Set<number>>(new Set());

  const scrollPosition = useSharedValue(0);
  const screenWidth = Dimensions.get("window").width;
  const tabWidth = screenWidth / 2;

  // ── Data fetching via React Query ──

  const { data: event } = useEvent(eventId ?? undefined);

  const {
    attendees: rawAttendees,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useEventAttendees({
    eventId: eventId ?? undefined,
    status: CHECK_IN_STATUSES,
  });

  // Refetch when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Polling every 30s as fallback
  React.useEffect(() => {
    const interval = setInterval(() => refetch(), 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  // Map raw attendees to UI model, preserving local paid state
  const contacts = React.useMemo(() => {
    const mapped = rawAttendees.map((a) => {
      const contact = mapAttendee(a);
      if (locallyPaidRef.current.has(contact.id)) {
        contact.paid = true;
      }
      return contact;
    });
    mapped.sort(
      (a, b) =>
        new Date(b.lastSeenAt || 0).getTime() -
        new Date(a.lastSeenAt || 0).getTime(),
    );
    return mapped;
  }, [rawAttendees]);

  // ── WebSocket — optimistic cache updates ──

  const attendeeQueryKey = ["eventAttendees", eventId, undefined, CHECK_IN_STATUSES];

  useEventSocket({
    eventId,
    onGuestCheckedIn: React.useCallback(
      (data: { guestId: number; userId?: number; firstName: string; lastName: string; userName?: string; avatarUrl?: string; status: string; isGuest?: boolean; checkedInAt?: string }) => {
        // Optimistically add/update guest in React Query cache
        queryClient.setQueriesData<{ pages: EventAttendeesResponse[]; pageParams: number[] }>(
          { queryKey: attendeeQueryKey },
          (old) => {
            if (!old) return old;
            const newAttendee = {
              id: data.guestId,
              userId: data.userId,
              firstName: data.firstName,
              lastName: data.lastName,
              userName: data.userName,
              avatarUrl: data.avatarUrl,
              status: data.status as EventUserStatus,
              isGuest: data.isGuest ?? !data.userId,
              checkedInAt: data.checkedInAt || new Date().toISOString(),
              checkedIn: true,
            };
            // Check if guest already exists in any page
            const exists = old.pages.some((page) =>
              page.attendees.some((a) => a.id === data.guestId),
            );
            if (exists) {
              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  attendees: page.attendees.map((a) =>
                    a.id === data.guestId ? { ...a, ...newAttendee } : a,
                  ),
                })),
              };
            }
            // Add to first page
            return {
              ...old,
              pages: old.pages.map((page, i) =>
                i === 0
                  ? {
                      ...page,
                      attendees: [newAttendee, ...page.attendees],
                      total: page.total + 1,
                    }
                  : page,
              ),
            };
          },
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      [queryClient, attendeeQueryKey],
    ),
    onPaymentReceived: React.useCallback(
      (data: { userId?: number | null; guestId?: number | null }) => {
        // Mark guest as paid in local ref + trigger re-render via cache update
        queryClient.setQueriesData<{ pages: EventAttendeesResponse[]; pageParams: number[] }>(
          { queryKey: attendeeQueryKey },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                attendees: page.attendees.map((a) => {
                  if (
                    (data.guestId && a.id === data.guestId) ||
                    (data.userId && a.userId && a.userId === data.userId)
                  ) {
                    locallyPaidRef.current.add(a.id);
                  }
                  return a;
                }),
              })),
            };
          },
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      [queryClient, attendeeQueryKey],
    ),
  });

  // ── Tab animation ──

  const handleTabPress = React.useCallback(
    (tab: "approved" | "denied") => {
      const pageIndex = tab === "approved" ? 0 : 1;
      scrollPosition.value = withTiming(pageIndex, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
      if (tab !== activeTab) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setActiveTab(tab);
    },
    [scrollPosition, activeTab],
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollPosition.value * tabWidth }],
  }));

  const approvedTabTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollPosition.value, [0, 1], [1, 0.5]),
  }));

  const deniedTabTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollPosition.value, [0, 1], [0.5, 1]),
  }));

  // ── Terminal auto-connect ──

  React.useEffect(() => {
    if (isInitialized && !isReaderConnected && !connectAttemptedRef.current) {
      connectAttemptedRef.current = true;
      connectReader(eventId ?? undefined).catch(() => {});
    }
  }, [isInitialized, isReaderConnected, connectReader]);

  // ── Charge handler ──

  const handleCharge = React.useCallback(
    async (guest: CheckInContact) => {
      if (!eventId) return;

      const doorCoverCents = event?.doorCoverPriceCents;

      // Free event — mark paid locally
      if (!doorCoverCents || doorCoverCents <= 0) {
        locallyPaidRef.current.add(guest.id);
        // Force re-render by invalidating cache
        queryClient.invalidateQueries({ queryKey: attendeeQueryKey });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      setCollectingGuestId(guest.id);

      try {
        if (!isReaderConnected) {
          await connectReader(eventId ?? undefined);
        }

        const result = await paymentsApi.collectAtDoor(eventId, {
          guestId: guest.id,
          customAmountCents: doorCoverCents,
          useTerminal: true,
        });

        await collectPayment(result.clientSecret);

        locallyPaidRef.current.add(guest.id);
        queryClient.invalidateQueries({ queryKey: attendeeQueryKey });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err: any) {
        if (err?.message?.includes("canceled")) {
          setCollectingGuestId(null);
          return;
        }
        setPaymentFailedAlert(err?.message || "Something went wrong.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setCollectingGuestId(null);
      }
    },
    [eventId, event, isReaderConnected, connectReader, collectPayment, queryClient, attendeeQueryKey],
  );

  // ── Derived data ──

  const doorCoverDisplay = event?.doorCoverPriceCents
    ? `$${(event.doorCoverPriceCents / 100).toFixed(2)}`
    : "Free";

  const approvedContacts = React.useMemo(
    () => contacts.filter((c) => c.checkInStatus === "approved"),
    [contacts],
  );
  const deniedContacts = React.useMemo(
    () => contacts.filter((c) => c.checkInStatus === "denied"),
    [contacts],
  );
  const displayedContacts =
    activeTab === "approved" ? approvedContacts : deniedContacts;

  // ── Render ──

  const handleContactPress = React.useCallback(
    (item: CheckInContact) => setSelectedContact(item),
    [],
  );

  const renderContact = React.useCallback(
    ({ item }: { item: CheckInContact }) => (
      <ContactRow
        item={item}
        isCollecting={collectingGuestId === item.id}
        isAnyCollecting={collectingGuestId !== null}
        doorCoverDisplay={doorCoverDisplay}
        onPress={handleContactPress}
        onCharge={handleCharge}
      />
    ),
    [collectingGuestId, handleCharge, doorCoverDisplay, handleContactPress],
  );

  const keyExtractor = React.useCallback(
    (item: CheckInContact) => String(item.id),
    [],
  );

  const handleEndReached = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!eventId) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
                <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          No event selected
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
            <ConfirmSheet
        visible={!!paymentFailedAlert}
        onClose={() => setPaymentFailedAlert(null)}
        title="Payment Failed"
        message={paymentFailedAlert || ""}
        alertOnly
        icon="card-outline"
      />
      <ContactDetailModal
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
      />

      {/* Pill row header */}
      <View style={[styles.pillRow, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.pillIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </Pressable>
        <Pressable style={styles.pillIcon} onPress={() => refetch()}>
          <Ionicons name="refresh" size={18} color="#000" />
        </Pressable>
        {(['approved', 'denied'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const count = tab === 'approved' ? approvedContacts.length : deniedContacts.length;
          return (
            <Pressable
              key={tab}
              style={styles.pillFilter}
              onPress={() => handleTabPress(tab)}
            >
              {isLiquidGlassSupported ? (
                <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
              ) : (
                <View style={styles.pillGlassLayer} pointerEvents="none">
                  <GlassView {...liquidGlass.surface} tintColor={isActive ? 'rgba(0,0,0,0.12)' : 'transparent'} borderRadius={19} style={StyleSheet.absoluteFill} />
                </View>
              )}
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {tab === 'approved' ? 'Approved' : 'Denied'}{count > 0 ? ` ${count}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <LinearGradient colors={['#000000', 'rgba(0,0,0,0)']} style={styles.topFade} pointerEvents="none" />

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
            Loading list...
          </Text>
        </View>
      ) : displayedContacts.length === 0 ? (
        <Animated.View
          entering={FadeIn.duration(500)}
          style={styles.centerContent}
        >
          <Ionicons
            name={
              activeTab === "approved"
                ? "people-outline"
                : "close-circle-outline"
            }
            size={64}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            {activeTab === "approved" ? "No attendees yet" : "No denied guests"}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            {activeTab === "approved"
              ? "People who RSVP, buy tickets, or check in will appear here"
              : "Guests who were denied entry will appear here"}
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={displayedContacts}
          renderItem={renderContact}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={colors.textTertiary}
                style={styles.loadingFooter}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

export default function CheckInsScreen() {
  return (
    <TerminalProvider>
      <CheckInsContent />
    </TerminalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
  },
  headerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  readerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 100,
  },
  pillRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
    paddingBottom: 8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 9 },
  pillIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillFilter: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pillGlassLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 19,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  pillTextActive: {
    color: 'rgba(0,0,0,0.8)',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 120,
  },
  loadingFooter: {
    paddingVertical: 16,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  tabText: {
    fontSize: 15,
  },
  tabBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tabBadgeText: {
    fontSize: 12,
  },
});
