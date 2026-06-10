// ── SCHOOL / AD DASHBOARD API ORCHESTRATOR ───────────────
// One-shot snapshot for the School persona (athletic director). Fans
// out across the live `proslync-backend` surfaces and the still-mock
// AD audit/rev-share/cap surfaces and assembles a unified payload so
// the school view + its sub-cards consume a single source.
//
// LIVE (proslync-backend, default localhost:3020):
//   • `getNilManagerSnapshot()` → approval-queue + compliance-reviews
//     (REUSED — do not duplicate the underlying fetch logic).
//   • GET /api/deals      → AD rev-share client-side rollup context
//   • GET /api/athletes   → roster context
//
// MOCK (awaiting backend §4.6):
//   • Rev-share ledger     — `revShareApi.getSchoolLedger()`
//   • House-v-NCAA cap     — embedded inside `RevShareLedger.capContext`
//   • Risk report          — `riskReportsApi.getSchoolRiskReport()`
//
// Source posture:
//   • 'backend'  → every live sub-request succeeded
//   • 'mixed'    → some live sub-requests succeeded, some failed
//   • 'fallback' → every live sub-request failed (offline / no backend)
//
// Per-sub-request fault tolerance: a failure returns `null` (mock
// surfaces) or `[]` (live envelopes) and `failedSources` records the
// breakdown. The view chooses how to render each tier independently.

import { config } from '@/lib/config';
import {
  getNilManagerSnapshot,
  type ApprovalQueueItem,
  type ComplianceReview,
  type NilManagerSnapshot,
} from '@/lib/api/nil-manager';
import { revShareApi } from '@/lib/api/rev-share';
import { riskReportsApi } from '@/lib/api/risk-reports';
import { secureTokens } from '@/lib/storage/secure-tokens';
import type {
  AthletePublicProfile,
  NilDealRecord,
} from '@/lib/api/agent';
import type { HouseCapContext } from '@/lib/types/risk-report.types';
import type { RevShareLedger } from '@/lib/types/rev-share.types';
import type { RiskReport } from '@/lib/types/risk-report.types';

const DEFAULT_TIMEOUT_MS = 8_000;

export type SchoolSnapshotSource = 'backend' | 'mixed' | 'fallback';

/** Live deal rollup synthesised from `/api/deals` for AD revenue
 *  context. Distinct from the §4.6 ledger — totals are derived
 *  client-side from public deal records, not authoritative settlement
 *  rows. */
export interface SchoolDealRollup {
  /** Total gross deal volume in cents. */
  grossCents: number;
  /** Sum of `(dealValue * takeRate)` across all deals in cents. */
  takeCents: number;
  /** Count of deals currently in flight (not wrapped / paid / completed). */
  activeCount: number;
  /** Count of deals settled (wrapped / paid / completed). */
  settledCount: number;
}

export interface SchoolDashboardSnapshot {
  // ── LIVE backend (proslync-backend) ─────
  approvalQueue: ApprovalQueueItem[];
  complianceReviews: ComplianceReview[];
  deals: NilDealRecord[];
  athletes: AthletePublicProfile[];
  dealRollup: SchoolDealRollup;

  // ── MOCK (awaiting backend §4.6) ────────
  revShareLedger: RevShareLedger | null;
  /** Re-export of the cap block embedded inside `revShareLedger`. */
  capTracker: HouseCapContext | null;
  riskReport: RiskReport | null;

  // ── Metadata ────────────────────────────
  source: SchoolSnapshotSource;
  /** Sub-request names that failed (live tier only). */
  failedSources: string[];
  fetchedAt: string;
}

// ── Internal helpers ──────────────────────────────────────

function proUrl(
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

async function fetchJsonOrNull<T>(
  url: string,
  signal?: AbortSignal,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T | null> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort);
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);
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
      if (__DEV__) console.warn(`[schoolApi] ${response.status} ${url}`);
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
      console.warn('[schoolApi] network error', url, error);
    }
    return null;
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

function asList<T>(payload: unknown, keys: string[] = []): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  for (const key of ['items', 'data', 'results', ...keys]) {
    const candidate = obj[key];
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

function rollupDeals(deals: NilDealRecord[]): SchoolDealRollup {
  let grossCents = 0;
  let takeCents = 0;
  let activeCount = 0;
  let settledCount = 0;
  for (const d of deals) {
    const dealCents = Math.round((d.dealValue ?? 0) * 100);
    grossCents += dealCents;
    takeCents += Math.round(dealCents * (d.takeRate ?? 0));
    const isSettled =
      d.status === 'wrapped' ||
      d.status === 'paid' ||
      d.status === 'completed' ||
      d.status === 'closed-filled';
    if (isSettled) settledCount += 1;
    else activeCount += 1;
  }
  return { grossCents, takeCents, activeCount, settledCount };
}

// ── Public surface ────────────────────────────────────────

export interface GetSchoolDashboardSnapshotOptions {
  schoolId?: string;
  signal?: AbortSignal;
}

/** One-shot orchestrator. Fans out the live + mock surfaces and
 *  assembles a unified snapshot. Never throws — failures are recorded
 *  in `failedSources` and `source` collapses to 'mixed' / 'fallback'. */
export async function getSchoolDashboardSnapshot(
  opts: GetSchoolDashboardSnapshotOptions = {},
): Promise<SchoolDashboardSnapshot> {
  const schoolId = opts.schoolId ?? 'school:syracuse';
  const signal = opts.signal;

  const [nilManager, dealsRaw, athletesRaw, revShareLedger, riskReport] =
    await Promise.all([
      // Live: queue + reviews (reuse the existing orchestrator).
      getNilManagerSnapshot({ schoolId, signal }).catch(() => null),
      // Live: deals (client-side rev-share rollup context).
      fetchJsonOrNull<unknown>(proUrl('/api/deals'), signal),
      // Live: athletes (roster context).
      fetchJsonOrNull<unknown>(proUrl('/api/athletes'), signal),
      // Mock: rev-share ledger (awaiting backend §4.6).
      revShareApi.getSchoolLedger(schoolId).catch(() => null),
      // Mock: risk report (awaiting backend §4.6).
      riskReportsApi.getSchoolRiskReport(schoolId).catch(() => null),
    ]);

  // Track failures across the live tier only.
  const failedSources: string[] = [];

  let approvalQueue: ApprovalQueueItem[] = [];
  let complianceReviews: ComplianceReview[] = [];
  if (!nilManager) {
    failedSources.push('approval-queue', 'compliance-reviews');
  } else {
    // Mirror nil-manager's per-sub-request failure breakdown so the
    // school view can render partial states without re-fetching.
    if (nilManager.failedSources.includes('approval-queue')) {
      failedSources.push('approval-queue');
    } else {
      approvalQueue = nilManager.queue;
    }
    if (nilManager.failedSources.includes('compliance-reviews')) {
      failedSources.push('compliance-reviews');
    } else {
      complianceReviews = nilManager.reviewsPending;
    }
  }

  let deals: NilDealRecord[] = [];
  if (dealsRaw === null) {
    failedSources.push('deals');
  } else {
    deals = asList<NilDealRecord>(dealsRaw, ['deals']);
  }

  let athletes: AthletePublicProfile[] = [];
  if (athletesRaw === null) {
    failedSources.push('athletes');
  } else {
    athletes = asList<AthletePublicProfile>(athletesRaw, ['athletes']);
  }

  // Source posture — only live-tier failures collapse the badge.
  // Mock-tier returns (`revShareLedger`/`riskReport`) are always
  // available, so they don't influence the `source` tag.
  const liveSubrequestCount = 4; // queue, reviews, deals, athletes
  let source: SchoolSnapshotSource;
  if (failedSources.length === 0) source = 'backend';
  else if (failedSources.length >= liveSubrequestCount) source = 'fallback';
  else source = 'mixed';

  const capTracker = revShareLedger?.capContext ?? null;
  const dealRollup = rollupDeals(deals);

  return {
    approvalQueue,
    complianceReviews,
    deals,
    athletes,
    dealRollup,
    revShareLedger: revShareLedger ?? null,
    capTracker,
    riskReport: riskReport ?? null,
    source,
    failedSources,
    fetchedAt: new Date().toISOString(),
  };
}

/** Re-export the underlying NIL Manager snapshot for callers that need
 *  the full nil-manager payload (decide/appeal actions live there). */
export type { NilManagerSnapshot };

export const schoolApi = {
  getSnapshot: getSchoolDashboardSnapshot,
};
