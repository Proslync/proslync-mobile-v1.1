// ── COMPLIANCE EXPORT API (Sprint 3.8) ───────────────────
// Mock-first façade for the compliance-packet export primitive. Both
// `generate` and `getReceipt` resolve from an in-memory map seeded by
// the pure builder. Real `expo-print` / native-share PDF generation is
// deferred per PLAN §3.8 until counsel-approved policy wording lands.
//
// `generate` simulates a small async cost (~600ms) so the UI can
// render a credible "Generating…" loading state.

import { buildExportReceipt } from '@/lib/utils/compliance-export-builder';
import type {
  ExportPacketKind,
  ExportPacketReceipt,
} from '@/lib/types/compliance-export.types';

const RECEIPT_CACHE = new Map<string, ExportPacketReceipt>();
const GENERATE_DELAY_MS = 600;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const complianceExportApi = {
  /**
   * Generate a fresh export-packet receipt for the given subject.
   * Resolves after a small simulated delay so the UI can render a
   * loading state. Caches the receipt by id for `getReceipt` lookup.
   */
  async generate(
    kind: ExportPacketKind,
    subjectId: string,
  ): Promise<ExportPacketReceipt | null> {
    if (!subjectId) return null;
    await delay(GENERATE_DELAY_MS);
    const receipt = buildExportReceipt(kind, subjectId);
    if (receipt) RECEIPT_CACHE.set(receipt.id, receipt);
    return receipt;
  },

  /** Look up a previously-generated receipt by id. */
  async getReceipt(id: string): Promise<ExportPacketReceipt | null> {
    if (!id) return null;
    return RECEIPT_CACHE.get(id) ?? null;
  },
};
