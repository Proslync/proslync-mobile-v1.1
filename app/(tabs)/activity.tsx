// Wallet Screen - Membership card, offers, and events
import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useWallet } from '@/lib/providers/wallet-provider';
import {
  MembershipCard,
  StatusCardMenuSheet,
  OfferCarousel,
  ExploreEvents,
  WalletSkeleton,
} from '@/components/wallet';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const {
    user,
    balances,
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

  const handleViewEvent = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  if (isLoading || !user) {
    return <WalletSkeleton />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {/* Membership Card - Tappable */}
        <MembershipCard user={user} onPress={() => setCardMenuVisible(true)} />

        {/* Offers Carousel */}
        {offers.length > 0 && (
          <OfferCarousel
            offers={offers}
            onClaimOffer={claimOffer}
          />
        )}

        {/* Explore Events */}
        <ExploreEvents events={events} onViewEvent={handleViewEvent} />
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
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
  },
});
