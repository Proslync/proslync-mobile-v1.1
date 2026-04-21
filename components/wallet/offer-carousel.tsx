// Offer Carousel - Perks and offers with fixed Claim button position
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Offer } from '../../lib/types/wallet.types';
import { liquidGlass } from '@/constants/glass/liquid-glass';

interface OfferCarouselProps {
  offers: Offer[];
  onClaimOffer: (offerId: string) => void;
}

interface OfferCardProps {
  offer: Offer;
  onClaim: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isDark: boolean;
}

function OfferCard({ offer, onClaim, colors, isDark }: OfferCardProps) {
  return (
    <View style={styles.offerCard}>
      <View style={styles.offerRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.offerTitle, { color: colors.text }]} numberOfLines={1}>{offer.title}</Text>
          <Text style={[styles.offerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{offer.subtitle}</Text>
        </View>
        <TouchableOpacity
          style={[styles.claimButton, { overflow: 'hidden' as const, backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.08)' }, offer.isClaimed && styles.claimButtonClaimed]}
          onPress={() => !offer.isClaimed && onClaim()}
          disabled={offer.isClaimed}
          activeOpacity={0.7}
        >
          {offer.isClaimed && <Ionicons name="checkmark" size={14} color="#34c759" />}
          <Text style={[styles.claimButtonText, offer.isClaimed && styles.claimButtonTextClaimed]}>
            {offer.isClaimed ? 'Copied!' : 'Copy Code'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function OfferCarousel({ offers, onClaimOffer }: OfferCarouselProps) {
  const { colors, isDark } = useAppTheme();

  if (offers.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="gift-outline" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No upcoming promos</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.listContent}>
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            onClaim={() => onClaimOffer(offer.id)}
            colors={colors}
            isDark={isDark}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  offerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offerTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
  offerSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    height: 32,
  },
  offerCode: {
    fontSize: 11,
    letterSpacing: 1,
    opacity: 0.7,
  },
  offerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  claimButton: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
    justifyContent: 'center',
  },
  claimButtonClaimed: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  claimButtonText: {
    fontSize: 12,
    color: '#1A1A1A',
  },
  claimButtonTextClaimed: {
    color: '#34c759',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
});
