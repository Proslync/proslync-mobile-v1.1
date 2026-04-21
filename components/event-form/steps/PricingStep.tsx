// Step 5: Pricing - Ticket tiers and pricing rules (only shown for paid events)

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFormContext } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassSurface } from '@/components/glass/glass-surface';
import { CreateTierModal } from '@/components/pricing/create-tier-modal';
import { CreatePricingRuleModal } from '@/components/pricing/create-pricing-rule-modal';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import type { EventFormData, TierFormData } from '@/lib/schemas/events';
import type { CreateTierRequest, CreatePricingRuleRequest } from '@/lib/types/pricing.types';

function formatPrice(price: number): string {
  if (price === 0) return 'Free';
  return `$${price.toFixed(2)}`;
}

export function PricingStep() {
  const { setValue, watch } = useFormContext<EventFormData>();
  const { colors } = useAppTheme();

  const tiers: TierFormData[] = watch('tiers') || [];

  // Modal state
  const [showTierModal, setShowTierModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingTierIndex, setEditingTierIndex] = useState<number | null>(null);
  const [activeTierIndex, setActiveTierIndex] = useState<number | null>(null);
  const [editingPricingIndex, setEditingPricingIndex] = useState<number | null>(null);

  // --- Tier handlers ---

  const handleAddTier = useCallback(() => {
    setEditingTierIndex(null);
    setShowTierModal(true);
  }, []);

  const handleEditTier = useCallback((index: number) => {
    setEditingTierIndex(index);
    setShowTierModal(true);
  }, []);

  const handleTierSubmit = useCallback(
    (data: CreateTierRequest) => {
      const current = [...tiers];
      if (editingTierIndex !== null) {
        current[editingTierIndex] = {
          ...current[editingTierIndex],
          name: data.name,
          description: data.description,
        };
      } else {
        current.push({ name: data.name, description: data.description, pricing: [] });
      }
      setValue('tiers', current, { shouldDirty: true });
      setShowTierModal(false);
    },
    [tiers, editingTierIndex, setValue],
  );

  const [deleteTierIndex, setDeleteTierIndex] = useState<number | null>(null);
  const [deletePricingTarget, setDeletePricingTarget] = useState<{ tierIndex: number; pricingIndex: number } | null>(null);

  const handleDeleteTier = useCallback(
    (index: number) => {
      setDeleteTierIndex(index);
    },
    [],
  );

  // --- Pricing handlers ---

  const handleAddPricing = useCallback((tierIndex: number) => {
    setActiveTierIndex(tierIndex);
    setEditingPricingIndex(null);
    setShowPricingModal(true);
  }, []);

  const handleEditPricing = useCallback((tierIndex: number, pricingIndex: number) => {
    setActiveTierIndex(tierIndex);
    setEditingPricingIndex(pricingIndex);
    setShowPricingModal(true);
  }, []);

  const handlePricingSubmit = useCallback(
    (data: CreatePricingRuleRequest) => {
      if (activeTierIndex === null) return;
      const current = [...tiers];
      const tier = { ...current[activeTierIndex], pricing: [...current[activeTierIndex].pricing] };

      if (editingPricingIndex !== null) {
        tier.pricing[editingPricingIndex] = {
          name: data.name,
          price: data.price,
          currency: data.currency,
          capacity: data.capacity,
        };
      } else {
        tier.pricing.push({
          name: data.name,
          price: data.price,
          currency: data.currency,
          capacity: data.capacity,
        });
      }
      current[activeTierIndex] = tier;
      setValue('tiers', current, { shouldDirty: true });
      setShowPricingModal(false);
    },
    [tiers, activeTierIndex, editingPricingIndex, setValue],
  );

  const handleDeletePricing = useCallback(
    (tierIndex: number, pricingIndex: number) => {
      setDeletePricingTarget({ tierIndex, pricingIndex });
    },
    [],
  );

  // --- Modal initial values ---

  const tierModalInitial =
    editingTierIndex !== null && tiers[editingTierIndex]
      ? { id: editingTierIndex + 1, name: tiers[editingTierIndex].name, description: tiers[editingTierIndex].description }
      : undefined;

  const pricingModalInitial =
    activeTierIndex !== null && editingPricingIndex !== null
      ? (() => {
          const rule = tiers[activeTierIndex]?.pricing[editingPricingIndex];
          return rule ? { id: editingPricingIndex + 1, ...rule } : undefined;
        })()
      : undefined;

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Ticket Tiers</Text>
      <Text style={[styles.sectionDescription, { color: colors.textTertiary }]}>
        Add at least one tier with a pricing rule
      </Text>

      {/* Tier list */}
      {tiers.map((tier, tierIndex) => (
        <GlassSurface
          key={tierIndex}
          fill="subtle"
          border="subtle"
          cornerRadius="lg"
          style={styles.tierCard}
        >
          {/* Tier header */}
          <View style={styles.tierHeader}>
            <View style={styles.tierInfo}>
              <Text style={[styles.tierName, { color: colors.text }]}>{tier.name}</Text>
              {tier.description ? (
                <Text
                  style={[styles.tierDescription, { color: colors.textTertiary }]}
                  numberOfLines={2}
                >
                  {tier.description}
                </Text>
              ) : null}
            </View>
            <View style={styles.tierActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditTier(tierIndex)}
              >
                <GlassView {...liquidGlass.fillFaint} borderRadius={8} style={StyleSheet.absoluteFillObject} />
                <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteTier(tierIndex)}
              >
                <GlassView {...liquidGlass.fillFaint} borderRadius={8} style={StyleSheet.absoluteFillObject} />
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Pricing rules */}
          {tier.pricing.length > 0 && (
            <View style={styles.pricingList}>
              {tier.pricing.map((rule, pIndex) => (
                <View
                  key={pIndex}
                  style={[styles.pricingRow, { borderTopColor: 'rgba(255,255,255,0.06)' }]}
                >
                  <View style={styles.pricingInfo}>
                    <Text style={[styles.pricingName, { color: colors.text }]}>{rule.name}</Text>
                    <Text style={[styles.pricingDetail, { color: colors.textSecondary }]}>
                      {formatPrice(rule.price)}
                      {rule.capacity ? ` \u00B7 ${rule.capacity} tickets` : ''}
                    </Text>
                  </View>
                  <View style={styles.pricingActions}>
                    <TouchableOpacity
                      style={styles.smallAction}
                      onPress={() => handleEditPricing(tierIndex, pIndex)}
                    >
                      <Ionicons name="create-outline" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.smallAction}
                      onPress={() => handleDeletePricing(tierIndex, pIndex)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Warning if no pricing rules */}
          {tier.pricing.length === 0 && (
            <View style={styles.warningRow}>
              <Ionicons name="warning-outline" size={14} color="#f59e0b" />
              <Text style={styles.warningText}>Add at least one pricing rule</Text>
            </View>
          )}

          {/* Add pricing button */}
          <TouchableOpacity
            style={styles.addPricingButton}
            onPress={() => handleAddPricing(tierIndex)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={16} color={colors.textSecondary} />
            <Text style={[styles.addPricingText, { color: colors.textSecondary }]}>
              Add Pricing
            </Text>
          </TouchableOpacity>
        </GlassSurface>
      ))}

      {/* Add tier button */}
      <TouchableOpacity style={styles.addTierButton} onPress={handleAddTier} activeOpacity={0.7}>
        <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.addTierInner}>
          <Ionicons name="add-circle-outline" size={24} color={colors.textSecondary} />
          <Text style={[styles.addTierText, { color: colors.textSecondary }]}>Add Tier</Text>
        </GlassSurface>
      </TouchableOpacity>

      {/* Modals */}
      <CreateTierModal
        visible={showTierModal}
        onClose={() => setShowTierModal(false)}
        onSubmit={handleTierSubmit}
        initialValues={tierModalInitial}
      />
      <ConfirmSheet
        visible={deleteTierIndex !== null}
        onClose={() => setDeleteTierIndex(null)}
        onConfirm={() => {
          if (deleteTierIndex !== null) {
            const current = [...tiers];
            current.splice(deleteTierIndex, 1);
            setValue('tiers', current, { shouldDirty: true });
            setDeleteTierIndex(null);
          }
        }}
        title="Delete Tier"
        message={`Delete "${deleteTierIndex !== null ? tiers[deleteTierIndex]?.name : ''}" and all its pricing?`}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
      />

      <ConfirmSheet
        visible={deletePricingTarget !== null}
        onClose={() => setDeletePricingTarget(null)}
        onConfirm={() => {
          if (deletePricingTarget) {
            const current = [...tiers];
            const tier = { ...current[deletePricingTarget.tierIndex], pricing: [...current[deletePricingTarget.tierIndex].pricing] };
            tier.pricing.splice(deletePricingTarget.pricingIndex, 1);
            current[deletePricingTarget.tierIndex] = tier;
            setValue('tiers', current, { shouldDirty: true });
            setDeletePricingTarget(null);
          }
        }}
        title="Delete Pricing"
        message={`Delete "${deletePricingTarget ? tiers[deletePricingTarget.tierIndex]?.pricing[deletePricingTarget.pricingIndex]?.name : ''}"?`}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
      />

      <CreatePricingRuleModal
        visible={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onSubmit={handlePricingSubmit}
        initialValues={pricingModalInitial}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 20,
  },
  tierCard: {
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
  tierName: {
    fontSize: 16,
    marginBottom: 2,
  },
  tierDescription: {
    fontSize: 13,
  },
  tierActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
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
  },
  pricingDetail: {
    fontSize: 12,
    marginTop: 1,
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
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#f59e0b',
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
  },
  addTierButton: {
    marginTop: 4,
  },
  addTierInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  addTierText: {
    fontSize: 15,
  },
});
