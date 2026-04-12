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
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { EventStatus } from '@/lib/types/events.types';
import type { TicketTier, PricingRule } from '@/lib/types/pricing.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';

export default function PricingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const eventId = id ? Number(id) : 0;
  const { data: event } = useEvent(eventId || undefined);
  const { data: tiers = [], isLoading: tiersLoading, refetch: refetchTiers } = useGetTiers(eventId);
  const { data: promoCodes = [], isLoading: promosLoading, refetch: refetchPromos } = useGetPromoCodes(eventId);
  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await Promise.all([refetchTiers(), refetchPromos()]);
    },
  });

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

  const [activeSection, setActiveSection] = useState<'tickets' | 'promos'>('tickets');

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
    <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>

      {/* Pill row header */}
      <View style={[styles.pillRow, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.pillIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </Pressable>
        {(['tickets', 'promos'] as const).map((section) => {
          const isActive = activeSection === section;
          const label = section === 'tickets' ? 'Tickets' : 'Promos';
          return (
            <Pressable
              key={section}
              style={styles.pillFilter}
              onPress={() => setActiveSection(section)}
            >
              <View style={styles.pillGlassLayer} pointerEvents="none">
                <GlassView
                  {...liquidGlass.surface}
                  tintColor={isActive ? 'rgba(0,0,0,0.12)' : 'transparent'}
                  borderRadius={19}
                  style={StyleSheet.absoluteFill}
                />
              </View>
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24, paddingTop: 12 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {/* Ticket Pricing Section */}
          {activeSection === 'tickets' && (
          <Animated.View entering={FadeInDown.duration(300)}>

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
          )}

          {/* Promo Codes Section */}
          {activeSection === 'promos' && (
          <Animated.View entering={FadeInDown.duration(300)}>

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
          )}
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

      {/* Floating add button */}
      {!readOnly && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={activeSection === 'tickets' ? handleAddTier : handleAddPromo}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.bottomButtonText}>
              {activeSection === 'tickets' ? 'Add Tier' : 'Add Promo Code'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    width: 240,
    borderRadius: 26,
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  pillRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
    paddingBottom: 8,
  },
  pillIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillFilter: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pillGlassLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 19,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  pillTextActive: {
    color: 'rgba(0,0,0,0.8)',
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
    marginTop: 0,
  },
});
