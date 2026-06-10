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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassButton } from '@/components/glass/glass-button';
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

const STATS_CARD_BG = '#1C1C1E';

// ── Comparable offers CTA (Sprint 2.9) ──
const COMPARABLE_OFFER_TILES: ReadonlyArray<{
  dealId: string;
  brand: string;
  athlete: string;
}> = [
  { dealId: 'd-1', brand: 'Nike · Two-year exclusive', athlete: 'Dylan Harper' },
  { dealId: 'd-2', brand: 'Nike · Two-year exclusive', athlete: 'Ace Bailey' },
  { dealId: 'd-4', brand: 'Nike · Three-year renewal', athlete: 'Kiyan Anthony' },
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

// ── Who has access CTA (Sprint 3.7) ──
const DEMO_ATHLETE_ID = 'a-1';

function WhoHasAccessCta() {
  const router = useStableRouter();
  const { data } = useAthletePermissionGrants(DEMO_ATHLETE_ID);
  const grants = data ?? [];
  const active = grants.filter((g) => g.status === 'active').length;
  const pending = grants.filter((g) => g.status === 'pending').length;

  return (
    <TouchableOpacity
      style={whoHasAccessCtaStyles.card}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Open who has access (${grants.length} grants)`}
      onPress={() => router.push({ pathname: '/athlete/permissions' })}
    >
      <View style={whoHasAccessCtaStyles.headRow}>
        <Ionicons name="key-outline" size={16} color="#00C6B0" />
        <Text style={whoHasAccessCtaStyles.title}>Who has access</Text>
        <View style={whoHasAccessCtaStyles.countPill}>
          <Text style={whoHasAccessCtaStyles.countText}>{grants.length}</Text>
        </View>
      </View>
      <Text style={whoHasAccessCtaStyles.blurb}>
        Roles, individuals, and organizations you&apos;ve granted access to. Coarse-grained
        consent — pause or revoke at any time, full audit trail kept.
      </Text>
      <View style={whoHasAccessCtaStyles.footer}>
        <Text style={whoHasAccessCtaStyles.metaText}>
          {active} active · {pending} pending
        </Text>
        <View style={whoHasAccessCtaStyles.cta}>
          <Text style={whoHasAccessCtaStyles.ctaText}>View grants</Text>
          <Ionicons name="chevron-forward" size={12} color="#00C6B0" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Opportunities CTA (Sprint 2.3) ──
function AthleteOpportunitiesCta() {
  const router = useStableRouter();
  const matchCount = React.useMemo(
    () => getAthleteDiscovery(DEMO_ATHLETE_ID).matched.length,
    [],
  );
  return (
    <TouchableOpacity
      style={opportunitiesCtaStyles.card}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Open opportunities (${matchCount} matched)`}
      onPress={() => router.push({ pathname: '/athlete/opportunities' })}
    >
      <View style={opportunitiesCtaStyles.headRow}>
        <Ionicons name="briefcase-outline" size={16} color="#EB621A" />
        <Text style={opportunitiesCtaStyles.title}>Opportunities</Text>
        <View style={opportunitiesCtaStyles.countPill}>
          <Text style={opportunitiesCtaStyles.countText}>{matchCount}</Text>
        </View>
      </View>
      <Text style={opportunitiesCtaStyles.blurb}>
        Open deals from brands matched to your profile. Apply directly — every applicant goes
        through AI rank + human approval before any commitment.
      </Text>
      <View style={opportunitiesCtaStyles.footer}>
        <Text style={opportunitiesCtaStyles.metaText}>
          {matchCount} matched · synthetic fixture set
        </Text>
        <View style={opportunitiesCtaStyles.cta}>
          <Text style={opportunitiesCtaStyles.ctaText}>Browse</Text>
          <Ionicons name="chevron-forward" size={12} color="#EB621A" />
        </View>
      </View>
    </TouchableOpacity>
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

// ── Section root ────────────────────────────────────────────────

export function AthleteDealsSection() {
  const contractsQuery = useAthleteContracts(DEMO_ATHLETE_ID);
  const offersQuery = useAthleteOffers();

  const activeCount = contractsQuery.data?.activeCount ?? 0;
  const offerCount = offersQuery.data?.offerCount ?? 0;

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
        ? `$${Math.round(ytdTotal / 1000_00)}K`
        : `$${(ytdTotal / 100).toFixed(0)}`;

  return (
    <View style={{ gap: 16 }}>
      {/* Hero — gradient backdrop with KPI + tile grid */}
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
          <View style={heroStyles.heroChevron}>
            <Ionicons name="trending-up" size={14} color="#34C759" />
            <Text style={heroStyles.heroDelta}>+12%</Text>
          </View>
        </View>
        <View style={heroStyles.heroTileRow}>
          <HeroTile icon="checkmark-circle" tint="#34C759" label="ACTIVE" value={String(activeCount)} />
          <View style={heroStyles.heroTileDivider} />
          <HeroTile icon="mail-unread" tint="#EB621A" label="NEW OFFERS" value={String(offerCount)} />
          <View style={heroStyles.heroTileDivider} />
          <HeroTile icon="time" tint="#FFD60A" label="PENDING" value="2" />
        </View>
      </View>

      {/* Comparable offers CTA (Sprint 2.9) — taps into the athlete-side
          comparable-deal evidence packet at `app/athlete/comparables/[dealId]`. */}
      <ComparableOffersCta />

      {/* Who has access CTA (Sprint 3.7) — taps into the athlete consent /
          permission-grant list at `app/athlete/permissions`. */}
      <WhoHasAccessCta />

      {/* Opportunities CTA (Sprint 2.3) — taps into the athlete-side
          OpenDeal discovery surface at `app/athlete/opportunities`. */}
      <AthleteOpportunitiesCta />

      {/* Payout breakdown CTA (W31) — taps into `app/athlete/payouts` for
          the full payout split + suggested tax set-aside. */}
      <AthleteWalletRefreshCta />

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

// ── Hero tile helper ─────────────────────────────────────────────
function HeroTile({
  icon,
  tint,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  value: string;
}) {
  return (
    <View style={heroStyles.heroTile}>
      <View style={[heroStyles.heroTileIcon, { backgroundColor: `${tint}26` }]}>
        <Ionicons name={icon} size={13} color={tint} />
      </View>
      <Text style={heroStyles.heroTileValue}>{value}</Text>
      <Text style={heroStyles.heroTileLabel}>{label}</Text>
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
    d.status === 'Active'
      ? '#34C759'
      : d.status === 'Pending'
        ? '#EB621A'
        : 'rgba(255,255,255,0.85)';
  const statusBg =
    d.status === 'Active'
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
  const matchTint =
    o.matchScore >= 85 ? '#34C759' : o.matchScore >= 70 ? '#EB621A' : '#FFD60A';
  return (
    <View style={dealsStyles.card}>
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
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const heroStyles = StyleSheet.create({
  heroCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(235,98,26,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(235,98,26,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heroAmount: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  heroChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
  heroTileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  heroTileDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 4,
  },
  heroTile: { flex: 1, alignItems: 'center', gap: 4 },
  heroTileIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTileValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  heroTileLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});

const listStyles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.45)',
    paddingHorizontal: 4,
  },
});

const dealsStyles = StyleSheet.create({
  card: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  brandBadgeText: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
  brandName: { color: '#FFF', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  contractLine: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  offerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  offerMetaRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  offerAmount: { color: '#EB621A', fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  offerReceived: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '500' },
  newDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EB621A',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    minWidth: 28,
    textAlign: 'right',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  metaDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 12,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.45)',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.1,
    marginTop: 4,
  },
  matchRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
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
    borderRadius: 16,
    padding: 18,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateBody: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyRow: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12.5,
    fontWeight: '600',
  },
});

const ctaStyles = StyleSheet.create({
  card: {
    gap: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.32)',
    backgroundColor: 'rgba(255,111,60,0.08)',
    padding: 14,
  },
  headRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  title: {
    color: '#EB621A',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  blurb: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  tile: {
    flex: 1,
    gap: 6,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.42)',
    backgroundColor: 'rgba(255,111,60,0.10)',
    padding: 10,
    minHeight: 92,
    justifyContent: 'space-between',
  },
  tileAthlete: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.1,
  },
  tileBrand: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10.5,
    fontWeight: '600',
    lineHeight: 14,
  },
  tileFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  tileCta: {
    color: '#EB621A',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

const whoHasAccessCtaStyles = StyleSheet.create({
  card: {
    gap: 8,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,198,176,0.32)',
    backgroundColor: 'rgba(0,198,176,0.08)',
    padding: 14,
  },
  headRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  title: {
    color: '#00C6B0',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flex: 1,
  },
  countPill: {
    minWidth: 22,
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(0,198,176,0.20)',
  },
  countText: {
    color: '#00C6B0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  blurb: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  metaText: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 11.5,
    fontWeight: '700',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ctaText: {
    color: '#00C6B0',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

const opportunitiesCtaStyles = StyleSheet.create({
  card: {
    gap: 8,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.32)',
    backgroundColor: 'rgba(255,111,60,0.08)',
    padding: 14,
  },
  headRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  title: {
    color: '#EB621A',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flex: 1,
  },
  countPill: {
    minWidth: 22,
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,111,60,0.20)',
  },
  countText: {
    color: '#EB621A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  blurb: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  metaText: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 11.5,
    fontWeight: '700',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ctaText: {
    color: '#EB621A',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});

const walletCtaStyles = StyleSheet.create({
  card: {
    gap: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,214,10,0.32)',
    backgroundColor: 'rgba(255,214,10,0.08)',
    padding: 14,
  },
  headRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  title: {
    color: '#FFD60A',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    flex: 1,
  },
  periodLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  blurb: {
    color: 'rgba(255,214,10,0.92)',
    fontSize: 11.5,
    fontWeight: '700',
    lineHeight: 15,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  metaText: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 11.5,
    fontWeight: '700',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ctaText: {
    color: '#FFD60A',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
