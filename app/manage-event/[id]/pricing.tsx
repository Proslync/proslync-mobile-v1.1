import { useState } from 'react';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { CreateTierModal } from '@/components/pricing/create-tier-modal';
import { CreatePricingRuleModal } from '@/components/pricing/create-pricing-rule-modal';
import { CreatePromoCodeModal } from '@/components/pricing/create-promo-code-modal';
import { TierCard } from '@/components/pricing/tier-card';
import { PromoCodeCard } from '@/components/pricing/promo-code-card';
import {
  useEvent,
  useGetTiers,
  useGetPromoCodes,
  useCreateTier,
  useDeleteTier,
  useCreatePricingRule,
  useDeletePricingRule,
  useCreatePromoCode,
  useDeletePromoCode,
  useTogglePromoCodeActive,
  useEventPermissions,
} from '@/hooks';
import { useAppTheme } from '@/hooks/use-app-theme';
import { EventStatus } from '@/lib/types/events.types';
import type { TicketTier, PricingRule } from '@/lib/types/pricing.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PricingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const eventId = id ? Number(id) : 0;
  const { data: event } = useEvent(eventId || undefined);
  const { data: tiers = [], isLoading: tiersLoading } = useGetTiers(eventId);
  const { data: promoCodes = [], isLoading: promosLoading } = useGetPromoCodes(eventId);

  const { canEditBilling } = useEventPermissions(eventId || undefined);
  const isPastEvent = event?.status === EventStatus.FINISHED || event?.status === EventStatus.CANCELLED;
  const readOnly = isPastEvent || !canEditBilling();

  // Mutations
  const createTier = useCreateTier(eventId);
  const deleteTier = useDeleteTier(eventId);
  const createPricingRule = useCreatePricingRule(eventId);
  const deletePricingRule = useDeletePricingRule(eventId);
  const createPromoCode = useCreatePromoCode(eventId);
  const deletePromoCode = useDeletePromoCode(eventId);
  const togglePromoActive = useTogglePromoCodeActive(eventId);

  // Modal state
  const [tierModalVisible, setTierModalVisible] = useState(false);
  const [tierToEdit, setTierToEdit] = useState<TicketTier | undefined>();
  const [pricingModalVisible, setPricingModalVisible] = useState(false);
  const [pricingTierId, setPricingTierId] = useState<number | null>(null);
  const [pricingToEdit, setPricingToEdit] = useState<PricingRule | undefined>();
  const [promoModalVisible, setPromoModalVisible] = useState(false);

  // Tier handlers
  const handleAddTier = () => {
    setTierToEdit(undefined);
    setTierModalVisible(true);
  };

  const handleEditTier = (tier: TicketTier) => {
    setTierToEdit(tier);
    setTierModalVisible(true);
  };

  const handleTierSubmit = (data: Parameters<typeof createTier.mutate>[0]) => {
    createTier.mutate(data, {
      onSuccess: () => setTierModalVisible(false),
    });
  };

  // Pricing rule handlers
  const handleAddPricing = (tierId: number) => {
    setPricingTierId(tierId);
    setPricingToEdit(undefined);
    setPricingModalVisible(true);
  };

  const handleEditPricing = (tierId: number, rule: PricingRule) => {
    setPricingTierId(tierId);
    setPricingToEdit(rule);
    setPricingModalVisible(true);
  };

  const handlePricingSubmit = (data: Parameters<typeof createPricingRule.mutate>[0]['data']) => {
    if (!pricingTierId) return;
    createPricingRule.mutate(
      { tierId: pricingTierId, data },
      { onSuccess: () => setPricingModalVisible(false) },
    );
  };

  // Promo code handlers
  const handleAddPromo = () => {
    setPromoModalVisible(true);
  };

  const handlePromoSubmit = (data: Parameters<typeof createPromoCode.mutate>[0]) => {
    createPromoCode.mutate(data, {
      onSuccess: () => setPromoModalVisible(false),
    });
  };

  const isLoading = tiersLoading || promosLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Pricing</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Ticket Pricing Section */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ticket Pricing</Text>
              {!readOnly && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddTier}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color={colors.text} />
                  <Text style={[styles.addButtonText, { color: colors.text }]}>Add Tier</Text>
                </TouchableOpacity>
              )}
            </View>

            {tiers.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="pricetag-outline" size={32} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                  No ticket tiers yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                  Add a tier to start selling tickets
                </Text>
              </View>
            ) : (
              tiers.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  readOnly={readOnly}
                  onAddPricing={handleAddPricing}
                  onEditTier={handleEditTier}
                  onDeleteTier={(tierId) => deleteTier.mutate(tierId)}
                  onEditPricing={handleEditPricing}
                  onDeletePricing={(tierId, pricingId) =>
                    deletePricingRule.mutate({ tierId, pricingId })
                  }
                />
              ))
            )}
          </Animated.View>

          {/* Promo Codes Section */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.promoSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Promo Codes</Text>
              {!readOnly && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddPromo}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color={colors.text} />
                  <Text style={[styles.addButtonText, { color: colors.text }]}>Add Code</Text>
                </TouchableOpacity>
              )}
            </View>

            {promoCodes.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="ticket-outline" size={32} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                  No promo codes yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                  Create discount codes for your event
                </Text>
              </View>
            ) : (
              promoCodes.map((code) => (
                <PromoCodeCard
                  key={code.id}
                  promoCode={code}
                  readOnly={readOnly}
                  onToggleActive={(promoId) => {
                    const promo = promoCodes.find((p) => p.id === promoId);
                    togglePromoActive.mutate({ promoId, isActive: !promo?.isActive });
                  }}
                  onEdit={() => {}}
                  onDelete={(promoId) => deletePromoCode.mutate(promoId)}
                />
              ))
            )}
          </Animated.View>
        </ScrollView>
      )}

      {/* Modals */}
      <CreateTierModal
        visible={tierModalVisible}
        onClose={() => setTierModalVisible(false)}
        onSubmit={handleTierSubmit}
        loading={createTier.isPending}
        initialValues={tierToEdit}
      />

      <CreatePricingRuleModal
        visible={pricingModalVisible}
        onClose={() => setPricingModalVisible(false)}
        onSubmit={handlePricingSubmit}
        loading={createPricingRule.isPending}
        initialValues={pricingToEdit}
      />

      <CreatePromoCodeModal
        visible={promoModalVisible}
        onClose={() => setPromoModalVisible(false)}
        onSubmit={handlePromoSubmit}
        loading={createPromoCode.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  addButtonText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  promoSection: {
    marginTop: 24,
  },
});
