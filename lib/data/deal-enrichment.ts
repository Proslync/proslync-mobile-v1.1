// lib/data/deal-enrichment.ts
// ── DEAL-DETAIL ENRICHMENT JOIN ────────────────────────────────────────────
// The deal-detail page renders a rich BrandDealDetail packet (d-1…d-6), but
// the live truth/FMV/clearance/escrow primitives live in OTHER fixtures that
// use DIFFERENT id namespaces:
//
//   Brand HQ packet   →  d-*           (lib/data/mock-brand-data.ts)
//   Payment truth      →  dt-*          (lib/data/mock-deal-truth.ts)
//   Deal engine/escrow →  PSY-*         (lib/data/mock-deal-engine.ts)
//
// This module owns the id-bridge between those namespaces and exposes a single
// PURE `buildDealEnrichment(detail)` that joins whatever the bridge resolves.
// Every sub-section is optional: where a bridge has no match, the field is
// `undefined` and the UI omits that block gracefully (no empty/broken cards).
//
// All FMV/clearance numbers come from the real engines (lib/fmv, lib/compliance)
// — nothing is hard-coded. FMV is an ESTIMATE; the FMV_DISCLAIMER must render
// alongside any band.

import type { BrandDealDetail } from '@/lib/data/mock-brand-data';
import { DEAL_TRUTH_FIXTURE } from '@/lib/data/mock-deal-truth';
import { DEMO_DEAL } from '@/lib/data/mock-deal-engine';
import type { DealTruth } from '@/lib/athlete/truth';
import { hoursUntilISO } from '@/lib/athlete/truth';
import { formatCentsUSD } from '@/lib/money/money-machine.mjs';
import {
  predictClearance,
  FMV_DISCLAIMER,
  type ClearancePrediction,
  type DealKind,
} from '@/lib/fmv/fmv-engine';
import { nilGoDeadline } from '@/lib/compliance/preclearance';
import type { EngineDeal } from '@/lib/types/deal-engine.types';

export { FMV_DISCLAIMER };

// ── Id bridge ───────────────────────────────────────────────────────────────
// Hand-authored cross-namespace map. A deal may bridge to a payment-truth
// record, a deal-engine record, or both — or neither.

type DealBridge = {
  /** lib/data/mock-deal-truth.ts dealId (dt-*). */
  truthId?: string;
  /** lib/data/mock-deal-engine.ts dealId (PSY-*). */
  engineId?: string;
};

const DEAL_ID_BRIDGE: Record<string, DealBridge> = {
  // Nike negotiation → Nike payment-truth (disclosed, payment in CSC review).
  'd-1': { truthId: 'dt-nike-1' },
  // Beats sent → Legacy Athletics truth (cleared, payment expected/authorized).
  'd-2': { truthId: 'dt-legacy-1' },
  // Zaxby's draft → no live truth/engine record yet (graceful omit).
  'd-3': {},
  // Gatorade flagship signed → Gatorade truth (PAID) + Kiyan engine escrow deal.
  'd-4': { truthId: 'dt-gatorade-1', engineId: DEMO_DEAL.dealId },
  // CarMax live → no live truth/engine record yet (graceful omit).
  'd-5': {},
  // Nike signature renewal in negotiation → JMA truth (UNDISCLOSED → NIL Go clock).
  'd-6': { truthId: 'dt-jma-1', engineId: DEMO_DEAL.dealId },
};

// ── Per-deal FMV inputs ──────────────────────────────────────────────────────
// Athlete reach/engagement + deal kind feed the FMV + clearance engines. These
// mirror the demo roster's relative profiles; followers in absolute count.

type FmvProfile = {
  dealKind: DealKind;
  totalFollowers: number;
  engagementRate7d: number;
  payerEntityType: string;
  deliverableDescription: string;
};

const DEAL_FMV_PROFILE: Record<string, FmvProfile> = {
  'd-1': { dealKind: 'endorsement', totalFollowers: 910_000, engagementRate7d: 0.061, payerEntityType: 'national-brand', deliverableDescription: '6 social activations/yr + on-court footwear exclusivity + signature capsule session' },
  'd-2': { dealKind: 'social-post', totalFollowers: 720_000, engagementRate7d: 0.058, payerEntityType: 'national-brand', deliverableDescription: '8 tunnel-walk features/yr + 4 highlight reels with product' },
  'd-3': { dealKind: 'appearance', totalFollowers: 180_000, engagementRate7d: 0.042, payerEntityType: 'local-business', deliverableDescription: '6 in-restaurant appearances + 12 regional social posts' },
  'd-4': { dealKind: 'endorsement', totalFollowers: 1_200_000, engagementRate7d: 0.068, payerEntityType: 'national-brand', deliverableDescription: '2 national campaigns/yr + hydration-science content series' },
  'd-5': { dealKind: 'endorsement', totalFollowers: 480_000, engagementRate7d: 0.05, payerEntityType: 'local-business', deliverableDescription: 'First-car content series + 4 dealership appearances/yr + regional billboard' },
  'd-6': { dealKind: 'licensing', totalFollowers: 3_100_000, engagementRate7d: 0.091, payerEntityType: 'national-brand', deliverableDescription: 'Signature-line co-design + on-court exclusivity + royalty structure' },
};

// ── Money parsing ────────────────────────────────────────────────────────────
// The packet stores display strings ("$380K", "$520K renewal", "$3.1M"). Parse
// the leading currency token into cents for the FMV/clearance engines.

export function parseDisplayMoneyToCents(display: string): number | null {
  const m = display.match(/\$\s*([\d,.]+)\s*([KMB]?)/i);
  if (!m) return null;
  const base = Number(m[1].replace(/,/g, ''));
  if (Number.isNaN(base)) return null;
  const mult = m[2].toUpperCase() === 'M' ? 1_000_000 : m[2].toUpperCase() === 'B' ? 1_000_000_000 : m[2].toUpperCase() === 'K' ? 1_000 : 1;
  return Math.round(base * mult * 100);
}

// ── Output shape ─────────────────────────────────────────────────────────────

export type PaymentTruthRead = {
  dealId: string;
  state: DealTruth['paymentState'];
  stateLabel: string;
  amount: string;
  paidAt?: string;
  taxSetAside?: string;
};

export type FmvRead = {
  band: string;
  point: string;
  confidence: ClearancePrediction['confidence'];
  bandLabel: ClearancePrediction['bandLabel'];
  reason: string;
  amount: string;
  disclaimer: string;
};

export type NilGoRead = {
  deadlineISO: string;
  hoursRemaining: number | null;
};

/**
 * Resolved clearance status for a deal that is past the pre-clearance phase.
 * Shown INSTEAD of the forward-looking FMV/clearance prediction once a deal is
 * signed/live — a "will this clear?" read is incoherent on a done deal.
 */
export type ClearanceStatusRead = {
  /** Short status line, e.g. "Cleared · passed NIL Go". */
  label: string;
  /** Truthy when the underlying truth record marks this deal cleared/paid. */
  cleared: boolean;
};

export type EscrowRead = {
  dealId: string;
  funded: string;
  released: string;
  state: EngineDeal['escrow']['state'];
  milestones: Array<{ id: string; description: string; amount: string; status: string }>;
};

export type DealEnrichment = {
  payment?: PaymentTruthRead;
  fmv?: FmvRead;
  nilGo?: NilGoRead;
  escrow?: EscrowRead;
  /** Present only on post-clearance deals (signed/live) in place of `fmv`/`nilGo`. */
  clearanceStatus?: ClearanceStatusRead;
};

// ── Stage gating ─────────────────────────────────────────────────────────────
// A FMV band + "will this clear?" read is only coherent while clearance is a
// LIVE question — i.e. before the deal is executed. Once a deal is signed or
// live, the question is settled, so we show a clearance STATUS line instead of
// a prediction (and drop the NIL Go countdown — disclosure clocks for executed
// deals are surfaced via payment/escrow, not a pre-clearance prompt).
const PRE_CLEARANCE_STAGES: ReadonlySet<BrandDealDetail['stage']['key']> = new Set([
  'draft',
  'sent',
  'negotiation',
]);

function isPreClearance(detail: BrandDealDetail): boolean {
  return PRE_CLEARANCE_STAGES.has(detail.stage.key ?? detail.deal.stage);
}

const PAYMENT_STATE_LABEL: Record<DealTruth['paymentState'], string> = {
  expected: 'Expected',
  'in-review': 'In review',
  cleared: 'Cleared',
  paid: 'Paid',
};

// ── Join ─────────────────────────────────────────────────────────────────────

export function buildDealEnrichment(detail: BrandDealDetail): DealEnrichment {
  const bridge = DEAL_ID_BRIDGE[detail.id] ?? {};
  const out: DealEnrichment = {};

  // ── Payment truth (three-state expected/in-review/cleared/paid) ──────────
  const truth = bridge.truthId
    ? DEAL_TRUTH_FIXTURE.find((t) => t.dealId === bridge.truthId)
    : undefined;
  if (truth) {
    out.payment = {
      dealId: truth.dealId,
      state: truth.paymentState,
      stateLabel: PAYMENT_STATE_LABEL[truth.paymentState],
      amount: formatCentsUSD(truth.amountCents),
      ...(truth.paidAtISO ? { paidAt: truth.paidAtISO } : {}),
      ...(truth.taxSetAsideCents !== undefined
        ? { taxSetAside: formatCentsUSD(truth.taxSetAsideCents) }
        : {}),
    };
  }

  // ── FMV band + clearance read — ONLY while clearance is a live question ───
  // For pre-clearance deals (draft/sent/negotiation) we render the forward-
  // looking prediction. For executed deals (signed/live) we render a settled
  // clearance STATUS line instead (built below) — never both.
  const preClearance = isPreClearance(detail);
  const profile = DEAL_FMV_PROFILE[detail.id];
  const amountCents = parseDisplayMoneyToCents(detail.money.total);
  if (preClearance && profile && amountCents !== null) {
    const prediction = predictClearance({
      amountCents,
      dealKind: profile.dealKind,
      deliverableDescription: profile.deliverableDescription,
      payerEntityType: profile.payerEntityType,
      totalFollowers: profile.totalFollowers,
      engagementRate7d: profile.engagementRate7d,
      athleteId: detail.id,
      dealId: detail.id,
    });
    out.fmv = {
      band: `${formatCentsUSD(prediction.fmv.lowCents)} – ${formatCentsUSD(prediction.fmv.highCents)}`,
      point: formatCentsUSD(prediction.fmv.pointCents),
      confidence: prediction.confidence,
      bandLabel: prediction.bandLabel,
      reason: prediction.reason,
      amount: formatCentsUSD(amountCents),
      disclaimer: FMV_DISCLAIMER,
    };
  }

  // ── NIL Go deadline — pre-clearance + undisclosed only ────────────────────
  // The countdown is a "file this before you're ineligible" prompt; it only
  // belongs while the deal is still in flight.
  if (preClearance && truth && truth.disclosure.state === 'undisclosed') {
    const deadlineISO = truth.disclosure.deadlineISO ?? nilGoDeadline(truth.disclosure.executedAtISO);
    out.nilGo = {
      deadlineISO,
      hoursRemaining: hoursUntilISO(deadlineISO),
    };
  }

  // ── Clearance STATUS — settled read for executed deals ────────────────────
  // Replaces the FMV prediction once the deal is signed/live. Prefer the real
  // disclosure/payment truth where bridged; otherwise fall back to a stage-only
  // line. Payment truth + escrow still render alongside (always relevant).
  if (!preClearance) {
    const disclosure = truth?.disclosure.state;
    const passedNilGo = disclosure === 'cleared';
    let label: string;
    let cleared: boolean;
    if (passedNilGo) {
      // Disclosure cleared the school/CSC NIL Go portal — the settled happy path.
      label = 'Cleared · passed NIL Go';
      cleared = true;
    } else if (disclosure === 'denied') {
      label = 'Executed · NIL Go denied';
      cleared = false;
    } else if (disclosure !== undefined && disclosure !== 'not-required') {
      // Executed but disclosure still moving (undisclosed/submitted/in-review).
      label = 'Executed · NIL Go disclosure pending';
      cleared = false;
    } else {
      // No bridged truth (or not-required): report the lifecycle stage we know.
      label = `${detail.stage.label} · clearance settled`;
      cleared = true;
    }
    out.clearanceStatus = { label, cleared };
  }

  // ── Escrow / milestones — only where the bridge maps to an engine deal ────
  if (bridge.engineId && bridge.engineId === DEMO_DEAL.dealId) {
    const engine = DEMO_DEAL;
    out.escrow = {
      dealId: engine.dealId,
      funded: formatCentsUSD(engine.escrow.fundedCents),
      released: formatCentsUSD(engine.escrow.releasedCents),
      state: engine.escrow.state,
      milestones: engine.milestones.map((m) => ({
        id: m.id,
        description: m.description,
        amount: formatCentsUSD(m.amountCents),
        status: m.status,
      })),
    };
  }

  return out;
}
