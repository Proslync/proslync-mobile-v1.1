// ── PROSLYNC BRAND HQ API ORCHESTRATOR ────────────────────
// PLAN.md §2 "brand-first reorient" wire-up. Fans out across the live
// proslync-backend (localhost:3020 by default, configurable via
// EXPO_PUBLIC_PROSLYNC_PRO_API_BASE_URL) to assemble the snapshot the
// Brand HQ view renders.
//
// Surfaces hit:
//   GET /api/brands                            → directory list (auth)
//   GET /api/brands  → filter client-side      → single brand profile
//   GET /api/campaigns?brandId=<id>            → this brand's open deals
//   GET /api/campaigns/:id/applications        → applicants per campaign
//   GET /api/deals                             → cross-filter brandId
//   GET /api/deals/:id/evidence                → evidence packet (last 5)
//
// Backend endpoints intentionally degrade individually: partial failures
// return empty envelopes and the orchestrator flips `source` to
// `'partial'`. Full failure (no brand + no campaigns + no deals) flips
// to `'fallback'`. The hook layer renders mock fixtures in that case so
// Brand HQ is never blank.
//
// Auth: best-effort Bearer token via `secureTokens`. The auth route
// (`/api/auth/me`) and the campaigns/applications routes require auth;
// `/api/brands`, `/api/deals`, and `/api/deals/:id/evidence` work
// without. A missing token degrades the applicant feed gracefully.

import { config } from '@/lib/config';
import { secureTokens } from '@/lib/storage/secure-tokens';

// ── Public domain types (narrow wire shapes) ──────────────

export interface BrandPublicProfile {
  id: string;
  userName?: string;
  name: string;
  email?: string;
  role: 'brand';
  category?: string;
  quarterlyBudget?: number;
  targetSports?: string[];
  verificationStatus?: string;
  activeDeals?: number;
  totalSpend?: number;
}

export interface BrandOpenDealRecord {
  id: string;
  brandId: string;
  title: string;
  briefMarkdown?: string;
  budgetMinCents: number;
  budgetMaxCents: number;
  status: string;
  category?: string;
  applicationCount?: number;
  applicationOpensAt?: string;
  applicationClosesAt?: string;
  exclusivityRequired?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandOpenDealApplication {
  id: string;
  openDealId: string;
  athleteId: string;
  status:
    | 'submitted'
    | 'shortlisted'
    | 'rejected'
    | 'selected'
    | 'withdrawn'
    | string;
  pitchMarkdown?: string;
  askCents?: number;
  appliedAt?: string;
  decidedAt?: string;
}

export interface BrandActiveDeal {
  id: string;
  athleteId: string;
  brandId: string;
  agentId?: string;
  title: string;
  status: string;
  dealValue: number;
  takeRate: number;
  description?: string;
  nilCategory?: string;
  fundingSource?: string;
  paymentConfidence?: string;
  createdAt: string;
  updatedAt: string;
  athlete?: {
    id: string;
    name: string;
    sport?: string;
    school?: string;
    followers?: number;
  } | null;
  brand?: BrandPublicProfile | null;
  evidencePacket?: unknown;
}

export interface BrandEvidencePacketLite {
  id: string;
  dealId: string;
  status?: string;
  reviewState?: string;
  brandHqReview?: {
    decision?: string;
    recommendedActions?: string[];
    blockers?: string[];
    riskFlags?: string[];
  };
  evidenceItems?: { id: string; label: string; status?: string }[];
  updatedAt?: string;
}

export type BrandSnapshotSource = 'backend' | 'partial' | 'fallback';

export interface BrandHqSnapshot {
  brand: BrandPublicProfile | null;
  pipeline: {
    openDeals: BrandOpenDealRecord[];
    applicationsByCampaign: Record<string, BrandOpenDealApplication[]>;
    activeDeals: BrandActiveDeal[];
  };
  recentEvidence: BrandEvidencePacketLite[];
  source: BrandSnapshotSource;
  fetchedAt: string;
  /** Names of sub-requests that failed; empty when all succeeded. */
  failedSources: string[];
}

// ── Empty defaults ────────────────────────────────────────

const EMPTY_SNAPSHOT: BrandHqSnapshot = {
  brand: null,
  pipeline: {
    openDeals: [],
    applicationsByCampaign: {},
    activeDeals: [],
  },
  recentEvidence: [],
  source: 'fallback',
  fetchedAt: '1970-01-01T00:00:00.000Z',
  failedSources: ['brand', 'campaigns', 'deals'],
};

const DEFAULT_TIMEOUT_MS = 10_000;

// ── Fetch helper ──────────────────────────────────────────

function buildProUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  const base = config.api.proBaseUrl || 'http://localhost:3020';
  const url = new URL(path.startsWith('/') ? path : `/${path}`, base);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

let __loggedProHost = false;
function logHostOnce(base: string): void {
  if (__loggedProHost) return;
  __loggedProHost = true;
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.info(`[brandApi] base URL → ${base}`);
  }
}

async function fetchJsonOrNull<T>(
  url: string,
  init: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<T | null> {
  const controller = new AbortController();
  const userSignal = init.signal;
  const onUserAbort = () => controller.abort();
  if (userSignal) {
    if (userSignal.aborted) controller.abort();
    else userSignal.addEventListener('abort', onUserAbort);
  }
  const timer = setTimeout(
    () => controller.abort(),
    init.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    try {
      const token = await secureTokens.getAccessToken();
      if (token && !token.startsWith('mock-')) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // best-effort token attach
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    if (!response.ok) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn(`[brandApi] ${response.status} ${url}`);
      }
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    const isAbort =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError';
    if (!isAbort && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[brandApi] network error', url, error);
    }
    return null;
  } finally {
    clearTimeout(timer);
    if (userSignal) userSignal.removeEventListener('abort', onUserAbort);
  }
}

/** Coerce envelope shapes (`{ data }`, `{ items }`, `{ results }`, bare
 *  array) into a flat list. */
function asList<T>(payload: unknown, keys: string[] = []): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  for (const key of ['data', 'items', 'results', ...keys]) {
    const candidate = obj[key];
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

/** Unwrap a single-object envelope (`{ data: {...} }`). */
function asObject<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as Record<string, unknown>;
  if (
    'data' in obj &&
    obj.data &&
    typeof obj.data === 'object' &&
    !Array.isArray(obj.data)
  ) {
    return obj.data as T;
  }
  return payload as T;
}

// ── Public orchestrator surface ───────────────────────────

export interface GetBrandHqSnapshotOptions {
  /** Optional brand-id override. When omitted the orchestrator picks the
   *  first brand from `/api/brands` as a deterministic default. */
  brandId?: string;
  /** Cap on evidence packets fetched concurrently. Default 5. */
  evidenceLimit?: number;
  signal?: AbortSignal;
}

export const brandApi = {
  async getBrandHqSnapshot(
    opts: GetBrandHqSnapshotOptions = {},
  ): Promise<BrandHqSnapshot> {
    const { brandId, evidenceLimit = 5, signal } = opts;
    const base = config.api.proBaseUrl || 'http://localhost:3020';
    logHostOnce(base);

    // First: resolve the brand. The product-contract surface has no
    // `/api/brands/:id`, so we list and pick the requested id (or the
    // first row).
    const brandsRaw = await fetchJsonOrNull<unknown>(
      buildProUrl('/api/brands'),
      { signal },
    );
    const brands = asList<BrandPublicProfile>(brandsRaw);
    let brand: BrandPublicProfile | null = null;
    if (brands.length > 0) {
      brand = brandId
        ? (brands.find((b) => b.id === brandId) ?? brands[0] ?? null)
        : (brands[0] ?? null);
    }
    const resolvedBrandId = brand?.id ?? brandId;

    // Parallel fan-out: campaigns scoped to brand, deals filtered to brand.
    const [campaignsRaw, dealsRaw] = await Promise.all([
      fetchJsonOrNull<unknown>(
        buildProUrl(
          '/api/campaigns',
          resolvedBrandId ? { brandId: resolvedBrandId } : undefined,
        ),
        { signal },
      ),
      fetchJsonOrNull<unknown>(buildProUrl('/api/deals'), { signal }),
    ]);

    const openDeals = asList<BrandOpenDealRecord>(campaignsRaw);
    const dealsAll = asList<BrandActiveDeal>(dealsRaw);
    const activeDeals = resolvedBrandId
      ? dealsAll.filter((d) => d.brandId === resolvedBrandId)
      : dealsAll;

    // Applications per campaign. Best-effort — requires auth, so a
    // missing token returns 401 and the campaign just maps to [].
    const applicationsByCampaign: Record<
      string,
      BrandOpenDealApplication[]
    > = {};
    if (openDeals.length > 0) {
      const limited = openDeals.slice(0, 10);
      const appResults = await Promise.all(
        limited.map((deal) =>
          fetchJsonOrNull<unknown>(
            buildProUrl(`/api/campaigns/${encodeURIComponent(deal.id)}/applications`),
            { signal },
          ),
        ),
      );
      limited.forEach((deal, index) => {
        applicationsByCampaign[deal.id] = asList<BrandOpenDealApplication>(
          appResults[index],
        );
      });
    }

    // Evidence packets for the latest N active deals.
    const evidenceTargets = activeDeals
      .slice()
      .sort(
        (a, b) =>
          Date.parse(b.updatedAt ?? '1970-01-01') -
          Date.parse(a.updatedAt ?? '1970-01-01'),
      )
      .slice(0, evidenceLimit);

    const evidenceResults = await Promise.all(
      evidenceTargets.map((deal) =>
        fetchJsonOrNull<unknown>(
          buildProUrl(`/api/deals/${encodeURIComponent(deal.id)}/evidence`),
          { signal },
        ),
      ),
    );
    const recentEvidence: BrandEvidencePacketLite[] = evidenceResults
      .map((result, index) => {
        const target = evidenceTargets[index];
        const packet = asObject<BrandEvidencePacketLite>(result);
        if (!packet || !target) return null;
        return {
          ...packet,
          dealId: packet.dealId ?? target.id,
        };
      })
      .filter((p): p is BrandEvidencePacketLite => p !== null);

    // Source classification.
    const failedSources: string[] = [];
    if (brandsRaw === null) failedSources.push('brand');
    if (campaignsRaw === null) failedSources.push('campaigns');
    if (dealsRaw === null) failedSources.push('deals');

    let source: BrandSnapshotSource;
    if (failedSources.length === 0 && (brand || activeDeals.length > 0 || openDeals.length > 0)) {
      source = 'backend';
    } else if (
      brandsRaw === null &&
      campaignsRaw === null &&
      dealsRaw === null
    ) {
      source = 'fallback';
    } else if (failedSources.length > 0) {
      source = 'partial';
    } else {
      // All endpoints replied but with zero data — still treat as
      // backend (the seed may just be empty).
      source = 'backend';
    }

    return {
      brand,
      pipeline: {
        openDeals,
        applicationsByCampaign,
        activeDeals,
      },
      recentEvidence,
      source,
      fetchedAt: new Date().toISOString(),
      failedSources,
    };
  },

  /** Exposed for tests/debug; the orchestrator above never throws. */
  emptySnapshot(): BrandHqSnapshot {
    return { ...EMPTY_SNAPSHOT };
  },
};

// ── Adapters: live → UI shapes ────────────────────────────

const PALETTE = [
  '#EB621A', // accent
  '#00C6B0', // teal
  '#F76900',
  '#2774AE',
  '#CC0033',
  '#E11E2B',
];

export function pickBrandColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length]!;
}

function formatMoneyShort(cents: number): string {
  if (!Number.isFinite(cents) || cents === 0) return '$0';
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${Math.round(dollars / 1_000)}K`;
  return `$${Math.round(dollars)}`;
}

function formatDealValue(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return '$0';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${Math.round(amount)}`;
}

/** Stage label adapter — backend `OpenDealRow.status` → UI badge. */
export function openDealStatusLabel(status: string): {
  label: string;
  tone: 'live' | 'upcoming' | 'wrapped' | 'review';
} {
  switch (status) {
    case 'open':
    case 'live':
      return { label: 'LIVE', tone: 'live' };
    case 'draft':
      return { label: 'DRAFT', tone: 'upcoming' };
    case 'reviewing':
      return { label: 'REVIEWING', tone: 'review' };
    case 'closed-filled':
      return { label: 'AWARDED', tone: 'wrapped' };
    case 'closed-cancelled':
    case 'closed':
      return { label: 'CLOSED', tone: 'wrapped' };
    default:
      return { label: status.toUpperCase(), tone: 'upcoming' };
  }
}

/** Adapt a live `BrandOpenDealRecord` + applicants to a campaign-card
 *  shape mirroring `mock-brand-data.Campaign`. */
export function toCampaignCard(
  deal: BrandOpenDealRecord,
  applicants: BrandOpenDealApplication[],
): {
  id: string;
  name: string;
  athlete: string;
  status: 'live' | 'upcoming' | 'wrapped';
  reach: string;
  impressions: string;
  engagement: string;
  budget: string;
  spent: number;
  startDate: string;
  endDate: string;
} {
  const { tone } = openDealStatusLabel(deal.status);
  const statusForCard: 'live' | 'upcoming' | 'wrapped' =
    tone === 'live'
      ? 'live'
      : tone === 'wrapped'
        ? 'wrapped'
        : 'upcoming';
  const midCents = Math.round((deal.budgetMinCents + deal.budgetMaxCents) / 2);
  return {
    id: deal.id,
    name: deal.title,
    athlete:
      applicants.length > 0
        ? `${applicants.length} applicant${applicants.length === 1 ? '' : 's'}`
        : 'Awaiting applicants',
    status: statusForCard,
    reach: '—',
    impressions: '—',
    engagement: '—',
    budget: formatMoneyShort(midCents),
    spent: statusForCard === 'live' ? 50 : statusForCard === 'wrapped' ? 100 : 0,
    startDate: formatDate(deal.applicationOpensAt),
    endDate: formatDate(deal.applicationClosesAt),
  };
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Adapt a live active-deal row to the UI's `Deal` shape used in the
 *  Pipeline > Deals subtab. */
export function toDealCard(d: BrandActiveDeal): {
  id: string;
  athlete: string;
  stage: 'draft' | 'sent' | 'negotiation' | 'signed' | 'live';
  value: string;
  term: string;
  lastTouched: string;
  owner: string;
} {
  const athleteName = d.athlete?.name ?? d.athleteId;
  const school = d.athlete?.school ? ` · ${d.athlete.school}` : '';
  return {
    id: d.id,
    athlete: `${athleteName}${school}`,
    stage: mapDealStatusToStage(d.status),
    value: formatDealValue(d.dealValue ?? 0),
    term: d.nilCategory ?? '—',
    lastTouched: `Updated ${formatRelative(d.updatedAt)}`,
    owner: d.agentId ?? '—',
  };
}

function mapDealStatusToStage(
  status: string,
): 'draft' | 'sent' | 'negotiation' | 'signed' | 'live' {
  switch (status) {
    case 'draft':
      return 'draft';
    case 'sent':
    case 'athlete_reviewing':
      return 'sent';
    case 'negotiation':
    case 'brand_reviewing':
      return 'negotiation';
    case 'contract_signed':
    case 'signed':
      return 'signed';
    case 'in_progress':
    case 'live':
    case 'wrapped':
    case 'paid':
    case 'completed':
      return 'live';
    default:
      return 'sent';
  }
}

function formatRelative(iso?: string): string {
  if (!iso) return '';
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return '';
  const diffMs = Date.now() - then;
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < day) return 'today';
  if (diffMs < 2 * day) return 'yesterday';
  return `${Math.floor(diffMs / day)}d ago`;
}

/** Pipeline summary stats derived from live data. */
export function summarizePipeline(snapshot: BrandHqSnapshot): {
  openPostsCount: number;
  reviewingCount: number;
  totalApplicants: number;
  closingThisWeek: number;
} {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const openDeals = snapshot.pipeline.openDeals;
  const apps = snapshot.pipeline.applicationsByCampaign;
  const openPostsCount = openDeals.filter(
    (d) => d.status === 'open' || d.status === 'live',
  ).length;
  const reviewingCount = openDeals.filter((d) => d.status === 'reviewing').length;
  const totalApplicants = Object.values(apps).reduce(
    (sum, list) => sum + list.length,
    0,
  );
  const closingThisWeek = openDeals.filter((d) => {
    if (!d.applicationClosesAt) return false;
    const t = Date.parse(d.applicationClosesAt);
    if (!Number.isFinite(t)) return false;
    const delta = t - now;
    return delta >= 0 && delta <= SEVEN_DAYS_MS;
  }).length;
  return { openPostsCount, reviewingCount, totalApplicants, closingThisWeek };
}

/** Aggregate active-deals into a pipeline-value summary. */
export function summarizeDeals(snapshot: BrandHqSnapshot): {
  totalCount: number;
  totalValueLabel: string;
  byStage: Record<'draft' | 'sent' | 'negotiation' | 'signed' | 'live', number>;
} {
  const deals = snapshot.pipeline.activeDeals;
  const byStage = {
    draft: 0,
    sent: 0,
    negotiation: 0,
    signed: 0,
    live: 0,
  };
  let totalValue = 0;
  for (const d of deals) {
    byStage[mapDealStatusToStage(d.status)] += 1;
    totalValue += d.dealValue ?? 0;
  }
  return {
    totalCount: deals.length,
    totalValueLabel: formatDealValue(totalValue),
    byStage,
  };
}
