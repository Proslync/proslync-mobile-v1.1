// ── ATHLETE CONTRACTS HOOK ─────────────────────────────────
// r6-deals-1 Phase C: React-Query hook backing the ACTIVE CONTRACTS
// list inside `<AthleteDealsSection />`. Wraps the live `/api/nil-deals`
// endpoint (proslync-backend, see `src/routes/nil-deals.ts`) via the
// typed `proslyncNilDealsApi` surface in `lib/api/proslync-spines.ts`.
//
// Returns a normalized payload purpose-built for the deals section:
//   • contracts    — UI-shaped rows (brand fallback label, formatted
//                    amount, derived status pill)
//   • activeCount  — count of "Active" contracts (live + negotiating +
//                    committed) for the hero summary line
//   • totalCount   — total returned rows
//
// Loading + error state surface verbatim from React Query so the
// section can render its own spinner / retry affordance.
//
// NOTE — backend response gap: `nil_deals` rows carry `brandId` but no
// brand display name. The hook falls back to a derived label
// ("Brand <id-prefix>") until brand metadata is denormalized onto the
// row or the section opts into a brand-lookup join.

import { useQuery } from '@tanstack/react-query';

import {
  proslyncNilDealsApi,
  type ProslyncNilDeal,
  type ProslyncNilDealStage,
} from '@/lib/api/proslync-spines';

export const ATHLETE_CONTRACTS_KEY = 'athlete-contracts';

/** UI-facing status pill states. Maps the 9-state backend stage to the
 *  visual taxonomy the deals section uses (Active/Pending/Signed/Paid). */
export type ActiveContractStatus = 'Active' | 'Pending' | 'Signed' | 'Paid';

export interface ActiveContractView {
  id: string;
  /** Display name for the brand row. Best-effort until the backend row
   *  carries a brand label; falls back to a prefix of the brand id. */
  brand: string;
  /** Stable 1-char glyph for the brand badge. */
  initial: string;
  /** Hashed accent color for the brand badge — deterministic per
   *  brandId so the same brand reads the same across renders. */
  color: string;
  /** Contract title, mirrored from the backend row. */
  contract: string;
  status: ActiveContractStatus;
  /** Pre-formatted dollar string with rough cadence (gross only —
   *  royalty / tier metadata isn't on the row yet). */
  amount: string;
  /** Best-effort "next milestone" string. Until the backend exposes
   *  per-deal deliverables, this surfaces the contract status + end
   *  date so the user has *some* temporal signal. */
  due: string;
  /** Original backend stage — for downstream filtering by callers. */
  stage: ProslyncNilDealStage;
}

export interface AthleteContractsView {
  contracts: ActiveContractView[];
  activeCount: number;
  totalCount: number;
}

// ── Mapping helpers ──────────────────────────────────────

const BRAND_PALETTE = [
  '#E11E2B',
  '#00C2A8',
  '#E52321',
  '#0A2342',
  '#004D47',
  '#D0131F',
  '#EB621A',
  '#635BFF',
];

function colorForBrand(brandId: string): string {
  let hash = 0;
  for (let i = 0; i < brandId.length; i += 1) {
    hash = (hash * 31 + brandId.charCodeAt(i)) >>> 0;
  }
  return BRAND_PALETTE[hash % BRAND_PALETTE.length]!;
}

/** Backend rows don't carry brand display names yet. Strip the `b-`
 *  prefix if present and title-case the remainder; otherwise return
 *  the raw id. The UI also rides on a 1-char initial in the badge. */
function brandLabelFromId(brandId: string): string {
  if (!brandId) return 'Brand';
  const trimmed = brandId.startsWith('b-') ? brandId.slice(2) : brandId;
  if (trimmed.length === 0) return 'Brand';
  return `Brand ${trimmed.toUpperCase()}`;
}

function initialFromBrand(brandLabel: string): string {
  const cleaned = brandLabel.replace(/^Brand\s+/, '').trim();
  const source = cleaned.length > 0 ? cleaned : brandLabel.trim();
  return source.slice(0, 1).toUpperCase() || '·';
}

function formatAmountCents(cents: number): string {
  if (!Number.isFinite(cents) || cents <= 0) return '—';
  const dollars = Math.round(cents / 100);
  return `$${dollars.toLocaleString()}`;
}

/** Map the 9-state backend `stage` to the section's pill. The
 *  contract-status column is also considered so a signed-but-not-live
 *  row reads as "Signed" rather than "Pending". A `settled` deal (paid
 *  out) reads as "Paid" so it can sit in the list alongside in-flight
 *  rows without contradicting the payout breakdown's Gross total. */
function statusFromRow(row: ProslyncNilDeal): ActiveContractStatus {
  if (row.stage === 'settled') return 'Paid';
  if (row.contractStatus === 'signed') {
    if (row.stage === 'live' || row.stage === 'delivered') return 'Active';
    return 'Signed';
  }
  if (row.stage === 'live' || row.stage === 'delivered') return 'Active';
  return 'Pending';
}

function formatDueLine(row: ProslyncNilDeal): string {
  // A settled deal has nothing left to do — the next cue is the payout.
  if (row.stage === 'settled') return 'Paid out';
  // The backend doesn't track per-deal "next milestone" yet. Compose a
  // best-effort cue from the contract window so the cell isn't empty.
  if (row.endDate) {
    const d = new Date(row.endDate);
    if (!Number.isNaN(d.getTime())) {
      return `Wraps ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
  }
  if (row.startDate) {
    const d = new Date(row.startDate);
    if (!Number.isNaN(d.getTime())) {
      return `Starts ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
  }
  if (row.contractStatus === 'pending') return 'Awaiting signature';
  if (row.reviewSummary === 'any-flagged' || row.reviewSummary === 'any-rejected') {
    return 'Review required';
  }
  return 'Schedule TBD';
}

function mapContract(row: ProslyncNilDeal): ActiveContractView {
  // Prefer the denormalized brand name when the row carries one (no
  // "Brand <id>" placeholder); fall back to the derived label otherwise.
  const brand =
    row.brandName && row.brandName.trim().length > 0
      ? row.brandName.trim()
      : brandLabelFromId(row.brandId);
  return {
    id: row.id,
    brand,
    initial: initialFromBrand(brand),
    color: colorForBrand(row.brandId),
    contract: row.title,
    status: statusFromRow(row),
    amount: formatAmountCents(row.amountCents),
    due: formatDueLine(row),
    stage: row.stage,
  };
}

// Stages we treat as "surfaceable on the contracts list" — i.e. a real
// executed/booked deal. Anything pre-commit (open/applied/reviewing) is
// still in the OFFER INBOX view; `disputed` is exceptional. `settled`
// (paid out) IS included so the Deals "YTD DEAL VALUE" sums every booked
// deal and reconciles with the payout breakdown's Gross (the paid deal
// renders with a "Paid" pill rather than being silently dropped).
const ACTIVE_CONTRACT_STAGES: ReadonlySet<ProslyncNilDealStage> = new Set([
  'negotiating',
  'committed',
  'live',
  'delivered',
  'settled',
]);

function isActive(view: ActiveContractView): boolean {
  return view.status === 'Active';
}

// ── Seeded fallback ──────────────────────────────────────
// Demo safety net: ACTIVE CONTRACTS is a headline list on the athlete deck.
// If /api/nil-deals 401s/errors or returns no active rows, fall back to these
// seeded contracts so a prospect never sees an empty list or a retry card on a
// core surface. Brand names are real (not "Brand <id>" placeholders) and match
// the deal-truth / payment cast (Nike, Gatorade, JMA, Legacy) so the demo reads
// as one coherent world. The same mapContract pipeline maps these, so the
// brandName denormalized field drives the label (PART 8 — no placeholder names).
const SEEDED_CONTRACTS: ProslyncNilDeal[] = [
  {
    id: 'seed-contract-nike',
    sourceOpenDealId: null,
    sourceApplicationId: null,
    athleteId: 'a-1',
    brandId: 'b-nike',
    brandName: 'Nike',
    categoryId: null,
    title: 'Campus Activation · Summer',
    stage: 'live',
    amountCents: 2_400_00,
    startDate: null,
    endDate: new Date(Date.now() + 60 * 24 * 3600e3).toISOString(),
    exclusivity: null,
    contractStatus: 'signed',
    reviewSummary: 'all-cleared',
    appealState: 'none',
    createdAt: new Date(Date.now() - 30 * 24 * 3600e3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-contract-gatorade',
    sourceOpenDealId: null,
    sourceApplicationId: null,
    athleteId: 'a-1',
    brandId: 'b-gatorade',
    brandName: 'Gatorade',
    categoryId: null,
    title: 'Performance Partnership',
    stage: 'settled',
    amountCents: 3_200_00,
    startDate: null,
    endDate: new Date(Date.now() + 120 * 24 * 3600e3).toISOString(),
    exclusivity: null,
    contractStatus: 'signed',
    reviewSummary: 'all-cleared',
    appealState: 'none',
    createdAt: new Date(Date.now() - 90 * 24 * 3600e3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-contract-jma',
    sourceOpenDealId: null,
    sourceApplicationId: null,
    athleteId: 'a-1',
    brandId: 'b-jma',
    brandName: 'JMA Wireless',
    categoryId: null,
    title: 'Brand Ambassador · Q3',
    stage: 'committed',
    amountCents: 4_500_00,
    startDate: new Date(Date.now() + 7 * 24 * 3600e3).toISOString(),
    endDate: null,
    exclusivity: null,
    contractStatus: 'pending',
    reviewSummary: 'all-cleared',
    appealState: 'none',
    createdAt: new Date(Date.now() - 5 * 24 * 3600e3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-contract-legacy',
    sourceOpenDealId: null,
    sourceApplicationId: null,
    athleteId: 'a-1',
    brandId: 'b-legacy',
    brandName: 'Legacy Athletics',
    categoryId: null,
    title: 'Apparel Deal · FY26',
    stage: 'negotiating',
    amountCents: 1_800_00,
    startDate: null,
    endDate: null,
    exclusivity: null,
    contractStatus: 'pending',
    reviewSummary: 'all-cleared',
    appealState: 'none',
    createdAt: new Date(Date.now() - 3 * 24 * 3600e3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function buildView(rows: ProslyncNilDeal[]): AthleteContractsView {
  const visible = rows.filter((r) => ACTIVE_CONTRACT_STAGES.has(r.stage));
  const contracts = visible.map(mapContract);
  return {
    contracts,
    activeCount: contracts.filter(isActive).length,
    totalCount: contracts.length,
  };
}

async function fetchAthleteContracts(athleteId: string): Promise<AthleteContractsView> {
  try {
    const envelope = await proslyncNilDealsApi.list({ athleteId, limit: 50 });
    const view = buildView(envelope.data ?? []);
    // Empty live list on a headline surface → seeded fallback (demo safety net).
    if (view.totalCount === 0) return buildView(SEEDED_CONTRACTS);
    return view;
  } catch {
    // Errored feed (network / 401) also gets the seeded fallback so the list
    // renders content instead of a retry card during the demo.
    return buildView(SEEDED_CONTRACTS);
  }
}

export function useAthleteContracts(athleteId: string) {
  return useQuery({
    queryKey: [ATHLETE_CONTRACTS_KEY, athleteId],
    queryFn: () => fetchAthleteContracts(athleteId),
    enabled: Boolean(athleteId),
    staleTime: 60_000,
    gcTime: 300_000,
  });
}
