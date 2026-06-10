// ── NIL COMPARABLE DEALS API ─────────────────────────────
// Mock-first façade for the comparable-deal evidence primitive.
// In mock mode it serves hand-authored fixtures from `mock-deal-comps`.
// In non-mock mode it falls back to the backend `/api/deals/:id/evidence`
// endpoint and projects its comparable rows onto the canonical
// `ComparableDealEvidence` shape.
//
// Per PLAN §2.9 / §5b: this is the only NIL evidence module allowed to
// surface comp data in v1 — gated by the source registry and the Q17
// (PLAN §9) source-policy decision.

import { config } from '../../config';
import { getMockDealComparables } from '@/lib/data/mock-deal-comps';
import type {
  ComparableDealEvidence,
  ComparableDealReviewerState,
} from '@/lib/types/comparable-deal.types';

import { proslyncApi } from '../proslync';

export const nilCompsApi = {
  /**
   * Returns the comparable-deal evidence packet for a deal, or null when
   * no comps exist (so the UI can render a clean empty state).
   */
  async getDealComparables(
    dealId: string,
  ): Promise<ComparableDealEvidence | null> {
    if (!dealId) return null;

    // Mock mode: serve fixtures.
    if (config.api.mode === 'mock') {
      return getMockDealComparables(dealId);
    }

    // Non-mock mode: try the backend evidence packet, fall back to mock
    // when the backend has no data for this deal id.
    try {
      const packet = await proslyncApi.getDealEvidence(dealId);
      if (!packet || !packet.comparableDeals?.length) {
        return getMockDealComparables(dealId);
      }
      return projectBackendEvidence(dealId, packet);
    } catch {
      return getMockDealComparables(dealId);
    }
  },
};

function projectBackendEvidence(
  dealId: string,
  packet: Awaited<ReturnType<typeof proslyncApi.getDealEvidence>>,
): ComparableDealEvidence {
  const rows = packet.comparableDeals.map((row) => ({
    id: row.id,
    inputDealId: dealId,
    athlete: {
      id: `athlete-${row.id}`,
      displayName: row.athlete,
      sport: 'Basketball',
      schoolOrTeam: 'See source ref',
    },
    brand: {
      id: `brand-${row.id}`,
      displayName: row.brand,
      category: 'See source ref',
    },
    amount: { cents: row.amountCents, currency: 'USD' as const },
    nilCategory: row.label,
    dealReportedAt: row.retrievedAt,
    rationale: row.rationale,
    caveats: [],
    source: {
      id: row.sourceRef,
      label: row.sourceRef,
      kind: 'aggregator' as const,
      retrievedAt: row.retrievedAt,
      freshnessDays: row.freshnessDays,
    },
    reviewerState: row.reviewerState as ComparableDealReviewerState,
  }));

  return {
    summary: {
      inputDealId: dealId,
      confidence: rows.length >= 3 ? 'medium' : 'low',
      summary:
        'Comparable rows projected from the backend evidence packet. Confirm the reviewer state before sharing externally.',
    },
    rows,
    attribution: {
      schemaSource: 'NILComp',
      schemaLicense: 'MIT',
      note: 'Projected from /api/deals/:id/evidence using the NILComp-shaped schema.',
    },
    updatedAt: packet.updatedAt,
  };
}
