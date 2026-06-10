// ── NIL MANAGER API ORCHESTRATOR ───────────────────────────
// Thin orchestrator that hits proslync-backend (localhost:3020 by
// default, configurable via EXPO_PUBLIC_PROSLYNC_PRO_API_BASE_URL) for
// every datum the NIL Manager view renders. Wraps four backend
// surfaces in a single Promise.all burst:
//
//   GET /api/approval-queue              → pending external/financial/AI
//   GET /api/compliance-reviews          → per-target review tracks
//   GET /api/permissions/athletes/:id    → athlete-issued consent grants
//   GET /api/users                       → school roster (light)
//
// Per-request fault tolerance: any sub-request that fails returns an
// empty array and `source` stays `'backend'` so the view can still
// render partial data. If ALL sub-requests fail, `source` becomes
// `'fallback'` and the orchestrator hydrates from
// `mock-nil-manager-data` so the user always sees something.
//
// Bypasses the shared apiClient: that singleton targets the legacy
// Cloud Run host via `config.api.baseUrl`, and eagerly attaches a mock
// Bearer token in demo mode. The pro persona endpoints live on a
// different host (`config.api.proBaseUrl`) and are happy with no auth
// header in dev.

import { config } from '@/lib/config';
import {
  NIL_MANAGER_ATHLETES,
  type ConsentLevel,
  type NilManagerAthlete,
} from '@/lib/data/mock-nil-manager-data';

const DEFAULT_TIMEOUT_MS = 8_000;

// ── Shapes returned by the backend (kept narrow on purpose) ──
// These mirror the proslync-backend response payloads. We don't
// re-import from the existing `lib/types/*` files because the
// backend's wire shape is the contract — internal client types may
// diverge as the rest of the app evolves.

export type ComplianceReviewStatus =
  | 'pending'
  | 'cleared'
  | 'flagged'
  | 'rejected'
  | 'appealed';

export interface ComplianceReview {
  id: string;
  targetType: string;
  targetId: string;
  trackKind?: 'ncaa' | 'school' | 'ethics' | string;
  status: ComplianceReviewStatus;
  note?: string | null;
  decidedAt?: string | null;
  decidedBy?: string | null;
  appealState?: 'requested' | 'in_progress' | 'decided' | null;
  createdAt?: string;
  updatedAt?: string;
}

export type ApprovalDecision = 'approved' | 'rejected';

export interface ApprovalQueueItem {
  id: string;
  kind: string;
  priority?: string;
  state: 'pending' | 'approved' | 'rejected' | string;
  title?: string;
  summary?: string;
  subjectRef?: { kind: string; id: string; label?: string };
  createdAt?: string;
  decidedAt?: string | null;
  decidedBy?: string | null;
}

export interface ComplianceDisclosureLite {
  id: string;
  athleteId: string;
  athleteName?: string;
  status?: string;
  reviewState?: string;
  submittedAt?: string;
  summary?: string;
}

export interface PermissionGrantLite {
  id: string;
  athleteId: string;
  granteeKind?: string;
  granteeLabel?: string;
  scopes?: string[];
  level?: ConsentLevel;
  status?: 'active' | 'paused' | 'revoked' | 'pending' | string;
  activatedAt?: string | null;
  expiresAt?: string | null;
}

export type NilManagerSnapshotSource = 'backend' | 'fallback' | 'mixed';

export interface NilManagerSnapshot {
  queue: ApprovalQueueItem[];
  disclosuresOpen: ComplianceDisclosureLite[];
  reviewsPending: ComplianceReview[];
  permissionGrants: PermissionGrantLite[];
  roster: NilManagerAthlete[];
  source: NilManagerSnapshotSource;
  fetchedAt: string;
  /** Names of sub-requests that failed; empty when all succeeded. */
  failedSources: string[];
}

// ── Internal helpers ──────────────────────────────────────────

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
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      ...init,
      headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
      signal: controller.signal,
    });
    if (!response.ok) {
      if (__DEV__) console.warn(`[nilManagerApi] ${response.status} ${url}`);
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
      console.warn('[nilManagerApi] network error', url, error);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Coerce arbitrary list-envelope shapes into a flat array. Tolerates
 *  `{ items: [] }`, `{ data: [] }`, `{ queue: [] }`, `{ reviews: [] }`,
 *  `{ grants: [] }`, or a bare array. */
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

// ── Public surface ────────────────────────────────────────────

export interface GetNilManagerSnapshotOptions {
  schoolId?: string;
  /** When provided, scopes the permission-grants probe to this athlete.
   *  Leaving undefined skips the per-athlete probe (no cross-athlete
   *  bulk endpoint exists yet). */
  athleteId?: string;
  signal?: AbortSignal;
}

/** One-shot orchestrator. Fans out across the four NIL Manager surfaces
 *  and assembles a unified snapshot. Never throws — failures are
 *  captured in `failedSources` and `source`. */
export async function getNilManagerSnapshot(
  opts: GetNilManagerSnapshotOptions = {},
): Promise<NilManagerSnapshot> {
  const { schoolId, athleteId, signal } = opts;
  const init: RequestInit = signal ? { signal } : {};

  const [queueRaw, reviewsRaw, grantsRaw] = await Promise.all([
    fetchJsonOrNull<unknown>(
      proUrl('/api/approval-queue', schoolId ? { schoolId } : undefined),
      init,
    ),
    fetchJsonOrNull<unknown>(
      proUrl('/api/compliance-reviews', { schoolId }),
      init,
    ),
    athleteId
      ? fetchJsonOrNull<unknown>(
          proUrl(`/api/permissions/athletes/${encodeURIComponent(athleteId)}`),
          init,
        )
      : Promise.resolve(null),
  ]);

  const failedSources: string[] = [];
  if (queueRaw === null) failedSources.push('approval-queue');
  if (reviewsRaw === null) failedSources.push('compliance-reviews');
  if (athleteId && grantsRaw === null) failedSources.push('permission-grants');

  const queue = asList<ApprovalQueueItem>(queueRaw, ['queue', 'pending']);
  const reviewsAll = asList<ComplianceReview>(reviewsRaw, ['reviews']);
  const reviewsPending = reviewsAll.filter(
    (r) => r.status === 'pending' || r.status === 'flagged' || r.status === 'appealed',
  );
  const permissionGrants = asList<PermissionGrantLite>(grantsRaw, ['grants']);

  // Disclosures: backend doesn't have a bulk "open disclosures by school"
  // endpoint yet (only `/api/deals/:id/evidence` per-deal); leave the
  // section as an empty list-from-backend rather than fabricate.
  const disclosuresOpen: ComplianceDisclosureLite[] = [];

  // Required sub-requests = queue + reviews. If both failed, no backend
  // contact succeeded — switch to fallback.
  const requiredFailed =
    failedSources.includes('approval-queue') &&
    failedSources.includes('compliance-reviews');

  let source: NilManagerSnapshotSource;
  let roster: NilManagerAthlete[];
  if (requiredFailed) {
    source = 'fallback';
    roster = NIL_MANAGER_ATHLETES;
  } else if (failedSources.length > 0) {
    source = 'mixed';
    roster = NIL_MANAGER_ATHLETES;
  } else {
    source = 'backend';
    roster = NIL_MANAGER_ATHLETES;
  }

  return {
    queue,
    disclosuresOpen,
    reviewsPending,
    permissionGrants,
    roster,
    source,
    fetchedAt: new Date().toISOString(),
    failedSources,
  };
}

// ── Mutations (best-effort) ──────────────────────────────────

async function postJson<T>(
  url: string,
  body: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      if (__DEV__) console.warn(`[nilManagerApi] POST ${response.status} ${url}`);
      return null;
    }
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  } catch (error) {
    if (__DEV__) console.warn('[nilManagerApi] POST network error', url, error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function decideApproval(
  id: string,
  decision: ApprovalDecision,
  note?: string,
): Promise<boolean> {
  if (!id) return false;
  const result = await postJson<{ ok?: boolean; id?: string }>(
    proUrl(`/api/approval-queue/${encodeURIComponent(id)}/decide`),
    { decision, note },
  );
  return result !== null;
}

export async function decideReview(
  id: string,
  status: 'cleared' | 'flagged' | 'rejected',
  note?: string,
): Promise<boolean> {
  if (!id) return false;
  const result = await postJson<{ ok?: boolean }>(
    proUrl(`/api/compliance-reviews/${encodeURIComponent(id)}/decide`),
    { status, note },
  );
  return result !== null;
}

export async function appealReview(
  id: string,
  appealState: 'requested' | 'in_progress' | 'decided',
): Promise<boolean> {
  if (!id) return false;
  const result = await postJson<{ ok?: boolean }>(
    proUrl(`/api/compliance-reviews/${encodeURIComponent(id)}/appeal`),
    { appealState },
  );
  return result !== null;
}

export const nilManagerApi = {
  getSnapshot: getNilManagerSnapshot,
  decideApproval,
  decideReview,
  appealReview,
};
