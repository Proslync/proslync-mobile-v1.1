// Wallet Screen - Membership card, offers, and events
import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '@/lib/providers/wallet-provider';
import {
  MembershipCard,
  StatusCardMenuSheet,
  OfferCarousel,
  TicketCarousel,
  WalletSkeleton,
} from '@/components/wallet';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const {
    user,
    offers,
    events,
    isLoading,
    claimOffer,
    refreshWallet,
  } = useWallet();

  const [cardMenuVisible, setCardMenuVisible] = React.useState(false);

  // Pull-to-refresh with haptic feedback
  const { refreshControl } = useRefreshControl({
    onRefresh: refreshWallet,
  });

  if (isLoading || !user) {
    return <WalletSkeleton />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <DarkGradientBg />

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
        {offers.length > 0 && (
          <OfferCarousel
            offers={offers}
            onClaimOffer={claimOffer}
          />
        )}

        {/* Tickets */}
        <TicketCarousel
          events={events}
          onViewEvent={(eventId) => console.log('View event:', eventId)}
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
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
  },
});
