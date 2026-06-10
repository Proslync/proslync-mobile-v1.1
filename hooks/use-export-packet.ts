// ── COMPLIANCE EXPORT PACKET HOOKS (Sprint 3.8) ──────────
// React-Query bindings for the mock compliance-packet export façade.
// `useGenerateExportPacket` is a mutation (the user's tap is the
// trigger); `useExportReceipt` is a passive query for any surface
// that wants to show an existing receipt by id. Cache cadence
// matches the disclosure / risk-report hooks (2-minute stale,
// 10-minute gc) so receipts don't stick around in memory longer
// than the rest of the compliance graph.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { complianceExportApi } from '@/lib/api/compliance-export';
import type {
  ExportPacketKind,
  ExportPacketReceipt,
} from '@/lib/types/compliance-export.types';

export const EXPORT_PACKET_KEY = 'export-packet';

export interface GenerateExportPacketVars {
  kind: ExportPacketKind;
  subjectId: string;
}

export function useGenerateExportPacket() {
  const queryClient = useQueryClient();
  return useMutation<
    ExportPacketReceipt | null,
    Error,
    GenerateExportPacketVars
  >({
    mutationFn: ({ kind, subjectId }) =>
      complianceExportApi.generate(kind, subjectId),
    onSuccess: (receipt) => {
      if (receipt) {
        queryClient.setQueryData([EXPORT_PACKET_KEY, receipt.id], receipt);
      }
    },
  });
}

export function useExportReceipt(id: string | null | undefined) {
  return useQuery({
    queryKey: [EXPORT_PACKET_KEY, id],
    queryFn: () => complianceExportApi.getReceipt(id ?? ''),
    enabled: Boolean(id),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}
