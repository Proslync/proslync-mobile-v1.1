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
      <GlassView
        {...liquidGlass.surface}
        borderRadius={16}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Top: Title (max 2 lines) */}
      <Text style={[styles.offerTitle, { color: colors.text }]} numberOfLines={2}>
        {offer.title}
      </Text>

      {/* Middle: Subtitle + code */}
      <Text style={[styles.offerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
        {offer.subtitle}
      </Text>
      {offer.code && (
        <Text style={[styles.offerCode, { color: colors.text }]} numberOfLines={1}>
          {offer.code}
        </Text>
      )}

      {/* Bottom: Claim button */}
      <View style={styles.offerFooter}>
        <TouchableOpacity
          style={[styles.claimButton, { overflow: 'hidden' as const, backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.08)' }, offer.isClaimed && styles.claimButtonClaimed]}
          onPress={() => !offer.isClaimed && onClaim()}
          disabled={offer.isClaimed}
          activeOpacity={0.7}
        >
          {isDark && <GlassView {...liquidGlass.fill} borderRadius={8} style={StyleSheet.absoluteFillObject} />}
          {offer.isClaimed && (
            <Ionicons name="checkmark" size={14} color="#34c759" />
          )}
          <Text
            style={[
              styles.claimButtonText,
              offer.isClaimed && styles.claimButtonTextClaimed,
            ]}
          >
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
      <View style={[styles.container, { borderTopColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Promos</Text>
        <View style={styles.emptyState}>
          <Ionicons name="gift-outline" size={40} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No upcoming promos</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderTopColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Promos</Text>
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
            colors={colors}
            isDark={isDark}
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
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
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
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    justifyContent: 'space-between',
  },
  offerTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    lineHeight: 20,
    height: 40,
  },
  offerSubtitle: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    lineHeight: 16,
    height: 32,
  },
  offerCode: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
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
    fontFamily: 'Lato_700Bold',
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
    fontFamily: 'Lato_400Regular',
    marginTop: 12,
  },
});
