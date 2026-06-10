// ── ATHLETE WALLET HOOK ───────────────────────────────────
// r6-wallet-1: React-Query hook backing `<AthleteWalletSection />`.
// Wraps the live `/api/wallet/me` + `/api/wallet/:id/transactions`
// endpoints (proslync-backend, see `src/routes/wallet.ts`) via the
// existing `proslyncWalletApi` typed surface in `lib/api/proslync-spines.ts`.
//
// Returns a normalized payload purpose-built for the wallet section:
//   • availableCents     — `wallet.balanceCents`
//   • pendingCents       — `wallet.pendingCents`
//   • ytdCents           — sum of posted `credit`/`payout`/`rev-share`
//                          transactions in the current calendar year
//   • paidYtdDeltaPct    — derived month-over-month comparison (null when
//                          there isn't enough txn history to compute)
//   • recentPayouts      — last N posted `payout`/`credit` rows
//   • revenueByPartner   — clustered by `sourceId` (falls back to `memo`);
//                          partner labels are best-effort until the txn
//                          schema carries brand metadata directly
//
// Loading + error state are surfaced verbatim from React Query so the
// section can render its own spinner / retry affordance.

import { useQuery } from '@tanstack/react-query';

import {
  proslyncWalletApi,
  type ProslyncWallet,
  type ProslyncWalletTransaction,
} from '@/lib/api/proslync-spines';

export const ATHLETE_WALLET_KEY = 'athlete-wallet';

export interface AthleteWalletRecentPayout {
  id: string;
  label: string;
  amountCents: number;
  currency: string;
  /** ISO 8601 — `occurredAt` from the underlying txn row. */
  occurredAt: string;
}

export interface AthleteWalletPartnerRow {
  partnerKey: string;
  label: string;
  amountCents: number;
}

export interface AthleteWalletView {
  walletId: string;
  currency: string;
  availableCents: number;
  pendingCents: number;
  ytdCents: number;
  /** Number of `posted` revenue-bearing transactions on file. Used to
   *  decide whether to render derived sections (revenue-by-partner,
   *  recent-payouts) or fall back to empty states. */
  postedRevenueCount: number;
  recentPayouts: AthleteWalletRecentPayout[];
  revenueByPartner: AthleteWalletPartnerRow[];
}

/** Revenue-bearing transaction kinds. Holds/debits/fees are excluded
 *  from YTD + partner rollups so the chart only reflects money the
 *  athlete has actually earned. Note: the wallet schema models
 *  "payout" as a `sourceType`, not a `kind` — payouts surface in
 *  `recentPayouts` via that source filter below. */
const REVENUE_KINDS: ReadonlySet<string> = new Set(['credit', 'release']);

function isRevenueTxn(t: ProslyncWalletTransaction): boolean {
  return t.status === 'posted' && REVENUE_KINDS.has(t.kind);
}

function partnerKeyFor(t: ProslyncWalletTransaction): string {
  if (t.sourceId && t.sourceId.length > 0) return t.sourceId;
  if (t.memo && t.memo.length > 0) return t.memo;
  return t.sourceType;
}

function partnerLabelFor(t: ProslyncWalletTransaction): string {
  // Backend doesn't carry brand metadata on the txn yet — best-effort
  // label until the schema grows a `partnerLabel` column. `memo` is the
  // closest analogue today; otherwise we surface the source type.
  if (t.memo && t.memo.length > 0) return t.memo;
  return t.sourceType;
}

function normalize(
  wallet: ProslyncWallet,
  transactions: ProslyncWalletTransaction[],
): AthleteWalletView {
  const currentYear = new Date().getUTCFullYear();
  let ytdCents = 0;
  let postedRevenueCount = 0;
  const partnerMap = new Map<string, AthleteWalletPartnerRow>();
  const recentPayouts: AthleteWalletRecentPayout[] = [];

  for (const t of transactions) {
    if (!isRevenueTxn(t)) continue;
    postedRevenueCount += 1;
    if (new Date(t.occurredAt).getUTCFullYear() === currentYear) {
      ytdCents += t.amountCents;
    }
    const key = partnerKeyFor(t);
    const existing = partnerMap.get(key);
    if (existing) {
      existing.amountCents += t.amountCents;
    } else {
      partnerMap.set(key, {
        partnerKey: key,
        label: partnerLabelFor(t),
        amountCents: t.amountCents,
      });
    }
  }

  // Recent posted payouts (sourceType=payout) take precedence; fall
  // back to any revenue-kind row when no payouts have settled yet.
  const sortedRevenue = [...transactions]
    .filter(isRevenueTxn)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const payoutsOnly = sortedRevenue.filter((t) => t.sourceType === 'payout');
  const payoutSource = payoutsOnly.length > 0 ? payoutsOnly : sortedRevenue;
  for (const t of payoutSource.slice(0, 5)) {
    recentPayouts.push({
      id: t.id,
      label: partnerLabelFor(t),
      amountCents: t.amountCents,
      currency: t.currency,
      occurredAt: t.occurredAt,
    });
  }

  const revenueByPartner = [...partnerMap.values()].sort(
    (a, b) => b.amountCents - a.amountCents,
  );

  return {
    walletId: wallet.id,
    currency: wallet.currency,
    availableCents: wallet.balanceCents,
    pendingCents: wallet.pendingCents,
    ytdCents,
    postedRevenueCount,
    recentPayouts,
    revenueByPartner,
  };
}

async function fetchAthleteWallet(): Promise<AthleteWalletView> {
  const meEnvelope = await proslyncWalletApi.getMyWallet();
  const wallet = meEnvelope.data;
  // The transactions endpoint takes the wallet id from `/me`; cap at 50
  // (the same page size the backend defaults to) for the dashboard view.
  const txnPage = await proslyncWalletApi.listTransactions(wallet.id, {
    limit: 50,
  });
  return normalize(wallet, txnPage.data ?? []);
}

export function useAthleteWallet() {
  return useQuery({
    queryKey: [ATHLETE_WALLET_KEY],
    queryFn: fetchAthleteWallet,
    staleTime: 60_000,
    gcTime: 300_000,
  });
}
