// Athlete Deals section — extracted from athlete-view.tsx for the R5 remix.
// Hosts the four locally-scoped CTAs (ComparableOffers, WhoHasAccess,
// AthleteOpportunities, AthleteWalletRefresh) inline alongside the active
// contracts + offer inbox lists.
//
// r6-deals-1 Phase C: ACTIVE_DEALS + OFFER_INBOX fixtures replaced with
// live data via `useAthleteContracts` (→ /api/nil-deals) and
// `useAthleteOffers` (→ /api/campaigns). Comparable Offers / Who Has
// Access / Opportunities / Payout Breakdown CTAs are intentionally
// untouched and still ride on existing surfaces.
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NotificationSheet } from '@/components/shared/notification-sheet';
import { deriveDealNotifications, type DealNotification } from '@/lib/deal-engine/engine';
import { DEAL_ENGINE_STORAGE_KEY } from '@/lib/data/mock-deal-engine';
import type { EngineDeal } from '@/lib/types/deal-engine.types';
import type { AppNotification } from '@/lib/types/notifications.types';

import { GlassButton } from '@/components/glass/glass-button';
import { useFocusEffect } from 'expo-router';
import { useStableRouter } from '@/hooks/use-stable-router';
import { useAthletePermissionGrants } from '@/hooks/use-permission-grants';
import { useAthletePayouts } from '@/hooks/use-athlete-payouts';
import {
  useAthleteContracts,
  type ActiveContractView,
} from '@/hooks/use-athlete-contracts';
import {
  useAthleteOffers,
  type OfferInboxView,
} from '@/hooks/use-athlete-offers';
import { getAthleteDiscovery } from '@/lib/data/mock-athlete-discovery';
import {
  hoursUntilISO,
  urgencyForDeadline,
} from '@/lib/athlete/truth';
import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';
import type { DealTruth, PaymentState } from '@/lib/athlete/truth';

import {
  ACCENT as TOKEN_ACCENT,
  SURFACE,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  HAIRLINE,
  HAIRLINE_SUBTLE,
  RADIUS_SM,
  RADIUS_CARD,
  RADIUS_LG,
  RADIUS_PILL,
  SP_XS,
  SP_SM,
  SP_MD,
} from '@/components/shared/ui-kit/tokens';

const STATS_CARD_BG = SURFACE;

// ── Comparable offers CTA (Sprint 2.9) ──
// Brand + athlete labels MUST match the deal packet each tile opens
// (getBrandDealDetail(dealId)) so the comp tile never advertises a brand the
// detail contradicts: d-1 = Nike × Dylan Harper, d-2 = Beats × Ace Bailey,
// d-4 = Nike Hoops × Kiyan Anthony (the hero deal, $660K signed).
const COMPARABLE_OFFER_TILES: ReadonlyArray<{
  dealId: string;
  brand: string;
  athlete: string;
}> = [
  { dealId: 'd-1', brand: 'Nike · Two-year exclusive', athlete: 'Dylan Harper' },
  { dealId: 'd-2', brand: 'Beats · Two-year exclusive', athlete: 'Ace Bailey' },
  { dealId: 'd-4', brand: 'Nike Hoops · Three-year renewal', athlete: 'Kiyan Anthony' },
];

function ComparableOffersCta() {
  const router = useStableRouter();
  return (
    <View style={ctaStyles.card}>
      <View style={ctaStyles.headRow}>
        <Ionicons name="trending-up" size={16} color="#EB621A" />
        <Text style={ctaStyles.title}>Comparable offers available</Text>
      </View>
      <Text style={ctaStyles.blurb}>
        See what athletes in your tier accepted for similar deals — anonymized, reviewer-tagged
        evidence you can use to negotiate.
      </Text>
      <View style={ctaStyles.tileRow}>
        {COMPARABLE_OFFER_TILES.map((tile) => (
          <TouchableOpacity
            key={tile.dealId}
            style={ctaStyles.tile}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Open comparable offers for ${tile.athlete}`}
            onPress={() =>
              router.push({
                pathname: '/athlete/comparables/[dealId]',
                params: { dealId: tile.dealId, role: 'player' },
              })
            }
          >
            <Text style={ctaStyles.tileAthlete} numberOfLines={1}>
              {tile.athlete}
            </Text>
            <Text style={ctaStyles.tileBrand} numberOfLines={2}>
              {tile.brand}
            </Text>
            <View style={ctaStyles.tileFooter}>
              <Text style={ctaStyles.tileCta}>View comps</Text>
              <Ionicons name="chevron-forward" size={12} color="#EB621A" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Tools grid (Sprint simplify) ──────────────────────────────────
// Collapses the former navigation-only CTAs — Who has access, Contract
// check, Opportunities, Start a deal — into one compact 2×2 grid of
// tappable tiles. Each tile preserves its original route and live count.
// Neutral tiles; copper reserved for the single primary ("Start a deal").
const DEMO_ATHLETE_ID = 'a-1';

function ToolTile({
  icon,
  label,
  sublabel,
  badge,
  primary,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel: string;
  badge?: string;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[toolsStyles.tile, primary && toolsStyles.tilePrimary]}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${label}${badge ? ` (${badge})` : ''}`}
      onPress={onPress}
    >
      <View style={toolsStyles.tileHead}>
        <Ionicons name={icon} size={18} color={primary ? COPPER : TEXT_PRIMARY} />
        {badge ? (
          <View style={toolsStyles.tileBadge}>
            <Text style={toolsStyles.tileBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={toolsStyles.tileTextWrap}>
        <Text style={[toolsStyles.tileLabel, primary && toolsStyles.tileLabelPrimary]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={toolsStyles.tileSub} numberOfLines={1}>{sublabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

function AthleteToolsGrid() {
  const router = useStableRouter();
  const { data: grantData } = useAthletePermissionGrants(DEMO_ATHLETE_ID);
  const grantCount = grantData?.length ?? 0;
  const matchCount = React.useMemo(
    () => getAthleteDiscovery(DEMO_ATHLETE_ID).matched.length,
    [],
  );

  return (
    <View style={toolsStyles.wrap}>
      <Text style={listStyles.sectionLabel}>TOOLS</Text>
      <View style={toolsStyles.grid}>
        <ToolTile
          icon="add-circle-outline"
          label="Start a deal"
          sublabel="NIL deal engine"
          primary
          onPress={() => router.push('/deal-engine/new')}
        />
        <ToolTile
          icon="briefcase-outline"
          label="Opportunities"
          sublabel={`${matchCount} matched`}
          badge={matchCount > 0 ? String(matchCount) : undefined}
          onPress={() => router.push({ pathname: '/athlete/opportunities' })}
        />
        <ToolTile
          icon="key-outline"
          label="Who has access"
          sublabel="Consent & grants"
          badge={grantCount > 0 ? String(grantCount) : undefined}
          onPress={() => router.push({ pathname: '/athlete/permissions' })}
        />
        <ToolTile
          icon="shield-checkmark-outline"
          label="Contract check"
          sublabel="Scan for red flags"
          onPress={() => router.push('/athlete/contract-scan')}
        />
      </View>
    </View>
  );
}

// ── Wallet refresh CTA (W31) ──
function formatWalletMoney(cents: number): string {
  const dollars = Math.round(cents / 100);
  return `$${dollars.toLocaleString()}`;
}

function AthleteWalletRefreshCta() {
  const router = useStableRouter();
  const { data } = useAthletePayouts(DEMO_ATHLETE_ID);
  const taxPct = data ? (data.suggestedTaxRateBp / 100).toFixed(0) : '24';

  return (
    <TouchableOpacity
      style={walletCtaStyles.card}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Open athlete payouts"
      onPress={() => router.push({ pathname: '/athlete/payouts' })}
    >
      <View style={walletCtaStyles.headRow}>
        <Ionicons name="cash-outline" size={16} color="#FFD60A" />
        <Text style={walletCtaStyles.title}>Payout breakdown</Text>
        <Text style={walletCtaStyles.periodLabel}>
          {data?.period.label ?? 'FY 2025-26'}
        </Text>
      </View>
      {data ? (
        <View style={walletCtaStyles.statsRow}>
          <View style={walletCtaStyles.stat}>
            <Text style={walletCtaStyles.statValue}>
              {formatWalletMoney(data.totals.gross.cents)}
            </Text>
            <Text style={walletCtaStyles.statLabel}>Gross</Text>
          </View>
          <View style={walletCtaStyles.stat}>
            <Text style={[walletCtaStyles.statValue, { color: '#FFD60A' }]}>
              {formatWalletMoney(data.totals.taxSetAside.cents)}
            </Text>
            <Text style={walletCtaStyles.statLabel}>Tax · {taxPct}%</Text>
          </View>
          <View style={walletCtaStyles.stat}>
            <Text style={[walletCtaStyles.statValue, { color: '#00C6B0' }]}>
              {formatWalletMoney(data.totals.net.cents)}
            </Text>
            <Text style={walletCtaStyles.statLabel}>Net</Text>
          </View>
        </View>
      ) : null}
      <Text style={walletCtaStyles.blurb}>
        Set aside ~{taxPct}% for federal + state. This estimate is not tax advice.
      </Text>
      <View style={walletCtaStyles.footer}>
        <Text style={walletCtaStyles.metaText}>
          {data
            ? `${data.items.length} items · paid ${formatWalletMoney(data.totals.paidYtd.cents)} YTD`
            : 'Loading payouts'}
        </Text>
        <View style={walletCtaStyles.cta}>
          <Text style={walletCtaStyles.ctaText}>Open payouts</Text>
          <Ionicons name="chevron-forward" size={12} color="#FFD60A" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Payment Truth Section ─────────────────────────────────────────────────
// Spec §4 — per-deal 3-step payment state indicator: EXPECTED → CSC REVIEW → PAID
// One row per deal. Copper for current state, white-30 for pending, green for paid.
// Tapping any row → /athlete/disclosures (v1 deep-link, sufficient for demo).

const COPPER = TOKEN_ACCENT;
const GREEN_PAID = '#34C759';
const RED_DENIED = '#FF3B30';
const AMBER_DUE = '#FFD60A';

type StepState = 'pending' | 'current' | 'done' | 'denied';

interface PaymentStep {
  label: string;
  state: StepState;
}

function stepsForPaymentState(ps: PaymentState): PaymentStep[] {
  switch (ps) {
    case 'expected':
      return [
        { label: 'EXPECTED', state: 'current' },
        { label: 'CSC REVIEW', state: 'pending' },
        { label: 'PAID', state: 'pending' },
      ];
    case 'in-review':
      return [
        { label: 'EXPECTED', state: 'done' },
        { label: 'CSC REVIEW', state: 'current' },
        { label: 'PAID', state: 'pending' },
      ];
    case 'cleared':
      return [
        { label: 'EXPECTED', state: 'done' },
        { label: 'CSC REVIEW', state: 'done' },
        { label: 'PAID', state: 'current' },
      ];
    case 'paid':
      return [
        { label: 'EXPECTED', state: 'done' },
        { label: 'CSC REVIEW', state: 'done' },
        { label: 'PAID', state: 'done' },
      ];
    default:
      return [
        { label: 'EXPECTED', state: 'pending' },
        { label: 'CSC REVIEW', state: 'pending' },
        { label: 'PAID', state: 'pending' },
      ];
  }
}

function stepDotColor(s: StepState): string {
  if (s === 'done') return GREEN_PAID;
  if (s === 'current') return COPPER;
  if (s === 'denied') return RED_DENIED;
  return 'rgba(255,255,255,0.30)';
}

function PaymentTruthRow({ deal, onPress }: { deal: DealTruth; onPress: () => void }) {
  const router = useStableRouter();
  const steps = stepsForPaymentState(deal.paymentState);

  // Sub-chip: disclosure countdown (if undisclosed)
  let disclosureChip: React.ReactNode = null;
  if (deal.disclosure.state === 'undisclosed' && deal.disclosure.deadlineISO) {
    const hours = hoursUntilISO(deal.disclosure.deadlineISO);
    // Overdue-aware: a past NIL Go deadline must read red, not calm-copper.
    const threshold = urgencyForDeadline(deal.disclosure.deadlineISO);
    const chipColor = threshold === 'red' ? RED_DENIED : threshold === 'amber' ? AMBER_DUE : COPPER;
    const label =
      hours === null ? 'overdue'
        : hours < 24 ? `${Math.floor(hours)}h to report`
        : `${Math.floor(hours / 24)}d to report`;
    disclosureChip = (
      <View style={ptStyles.subChip}>
        <Ionicons name="time-outline" size={10} color={chipColor} />
        <Text style={[ptStyles.subChipText, { color: chipColor }]}>{label}</Text>
      </View>
    );
  }

  // Sub-chip: upcoming undone deliverable (amber/red if <72h)
  let deliverableChip: React.ReactNode = null;
  const nextDel = deal.deliverables
    .filter((d) => !d.done)
    .sort((a, b) => a.dueISO.localeCompare(b.dueISO))[0];
  if (nextDel && !disclosureChip) {
    const hours = hoursUntilISO(nextDel.dueISO);
    // Overdue-aware: an overdue deliverable must surface as red — previously
    // thresholdForHours(null) returned green, so the chip was silently dropped.
    const threshold = urgencyForDeadline(nextDel.dueISO);
    if (threshold === 'amber' || threshold === 'red') {
      const chipColor = threshold === 'red' ? RED_DENIED : AMBER_DUE;
      const label =
        hours !== null && hours < 24
          ? `${Math.floor(hours)}h · ${nextDel.label}`
          : hours !== null
            ? `${Math.floor(hours / 24)}d · ${nextDel.label}`
            : `overdue · ${nextDel.label}`;
      deliverableChip = (
        <View style={ptStyles.subChip}>
          <Ionicons name="calendar-outline" size={10} color={chipColor} />
          <Text style={[ptStyles.subChipText, { color: chipColor }]}>{label}</Text>
        </View>
      );
    }
  }

  // NUDGE PAYER chip: shown when payment is expected/cleared and no urgency sub-chip
  const showNudge =
    (deal.paymentState === 'expected' || deal.paymentState === 'cleared') &&
    !disclosureChip &&
    !deliverableChip;

  return (
    <Pressable
      style={ptStyles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${deal.brand} — ${deal.paymentState}`}
    >
      <View style={ptStyles.rowTop}>
        <View style={{ flex: 1 }}>
          <Text style={ptStyles.brandName} numberOfLines={1}>{deal.brand}</Text>
          <Text style={ptStyles.titleLine} numberOfLines={1}>{deal.title}</Text>
        </View>
        <View style={ptStyles.stepsRow}>
          {steps.map((step, i) => (
            <View key={step.label} style={ptStyles.stepCell}>
              <View style={[ptStyles.stepDot, { backgroundColor: stepDotColor(step.state) }]} />
              <Text style={[ptStyles.stepLabel, step.state === 'current' && ptStyles.stepLabelActive]}>
                {step.label}
              </Text>
              {i < steps.length - 1 ? (
                <View style={ptStyles.stepConnector} />
              ) : null}
            </View>
          ))}
        </View>
      </View>
      {(disclosureChip ?? deliverableChip) ? (
        <View style={ptStyles.subRow}>
          {disclosureChip}
          {deliverableChip}
        </View>
      ) : null}
      {showNudge ? (
        <View style={ptStyles.subRow}>
          <Pressable
            style={ptStyles.nudgeChip}
            onPress={() => router.push('/athlete/disclosures')}
            accessibilityRole="button"
            accessibilityLabel="Nudge payer"
          >
            <Text style={ptStyles.nudgeText}>NUDGE PAYER</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

function PaymentTruthSection() {
  const router = useStableRouter();
  const deals = DEAL_TRUTH_FIXTURE;
  if (deals.length === 0) return null;
  return (
    <View style={ptStyles.section}>
      {/* Lower-third header: 4px copper left bar + caps label (spec §4) */}
      <View style={ptStyles.sectionHeader}>
        <View style={ptStyles.sectionBar} />
        <Text style={ptStyles.sectionLabel}>PAYMENT TRUTH</Text>
      </View>
      <View style={ptStyles.rows}>
        {deals.map((deal) => (
          <PaymentTruthRow
            key={deal.dealId}
            deal={deal}
            onPress={() => router.push('/athlete/disclosures')}
          />
        ))}
      </View>
    </View>
  );
}

const ptStyles = StyleSheet.create({
  section: {
    gap: SP_SM,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_SM,
  },
  sectionBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: COPPER,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: TEXT_SECONDARY,
    flex: 1,
  },
  rows: {
    gap: SP_SM,
  },
  row: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: RADIUS_CARD,
    padding: SP_MD,
    gap: SP_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE_SUBTLE,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_SM,
  },
  brandName: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  titleLine: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  stepCell: {
    alignItems: 'center',
    gap: 3,
    position: 'relative',
    paddingHorizontal: SP_XS,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepLabel: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.30)',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: COPPER,
  },
  stepConnector: {
    position: 'absolute',
    top: 4,
    right: -4,
    width: 8,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  subRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_XS,
    paddingHorizontal: SP_SM,
    paddingVertical: SP_XS,
    borderRadius: RADIUS_SM,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  subChipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  nudgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP_SM,
    paddingVertical: SP_XS,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COPPER}66`,
    backgroundColor: 'rgba(235,98,26,0.08)',
    minHeight: 28,
  },
  nudgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: COPPER,
  },
});

// ── Deal notifications hook ──────────────────────────────────────

const NOTIF_SEEN_KEY = 'proslync:deal-engine:notifSeen:v1';
const DANGER_COLOR = '#FF453A';

function useDealNotifications() {
  const [notifItems, setNotifItems] = React.useState<AppNotification[]>([]);
  const [seenAt, setSeenAt] = React.useState<string | null>(null);

  async function load() {
    try {
      const [raw, seenRaw] = await Promise.all([
        AsyncStorage.getItem(DEAL_ENGINE_STORAGE_KEY),
        AsyncStorage.getItem(NOTIF_SEEN_KEY),
      ]);
      const deals: EngineDeal[] = raw ? JSON.parse(raw) : [];
      const now = new Date().toISOString();
      const notifs: DealNotification[] = deriveDealNotifications(deals, now);
      const mapped: AppNotification[] = notifs.map((n, i) => ({
        id: 98_000 + i,
        type: 'payment' as const,
        title: n.title,
        body: n.body,
        read: seenRaw ? n.atISO <= seenRaw : false,
        metadata: { dealId: n.dealId, kind: n.kind },
        createdAt: n.atISO,
      }));
      setNotifItems(mapped);
      setSeenAt(seenRaw);
    } catch (_) {}
  }

  useFocusEffect(React.useCallback(() => {
    load();
  }, []));

  const unreadCount = notifItems.filter((n) => !n.read).length;

  async function markSeen() {
    const now = new Date().toISOString();
    setSeenAt(now);
    setNotifItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await AsyncStorage.setItem(NOTIF_SEEN_KEY, now);
    await load();
  }

  return { notifItems, unreadCount, markSeen };
}

// ── Section root ────────────────────────────────────────────────

export function AthleteDealsSection() {
  const contractsQuery = useAthleteContracts(DEMO_ATHLETE_ID);
  const offersQuery = useAthleteOffers();
  const payoutsQuery = useAthletePayouts(DEMO_ATHLETE_ID);

  // Computed deck-top totals — sum live contract values for the hero KPI.
  const ytdTotal = React.useMemo(() => {
    const items = contractsQuery.data?.contracts ?? [];
    let cents = 0;
    for (const c of items) {
      const m = c.amount.replace(/[^0-9.]/g, '');
      const num = parseFloat(m);
      if (Number.isFinite(num)) cents += Math.round(num * 100);
    }
    return cents;
  }, [contractsQuery.data]);

  const ytdDisplay =
    ytdTotal >= 100000_00
      ? `$${(ytdTotal / 100000_00).toFixed(1)}M`
      : ytdTotal >= 1000_00
        ? `$${(ytdTotal / 1000_00).toFixed(1).replace(/\.0$/, '')}K`
        : `$${(ytdTotal / 100).toFixed(0)}`;

  // Derived delta — the share of YTD deal value already paid out (settled
  // / booked). Replaces the old hardcoded "+12%" that sat next to a $0; this
  // reconciles with the same paid total Home + Wallet + the payout breakdown
  // show. Null until both numbers are known so we never flash a bogus figure.
  const paidYtdCents = payoutsQuery.data?.totals.paidYtd.cents ?? 0;
  const paidSharePct =
    ytdTotal > 0 ? Math.round((paidYtdCents / ytdTotal) * 100) : null;

  return (
    <View style={{ gap: 16 }}>
      {/* Payment Truth — per-deal 3-step state (spec §4 thin truth layer) */}
      <PaymentTruthSection />

      {/* Hero — gradient backdrop with the YTD deal-value KPI */}
      <View style={heroStyles.heroCard}>
        <LinearGradient
          colors={['rgba(235,98,26,0.32)', 'rgba(235,98,26,0.06)', 'rgba(0,0,0,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={heroStyles.heroHeader}>
          <View style={heroStyles.heroIconBubble}>
            <Ionicons name="briefcase" size={20} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={heroStyles.heroEyebrow}>YTD DEAL VALUE</Text>
            <Text style={heroStyles.heroAmount}>{ytdDisplay}</Text>
          </View>
          {paidSharePct !== null && paidSharePct > 0 ? (
            <View style={heroStyles.heroChevron}>
              <Ionicons name="checkmark-circle" size={14} color="#34C759" />
              <Text style={heroStyles.heroDelta}>{paidSharePct}% paid</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Comparable offers CTA (Sprint 2.9) — taps into the athlete-side
          comparable-deal evidence packet at `app/athlete/comparables/[dealId]`. */}
      <ComparableOffersCta />

      {/* Payout breakdown CTA (W31) — taps into `app/athlete/payouts` for
          the full payout split + suggested tax set-aside. */}
      <AthleteWalletRefreshCta />

      {/* Tools — compact 2×2 grid that folds the former navigation-only CTAs
          (Start a deal → /deal-engine/new, Opportunities → /athlete/opportunities,
          Who has access → /athlete/permissions, Contract check →
          /athlete/contract-scan), each preserving its route + live count. */}
      <AthleteToolsGrid />

      {/* Active Contracts section (r6-deals-1 Phase C — /api/nil-deals) */}
      <View style={{ gap: 10 }}>
        <Text style={listStyles.sectionLabel}>ACTIVE CONTRACTS</Text>
        <ContractsList query={contractsQuery} />
      </View>

      {/* Offer Inbox section (r6-deals-1 Phase C — /api/campaigns) */}
      <View style={{ gap: 10 }}>
        <Text style={listStyles.sectionLabel}>OFFER INBOX</Text>
        <OffersList query={offersQuery} />
      </View>

    </View>
  );
}

// ── Contracts list (loading/error/empty/populated) ──────────────

type ContractsQueryReturn = ReturnType<typeof useAthleteContracts>;

function ContractsList({ query }: { query: ContractsQueryReturn }) {
  const { data, isLoading, isError, refetch, isRefetching } = query;

  if (isLoading && !data) {
    return (
      <View style={dealsStyles.stateCard}>
        <ActivityIndicator color="#EB621A" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={dealsStyles.stateCard}>
        <Ionicons name="cloud-offline-outline" size={26} color="rgba(255,255,255,0.55)" />
        <Text style={dealsStyles.stateBody}>
          Couldn't load contracts. Pull to retry, or tap below.
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

  if (data.contracts.length === 0) {
    return (
      <View style={dealsStyles.emptyRow}>
        <Text style={dealsStyles.emptyText}>No active contracts yet</Text>
      </View>
    );
  }

  return (
    <>
      {data.contracts.map((d) => (
        <ContractRow key={d.id} d={d} />
      ))}
    </>
  );
}

function ContractRow({ d }: { d: ActiveContractView }) {
  const statusColor =
    d.status === 'Active' || d.status === 'Paid'
      ? '#34C759'
      : d.status === 'Pending'
        ? '#EB621A'
        : 'rgba(255,255,255,0.85)';
  const statusBg =
    d.status === 'Active' || d.status === 'Paid'
      ? 'rgba(52,199,89,0.16)'
      : d.status === 'Pending'
        ? 'rgba(255,111,60,0.16)'
        : 'rgba(255,255,255,0.06)';
  // Deterministic progress per contract id — looks alive without backend support yet.
  const seed = d.id
    .split('')
    .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) % 1000, 7);
  const progress = 35 + (seed % 55); // 35-89%
  return (
    <View style={dealsStyles.card}>
      <View style={[dealsStyles.accentStripe, { backgroundColor: d.color }]} />
      <View style={dealsStyles.cardInner}>
        <View style={dealsStyles.cardTop}>
          <View style={[dealsStyles.brandBadge, { backgroundColor: d.color }]}>
            <Text style={dealsStyles.brandBadgeText}>{d.initial}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={dealsStyles.brandName}>{d.brand}</Text>
            <Text style={dealsStyles.contractLine}>{d.contract}</Text>
          </View>
          <View style={[dealsStyles.statusPill, { backgroundColor: statusBg }]}>
            <View style={[dealsStyles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[dealsStyles.statusText, { color: statusColor }]}>
              {d.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Progress bar — deliverables / payouts completed */}
        <View style={dealsStyles.progressRow}>
          <View style={dealsStyles.progressTrack}>
            <LinearGradient
              colors={[d.color, '#FFD60A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[dealsStyles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={dealsStyles.progressLabel}>{progress}%</Text>
        </View>

        <View style={dealsStyles.metaRow}>
          <View style={{ flex: 1 }}>
            <Text style={dealsStyles.metaLabel}>VALUE</Text>
            <Text style={dealsStyles.metaValue}>{d.amount}</Text>
          </View>
          <View style={dealsStyles.metaDivider} />
          <View style={{ flex: 1 }}>
            <Text style={dealsStyles.metaLabel}>NEXT</Text>
            <Text style={dealsStyles.metaValue}>{d.due}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Offers list (loading/error/empty/populated) ─────────────────

type OffersQueryReturn = ReturnType<typeof useAthleteOffers>;

function OffersList({ query }: { query: OffersQueryReturn }) {
  const { data, isLoading, isError, refetch, isRefetching } = query;

  if (isLoading && !data) {
    return (
      <View style={dealsStyles.stateCard}>
        <ActivityIndicator color="#EB621A" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={dealsStyles.stateCard}>
        <Ionicons name="cloud-offline-outline" size={26} color="rgba(255,255,255,0.55)" />
        <Text style={dealsStyles.stateBody}>
          Couldn't load offers. Pull to retry, or tap below.
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

  if (data.offers.length === 0) {
    return (
      <View style={dealsStyles.emptyRow}>
        <Text style={dealsStyles.emptyText}>No new offers right now</Text>
      </View>
    );
  }

  return (
    <>
      {data.offers.map((o) => (
        <OfferRow key={o.id} o={o} />
      ))}
    </>
  );
}

function OfferRow({ o }: { o: OfferInboxView }) {
  const router = useStableRouter();
  const matchTint =
    o.matchScore >= 85 ? '#34C759' : o.matchScore >= 70 ? '#EB621A' : '#FFD60A';
  return (
    <TouchableOpacity
      style={dealsStyles.card}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Open ${o.brand} offer — ${o.amount}, ${o.matchScore} match`}
      onPress={() =>
        router.push({
          pathname: '/athlete/comparables/[dealId]',
          // Pass the row's brand + amount so the detail header matches the
          // row even when the open campaign has no comparable-evidence
          // packet yet (no contradictory brand/amount on the detail).
          params: { dealId: o.id, role: 'player', brand: o.brand, amount: o.amount },
        })
      }
    >
      <View style={[dealsStyles.accentStripe, { backgroundColor: o.color }]} />
      <View style={dealsStyles.cardInner}>
        <View style={dealsStyles.cardTop}>
          <View style={[dealsStyles.brandBadge, { backgroundColor: o.color }]}>
            <Text style={dealsStyles.brandBadgeText}>{o.initial}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={dealsStyles.offerHeaderRow}>
              <Text style={dealsStyles.brandName}>{o.brand}</Text>
              <View style={dealsStyles.newDot} />
            </View>
            <Text style={dealsStyles.contractLine}>{o.summary}</Text>
            <View style={dealsStyles.offerMetaRow}>
              <Text style={dealsStyles.offerAmount}>{o.amount}</Text>
              <Text style={dealsStyles.offerReceived}>· {o.received}</Text>
            </View>
          </View>
          <View
            style={[
              dealsStyles.matchRing,
              { borderColor: `${matchTint}66`, backgroundColor: `${matchTint}1A` },
            ]}
          >
            <Text style={[dealsStyles.matchScore, { color: matchTint }]}>{o.matchScore}</Text>
            <Text style={[dealsStyles.matchLabel, { color: matchTint }]}>MATCH</Text>
          </View>
        </View>
        <View style={dealsStyles.offerCtaRow}>
          <Text style={dealsStyles.offerCtaText}>View comparable offers</Text>
          <Ionicons name="chevron-forward" size={13} color="#EB621A" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const heroStyles = StyleSheet.create({
  heroCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: RADIUS_LG,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE_SUBTLE,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconBubble: {
    width: 42,
    height: 42,
    borderRadius: RADIUS_CARD,
    backgroundColor: 'rgba(235,98,26,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(235,98,26,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    color: TEXT_SECONDARY,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heroAmount: {
    color: TEXT_PRIMARY,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  heroChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_XS,
    paddingHorizontal: SP_SM,
    paddingVertical: SP_XS,
    borderRadius: RADIUS_SM,
    backgroundColor: 'rgba(52,199,89,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(52,199,89,0.4)',
  },
  heroDelta: {
    color: '#34C759',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});

// ── Tools grid styles ──
const toolsStyles = StyleSheet.create({
  wrap: { gap: 10 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SP_SM,
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    minHeight: 78,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    backgroundColor: SURFACE,
    padding: SP_MD,
    justifyContent: 'space-between',
    gap: SP_SM,
  },
  tilePrimary: {
    borderColor: `${COPPER}66`,
    backgroundColor: 'rgba(235,98,26,0.08)',
  },
  tileHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileBadge: {
    minWidth: 20,
    alignItems: 'center',
    paddingHorizontal: SP_XS,
    paddingVertical: 1,
    borderRadius: RADIUS_PILL,
    backgroundColor: SURFACE_RAISED,
  },
  tileBadgeText: {
    color: TEXT_PRIMARY,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
    fontVariant: ['tabular-nums'],
  },
  tileTextWrap: { gap: 1 },
  tileLabel: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  tileLabelPrimary: { color: COPPER },
  tileSub: {
    color: TEXT_TERTIARY,
    fontSize: 11,
    fontWeight: '600',
  },
});

const listStyles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: TEXT_TERTIARY,
    paddingHorizontal: SP_XS,
  },
});

const dealsStyles = StyleSheet.create({
  card: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: RADIUS_LG,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE_SUBTLE,
  },
  accentStripe: {
    width: 4,
    alignSelf: 'stretch',
  },
  cardInner: {
    flex: 1,
    padding: 14,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: RADIUS_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  brandBadgeText: { color: TEXT_PRIMARY, fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
  brandName: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  contractLine: { color: TEXT_SECONDARY, fontSize: 12 },
  offerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  offerMetaRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: SP_XS },
  offerAmount: { color: TEXT_PRIMARY, fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  offerReceived: { color: TEXT_TERTIARY, fontSize: 11, fontWeight: '500' },
  offerCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: SP_SM,
  },
  offerCtaText: { color: '#EB621A', fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  newDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COPPER,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_XS,
    paddingHorizontal: SP_SM,
    paddingVertical: SP_XS,
    borderRadius: RADIUS_SM,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: SP_SM },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: {
    color: TEXT_SECONDARY,
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    minWidth: 28,
    textAlign: 'right',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingTop: SP_SM,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE_SUBTLE,
  },
  metaDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: HAIRLINE,
    marginHorizontal: 12,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: TEXT_TERTIARY,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: -0.1,
    marginTop: SP_XS,
  },
  matchRing: {
    width: 54,
    height: 54,
    borderRadius: RADIUS_PILL,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  matchLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: -2 },
  matchScore: {
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  stateCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: RADIUS_LG,
    padding: RADIUS_LG,
    gap: SP_SM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateBody: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyRow: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: RADIUS_CARD,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  emptyText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: '600',
  },
});

const ctaStyles = StyleSheet.create({
  card: {
    gap: SP_SM,
    borderRadius: RADIUS_LG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    backgroundColor: SURFACE,
    padding: 14,
  },
  headRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SP_SM,
  },
  title: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  blurb: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  tileRow: {
    flexDirection: 'row',
    gap: SP_SM,
    marginTop: 2,
  },
  tile: {
    flex: 1,
    gap: 6,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    backgroundColor: SURFACE_RAISED,
    padding: SP_SM,
    minHeight: 92,
    justifyContent: 'space-between',
  },
  tileAthlete: {
    color: TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.1,
  },
  tileBrand: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  tileFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  tileCta: {
    color: COPPER,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

const dealsBellStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.45)',
  },
  bellBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: DANGER_COLOR,
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellDotText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF',
  },
});

const walletCtaStyles = StyleSheet.create({
  card: {
    gap: SP_SM,
    borderRadius: RADIUS_LG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    backgroundColor: SURFACE,
    padding: 14,
  },
  headRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SP_SM,
  },
  title: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flex: 1,
  },
  periodLabel: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SP_SM,
    marginTop: 2,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: TEXT_SECONDARY,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  blurb: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  metaText: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '700',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ctaText: {
    color: '#FFD60A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

