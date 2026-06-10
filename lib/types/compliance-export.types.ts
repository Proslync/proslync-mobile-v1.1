// ── COMPLIANCE EXPORT PACKET TYPES (Sprint 3.8) ──────────
// Mock-first export-packet receipt schema for the compliance-packet
// export primitive. This is the placeholder slice that lets a NIL
// Manager generate a disclosure or deal-evidence packet for school
// review. Real `expo-print` / native-share PDF generation is deferred
// per PLAN §3.8 + Q18 until counsel-approved policy wording lands;
// today's slice ships the schema + a mock generator + a clipboard
// JSON-preview share trigger.
//
// Every receipt must carry the standing `caveat` below — Proslync is
// not an official CSC submitter and these packets are the school's
// reviewer record only. The discipline mirrors `cscNote` on
// `ComplianceDisclosure` and the synthetic-source caveats on
// `ComparableDealRow`.

/** Subject family for an export packet. */
export type ExportPacketKind =
  | 'disclosure'           // ComplianceDisclosure -> school reviewer record
  | 'deal-evidence'        // BrandDealDetail -> evidence packet for AD review
  | 'compliance-summary';  // Roll-up across an athlete or program

/** Lifecycle for a generated export packet. */
export type ExportPacketState =
  | 'draft'        // schema-only, not yet generated
  | 'generating'   // mock generator in flight
  | 'ready'        // generated and clipboard-shareable
  | 'shared'       // user has copied / handed off the packet
  | 'expired';     // receipt aged out (placeholder — not enforced today)

/** Pointer back to the underlying record this packet is anchored on. */
export interface ExportPacketSubjectRef {
  kind: ExportPacketKind;
  /** Source-record id (`disclosure.id`, `deal.id`, or athlete-id). */
  id: string;
  /** Human label rendered in receipt UI. */
  label: string;
}

/** Compact size descriptor for the export-packet preview chips. */
export interface ExportPacketSize {
  fields: number;
  pages: number;
}

/**
 * Standing caveat copy that MUST be carried on every receipt. Mirrors
 * the CSC discipline in `mock-disclosures.ts` (`cscNote`) and the
 * Sprint 3.8 disclosure-not-legal-guarantee posture in PLAN §3.8.
 */
export const EXPORT_PACKET_CAVEAT =
  "This packet is the school's reviewer record. Proslync is not an official CSC submitter. Verify with school counsel before any external use.";

/** Final receipt returned by the mock generator. */
export interface ExportPacketReceipt {
  id: string;
  kind: ExportPacketKind;
  subjectRef: ExportPacketSubjectRef;
  /** ISO 8601 timestamp the receipt was generated. */
  generatedAt: string;
  /** ISO 8601 timestamp the receipt is no longer considered fresh. */
  expiresAt: string;
  state: ExportPacketState;
  /** Synthetic JSON payload the share-sheet copy hands to the clipboard. */
  mockJsonPayload: object;
  size: ExportPacketSize;
  caveat: string;
}
