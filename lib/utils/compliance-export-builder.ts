// ── COMPLIANCE EXPORT BUILDER (Sprint 3.8) ───────────────
// Pure builder for `ExportPacketReceipt`. Reads from the in-app mock
// fixtures and produces a synthetic JSON payload + a size descriptor.
// No `expo-print`, no native share, no real PDF — that integration is
// deferred per PLAN §3.8 + Q18 until counsel-approved policy wording
// lands.
//
// All receipts carry the standing `EXPORT_PACKET_CAVEAT` so any
// downstream surface (chip, share-sheet preview, future PDF cover
// page) can render the same disclosure-not-legal-guarantee discipline.

import { getBrandDealDetail } from '@/lib/data/mock-brand-data';
import { getMockDisclosure } from '@/lib/data/mock-disclosures';
import {
  EXPORT_PACKET_CAVEAT,
  type ExportPacketKind,
  type ExportPacketReceipt,
  type ExportPacketSize,
  type ExportPacketSubjectRef,
} from '@/lib/types/compliance-export.types';

const PACKET_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const FIELDS_PER_PAGE = 18;

function makeReceiptId(kind: ExportPacketKind, subjectId: string): string {
  return `pkt_${kind}_${subjectId}_${Date.now().toString(36)}`;
}

function pageEstimate(fields: number): ExportPacketSize {
  return {
    fields,
    pages: Math.max(1, Math.ceil(fields / FIELDS_PER_PAGE)),
  };
}

interface BuiltPayload {
  payload: object;
  size: ExportPacketSize;
  subjectRef: ExportPacketSubjectRef;
}

function buildDisclosurePayload(subjectId: string): BuiltPayload | null {
  const disclosure = getMockDisclosure(subjectId);
  if (!disclosure) return null;

  const payload = {
    packet: 'disclosure',
    disclosureId: disclosure.id,
    athlete: disclosure.counterparties.athlete,
    brand: disclosure.counterparties.brand,
    agentOfRecord: disclosure.counterparties.agentOfRecord ?? null,
    thresholdState: disclosure.thresholdState,
    payorAssociationStatus: disclosure.payorAssociationStatus,
    arrangementTerms: disclosure.arrangementTerms,
    compensation: disclosure.compensation,
    serviceProviders: disclosure.serviceProviders,
    attachments: disclosure.attachments.map((a) => ({
      id: a.id,
      label: a.label,
      state: a.state,
    })),
    attestation: disclosure.attestation,
    actionHistory: disclosure.actionHistory.map((entry) => ({
      id: entry.id,
      action: entry.action,
      actor: entry.actor,
      at: entry.at,
      note: entry.note ?? null,
    })),
    reviewState: disclosure.reviewState,
    cscNote: disclosure.cscNote,
  };

  // Field count: leaf-key tally for the size chip.
  const fields =
    9 + // top-level scalars + nested object keys we always render
    Object.keys(disclosure.arrangementTerms).length +
    Object.keys(disclosure.compensation).length +
    disclosure.serviceProviders.length +
    disclosure.attachments.length * 3 +
    disclosure.actionHistory.length * 4;

  return {
    payload,
    size: pageEstimate(fields),
    subjectRef: {
      kind: 'disclosure',
      id: disclosure.id,
      label: `${disclosure.counterparties.brand.name} — ${disclosure.counterparties.athlete.name}`,
    },
  };
}

function buildDealEvidencePayload(subjectId: string): BuiltPayload | null {
  const detail = getBrandDealDetail(subjectId);
  if (!detail) return null;

  const payload = {
    packet: 'deal-evidence',
    dealId: detail.deal.id,
    company: detail.companyOverview,
    stage: detail.stage,
    money: detail.money,
    commitments: detail.commitments,
    contacts: detail.contacts,
    aiCompliance: detail.aiCompliance,
    evidence: detail.evidence,
  };

  const fields =
    8 + // top-level keys
    Object.keys(detail.companyOverview).length +
    Object.keys(detail.money).length +
    detail.commitments.length * 5 +
    detail.contacts.length * 4 +
    detail.aiCompliance.tracks.length * 3 +
    detail.evidence.attachments.length * 2 +
    detail.evidence.sources.length * 4;

  return {
    payload,
    size: pageEstimate(fields),
    subjectRef: {
      kind: 'deal-evidence',
      id: detail.deal.id,
      label: `${detail.companyOverview.name} x ${detail.deal.athlete}`,
    },
  };
}

function buildComplianceSummaryPayload(subjectId: string): BuiltPayload {
  // Lightweight roll-up placeholder — real implementation will fold per-
  // athlete consent + open-flag counts into a structured summary.
  const payload = {
    packet: 'compliance-summary',
    subjectId,
    generatedFor: 'school-review',
    summary:
      'Mock compliance roll-up placeholder. Real implementation pending Sprint 3.10 risk-report fold-in.',
  };
  return {
    payload,
    size: pageEstimate(6),
    subjectRef: {
      kind: 'compliance-summary',
      id: subjectId,
      label: `Compliance summary — ${subjectId}`,
    },
  };
}

/**
 * Build an `ExportPacketReceipt` from in-app mock fixtures. Returns
 * `null` when the kind/subjectId pair does not resolve to any source
 * data so the caller can render an error state.
 */
export function buildExportReceipt(
  kind: ExportPacketKind,
  subjectId: string,
): ExportPacketReceipt | null {
  let built: BuiltPayload | null = null;
  switch (kind) {
    case 'disclosure':
      built = buildDisclosurePayload(subjectId);
      break;
    case 'deal-evidence':
      built = buildDealEvidencePayload(subjectId);
      break;
    case 'compliance-summary':
      built = buildComplianceSummaryPayload(subjectId);
      break;
  }

  if (!built) return null;

  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + PACKET_TTL_MS);

  return {
    id: makeReceiptId(kind, subjectId),
    kind,
    subjectRef: built.subjectRef,
    generatedAt: generatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    state: 'ready',
    mockJsonPayload: built.payload,
    size: built.size,
    caveat: EXPORT_PACKET_CAVEAT,
  };
}
