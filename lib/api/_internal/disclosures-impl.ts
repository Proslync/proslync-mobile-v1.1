// ── ATHLETE DISCLOSURES API ──────────────────────────────
// Real-backend-first façade for the NIL Go-shaped athlete disclosure
// packet. Talks to /api/disclosures (registered 2026-05-11). When the
// backend is unreachable or returns no rows, falls back to the rich
// fixture data in `lib/data/mock-disclosures.ts` so demo runs stay
// offline-safe.
//
// The iOS `ComplianceDisclosure` type is rich (counterparties,
// arrangementTerms, compensation.paymentSchedule, attestation,
// actionHistory). The backend `complianceDisclosures` table is flat +
// JSON columns. `translateBackendRow()` does the best-effort mapping;
// fields the backend doesn't track yet get safe defaults derived from
// available columns. Write paths (`submitDraft`, `updateDisclosure`)
// still touch the backend for the state transition but keep the rich
// shape merge in-memory for the UI optimistic update.
//
// `submitDraft` is the visual-only state bump from the original
// mock-first API. With the real backend wired, it now POSTs to
// /api/disclosures/:id/transitions so the SQLite row advances too.

import { apiClient } from '../client';
import { isBackendReachable } from '../proslync';
import {
  getMockDisclosure,
  listMockDisclosuresForAthlete,
} from '@/lib/data/mock-disclosures';
import type {
  ComplianceDisclosure,
  DisclosureActionLogEntry,
  DisclosureReviewState,
} from '@/lib/types/compliance-disclosure.types';

// ── BACKEND ROW SHAPE ────────────────────────────────────
// Mirrors `complianceDisclosures` in proslync-backend/src/db/schema/governance.ts.

type BackendDisclosureRow = {
  id: string;
  athleteId: string;
  nilDealId: string | null;
  brandName: string;
  brandHandle: string | null;
  brandId: string | null;
  amountCents: number;
  paymentSource: 'brand-direct' | 'collective' | 'agency' | 'donor' | 'other';
  paymentMedium: 'cash' | 'in-kind' | 'equity' | 'service-credit' | 'other';
  associatedEntityDeclaration:
    | 'not-associated'
    | 'associated-collective'
    | 'associated-mmr-partner'
    | 'associated-other'
    | 'unknown';
  associatedEntityRisk: 'none' | 'low' | 'medium' | 'high';
  exclusivity: string | null;
  startDate: string;
  endDate: string | null;
  deliverableSummary: string;
  deliveryTimelineJson: string | null;
  proofOfPerformanceJson: string | null;
  attachmentsJson: string | null;
  writtenAgreementExists: boolean;
  attendanceContingency: boolean;
  endorsementFrequency: string | null;
  stateLawAttestation: boolean;
  institutionPolicyAttestation: boolean;
  institutionalAttestationPath: string | null;
  status: 'draft' | 'submitted' | 'returned' | 'approved' | 'rejected' | 'voided';
  cscReviewDecision:
    | 'not-submitted'
    | 'submitted'
    | 'under-review'
    | 'cleared'
    | 'not-cleared'
    | 'appeal-pending'
    | 'appeal-decided';
  submittedAt: string | null;
  decidedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

// ── REVIEW-STATE MAPPING ─────────────────────────────────
// Backend tracks `status` + `cscReviewDecision` separately so we never
// blur "school received" with "CSC cleared." iOS surface uses one
// `reviewState` chip; collapse via priority: CSC review beats raw status
// when CSC is engaged.

function deriveReviewState(row: BackendDisclosureRow): DisclosureReviewState {
  if (row.status === 'draft') return 'draft';
  if (row.status === 'approved') return 'approved';
  if (row.status === 'rejected') return 'flagged';
  if (row.status === 'returned' || row.status === 'voided') return 'amended';

  // status === 'submitted' — refine via CSC.
  if (row.cscReviewDecision === 'under-review' || row.cscReviewDecision === 'submitted') {
    return 'school-review';
  }
  if (row.cscReviewDecision === 'cleared') return 'approved';
  if (row.cscReviewDecision === 'not-cleared') return 'flagged';
  return 'submitted';
}

function safeJsonArray<T>(json: string | null): T[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

// ── BACKEND → iOS TRANSLATOR ─────────────────────────────
// Best-effort mapping. Fields the backend doesn't yet track (counterparty
// names beyond brandName, arrangement category labels, service providers,
// rich action history) get safe defaults. As the backend schema grows
// these can be tightened in place.

function translateBackendRow(row: BackendDisclosureRow): ComplianceDisclosure {
  const start = new Date(row.startDate);
  const end = row.endDate ? new Date(row.endDate) : null;
  const durationDays = end
    ? Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    : 30;

  const reviewState = deriveReviewState(row);

  // Action history derived from timestamps. Real audit log lives in
  // /api/compliance-reviews and can be merged in a follow-up.
  const actionHistory: DisclosureActionLogEntry[] = [
    {
      id: `h-${row.id}-created`,
      action: 'created',
      actor: { kind: 'athlete', label: 'Athlete' },
      at: row.createdAt,
    },
  ];
  if (row.submittedAt) {
    actionHistory.push({
      id: `h-${row.id}-submitted`,
      action: 'submitted',
      actor: { kind: 'athlete', label: 'Athlete' },
      at: row.submittedAt,
    });
  }
  if (row.decidedAt) {
    actionHistory.push({
      id: `h-${row.id}-reviewed`,
      action: 'reviewed',
      actor: { kind: 'school', label: 'School' },
      at: row.decidedAt,
      note: row.status === 'approved' ? 'Approved' : row.status === 'rejected' ? 'Rejected' : undefined,
    });
  }

  const attachments = safeJsonArray<{ id: string; label: string; state?: string }>(row.attachmentsJson).map(
    (a, i) => ({
      id: a.id ?? `att-${row.id}-${i}`,
      label: a.label ?? 'Attachment',
      state: (a.state as 'attached' | 'missing' | 'pending' | undefined) ?? 'attached',
    }),
  );

  return {
    id: row.id,
    athleteId: row.athleteId,
    brandId: row.brandId ?? undefined,
    dealId: row.nilDealId ?? undefined,
    thresholdState: row.amountCents >= 60000 ? 'crossed' : 'below-600',
    payorAssociationStatus:
      row.associatedEntityDeclaration === 'not-associated'
        ? 'unaffiliated'
        : row.associatedEntityDeclaration === 'unknown'
          ? 'unknown'
          : 'school-associated',
    counterparties: {
      athlete: {
        name: 'Athlete',
        school: 'School',
      },
      brand: {
        name: row.brandName,
        category: 'Brand',
      },
    },
    arrangementTerms: {
      categories: [],
      servicesGranted: row.deliverableSummary ? [row.deliverableSummary] : [],
      rightsGranted: [],
      durationDays,
      renewable: row.endorsementFrequency != null && row.endorsementFrequency !== '',
      exclusivityScope: row.exclusivity ?? undefined,
    },
    compensation: {
      totalCents: { cents: row.amountCents, currency: 'USD' },
      structure: 'flat',
      paymentSchedule: {
        atSignature: row.amountCents,
        atContentProof: 0,
        atFinalReport: 0,
      },
    },
    serviceProviders: [],
    attachments,
    attestation: {
      athleteSigned: row.stateLawAttestation && row.institutionPolicyAttestation,
      signedAt: row.submittedAt ?? undefined,
    },
    actionHistory,
    reviewState,
    source: {
      id: `proslync-live-${row.id}`,
      kind: 'platform-internal',
      label: 'Proslync · live',
      retrievedAt: row.updatedAt,
      freshnessDays: 0,
    },
    cscNote:
      'Proslync is not an official CSC submitter — this packet is the school\'s reviewer record.',
  };
}

// ── HTTP HELPERS ─────────────────────────────────────────

type ListEnvelope = { data: BackendDisclosureRow[] };
type SingleEnvelope = { data: BackendDisclosureRow };

async function tryFetchList(athleteId: string): Promise<ComplianceDisclosure[] | null> {
  if (!isBackendReachable()) return null;
  try {
    const env = await apiClient.get<ListEnvelope>(
      `/api/disclosures?athleteId=${encodeURIComponent(athleteId)}`,
    );
    if (!env || !Array.isArray(env.data)) return null;
    if (env.data.length === 0) return [];
    return env.data.map(translateBackendRow);
  } catch {
    return null;
  }
}

async function tryFetchOne(id: string): Promise<ComplianceDisclosure | null> {
  if (!isBackendReachable()) return null;
  try {
    const env = await apiClient.get<SingleEnvelope>(
      `/api/disclosures/${encodeURIComponent(id)}`,
    );
    if (!env || !env.data) return null;
    return translateBackendRow(env.data);
  } catch {
    return null;
  }
}

async function tryTransition(
  id: string,
  toStatus: BackendDisclosureRow['status'],
): Promise<ComplianceDisclosure | null> {
  if (!isBackendReachable()) return null;
  try {
    const env = await apiClient.post<SingleEnvelope>(
      `/api/disclosures/${encodeURIComponent(id)}/transitions`,
      { toStatus },
    );
    if (!env || !env.data) return null;
    return translateBackendRow(env.data);
  } catch {
    return null;
  }
}

// ── PUBLIC API ───────────────────────────────────────────

export const disclosuresApi = {
  /** List every disclosure tied to a given athlete id. */
  async listAthleteDisclosures(
    athleteId: string,
  ): Promise<ComplianceDisclosure[]> {
    if (!athleteId) return [];
    const live = await tryFetchList(athleteId);
    if (live && live.length > 0) return live;
    return listMockDisclosuresForAthlete(athleteId);
  },

  /** Fetch a single disclosure by id, or null if unknown. */
  async getDisclosure(id: string): Promise<ComplianceDisclosure | null> {
    if (!id) return null;
    const live = await tryFetchOne(id);
    if (live) return live;
    return getMockDisclosure(id);
  },

  /**
   * Submit a draft. Hits the backend's POST /api/disclosures/:id/transitions
   * when reachable; falls back to the prior visual-only state bump when
   * the backend is offline or the id is mock-only.
   */
  async submitDraft(id: string): Promise<ComplianceDisclosure | null> {
    const live = await tryTransition(id, 'submitted');
    if (live) return live;

    const base = getMockDisclosure(id);
    if (!base) return null;
    if (base.reviewState !== 'draft') return base;
    const at = new Date().toISOString();
    const entry: DisclosureActionLogEntry = {
      id: `h-${id}-submit-${Date.now()}`,
      action: 'submitted',
      actor: { kind: 'athlete', label: base.counterparties.athlete.name },
      at,
      note: 'Submitted via Proslync (mock fallback).',
    };
    return {
      ...base,
      reviewState: 'submitted',
      actionHistory: [...base.actionHistory, entry],
    };
  },

  /**
   * Inline edit. Currently mock-only — the backend doesn't yet expose a
   * generic PATCH /api/disclosures/:id (the existing service has
   * transition / csc-decision / attestation setters but not arbitrary
   * field patches). The rich-shape merge stays in-memory for the UI
   * optimistic update.
   */
  async updateDisclosure(
    id: string,
    patch: Partial<ComplianceDisclosure>,
  ): Promise<ComplianceDisclosure | null> {
    // Prefer the live row as the base when available so edits compose
    // with what SQLite knows; otherwise use the mock.
    const base = (await tryFetchOne(id)) ?? getMockDisclosure(id);
    if (!base) return null;
    const at = new Date().toISOString();
    const entry: DisclosureActionLogEntry = {
      id: `h-${id}-edit-${Date.now()}`,
      action: 'edited',
      actor: { kind: 'athlete', label: 'Self' },
      at,
      note: 'Inline edit',
    };
    return {
      ...base,
      ...patch,
      arrangementTerms: patch.arrangementTerms
        ? { ...base.arrangementTerms, ...patch.arrangementTerms }
        : base.arrangementTerms,
      compensation: patch.compensation
        ? {
            ...base.compensation,
            ...patch.compensation,
            paymentSchedule: patch.compensation.paymentSchedule
              ? {
                  ...base.compensation.paymentSchedule,
                  ...patch.compensation.paymentSchedule,
                }
              : base.compensation.paymentSchedule,
          }
        : base.compensation,
      attestation: patch.attestation
        ? { ...base.attestation, ...patch.attestation }
        : base.attestation,
      counterparties: patch.counterparties
        ? { ...base.counterparties, ...patch.counterparties }
        : base.counterparties,
      actionHistory: [...base.actionHistory, entry],
    };
  },
};
