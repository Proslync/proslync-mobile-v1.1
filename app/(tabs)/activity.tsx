// Wallet Screen - Membership card, offers, and events
import React, { useRef, useMemo, useCallback } from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '@/lib/providers/wallet-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useMembershipCard } from '@/hooks/use-membership-card';
import {
  MembershipCard,
  IncompleteMembershipCard,
  StatusCardMenuSheet,
  TicketList,
  WalletSkeleton,
} from '@/components/wallet';

export default function WalletScreen() {
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { colors, isDark } = useAppTheme();
  const {
    user,
    offers,
    events,
    isLoading,
    claimOffer,
    refreshWallet,
  } = useWallet();

  const [cardMenuVisible, setCardMenuVisible] = React.useState(false);

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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {/* Membership Card */}
        {user.isProfileComplete ? (
          <MembershipCard user={user} onPress={() => setCardMenuVisible(true)} />
        ) : (
          <IncompleteMembershipCard onPress={() => router.push('/edit-profile')} />
        )}

        {/* Tickets */}
        <TicketList
          rsvpEvents={rsvpEvents}
          onViewEvent={(eventId) => {
            router.push({
              pathname: '/event/[id]',
              params: { id: eventId },
            });
          }}
          onActionComplete={refreshWallet}
        />

      </ScrollView>

      {/* Status Card Menu Sheet - only for complete profiles */}
      {user.isProfileComplete && (
        <StatusCardMenuSheet
          visible={cardMenuVisible}
          onClose={() => setCardMenuVisible(false)}
          onExpandQR={handleExpandQR}
          user={user}
          pdf417Payload={membershipCard?.pdf417Payload}
          cardNumber={membershipCard?.cardNumber}
          isLoadingCard={isLoadingCard}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
  },
});
