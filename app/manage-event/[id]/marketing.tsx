import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { CreatePromoCodeModal } from '@/components/pricing/create-promo-code-modal';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  useEvent,
  useGetPromoCodes,
  useCreatePromoCode,
  useUpdatePromoCode,
  useDeletePromoCode,
  useTogglePromoCodeActive,
  useEventPermissions,
} from '@/hooks';
import { EventStatus } from '@/lib/types/events.types';
import type { PromoCode } from '@/lib/types/pricing.types';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatDiscount(code: PromoCode): string {
  if (code.discountType === 'percentage') return `${code.discountValue}% off`;
  return `$${code.discountValue.toFixed(2)} off`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MarketingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const eventId = id ? Number(id) : 0;
  const { data: event } = useEvent(eventId || undefined);
  const { data: promoCodes = [], isLoading } = useGetPromoCodes(eventId);

  const { canEditBilling } = useEventPermissions(eventId || undefined);
  const isPastEvent = event?.status === EventStatus.FINISHED || event?.status === EventStatus.CANCELLED;
  const readOnly = isPastEvent || !canEditBilling();

  const createPromoCode = useCreatePromoCode(eventId);
  const updatePromoCode = useUpdatePromoCode(eventId);
  const deletePromoCode = useDeletePromoCode(eventId);
  const togglePromoActive = useTogglePromoCodeActive(eventId);

  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const [copiedAlert, setCopiedAlert] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);

  const handlePromoSubmit = (data: Parameters<typeof createPromoCode.mutate>[0]) => {
    createPromoCode.mutate(data, {
      onSuccess: () => setPromoModalVisible(false),
    });
  };

  const handleShare = async (promo: PromoCode) => {
    const discount = formatDiscount(promo);
    const message = event
      ? `Use code ${promo.code} for ${discount} tickets to ${event.name}!`
      : `Use code ${promo.code} for ${discount}!`;
    try {
      await Share.share({ message });
    } catch {
      // user cancelled
    }
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedAlert(`${code} copied to clipboard`);
  };

  const handleDelete = (promo: PromoCode) => {
    setDeleteTarget(promo);
  };

  const activePromos = promoCodes.filter((p) => p.isActive);
  const inactivePromos = promoCodes.filter((p) => !p.isActive);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Marketing</Text>
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
          {/* Promo Codes Section */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Promo Codes</Text>
              {!readOnly && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setPromoModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color={colors.text} />
                  <Text style={[styles.addButtonText, { color: colors.text }]}>Create</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.sectionDescription, { color: colors.textTertiary }]}>
              Create promo codes to offer discounts on tickets. Share them with your audience to boost sales.
            </Text>

            {promoCodes.length === 0 ? (
              <View style={styles.emptySection}>
                <Ionicons name="megaphone-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                  No promo codes yet
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                  Create a promo code to get started
                </Text>
                {!readOnly && (
                  <TouchableOpacity
                    style={styles.emptyCreateButton}
                    onPress={() => setPromoModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={colors.text} />
                    <Text style={[styles.emptyCreateText, { color: colors.text }]}>Create Promo Code</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                {/* Active promos */}
                {activePromos.length > 0 && (
                  <View style={styles.promoGroup}>
                    <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>
                      Active ({activePromos.length})
                    </Text>
                    {activePromos.map((promo) => (
                      <PromoCard
                        key={promo.id}
                        promo={promo}
                        colors={colors}
                        readOnly={readOnly}
                        onShare={() => handleShare(promo)}
                        onCopy={() => handleCopyCode(promo.code)}
                        onToggle={() => togglePromoActive.mutate({ promoId: promo.id, isActive: !promo.isActive })}
                        onTogglePublic={() => updatePromoCode.mutate({ promoId: promo.id, data: { isPublic: !promo.isPublic } })}
                        onDelete={() => handleDelete(promo)}
                      />
                    ))}
                  </View>
                )}

                {/* Inactive promos */}
                {inactivePromos.length > 0 && (
                  <View style={styles.promoGroup}>
                    <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>
                      Inactive ({inactivePromos.length})
                    </Text>
                    {inactivePromos.map((promo) => (
                      <PromoCard
                        key={promo.id}
                        promo={promo}
                        colors={colors}
                        readOnly={readOnly}
                        onShare={() => handleShare(promo)}
                        onCopy={() => handleCopyCode(promo.code)}
                        onToggle={() => togglePromoActive.mutate({ promoId: promo.id, isActive: !promo.isActive })}
                        onTogglePublic={() => updatePromoCode.mutate({ promoId: promo.id, data: { isPublic: !promo.isPublic } })}
                        onDelete={() => handleDelete(promo)}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </Animated.View>
        </ScrollView>
      )}

      <ConfirmModal
        visible={!!copiedAlert}
        onClose={() => setCopiedAlert(null)}
        title="Copied"
        message={copiedAlert || ''}
        alertOnly
        icon="checkmark-circle-outline"
      />

      <ConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { deletePromoCode.mutate(deleteTarget.id); setDeleteTarget(null); } }}
        title="Delete Promo Code"
        message={`Delete "${deleteTarget?.code}"?`}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
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


interface PromoCardProps {
  promo: PromoCode;
  colors: ReturnType<typeof useAppTheme>['colors'];
  readOnly: boolean;
  onShare: () => void;
  onCopy: () => void;
  onToggle: () => void;
  onTogglePublic: () => void;
  onDelete: () => void;
}

function PromoCard({ promo, colors, readOnly, onShare, onCopy, onToggle, onTogglePublic, onDelete }: PromoCardProps) {
  const usageText = promo.maxUses
    ? `${promo.usedCount} / ${promo.maxUses} used`
    : `${promo.usedCount} used`;

  return (
    <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.promoCard}>
      <View style={styles.promoTopRow}>
        <View style={styles.promoCodeInfo}>
          <Text style={[styles.promoCode, { color: colors.text }]}>{promo.code}</Text>
          <Text style={[styles.promoDiscount, { color: colors.textSecondary }]}>
            {formatDiscount(promo)}
          </Text>
        </View>
        <View style={styles.badgeRow}>
          {promo.isPublic && (
            <View style={[styles.statusBadge, styles.publicBadge]}>
              <Text style={[styles.statusText, styles.publicText]}>Public</Text>
            </View>
          )}
          <View style={[styles.statusBadge, promo.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.statusText, promo.isActive ? styles.activeText : styles.inactiveText]}>
              {promo.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.promoStats}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.statText, { color: colors.textTertiary }]}>{usageText}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.statText, { color: colors.textTertiary }]}>
            From {formatDate(promo.validFrom)}
            {promo.validUntil ? ` to ${formatDate(promo.validUntil)}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.promoActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onCopy} activeOpacity={0.7}>
          <Ionicons name="copy-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>Copy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onShare} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>Share</Text>
        </TouchableOpacity>

        {!readOnly && (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={onTogglePublic} activeOpacity={0.7}>
              <Ionicons
                name={promo.isPublic ? 'eye-outline' : 'eye-off-outline'}
                size={16}
                color={promo.isPublic ? '#3b82f6' : colors.textSecondary}
              />
              <Text style={[styles.actionText, { color: promo.isPublic ? '#3b82f6' : colors.textSecondary }]}>
                {promo.isPublic ? 'Public' : 'Private'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={onToggle} activeOpacity={0.7}>
              <Ionicons
                name={promo.isActive ? 'pause-outline' : 'play-outline'}
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                {promo.isActive ? 'Pause' : 'Enable'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={onDelete} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </GlassSurface>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Lato_700Bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Lato_700Bold' },
  sectionDescription: { fontSize: 13, fontFamily: 'Lato_400Regular', marginBottom: 16 },
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
  addButtonText: { fontSize: 13, fontFamily: 'Lato_400Regular' },
  emptySection: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyText: { fontSize: 15, fontFamily: 'Lato_700Bold' },
  emptySubtext: { fontSize: 13, fontFamily: 'Lato_400Regular' },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  emptyCreateText: { fontSize: 14, fontFamily: 'Lato_700Bold' },
  promoGroup: { marginBottom: 20 },
  groupLabel: { fontSize: 12, fontFamily: 'Lato_700Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  promoCard: { padding: 16, marginBottom: 12 },
  promoTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  promoCodeInfo: { flex: 1, marginRight: 12 },
  promoCode: { fontSize: 18, fontFamily: 'Lato_700Bold', letterSpacing: 1.5 },
  promoDiscount: { fontSize: 14, fontFamily: 'Lato_400Regular', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeBadge: { backgroundColor: 'rgba(34,197,94,0.15)' },
  inactiveBadge: { backgroundColor: 'rgba(255,255,255,0.08)' },
  publicBadge: { backgroundColor: 'rgba(59,130,246,0.15)' },
  publicText: { color: '#3b82f6' },
  statusText: { fontSize: 11, fontFamily: 'Lato_700Bold' },
  activeText: { color: '#22c55e' },
  inactiveText: { color: 'rgba(255,255,255,0.4)' },
  promoStats: { marginTop: 12, gap: 4 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 12, fontFamily: 'Lato_400Regular' },
  promoActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontFamily: 'Lato_400Regular' },
});
