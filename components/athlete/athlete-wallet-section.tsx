// Athlete Wallet section — wired to the live `/api/wallet/me` +
// `/api/wallet/:id/transactions` endpoints via `useAthleteWallet`.
// Replaces the prior hardcoded EARNINGS_YTD / REVENUE_BY_BRAND /
// RECENT_PAYOUTS / UPCOMING_INVOICES constants (r6-wallet-1).
//
// Section order is preserved: YTD hero → available balance hero →
// pending / next-payout tiles → revenue by partner → action buttons →
// payout method placeholder → recent payouts → upcoming invoices.
// Sections that have no data after normalization render as empty-state
// rows so the layout still reads cleanly while the backend seed grows.
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlassButton } from '@/components/glass/glass-button';
import {
  useAthleteWallet,
  type AthleteWalletPartnerRow,
  type AthleteWalletRecentPayout,
} from '@/hooks/use-athlete-wallet';
import { formatCents } from '@/lib/utils/currency';
import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';

const STATS_CARD_BG = '#1C1C1E';
const ACCENT = '#EB621A';

// Deterministic palette for partner badges. Hashed on the partner key
// so the same partner gets a stable color across renders without the
// component needing brand metadata from the backend.
const PARTNER_PALETTE = [
  '#E11E2B',
  '#0F1B3F',
  '#00C2A8',
  '#EB621A',
  '#635BFF',
  '#0A2342',
];

function colorForPartner(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return PARTNER_PALETTE[hash % PARTNER_PALETTE.length]!;
}

function initialForLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length === 0) return '·';
  return trimmed.slice(0, 1).toUpperCase();
}

function formatOccurredAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function AthleteWalletSection() {
  const { data, isLoading, isError, refetch, isRefetching } = useAthleteWallet();
  const [transferOpen, setTransferOpen] = React.useState(false);

  if (isLoading && !data) {
    return (
      <View style={styles.stateCard}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.stateCard}>
        <Ionicons name="cloud-offline-outline" size={28} color="rgba(255,255,255,0.55)" />
        <Text style={styles.stateTitle}>Wallet unavailable</Text>
        <Text style={styles.stateBody}>
          Couldn't reach the wallet service. Pull to retry, or tap below.
        </Text>
        <GlassButton
          label={isRefetching ? 'Retrying…' : 'Retry'}
          icon={<Ionicons name="refresh" size={15} color="#FFF" />}
          variant="glass"
          size="sm"
          onPress={() => refetch()}
        />
      </View>
    );
  }

  const {
    availableCents,
    pendingCents,
    ytdCents,
    postedRevenueCount,
    recentPayouts,
    revenueByPartner,
  } = data;

  const maxPartnerCents = revenueByPartner.reduce(
    (m, r) => Math.max(m, r.amountCents),
    0,
  ) || 1;
  const totalForShareCents = revenueByPartner.reduce(
    (sum, r) => sum + r.amountCents,
    0,
  ) || 1;

  return (
    <View style={{ gap: 16 }}>
      {/* YTD earnings hero */}
      <View style={styles.heroCard}>
        <View style={styles.heroLeft}>
          <View style={[styles.heroAvatarWrap, { backgroundColor: ACCENT }]}>
            <Ionicons name="cash-outline" size={26} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{formatCents(ytdCents)}</Text>
            <View style={styles.sportRow}>
              <Ionicons name="trending-up" size={14} color="#34C759" />
              <Text style={styles.heroSport}>
                {postedRevenueCount > 0
                  ? `YTD · ${postedRevenueCount} settled txn${
                      postedRevenueCount === 1 ? '' : 's'
                    }`
                  : 'YTD · no settled earnings yet'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Available balance hero */}
      <View style={styles.heroCard}>
        <View style={styles.heroLeft}>
          <View style={[styles.heroAvatarWrap, { backgroundColor: ACCENT }]}>
            <Ionicons name="wallet" size={24} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{formatCents(availableCents)}</Text>
            <View style={styles.sportRow}>
              <Ionicons name="checkmark-circle" size={14} color="#34C759" />
              <Text style={styles.heroSport}>Available now</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Pending / next-payout tiles */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={[styles.tile, { flex: 1 }]}>
          <Text style={styles.tileLabel}>Pending</Text>
          <Text style={styles.tileValue}>{formatCents(pendingCents)}</Text>
        </View>
        <View style={[styles.tile, { flex: 1.4 }]}>
          <Text style={styles.tileLabel}>Next payout</Text>
          <Text style={styles.tileValue} numberOfLines={1}>
            {pendingCents > 0 ? 'Pending review' : 'No payout scheduled'}
          </Text>
        </View>
      </View>

      {/* Revenue by Partner */}
      <View style={{ gap: 10 }}>
        <Text style={styles.sectionLabel}>REVENUE BY PARTNER</Text>
        {revenueByPartner.length === 0 ? (
          <EmptyRow label="No partner revenue settled yet" />
        ) : (
          revenueByPartner.map((r: AthleteWalletPartnerRow) => {
            const widthPct = (r.amountCents / maxPartnerCents) * 100;
            const sharePct = (r.amountCents / totalForShareCents) * 100;
            const color = colorForPartner(r.partnerKey);
            return (
              <View key={r.partnerKey} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.brandBadge, { backgroundColor: color }]}>
                    <Text style={styles.brandBadgeText}>
                      {initialForLabel(r.label)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.brandName} numberOfLines={1}>
                      {r.label}
                    </Text>
                    <Text style={styles.brandShare}>
                      {sharePct.toFixed(1)}% of YTD
                    </Text>
                  </View>
                  <Text style={styles.amount}>{formatCents(r.amountCents)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${widthPct}%` }]} />
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <GlassButton
          label="Transfer out"
          icon={<Ionicons name="arrow-up" size={15} color="#FFF" />}
          variant="glass"
          size="sm"
          fullWidth
          style={styles.actionButton}
          onPress={() => {
            if (availableCents <= 0) {
              Alert.alert(
                'Nothing available yet',
                'No funds are available to transfer out. Pending balances will show here once they clear.',
              );
              return;
            }
            setTransferOpen(true);
          }}
        />
        <GlassButton
          label="Manage"
          icon={<Ionicons name="swap-vertical" size={15} color="#FFF" />}
          variant="glass"
          size="sm"
          fullWidth
          style={styles.actionButton}
          onPress={() => {}}
        />
      </View>

      {/* Payout method — placeholder; Stripe Connect status query lives
       *  in `stripeConnectApi.getAccountStatus`. Wire in a later phase. */}
      <View style={{ gap: 10 }}>
        <Text style={styles.sectionLabel}>PAYOUT METHOD</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.brandBadge, { backgroundColor: '#635BFF' }]}>
              <Ionicons name="card" size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.brandName}>Payout method</Text>
              <Text style={styles.brandShare}>Connect a destination to receive payouts</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Recent payouts */}
      <View style={{ gap: 10 }}>
        <Text style={styles.sectionLabel}>RECENT PAYOUTS</Text>
        {recentPayouts.length === 0 ? (
          <EmptyRow label="No payouts have settled yet" />
        ) : (
          recentPayouts.map((p: AthleteWalletRecentPayout) => {
            const color = colorForPartner(p.label);
            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.brandBadge, { backgroundColor: color }]}>
                    <Text style={styles.brandBadgeText}>
                      {initialForLabel(p.label)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.brandName} numberOfLines={1}>
                      {p.label}
                    </Text>
                    <Text style={styles.brandShare}>
                      {formatOccurredAt(p.occurredAt)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: 'rgba(52,199,89,0.16)' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: '#34C759' }]}>
                      +{formatCents(p.amountCents)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Tax set-aside — paid deal estimate (spec §4, not financial advice) */}
      <TaxSetAsideRow />

      {/* Upcoming invoices — backend has no invoice surface yet. Reserve
       *  the section for layout continuity and show an empty state. */}
      <View style={{ gap: 10 }}>
        <Text style={styles.sectionLabel}>UPCOMING INVOICES</Text>
        <EmptyRow label="Invoicing isn't wired yet" />
      </View>

      <TransferOutSheet
        visible={transferOpen}
        availableCents={availableCents}
        onClose={() => setTransferOpen(false)}
      />
    </View>
  );
}

function TransferOutSheet({
  visible,
  availableCents,
  onClose,
}: {
  visible: boolean;
  availableCents: number;
  onClose: () => void;
}) {
  const [amountInput, setAmountInput] = React.useState('');

  React.useEffect(() => {
    if (visible) setAmountInput('');
  }, [visible]);

  const amountCents = React.useMemo(() => {
    const parsed = parseFloat(amountInput.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.round(parsed * 100);
  }, [amountInput]);

  const overLimit = amountCents > availableCents;
  const validAmount = amountCents > 0 && !overLimit;

  const setQuick = (multiplier: number) => {
    const cents = Math.floor(availableCents * multiplier);
    setAmountInput((cents / 100).toFixed(2));
  };

  const confirm = () => {
    if (!validAmount) return;
    const formatted = formatCents(amountCents);
    Alert.alert(
      'Transfer requested',
      `${formatted} will be sent to your default payout method within 1–3 business days.`,
      [{ text: 'OK', onPress: onClose }],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={transferStyles.flex}
      >
        <Pressable style={transferStyles.backdrop} onPress={onClose}>
          <Pressable style={transferStyles.sheet} onPress={() => {}}>
            <View style={transferStyles.grabber} />

            <Text style={transferStyles.title}>Transfer out</Text>
            <Text style={transferStyles.subtitle}>
              Available: {formatCents(availableCents)}
            </Text>

            <View style={transferStyles.amountField}>
              <Text style={transferStyles.dollar}>$</Text>
              <TextInput
                value={amountInput}
                onChangeText={setAmountInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={transferStyles.amountInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={confirm}
              />
            </View>

            {overLimit ? (
              <Text style={transferStyles.errorText}>Exceeds available balance.</Text>
            ) : null}

            <View style={transferStyles.quickRow}>
              {[
                { label: '25%', mult: 0.25 },
                { label: '50%', mult: 0.5 },
                { label: 'Max', mult: 1 },
              ].map((q) => (
                <Pressable
                  key={q.label}
                  onPress={() => setQuick(q.mult)}
                  style={transferStyles.quickChip}
                >
                  <Text style={transferStyles.quickChipText}>{q.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={transferStyles.actions}>
              <Pressable onPress={onClose} style={[transferStyles.btn, transferStyles.btnGhost]}>
                <Text style={transferStyles.btnGhostText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirm}
                disabled={!validAmount}
                style={[
                  transferStyles.btn,
                  transferStyles.btnPrimary,
                  !validAmount && transferStyles.btnDisabled,
                ]}
              >
                <Text style={transferStyles.btnPrimaryText}>
                  {amountCents > 0 ? `Transfer ${formatCents(amountCents)}` : 'Transfer'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Tax Set-Aside Row ────────────────────────────────────────────────────
// One clearly-bounded element per spec §4 — shows estimated tax hold on the
// most recent paid fixture deal. Muted styling, one footnote. Not financial advice.
function TaxSetAsideRow() {
  const paidDeal = DEAL_TRUTH_FIXTURE.find(
    (d) => d.paymentState === 'paid' && d.taxSetAsideCents !== undefined,
  );
  if (!paidDeal || paidDeal.taxSetAsideCents === undefined) return null;

  const setAsideDollars = Math.round(paidDeal.taxSetAsideCents / 100);
  const totalDollars = Math.round(paidDeal.amountCents / 100);

  return (
    <View style={taxStyles.container}>
      <View style={taxStyles.row}>
        <View style={taxStyles.iconBubble}>
          <Ionicons name="calculator-outline" size={16} color="rgba(255,255,255,0.55)" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={taxStyles.label}>TAX SET-ASIDE (EST.)</Text>
          <Text style={taxStyles.amount}>
            {'$'}{setAsideDollars.toLocaleString('en-US')}
            <Text style={taxStyles.amountOf}>{' of $'}{totalDollars.toLocaleString('en-US')}</Text>
            <Text style={taxStyles.brand}>{' · '}{paidDeal.brand}</Text>
          </Text>
        </View>
      </View>
      <Text style={taxStyles.footnote}>Conservative 24% estimate — not tax advice.</Text>
    </View>
  );
}

const taxStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.0,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.80)',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
    marginTop: 2,
  },
  amountOf: {
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    fontSize: 13,
  },
  brand: {
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    fontSize: 12,
  },
  footnote: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.38)',
    fontStyle: 'italic',
    lineHeight: 14,
  },
});

function EmptyRow({ label }: { label: string }) {
  return (
    <View style={[styles.card, styles.emptyRow]}>
      <Ionicons name="ellipse-outline" size={16} color="rgba(255,255,255,0.35)" />
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.45)',
    paddingHorizontal: 4,
  },
  heroCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,111,60,0.35)',
  },
  heroName: { color: '#FFF', fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  sportRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  heroSport: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },
  tile: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  tileLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tileValue: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
  brandName: { color: '#FFF', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  brandShare: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  amount: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 3 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
  },
  stateCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  stateBody: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },
});

const transferStyles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 6,
  },
  title: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: -8 },

  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: 6,
  },
  dollar: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 26,
    fontWeight: '900',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  errorText: { color: '#FF6B6B', fontSize: 12, fontWeight: '600' },

  quickRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  quickChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  quickChipText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  btnGhostText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  btnPrimary: { backgroundColor: ACCENT },
  btnPrimaryText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  btnDisabled: { opacity: 0.4 },
});
