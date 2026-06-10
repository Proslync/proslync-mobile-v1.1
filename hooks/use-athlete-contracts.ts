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
 *  3-state visual taxonomy the deals section uses (Active/Pending/Signed). */
export type ActiveContractStatus = 'Active' | 'Pending' | 'Signed';

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

/** Map the 9-state backend `stage` to the section's 3-state pill. The
 *  contract-status column is also considered so a signed-but-not-live
 *  row reads as "Signed" rather than "Pending". */
function statusFromRow(row: ProslyncNilDeal): ActiveContractStatus {
  if (row.contractStatus === 'signed') {
    if (row.stage === 'live' || row.stage === 'delivered') return 'Active';
    return 'Signed';
  }
  if (row.stage === 'live' || row.stage === 'delivered') return 'Active';
  return 'Pending';
}

function formatDueLine(row: ProslyncNilDeal): string {
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
  const brand = brandLabelFromId(row.brandId);
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

// Stages we treat as "active enough to surface on the contracts list".
// Anything pre-commit (open/applied/reviewing) is still in the OFFER
// INBOX view; settled/disputed are historical.
const ACTIVE_CONTRACT_STAGES: ReadonlySet<ProslyncNilDealStage> = new Set([
  'negotiating',
  'committed',
  'live',
  'delivered',
]);

function isActive(view: ActiveContractView): boolean {
  return view.status === 'Active';
}

async function fetchAthleteContracts(athleteId: string): Promise<AthleteContractsView> {
  const envelope = await proslyncNilDealsApi.list({ athleteId, limit: 50 });
  const rows = envelope.data ?? [];
  const visible = rows.filter((r) => ACTIVE_CONTRACT_STAGES.has(r.stage));
  const contracts = visible.map(mapContract);
  return {
    contracts,
    activeCount: contracts.filter(isActive).length,
    totalCount: contracts.length,
  };
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
