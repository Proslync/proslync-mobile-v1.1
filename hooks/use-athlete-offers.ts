// ── ATHLETE OFFER INBOX HOOK ───────────────────────────────
// r6-deals-1 Phase C: React-Query hook backing the OFFER INBOX list
// inside `<AthleteDealsSection />`. Wraps the live `/api/campaigns`
// endpoint (proslync-backend, see `src/routes/campaigns.ts`) via the
// typed `proslyncCampaignsApi` surface in `lib/api/proslync-spines.ts`.
//
// "Offer inbox" = brand-side open campaigns visible to the athlete.
// Campaigns are filtered to `status='open'` so the section only
// surfaces actionable inbound deals (drafts + closed states are
// excluded).
//
// Returns a normalized payload:
//   • offers       — UI-shaped rows (brand fallback label, budget
//                    range string, "received" age cue, fit-score)
//   • offerCount   — convenience count for the hero summary line
//
// NOTE — backend response gap: like `nil_deals`, campaign rows carry
// `brandId` but no brand display name. The hook falls back to a
// derived label ("Brand <id-prefix>") until brand metadata is
// denormalized onto the row. The `matchScore` is also a placeholder
// (60 + hash-based 0-40 spread) until the AI ranking response is
// surfaced per-athlete; it's deterministic per-campaign so the badge
// is stable across renders.

import { useQuery } from '@tanstack/react-query';

import {
  proslyncCampaignsApi,
  type ProslyncCampaign,
} from '@/lib/api/proslync-spines';

export const ATHLETE_OFFERS_KEY = 'athlete-offers';

export interface OfferInboxView {
  id: string;
  brand: string;
  initial: string;
  color: string;
  /** Pre-formatted summary line for the row (title + brief slice). */
  summary: string;
  /** Budget range pre-formatted as a dollar string. */
  amount: string;
  /** Placeholder match-score — see file header note. */
  matchScore: number;
  /** Age cue like "2h ago" / "yesterday" / "Apr 12". */
  received: string;
}

export interface AthleteOffersView {
  offers: OfferInboxView[];
  offerCount: number;
}

// ── Mapping helpers ──────────────────────────────────────

const BRAND_PALETTE = [
  '#0A2342',
  '#004D47',
  '#D0131F',
  '#E11E2B',
  '#00C2A8',
  '#635BFF',
  '#EB621A',
  '#E52321',
];

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function colorForBrand(brandId: string): string {
  return BRAND_PALETTE[hashString(brandId) % BRAND_PALETTE.length]!;
}

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

function formatBudgetRange(minCents: number, maxCents: number): string {
  if (!Number.isFinite(minCents) || !Number.isFinite(maxCents)) return '—';
  const minK = Math.round(minCents / 1000_00); // $1000 units
  const maxK = Math.round(maxCents / 1000_00);
  if (minK === maxK) {
    return minK > 0 ? `$${minK}k flat` : `$${Math.round(maxCents / 100)}`;
  }
  return `$${minK}k – $${maxK}k`;
}

function formatReceived(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function summarizeBrief(title: string, brief: string): string {
  if (brief && brief.length > 0) {
    // Strip markdown punctuation noise and clamp to ~70 chars so the
    // row stays single-line at most screen widths.
    const cleaned = brief.replace(/[#*_>`]/g, '').trim();
    if (cleaned.length === 0) return title;
    return cleaned.length > 70 ? `${cleaned.slice(0, 67)}…` : cleaned;
  }
  return title;
}

/** Deterministic 60–99 score per campaign id. Stable across renders;
 *  swapped out once per-athlete AI ranking lands. */
function placeholderScore(campaignId: string): number {
  const h = hashString(campaignId);
  return 60 + (h % 40);
}

function mapOffer(row: ProslyncCampaign): OfferInboxView {
  // The public campaigns endpoint already returns a real `brandName`
  // (e.g. "EliteGear Athletic", "Gatorade", "Vuori") — prefer it so the
  // offer row never reads "Brand <id>". Fall back to the derived label.
  const brand =
    row.brandName && row.brandName.trim().length > 0
      ? row.brandName.trim()
      : brandLabelFromId(row.brandId);
  return {
    id: row.id,
    brand,
    initial: initialFromBrand(brand),
    color: colorForBrand(row.brandId),
    summary: summarizeBrief(row.title, row.briefMarkdown),
    amount: formatBudgetRange(row.budgetMinCents, row.budgetMaxCents),
    matchScore: placeholderScore(row.id),
    received: formatReceived(row.createdAt),
  };
}

async function fetchAthleteOffers(): Promise<AthleteOffersView> {
  const page = await proslyncCampaignsApi.list({ status: 'open', limit: 50 });
  const rows = page.data ?? [];
  const offers = rows.map(mapOffer);
  return { offers, offerCount: offers.length };
}

export function useAthleteOffers() {
  return useQuery({
    queryKey: [ATHLETE_OFFERS_KEY],
    queryFn: fetchAthleteOffers,
    staleTime: 60_000,
    gcTime: 300_000,
  });
}
