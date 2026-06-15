// ── ProfileActions ────────────────────────────────────────────
// Athlete storefront — two CTA buttons (SUPPORT + WORK WITH ME)
// rendered below the identity block on the athlete's own profile.
// Both buttons open bottom-anchored Modal sheets.
// Demo fixture only — NO real payments or deal submission.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  cancelPass,
  loadPasses,
  loadReceipts,
  savePass,
  type SupporterPass,
  type SupporterReceipt,
} from '@/lib/fan/supporter';

import {
  ACCENT,
  CANVAS,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  SURFACE,
  SURFACE_SUBTLE,
  HAIRLINE,
  HAIRLINE_SUBTLE,
  RADIUS_CARD,
  RADIUS_LG,
  RADIUS_PILL,
  SIGNAL_POSITIVE,
  SP_XS,
  SP_SM,
  SP_MD,
  SP_LG,
} from '@/components/shared/ui-kit/tokens';

const COPPER = ACCENT;
const MUTED = TEXT_SECONDARY;
const WHITE = TEXT_PRIMARY;
const SHEET_BG = CANVAS;
const CARD_BG = SURFACE;
const CARD_BORDER = HAIRLINE;
const SUCCESS_GREEN = SIGNAL_POSITIVE;
const DANGER = '#B53A2B';

// ─── SupporterSheet ──────────────────────────────────────────

type SupportTier = 'fan' | 'insider' | 'courtside';

const TIERS: {
  id: SupportTier;
  label: string;
  price: string;
  perks: string[];
  amountCents: number;
  platformCents: number;
}[] = [
  {
    id: 'fan',
    label: 'FAN',
    price: '$5/mo',
    perks: ['Supporter badge', 'Gated drops'],
    amountCents: 500,
    platformCents: 44,
  },
  {
    id: 'insider',
    label: 'INSIDER',
    price: '$12/mo',
    perks: ['Everything in Fan', 'Monthly Q&A', 'Early merch'],
    amountCents: 1200,
    platformCents: 144,
  },
  {
    id: 'courtside',
    label: 'COURTSIDE',
    price: '$25/mo',
    perks: ['Everything in Insider', 'Signed item each season', 'Name in credits'],
    amountCents: 2500,
    platformCents: 244,
  },
];

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDateShort(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

// ─── DraggableSheet ──────────────────────────────────────────
// Shared modal shell: scrim fades in place (Modal "fade"), the sheet slides
// up on mount, and dragging the sheet down interactively reduces the scrim
// dim until release either dismisses (past threshold) or springs back.

function DraggableSheet({
  visible,
  onClose,
  paddingBottom,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  paddingBottom: number;
  children: React.ReactNode;
}) {
  const translateY = useSharedValue(0);
  const sheetHeight = useSharedValue(420);

  React.useEffect(() => {
    if (visible) translateY.value = 0;
  }, [visible, translateY]);

  const pan = Gesture.Pan()
    .activeOffsetY(12)
    .failOffsetY(-12)
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 240 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  // The lower the sheet is dragged, the less the background dims.
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, Math.max(sheetHeight.value, 1)],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={ss.root}>
        <Animated.View style={[ss.scrim, scrimStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <GestureDetector gesture={pan}>
          <Animated.View
            entering={SlideInDown.duration(320)}
            style={[ss.sheet, { paddingBottom }, sheetStyle]}
            onLayout={(e) => {
              sheetHeight.value = e.nativeEvent.layout.height;
            }}
          >
            <View style={ss.handle} />
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

// ─── SupporterSheet (new + manage modes) ─────────────────────

type SheetMode = 'new' | 'manage';

interface SupporterSheetProps {
  visible: boolean;
  athleteId: string;
  athleteName: string;
  mode: SheetMode;
  existingPass: SupporterPass | null;
  recentReceipts: SupporterReceipt[];
  supporterNumber: number;
  onClose: () => void;
  onPassSaved: (pass: SupporterPass) => void;
  onPassCancelled: () => void;
}

function SupporterSheet({
  visible,
  athleteId,
  athleteName,
  mode,
  existingPass,
  recentReceipts,
  supporterNumber,
  onClose,
  onPassSaved,
  onPassCancelled,
}: SupporterSheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedTier, setSelectedTier] = React.useState<SupportTier>(
    existingPass?.tier ?? 'insider',
  );
  const [confirmed, setConfirmed] = React.useState(false);
  const [cancelConfirm, setCancelConfirm] = React.useState(false);

  // Sync selectedTier when existingPass changes (e.g. modal re-opened)
  React.useEffect(() => {
    if (existingPass) setSelectedTier(existingPass.tier);
  }, [existingPass]);

  const handleClose = React.useCallback(() => {
    setConfirmed(false);
    setCancelConfirm(false);
    if (!existingPass) setSelectedTier('insider');
    onClose();
  }, [onClose, existingPass]);

  const tier = TIERS.find((t) => t.id === selectedTier) ?? TIERS[1];

  const handleConfirm = React.useCallback(async () => {
    const pass: SupporterPass = {
      athleteId,
      athleteName,
      tier: selectedTier,
      priceCents: tier.amountCents,
      supporterNumber,
      startedAtISO: existingPass?.startedAtISO ?? new Date().toISOString(),
    };
    await savePass(pass);
    setConfirmed(true);
    onPassSaved(pass);
  }, [athleteId, athleteName, selectedTier, tier.amountCents, supporterNumber, existingPass, onPassSaved]);

  const handleCancelPass = React.useCallback(async () => {
    await cancelPass(athleteId);
    onPassCancelled();
    handleClose();
  }, [athleteId, onPassCancelled, handleClose]);

  // Decide which CTA label to show in manage mode
  const tierChanged = existingPass && existingPass.tier !== selectedTier;
  const ctaLabel = mode === 'new'
    ? `Become supporter #${supporterNumber}`
    : tierChanged
      ? `Switch to ${tier.label}`
      : `Renew ${tier.label}`;

  return (
    <DraggableSheet visible={visible} onClose={handleClose} paddingBottom={insets.bottom + 20}>

          {confirmed ? (
            /* ── Confirmation state ── */
            <ScrollView
              contentContainerStyle={ss.sheetContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={ss.title}>
                {mode === 'new'
                  ? `You're supporter #${supporterNumber}`
                  : tierChanged
                    ? `Switched to ${tier.label}`
                    : `Pass renewed`}
              </Text>
              <View style={ss.receiptCard}>
                <ReceiptRow label="You pay" value={formatCents(tier.amountCents)} />
                <ReceiptRow
                  label={`Reaches ${athleteName}`}
                  value={formatCents(tier.amountCents - tier.platformCents)}
                />
                <ReceiptRow label="Platform" value={formatCents(tier.platformCents)} />
              </View>
              <View style={ss.demoPill}>
                <Text style={ss.demoPillText}>DEMO — payments not enabled</Text>
              </View>
              <TouchableOpacity
                style={ss.ctaBtn}
                onPress={handleClose}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={ss.ctaBtnText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* ── Tier selection / manage state ── */
            <ScrollView
              contentContainerStyle={ss.sheetContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={ss.title}>
                {mode === 'manage'
                  ? `Supporting ${athleteName}`
                  : `Support ${athleteName} directly`}
              </Text>

              {TIERS.map((t) => {
                const isSelected = selectedTier === t.id;
                const isCurrent = existingPass?.tier === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[ss.tierCard, isSelected && ss.tierCardSelected]}
                    onPress={() => setSelectedTier(t.id)}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <View style={ss.tierRow}>
                      <View style={[ss.radio, isSelected && ss.radioSelected]}>
                        {isSelected ? (
                          <View style={ss.radioDot} />
                        ) : null}
                      </View>
                      <View style={ss.tierMeta}>
                        <View style={ss.tierLabelRow}>
                          <Text style={ss.tierLabel}>{t.label}</Text>
                          {isCurrent && (
                            <View style={ss.currentChip}>
                              <Text style={ss.currentChipText}>CURRENT</Text>
                            </View>
                          )}
                        </View>
                        <Text style={ss.tierPerks} numberOfLines={2}>
                          {t.perks.join(' · ')}
                        </Text>
                      </View>
                      <Text style={[ss.tierPrice, isSelected && ss.tierPriceSelected]}>
                        {t.price}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Recent receipts in manage mode */}
              {mode === 'manage' && recentReceipts.length > 0 && (
                <>
                  <Text style={ss.receiptHeading}>RECENT PAYMENTS</Text>
                  <View style={ss.receiptCard}>
                    {recentReceipts.slice(0, 3).map((r) => (
                      <ReceiptRow
                        key={r.id}
                        label={formatDateShort(r.atISO)}
                        value={`${formatCents(r.paidCents)} → ${formatCents(r.toAthleteCents)} to ${athleteName} ✓`}
                      />
                    ))}
                  </View>
                </>
              )}

              {mode === 'new' && (
                <Text style={ss.receiptNote}>
                  Every dollar is a real NIL transaction — you&apos;ll see exactly what
                  reaches {athleteName}.
                </Text>
              )}

              <TouchableOpacity
                style={ss.ctaBtn}
                onPress={handleConfirm}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={ctaLabel}
              >
                <Text style={ss.ctaBtnText}>{ctaLabel}</Text>
              </TouchableOpacity>

              {/* Cancel support (manage mode only) */}
              {mode === 'manage' && !cancelConfirm && (
                <TouchableOpacity
                  style={ss.cancelGhostBtn}
                  onPress={() => setCancelConfirm(true)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel support"
                >
                  <Text style={ss.cancelGhostText}>Cancel support</Text>
                </TouchableOpacity>
              )}

              {mode === 'manage' && cancelConfirm && (
                <View style={ss.cancelConfirmRow}>
                  <Text style={ss.cancelConfirmMsg}>
                    Remove your pass? Receipts are kept.
                  </Text>
                  <TouchableOpacity
                    style={ss.cancelDestructiveBtn}
                    onPress={handleCancelPass}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm cancel"
                  >
                    <Text style={ss.cancelDestructiveText}>Yes, cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setCancelConfirm(false)}
                    activeOpacity={0.7}
                    style={{ alignSelf: 'center' }}
                    accessibilityRole="button"
                    accessibilityLabel="Keep pass"
                  >
                    <Text style={ss.cancelKeepText}>Keep pass</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={ss.demoPill}>
                <Text style={ss.demoPillText}>DEMO — payments not enabled</Text>
              </View>
            </ScrollView>
          )}
    </DraggableSheet>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={ss.receiptRow}>
      <Text style={ss.receiptLabel}>{label}</Text>
      <Text style={ss.receiptValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// ─── WorkWithMeSheet ──────────────────────────────────────────

const DEAL_TYPES: { label: string; range: string }[] = [
  { label: 'Endorsement post', range: '$1.2–2.4K' },
  { label: 'Appearance', range: '$3–6K' },
  { label: 'Licensing', range: '$800–1.8K' },
];

const TRUST_CHIPS = [
  '4 deals completed on time',
  'NIL Go cleared history',
];

interface WorkWithMeSheetProps {
  visible: boolean;
  athleteName: string;
  onClose: () => void;
}

function WorkWithMeSheet({ visible, athleteName, onClose }: WorkWithMeSheetProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [confirmed, setConfirmed] = React.useState(false);

  const handleClose = React.useCallback(() => {
    setConfirmed(false);
    onClose();
  }, [onClose]);

  return (
    <DraggableSheet visible={visible} onClose={handleClose} paddingBottom={insets.bottom + 20}>

          {confirmed ? (
            /* ── Confirmation state ── */
            <ScrollView
              contentContainerStyle={ss.sheetContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={ss.title}>Request sent to {athleteName}&apos;s team</Text>
              <Text style={ss.receiptNote}>
                The team typically responds within 2 business days — or draft the
                contract now and send it for signature.
              </Text>
              <View style={ss.demoPill}>
                <Text style={ss.demoPillText}>DEMO</Text>
              </View>
              <TouchableOpacity
                style={ss.ctaBtn}
                onPress={() => {
                  handleClose();
                  setTimeout(() => router.push('/deal-engine/new' as any), 350);
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Draft the contract"
              >
                <Text style={ss.ctaBtnText}>Draft the contract →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={ss.ctaBtnGhost}
                onPress={handleClose}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={ss.ctaBtnGhostText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* ── Deal type selection state ── */
            <ScrollView
              contentContainerStyle={ss.sheetContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={ss.title}>Work with {athleteName}</Text>

              {DEAL_TYPES.map((dt) => (
                <View key={dt.label} style={ss.dealTypeRow}>
                  <Text style={ss.dealTypeLabel}>{dt.label}</Text>
                  <View style={ss.dealTypeRight}>
                    <Text style={ss.dealTypeRangeLabel}>est. range</Text>
                    <Text style={ss.dealTypeRange}>{dt.range}</Text>
                  </View>
                </View>
              ))}

              <View style={ss.trustRow}>
                {TRUST_CHIPS.map((chip) => (
                  <View key={chip} style={ss.trustChip}>
                    <Ionicons name="checkmark" size={11} color={SUCCESS_GREEN} />
                    <Text style={ss.trustChipText}>{chip}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={ss.ctaBtn}
                onPress={() => setConfirmed(true)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Start a deal request"
              >
                <Text style={ss.ctaBtnText}>Start a deal request</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
    </DraggableSheet>
  );
}

// ─── ProfileActions ───────────────────────────────────────────

export interface ProfileActionsProps {
  athleteId?: string;
  athleteName: string;
}

export function ProfileActions({ athleteId = 'a-1', athleteName }: ProfileActionsProps) {
  const [supporterOpen, setSupporterOpen] = React.useState(false);
  const [workOpen, setWorkOpen] = React.useState(false);

  // Persisted pass state
  const [pass, setPass] = React.useState<SupporterPass | null>(null);
  const [receipts, setReceipts] = React.useState<SupporterReceipt[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  // Hydrate on mount
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [passes, allReceipts] = await Promise.all([loadPasses(), loadReceipts()]);
        if (cancelled) return;
        setPass(passes[athleteId] ?? null);
        setReceipts(allReceipts.filter((r) => r.passAthleteId === athleteId));
      } catch {
        // silent
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, [athleteId]);

  const handlePassSaved = React.useCallback((saved: SupporterPass) => {
    setPass(saved);
    // Re-fetch receipts so newly appended receipt appears
    loadReceipts().then((all) => {
      setReceipts(all.filter((r) => r.passAthleteId === athleteId));
    }).catch(() => {});
  }, [athleteId]);

  const handlePassCancelled = React.useCallback(() => {
    setPass(null);
  }, []);

  const isSupporting = hydrated && pass !== null;
  const tierLabelShort = pass?.tier === 'fan' ? 'FAN'
    : pass?.tier === 'insider' ? 'INSIDER'
    : pass?.tier === 'courtside' ? 'COURTSIDE'
    : '';

  // Fixture supporter number: 15 if no pass stored yet, else keep existing
  const supporterNumber = pass?.supporterNumber ?? 15;

  return (
    <>
      <View style={pa.row}>
        {/* SUPPORT / SUPPORTING button */}
        <TouchableOpacity
          style={[pa.supportBtn, isSupporting && pa.supportingBtn]}
          onPress={() => setSupporterOpen(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isSupporting ? `Managing support for ${athleteName}` : `Support ${athleteName}`}
        >
          {isSupporting ? (
            <View style={pa.supportingRow}>
              <Ionicons name="checkmark-circle" size={14} color={SUCCESS_GREEN} />
              <Text style={pa.supportingBtnText}>
                SUPPORTING · {tierLabelShort}
              </Text>
            </View>
          ) : (
            <Text style={pa.supportBtnText}>SUPPORT</Text>
          )}
        </TouchableOpacity>

        {/* WORK WITH ME — ghost copper */}
        <TouchableOpacity
          style={pa.workBtn}
          onPress={() => setWorkOpen(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Work with ${athleteName}`}
        >
          <Text style={pa.workBtnText}>WORK WITH ME</Text>
        </TouchableOpacity>
      </View>

      <SupporterSheet
        visible={supporterOpen}
        athleteId={athleteId}
        athleteName={athleteName}
        mode={isSupporting ? 'manage' : 'new'}
        existingPass={pass}
        recentReceipts={receipts}
        supporterNumber={supporterNumber}
        onClose={() => setSupporterOpen(false)}
        onPassSaved={handlePassSaved}
        onPassCancelled={handlePassCancelled}
      />
      <WorkWithMeSheet
        visible={workOpen}
        athleteName={athleteName}
        onClose={() => setWorkOpen(false)}
      />
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const BTN_HEIGHT = 46;
const BTN_RADIUS = RADIUS_PILL;

const pa = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SP_SM,
    paddingHorizontal: SP_LG,
    marginTop: -48,
    marginBottom: SP_XS,
  },
  supportBtn: {
    flex: 1,
    height: 32,
    borderRadius: RADIUS_CARD,
    backgroundColor: COPPER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportingBtn: {
    backgroundColor: 'rgba(0,198,176,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,198,176,0.40)',
  },
  supportingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  supportBtnText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  supportingBtnText: {
    color: SUCCESS_GREEN,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  workBtn: {
    flex: 1,
    height: 32,
    borderRadius: RADIUS_CARD,
    backgroundColor: 'rgba(235,98,26,0.10)',
    borderWidth: 1.5,
    borderColor: COPPER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workBtnText: {
    color: COPPER,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

const ss = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: RADIUS_LG,
    borderTopRightRadius: RADIUS_LG,
    paddingTop: SP_SM,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: SP_SM,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: SP_SM,
    paddingBottom: 24,
    gap: SP_MD,
  },
  title: {
    color: WHITE,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: SP_XS,
  },
  // Tier cards
  tierCard: {
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 14,
  },
  tierCardSelected: {
    borderColor: COPPER,
    backgroundColor: `${COPPER}18`,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_MD,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: RADIUS_PILL,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COPPER,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS_PILL,
    backgroundColor: COPPER,
  },
  tierMeta: {
    flex: 1,
    gap: 3,
  },
  tierLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierLabel: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  currentChip: {
    borderRadius: RADIUS_PILL,
    backgroundColor: `${SUCCESS_GREEN}22`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${SUCCESS_GREEN}55`,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  currentChipText: {
    color: SUCCESS_GREEN,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tierPerks: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 15,
  },
  tierPrice: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  tierPriceSelected: {
    color: COPPER,
  },
  receiptHeading: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  receiptNote: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 2,
  },
  receiptCard: {
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 14,
    gap: SP_SM,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SP_SM,
  },
  receiptLabel: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 0,
  },
  receiptValue: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    flexShrink: 1,
  },
  demoPill: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE_SUBTLE,
    backgroundColor: SURFACE_SUBTLE,
    paddingHorizontal: SP_SM,
    paddingVertical: SP_XS,
  },
  demoPillText: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ctaBtn: {
    height: BTN_HEIGHT,
    borderRadius: BTN_RADIUS,
    backgroundColor: COPPER,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SP_XS,
  },
  ctaBtnGhost: {
    height: BTN_HEIGHT,
    borderRadius: BTN_RADIUS,
    borderWidth: 1,
    borderColor: HAIRLINE_SUBTLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SP_SM,
  },
  ctaBtnGhostText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ctaBtnText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  cancelGhostBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  cancelGhostText: {
    color: DANGER,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cancelConfirmRow: {
    gap: SP_SM,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${DANGER}44`,
    backgroundColor: `${DANGER}10`,
    padding: 14,
  },
  cancelConfirmMsg: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: SP_XS,
  },
  cancelDestructiveBtn: {
    height: 40,
    borderRadius: RADIUS_PILL,
    backgroundColor: DANGER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelDestructiveText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cancelKeepText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  // WorkWithMe — deal type rows
  dealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    paddingHorizontal: 14,
    paddingVertical: SP_MD,
    minHeight: 52,
  },
  dealTypeLabel: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '700',
  },
  dealTypeRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  dealTypeRangeLabel: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dealTypeRange: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SP_SM,
    marginTop: 2,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_XS,
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${SUCCESS_GREEN}44`,
    backgroundColor: `${SUCCESS_GREEN}12`,
    paddingHorizontal: SP_SM,
    paddingVertical: SP_XS,
  },
  trustChipText: {
    color: SUCCESS_GREEN,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
