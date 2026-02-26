// Wallet Screen - Membership card, offers, and events
import React, { useRef, useMemo } from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '@/lib/providers/wallet-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  MembershipCard,
  StatusCardMenuSheet,
  OfferCarousel,
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

  // RSVP-only events (no ticketId) — passed to TicketList separately
  const rsvpEvents = useMemo(() => events.filter((e) => !e.ticketId), [events]);

  const [cardMenuVisible, setCardMenuVisible] = React.useState(false);

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
        {/* Membership Card - Tappable */}
        <MembershipCard user={user} onPress={() => setCardMenuVisible(true)} />

        {/* Promos Carousel */}
        <OfferCarousel
          offers={offers}
          onClaimOffer={claimOffer}
        />

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

      {/* Status Card Menu Sheet */}
      <StatusCardMenuSheet
        visible={cardMenuVisible}
        onClose={() => setCardMenuVisible(false)}
        user={user}
      />
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
