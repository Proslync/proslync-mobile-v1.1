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
import { Offer } from '../../lib/types/wallet.types';

interface OfferCarouselProps {
  offers: Offer[];
  onClaimOffer: (offerId: string) => void;
}

function OfferCard({ offer, onClaim }: { offer: Offer; onClaim: () => void }) {
  return (
    <View style={styles.offerCard}>
      {/* Top: Title (max 2 lines) */}
      <Text style={styles.offerTitle} numberOfLines={2}>
        {offer.title}
      </Text>

      {/* Middle: Subtitle (max 2 lines) */}
      <Text style={styles.offerSubtitle} numberOfLines={2}>
        {offer.subtitle}
      </Text>

      {/* Bottom: Fixed footer with eligibility and claim button */}
      <View style={styles.offerFooter}>
        <View style={styles.eligibilityBadge}>
          <Text style={styles.eligibilityText}>{offer.eligibility}</Text>
        </View>
        <TouchableOpacity
          style={[styles.claimButton, offer.isClaimed && styles.claimButtonClaimed]}
          onPress={() => !offer.isClaimed && onClaim()}
          disabled={offer.isClaimed}
          activeOpacity={0.7}
        >
          {offer.isClaimed && (
            <Ionicons name="checkmark" size={14} color="#34c759" />
          )}
          <Text
            style={[
              styles.claimButtonText,
              offer.isClaimed && styles.claimButtonTextClaimed,
            ]}
          >
            {offer.isClaimed ? 'Claimed' : 'Claim'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function OfferCarousel({ offers, onClaimOffer }: OfferCarouselProps) {
  if (offers.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Perks & Offers</Text>
        <View style={styles.emptyState}>
          <Ionicons name="gift-outline" size={40} color="rgba(255,255,255,0.2)" />
          <Text style={styles.emptyText}>No offers available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Perks & Offers</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            onClaim={() => onClaimOffer(offer.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  offerCard: {
    width: 180,
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  offerTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    lineHeight: 20,
    height: 40,
  },
  offerSubtitle: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
    height: 32,
  },
  offerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eligibilityBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eligibilityText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    color: '#8b5cf6',
  },
  claimButton: {
    backgroundColor: '#0095f6',
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
    fontFamily: 'Lato_700Bold',
    color: '#fff',
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
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 12,
  },
});
