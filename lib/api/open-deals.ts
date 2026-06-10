// ── OPEN-DEALS API ────────────────────────────────────────
// Sprint 2.3 mock-first façade. The buyer (brand) lists, opens, and
// reviews OpenDeals; the AI ranking surface composes `aiReviewApi`
// over the fixture applicant pool.
//
// Today: serves hand-authored fixtures from `mock-open-deals.ts`.
// Tomorrow: swaps to a backend `/api/open-deals` adapter when Q17 /
// PLAN §9 source policy clears.
//
// Trust posture: every AI ranking row this module returns carries
// `provider: 'mock'` per the `AiTrustMeta` convention. Human approval
// is required before any outbound applicant contact (PLAN §2.3
// "AI ranking governance" risk band).

import {
  getMockOpenDeal,
  getMockOpenDeals,
  resolveApplicantAthlete,
} from '@/lib/data/mock-open-deals';
import type { ConsentLevel } from '@/lib/data/mock-nil-manager-data';
import type { MoneyAmount } from '@/lib/types/comparable-deal.types';
import type {
  OpenDealApplication,
  OpenDealSurfaceRecord,
} from '@/lib/types/open-deal.types';

import { aiReviewApi, type AiApplicantRankingResponse } from './ai-review';

/**
 * Athlete-side apply payload. All fields optional — the form ships with
 * sensible defaults so an athlete can submit a baseline application
 * without manual editing. Sprint 2.3 pre-persistence: this is mock-only.
 */
export interface OpenDealApplyPayload {
  /** Proposed rate as a MoneyAmount (integer cents). */
  proposedRateCents?: MoneyAmount;
  /** Freeform pitch / "why I'm a fit" body. */
  pitchNote?: string;
  /** Defaults to `'summary'` if omitted — share with NIL Manager toggle. */
  consentLevel?: ConsentLevel;
}

export interface RankedApplicant {
  application: OpenDealApplication;
  /** Resolved from `BRAND_ATHLETES` — may be `null` for unknown ids. */
  athlete: ReturnType<typeof resolveApplicantAthlete>;
}

export interface RankedApplicantsResponse {
  openDealId: string;
  ranking: AiApplicantRankingResponse;
  applicants: RankedApplicant[];
}

export const openDealsApi = {
  async getOpenDeals(): Promise<OpenDealSurfaceRecord[]> {
    return getMockOpenDeals();
  },

  async getOpenDeal(id: string): Promise<OpenDealSurfaceRecord | null> {
    if (!id) return null;
    return getMockOpenDeal(id);
  },

  /**
   * Compose the AI ranking response with the resolved applicant pool.
   * Pure mock today — no network call.
   */
  async getRankedApplicants(openDealId: string): Promise<RankedApplicantsResponse | null> {
    const record = getMockOpenDeal(openDealId);
    if (!record) return null;
    const pool = record.applicants.map((application) => {
      const athlete = resolveApplicantAthlete(application.athleteId);
      return { application, athlete };
    });

    const ranking = await aiReviewApi.rankApplicantsForOpenDeal(
      openDealId,
      pool.map(({ application, athlete }) => ({
        id: application.id,
        name: athlete?.name ?? application.athleteId,
        fitScore: athlete?.fitScore,
      })),
    );

    // Reorder applicants to match the ranking order so the UI can zip
    // them in a single pass.
    const rankedIndex = new Map(
      ranking.rankings.map((row, index) => [row.applicantId, index]),
    );
    const sortedApplicants = [...pool].sort((a, b) => {
      const ai = rankedIndex.get(a.application.id) ?? 999;
      const bi = rankedIndex.get(b.application.id) ?? 999;
      return ai - bi;
    });

    return {
      openDealId,
      ranking,
      applicants: sortedApplicants,
    };
  },

  /**
   * Athlete-side apply. Mock-only: returns a synthetic
   * `OpenDealApplication` row with status `'submitted'`. Does NOT mutate
   * the underlying fixtures — the surface treats the returned record as
   * a transient receipt the UI can show in a "Submitted!" pill. Real
   * persistence lands once Q17 / PLAN §9 clears.
   *
   * Trust posture: every athlete-facing apply surface must visibly
   * restate "AI rank + human approval gate" — submitting does NOT
   * guarantee a deal.
   */
  async applyToOpenDeal(
    openDealId: string,
    applicantId: string,
    payload: OpenDealApplyPayload = {},
  ): Promise<OpenDealApplication> {
    const askCents = payload.proposedRateCents?.cents;
    const pitch =
      payload.pitchNote && payload.pitchNote.trim().length > 0
        ? payload.pitchNote.trim()
        : 'Synthetic application — athlete submitted via mock surface.';
    return {
      id: `app-${openDealId}-${applicantId}-${Date.now()}`,
      openDealId,
      athleteId: applicantId,
      status: 'submitted',
      pitchMarkdown: pitch,
      proposedDeliverables: [],
      askCents,
      appliedAt: new Date().toISOString(),
    };
  },
};
