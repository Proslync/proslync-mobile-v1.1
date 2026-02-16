// Reusable tier display card with nested pricing rules

import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { GlassSurface } from '@/components/glass/glass-surface';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { TicketTier, PricingRule } from '@/lib/types/pricing.types';

interface TierCardProps {
  tier: TicketTier;
  onAddPricing: (tierId: number) => void;
  onEditTier: (tier: TicketTier) => void;
  onDeleteTier: (tierId: number) => void;
  onEditPricing: (tierId: number, rule: PricingRule) => void;
  onDeletePricing: (tierId: number, pricingId: number) => void;
}

function formatPrice(price: number, currency = 'USD'): string {
  if (price === 0) return 'Free';
  return `$${price.toFixed(2)}`;
}

export function TierCard({
  tier,
  onAddPricing,
  onEditTier,
  onDeleteTier,
  onEditPricing,
  onDeletePricing,
}: TierCardProps) {
  const { colors } = useAppTheme();

  const handleDeleteTier = () => {
    Alert.alert('Delete Tier', `Delete "${tier.name}" and all its pricing rules?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDeleteTier(tier.id) },
    ]);
  };

  const handleDeletePricing = (rule: PricingRule) => {
    Alert.alert('Delete Pricing', `Delete "${rule.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDeletePricing(tier.id, rule.id) },
    ]);
  };

  return (
    <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.container}>
      {/* Tier Header */}
      <View style={styles.tierHeader}>
        <View style={styles.tierInfo}>
          <View style={styles.tierNameRow}>
            <Text style={[styles.tierName, { color: colors.text }]}>{tier.name}</Text>
            <View style={[styles.activeBadge, { backgroundColor: tier.isActive ? '#22c55e' : 'rgba(255,255,255,0.3)' }]}>
              <Text style={styles.activeBadgeText}>{tier.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
          {tier.description ? (
            <Text style={[styles.tierDescription, { color: colors.textTertiary }]} numberOfLines={2}>
              {tier.description}
            </Text>
          ) : null}
          <Text style={[styles.tierStats, { color: colors.textSecondary }]}>
            {tier.soldCount} sold{tier.capacity ? ` / ${tier.capacity}` : ''}
          </Text>
        </View>
        <View style={styles.tierActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onEditTier(tier)}>
            <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDeleteTier}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pricing Rules */}
      {tier.pricing.length > 0 && (
        <View style={styles.pricingList}>
          {tier.pricing.map((rule) => (
            <View key={rule.id} style={[styles.pricingRow, { borderTopColor: 'rgba(255,255,255,0.06)' }]}>
              <View style={styles.pricingInfo}>
                <Text style={[styles.pricingName, { color: colors.text }]}>{rule.name}</Text>
                <Text style={[styles.pricingPrice, { color: colors.textSecondary }]}>
                  {formatPrice(rule.price, rule.currency)}
                  {rule.capacity ? ` \u00B7 ${rule.soldCount}/${rule.capacity}` : ` \u00B7 ${rule.soldCount} sold`}
                </Text>
              </View>
              {!rule.isAvailable && (
                <View style={styles.unavailableBadge}>
                  <Text style={styles.unavailableText}>Unavailable</Text>
                </View>
              )}
              <View style={styles.pricingActions}>
                <TouchableOpacity
                  style={styles.smallAction}
                  onPress={() => onEditPricing(tier.id, rule)}
                >
                  <Ionicons name="create-outline" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallAction}
                  onPress={() => handleDeletePricing(rule)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Add Pricing Button */}
      <TouchableOpacity
        style={styles.addPricingButton}
        onPress={() => onAddPricing(tier.id)}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={16} color={colors.textSecondary} />
        <Text style={[styles.addPricingText, { color: colors.textSecondary }]}>Add Pricing</Text>
      </TouchableOpacity>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tierInfo: {
    flex: 1,
    marginRight: 8,
  },
  tierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tierName: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 9,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  tierDescription: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginBottom: 4,
  },
  tierStats: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  tierActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingList: {
    marginTop: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  pricingInfo: {
    flex: 1,
  },
  pricingName: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  pricingPrice: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
  unavailableBadge: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  unavailableText: {
    fontSize: 9,
    fontFamily: 'Lato_700Bold',
    color: '#ef4444',
    textTransform: 'uppercase',
  },
  pricingActions: {
    flexDirection: 'row',
    gap: 4,
  },
  smallAction: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPricingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  addPricingText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
});
