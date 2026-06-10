// ── PROSLYNC AI REVIEW (groundwork) ───────────────────────
// Front-end surface for the AI-assisted features called out in
// Mrs. Wilson's W21/W24/S7 asks. Today it returns shape-stable mock
// responses; tomorrow it switches to a backend `/api/ai/*` adapter.
//
// Open question Q13 (PLAN §9): Anthropic API key + which compliance
// corpus the AI agent reads. Until that clears, every AI response
// returned from this module carries:
//   - explicit `provider: 'mock'`
//   - rationale + caveats arrays
//   - `confidence` band
//   - `reviewerState` reminding the UI to gate before human approval
//
// This intentionally avoids inventing real AI inference. The point is
// that the iOS app exposes a *single* AI surface so Brand HQ, NIL
// Manager, AD cockpit, and deal detail render the same trust band when
// the backend is wired.

import type { ComparableDealEvidence } from '@/lib/types/comparable-deal.types';

export type AiReviewProvider = 'mock' | 'anthropic' | 'openai';
export type AiReviewConfidence = 'low' | 'medium' | 'high';
export type AiReviewerState =
  | 'auto-suggested'
  | 'pending-review'
  | 'approved'
  | 'rejected';

export interface AiTrustMeta {
  provider: AiReviewProvider;
  confidence: AiReviewConfidence;
  rationale: string[];
  caveats: string[];
  reviewerState: AiReviewerState;
  reviewedAt?: string;
  reviewer?: string;
}

export interface AiApplicantRank {
  applicantId: string;
  applicantName: string;
  rank: number;          // 1 = best fit
  matchScore: number;    // 0..100
  rationale: string[];
  caveats: string[];
  trust: AiTrustMeta;
}

export interface AiApplicantRankingResponse {
  openDealId: string;
  generatedAt: string;
  trust: AiTrustMeta;
  rankings: AiApplicantRank[];
}

export interface AiComplianceTrack {
  label: 'NCAA' | 'School' | 'Ethics';
  status: 'clear' | 'review' | 'flagged';
  note: string;
}

export interface AiComplianceReviewResponse {
  dealId: string;
  generatedAt: string;
  summary: string;
  tracks: AiComplianceTrack[];
  caveats: string[];
  trust: AiTrustMeta;
}

const MOCK_TRUST_NOTE =
  'Mock AI response: shape-stable so the UI renders the trust band, but no real inference happened. Backend adapter (Q13 PLAN §9) will replace this.';

export const aiReviewApi = {
  /**
   * Rank applicants for an OpenDeal. Reviewer-state defaults to
   * `auto-suggested`; the brand must approve before any outbound action
   * (per PLAN §2.3 AI ranking governance).
   */
  async rankApplicantsForOpenDeal(
    openDealId: string,
    applicants: Array<{ id: string; name: string; fitScore?: number }>,
  ): Promise<AiApplicantRankingResponse> {
    const generatedAt = new Date().toISOString();
    const sorted = [...applicants].sort(
      (a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0),
    );
    return {
      openDealId,
      generatedAt,
      trust: {
        provider: 'mock',
        confidence: 'medium',
        rationale: [
          'Sorted by surfaced fitScore from the local fixture.',
          'No external evidence consulted.',
        ],
        caveats: [
          MOCK_TRUST_NOTE,
          'Approval gate required before any outbound message to applicants.',
        ],
        reviewerState: 'auto-suggested',
      },
      rankings: sorted.map((applicant, index) => ({
        applicantId: applicant.id,
        applicantName: applicant.name,
        rank: index + 1,
        matchScore: applicant.fitScore ?? Math.max(60, 95 - index * 6),
        rationale: [
          'Fit score, audience match, and on-platform engagement (mock heuristic).',
        ],
        caveats: ['Refresh after compliance and consent are confirmed.'],
        trust: {
          provider: 'mock',
          confidence: 'medium',
          rationale: ['Mock heuristic; replace with real adapter response.'],
          caveats: [MOCK_TRUST_NOTE],
          reviewerState: 'auto-suggested',
        },
      })),
    };
  },

  /**
   * Generate an AI-shaped compliance review for a deal — three-track
   * (NCAA / School / Ethics) state with rationale and caveats. Designed
   * to fold into the deal-detail Compliance triad surface.
   */
  async reviewDealCompliance(
    dealId: string,
    context: { nilCategory?: string; amountCents?: number } = {},
  ): Promise<AiComplianceReviewResponse> {
    const flagged = (context.amountCents ?? 0) >= 500_000_00;
    return {
      dealId,
      generatedAt: new Date().toISOString(),
      summary: flagged
        ? 'High-value deal — escalate to school compliance and confirm House-cap accounting before disclosure.'
        : 'Standard NIL endorsement shape; clear pending NIL Go disclosure attestation.',
      tracks: [
        {
          label: 'NCAA',
          status: flagged ? 'review' : 'clear',
          note: flagged
            ? 'Verify Bylaw 22 threshold + payor association status.'
            : 'No bylaw triggers detected in mock heuristic.',
        },
        {
          label: 'School',
          status: flagged ? 'flagged' : 'review',
          note: flagged
            ? 'Approval queue requires AD sign-off; cap reconciliation outstanding.'
            : 'Routine school review; pending NIL Manager intake.',
        },
        {
          label: 'Ethics',
          status: 'review',
          note: 'Confirm exclusivity and FTC disclosure language before publication.',
        },
      ],
      caveats: [
        MOCK_TRUST_NOTE,
        'No legal opinion. Final compliance call rests with school counsel.',
      ],
      trust: {
        provider: 'mock',
        confidence: flagged ? 'high' : 'medium',
        rationale: [
          'Amount-band heuristic only; no compliance corpus consulted.',
          context.nilCategory
            ? `Category context: ${context.nilCategory}.`
            : 'Category context: unknown.',
        ],
        caveats: [MOCK_TRUST_NOTE],
        reviewerState: 'auto-suggested',
      },
    };
  },

  /**
   * Project a comparable-deal packet into an AI-styled deal valuation
   * commentary. Pure derivation — no network call.
   */
  summarizeComparablesAsAiCommentary(
    evidence: ComparableDealEvidence | null | undefined,
  ): string {
    if (!evidence || evidence.rows.length === 0) {
      return 'No reviewer-approved comparable deals on file yet. AI valuation commentary disabled until comps clear review.';
    }
    const approved = evidence.rows.filter((r) => r.reviewerState === 'approved').length;
    const pending = evidence.rows.length - approved;
    const range = evidence.summary.range;
    if (!range) {
      return `${evidence.rows.length} comparable rows on file (${approved} approved, ${pending} pending). Range narrows once reviewers clear more rows.`;
    }
    return `${evidence.rows.length} comparable rows; ${approved} approved, ${pending} pending. Estimated band ${formatCents(range.low.cents)}–${formatCents(range.high.cents)} at ${evidence.summary.confidence} confidence.`;
  },
};

function formatCents(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
  if (dollars >= 1_000) return `$${Math.round(dollars / 1_000)}K`;
  return `$${dollars.toFixed(0)}`;
}
