// ── PROSLYNC AGENT API CLIENT ─────────────────────────────
// Phase 1 wire-up for the agent persona: pulls roster, inbound offers,
// active deals, and commission rollup from the live `proslync-backend`
// (default localhost:3020). Mirrors the network posture of
// `lib/api/fan/public.ts`:
//
//   • Raw fetch with AbortController + timeout (8s default).
//   • Returns empty envelopes on network/HTTP errors — NEVER throws.
//   • UI surfaces a small "live/demo" badge by reading
//     `agentApi.lastFetchSource` after each call.
//
// Auth: attaches Bearer token from `secureTokens.getAccessToken()` when
// available. The product-contract routes (`/api/athletes`, `/api/deals`)
// are currently unauth; campaigns/applications require auth. A missing
// token simply skips the header — the unauth routes still serve.
//
// Backend endpoints hit (see `proslync-backend/src/routes/*.ts`):
//   GET /api/athletes               → demoAthletes (product-contract)
//   GET /api/deals                  → demoDeals + brand/athlete + evidence
//   GET /api/campaigns              → open-deal listings (db-backed)
//
// The "inbound offers" surface uses `/api/campaigns` as a Phase 1 stand-in
// until the athlete-application relationship is modeled. When the backend
// adds a list endpoint we can refine to fetch real `OpenDealApplication`
// rows scoped to the agent's roster ids.

import { config } from '@/lib/config';
import { secureTokens } from '@/lib/storage/secure-tokens';
import type { OpenDealApplication } from '@/lib/types/open-deal.types';

// ── Domain types (mirror backend response shapes) ──────────

export interface AthletePublicProfile {
  id: string;
  userName: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: 'athlete';
  sport: string;
  school: string;
  league?: string;
  followers: number;
  engagementRate?: number;
  ratePerPost?: number;
  verificationStatus?: string;
  activeDeals: number;
  totalEarnings: number;
}

export interface BrandPublicProfile {
  id: string;
  userName: string;
  name: string;
  email?: string;
  role: 'brand';
  category: string;
  verificationStatus?: string;
}

export interface NilDealRecord {
  id: string;
  athleteId: string;
  brandId: string;
  agentId?: string;
  title: string;
  status: string;
  dealValue: number;
  takeRate: number;
  createdAt: string;
  updatedAt: string;
  description?: string;
  nilCategory?: string;
  fundingSource?: string;
  paymentConfidence?: string;
  transferPolicy?: string;
  // Joined fields from /api/deals
  athlete?: AthletePublicProfile | null;
  brand?: BrandPublicProfile | null;
  evidencePacket?: unknown;
}

export interface OpenDealRecord {
  id: string;
  brandId: string;
  title: string;
  briefMarkdown?: string;
  budgetMinCents: number;
  budgetMaxCents: number;
  status: string;
  applicationCount?: number;
  applicationOpensAt?: string;
  applicationClosesAt?: string;
}

export interface AgentRoster {
  athletes: AthletePublicProfile[];
  total: number;
}

export interface CommissionRollup {
  totalEarningsCents: number;
  activeDealCount: number;
  settledDealCount: number;
  pipelineValueCents: number;
}

// ── Empty defaults (returned on error) ─────────────────────

const EMPTY_ROSTER: AgentRoster = { athletes: [], total: 0 };
const EMPTY_DEALS: NilDealRecord[] = [];
const EMPTY_OFFERS: OpenDealApplication[] = [];
const EMPTY_COMMISSION: CommissionRollup = {
  totalEarningsCents: 0,
  activeDealCount: 0,
  settledDealCount: 0,
  pipelineValueCents: 0,
};

// ── Fetch helper ───────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 8000;

export type AgentDataSource = 'live' | 'mock' | 'offline';

interface AgentApiState {
  lastSource: AgentDataSource;
}

const state: AgentApiState = { lastSource: 'live' };

function setSource(s: AgentDataSource) {
  state.lastSource = s;
}

let __loggedProHost = false;
function logHostOnce(base: string): void {
  if (__loggedProHost) return;
  __loggedProHost = true;
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.info(`[agentApi] base URL → ${base}`);
  }
}

function buildProUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  const base = config.api.proBaseUrl || 'http://localhost:3020';
  logHostOnce(base);
  const url = new URL(path.startsWith('/') ? path : `/${path}`, base);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

interface FetchOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

async function fetchJson<T>(
  url: string,
  fallback: T,
  options: FetchOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const userSignal = options.signal;
  const onUserAbort = () => controller.abort();
  if (userSignal) {
    if (userSignal.aborted) controller.abort();
    else userSignal.addEventListener('abort', onUserAbort);
  }
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    // Attach Bearer token when available; product-contract routes are
    // unauth so a missing token is fine.
    try {
      const token = await secureTokens.getAccessToken();
      if (token && !token.startsWith('mock-')) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore — best-effort token attach
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    if (!response.ok) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn(`[agentApi] ${response.status} ${url}`);
      }
      setSource('offline');
      return fallback;
    }
    const payload = (await response.json()) as T;
    setSource('live');
    return payload;
  } catch (error) {
    const isAbort =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError';
    if (!isAbort && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[agentApi] network error', url, error);
    }
    setSource('offline');
    return fallback;
  } finally {
    clearTimeout(timeout);
    if (userSignal) userSignal.removeEventListener('abort', onUserAbort);
  }
}

// ── Public API surface ─────────────────────────────────────

export interface ListRosterOptions {
  limit?: number;
  cursor?: string;
  signal?: AbortSignal;
}

export const agentApi = {
  /** Live data-source posture from the last successful call. */
  getLastSource(): AgentDataSource {
    return state.lastSource;
  },

  /**
   * Agent's represented athletes. Phase 1 reads `/api/athletes` (the
   * product-contract demo seed). Phase 2 will refine to
   * `?agentId=<currentAgentId>` once the relationship is in the schema.
   */
  async getRoster(opts: ListRosterOptions = {}): Promise<AgentRoster> {
    const url = buildProUrl('/api/athletes', {
      limit: opts.limit,
      cursor: opts.cursor,
    });
    const envelope = await fetchJson<{
      data?: AthletePublicProfile[];
      items?: AthletePublicProfile[];
      results?: AthletePublicProfile[];
      count?: number;
    }>(url, {}, { signal: opts.signal });
    const athletes = envelope.data ?? envelope.items ?? envelope.results ?? [];
    return { athletes, total: envelope.count ?? athletes.length };
  },

  /**
   * Inbound offers — Phase 1 surfaces open campaigns the agent could route
   * to their roster. When `/api/applications?athleteId=` lands, swap this
   * to fetch real `OpenDealApplication` rows.
   */
  async getInboundOffers(
    athleteIds: string[],
    options: FetchOptions = {},
  ): Promise<OpenDealApplication[]> {
    // Phase 1: campaigns list is the closest live source. We synthesize
    // a transient `OpenDealApplication` row per open campaign + athlete
    // pair so the agent view's "Inbound offers" section has real
    // campaign ids/titles flowing through. Status stays `'submitted'`.
    const url = buildProUrl('/api/campaigns', { status: 'open', limit: 25 });
    const envelope = await fetchJson<{ data?: OpenDealRecord[] } | OpenDealRecord[]>(
      url,
      EMPTY_OFFERS as unknown as { data: OpenDealRecord[] },
      options,
    );
    const campaigns: OpenDealRecord[] = Array.isArray(envelope)
      ? envelope
      : (envelope?.data ?? []);
    if (athleteIds.length === 0 || campaigns.length === 0) return EMPTY_OFFERS;

    // Pair each campaign with the first roster athlete deterministically.
    // This keeps the surface shape stable until the backend exposes a
    // real per-athlete application feed.
    const offers: OpenDealApplication[] = campaigns.map((campaign, index) => {
      const athleteId = athleteIds[index % athleteIds.length] ?? athleteIds[0]!;
      const midCents = Math.round(
        (campaign.budgetMinCents + campaign.budgetMaxCents) / 2,
      );
      return {
        id: `inbound-${campaign.id}-${athleteId}`,
        openDealId: campaign.id,
        athleteId,
        status: 'submitted',
        pitchMarkdown: campaign.briefMarkdown ?? '',
        proposedDeliverables: [],
        askCents: midCents > 0 ? midCents : undefined,
        appliedAt: new Date().toISOString(),
      };
    });
    return offers;
  },

  /**
   * Active deals — currently the full /api/deals seed. When the deal
   * model gains an `agentId` index in the schema we can scope this
   * server-side; for now we filter client-side by athleteId.
   */
  async getActiveDeals(
    opts: { athleteIds?: string[]; status?: string[]; signal?: AbortSignal } = {},
  ): Promise<NilDealRecord[]> {
    const url = buildProUrl('/api/deals');
    const envelope = await fetchJson<{ data?: NilDealRecord[] } | NilDealRecord[]>(
      url,
      EMPTY_DEALS,
      { signal: opts.signal },
    );
    const deals: NilDealRecord[] = Array.isArray(envelope)
      ? envelope
      : (envelope?.data ?? []);
    let filtered = deals;
    if (opts.athleteIds && opts.athleteIds.length > 0) {
      const allow = new Set(opts.athleteIds);
      filtered = filtered.filter((d) => allow.has(d.athleteId));
    }
    if (opts.status && opts.status.length > 0) {
      const allow = new Set(opts.status);
      filtered = filtered.filter((d) => allow.has(d.status));
    }
    return filtered;
  },

  /**
   * Commission rollup — aggregated client-side from `/api/deals` so we
   * don't need a new backend endpoint. Returns cents.
   */
  async getCommissionRollup(
    athleteIds: string[],
    options: FetchOptions = {},
  ): Promise<CommissionRollup> {
    const deals = await agentApi.getActiveDeals({
      athleteIds: athleteIds.length > 0 ? athleteIds : undefined,
      signal: options.signal,
    });
    if (deals.length === 0) return EMPTY_COMMISSION;

    let totalEarningsCents = 0;
    let pipelineValueCents = 0;
    let activeDealCount = 0;
    let settledDealCount = 0;
    for (const d of deals) {
      const dealCents = Math.round((d.dealValue ?? 0) * 100);
      const commissionCents = Math.round(dealCents * (d.takeRate ?? 0));
      const isSettled =
        d.status === 'wrapped' ||
        d.status === 'paid' ||
        d.status === 'completed' ||
        d.status === 'closed-filled';
      if (isSettled) {
        settledDealCount += 1;
        totalEarningsCents += commissionCents;
      } else {
        activeDealCount += 1;
        pipelineValueCents += dealCents;
      }
    }
    return {
      totalEarningsCents,
      activeDealCount,
      settledDealCount,
      pipelineValueCents,
    };
  },
};

// ── Adapters: live shapes → mock-agent-data UI shapes ─────

// Deterministic palette so live athlete cards keep the same visual
// identity as the mock layout (yellow-accent avatar, brand initial badge).
const PALETTE = [
  '#F76900', // syracuse orange
  '#2774AE', // bruin blue
  '#00274C', // wolverines navy
  '#CC0033', // rutgers scarlet
  '#073E2C', // pine green
  '#E11E2B', // puma red
];

function pickColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length]!;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function formatMoneyUsd(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return '—';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}k`;
  return `$${amount}`;
}

/** Adapt a live athlete record to the shape the agent-view UI expects
 *  (mirrors `AgentAthlete` from `lib/data/mock-agent-data.ts`). */
export function toAgentAthleteCard(a: AthletePublicProfile) {
  const status: 'signed' | 'prospect' | 'pending' =
    a.verificationStatus === 'verified' ? 'signed' : 'pending';
  return {
    id: a.id,
    name: a.name,
    initials: initialsOf(a.name),
    color: pickColor(a.id),
    sport: a.sport,
    school: a.school,
    classYear: a.league ?? '',
    status,
    totalDealValue: `${formatMoneyUsd(a.totalEarnings ?? 0)} YTD`,
    activeDeals: a.activeDeals ?? 0,
    followers: formatFollowers(a.followers ?? 0),
  };
}

/** Adapt a live NIL deal to the UI's `AgentDeal` shape. */
export function toAgentDealCard(
  d: NilDealRecord,
  athleteName?: string,
): {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteInitial: string;
  athleteColor: string;
  brand: string;
  brandInitial: string;
  brandColor: string;
  stage: 'draft' | 'sent' | 'negotiation' | 'signed' | 'live' | 'wrapped';
  value: string;
  category: string;
  due: string;
} {
  const resolvedAthlete = athleteName ?? d.athlete?.name ?? d.athleteId;
  const brand = d.brand?.name ?? d.brandId;
  const stage = mapDealStatusToStage(d.status);
  return {
    id: d.id,
    athleteId: d.athleteId,
    athleteName: resolvedAthlete,
    athleteInitial: resolvedAthlete[0]?.toUpperCase() ?? 'A',
    athleteColor: pickColor(d.athleteId),
    brand,
    brandInitial: brand[0]?.toUpperCase() ?? 'B',
    brandColor: pickColor(d.brandId),
    stage,
    value: `${formatMoneyUsd(d.dealValue ?? 0)}`,
    category: d.nilCategory ?? '—',
    due: `Updated ${formatRelative(d.updatedAt)}`,
  };
}

function mapDealStatusToStage(
  status: string,
): 'draft' | 'sent' | 'negotiation' | 'signed' | 'live' | 'wrapped' {
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
      return 'live';
    case 'wrapped':
    case 'completed':
    case 'paid':
      return 'wrapped';
    default:
      return 'sent';
  }
}

function formatRelative(iso: string): string {
  if (!iso) return '';
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return '';
  const diffMs = Date.now() - then;
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < day) return 'today';
  if (diffMs < 2 * day) return 'yesterday';
  return `${Math.floor(diffMs / day)}d ago`;
}

/** Adapt an inbound offer (open-deal application) to the UI's offer card. */
export function toAgentOfferCard(
  o: OpenDealApplication,
  athleteName?: string,
  brandName?: string,
): {
  id: string;
  athleteName: string;
  athleteInitial: string;
  athleteColor: string;
  brand: string;
  brandInitial: string;
  brandColor: string;
  summary: string;
  amount: string;
  received: string;
  matchScore: number;
} {
  const aName = athleteName ?? o.athleteId;
  const bName = brandName ?? o.openDealId;
  const ask = typeof o.askCents === 'number' ? o.askCents / 100 : 0;
  return {
    id: o.id,
    athleteName: aName,
    athleteInitial: aName[0]?.toUpperCase() ?? 'A',
    athleteColor: pickColor(o.athleteId),
    brand: bName,
    brandInitial: bName[0]?.toUpperCase() ?? 'B',
    brandColor: pickColor(o.openDealId),
    summary: o.pitchMarkdown?.slice(0, 80) || 'Open campaign brief',
    amount: formatMoneyUsd(ask),
    received: formatRelative(o.appliedAt),
    matchScore: o.aiRanking?.score ?? 80,
  };
}
