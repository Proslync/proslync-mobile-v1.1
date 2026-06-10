// ── EXPORT PACKET BUTTON (Sprint 3.8) ────────────────────
// Pressable card that lets a NIL Manager (or any role surfaced on the
// disclosure / deal-detail surface) generate a compliance-export
// receipt and copy the synthetic JSON payload to the clipboard.
//
// Real `expo-print` PDF + native share-sheet generation is deferred
// per PLAN §3.8 + Q18 until counsel-approved policy wording lands.
// Today's slice ships:
//   1. "Generate export packet" CTA -> mutation -> "Generating…" state
//   2. "Ready" pill with size info ("47 fields · 3 pages")
//   3. "Copy JSON preview" secondary CTA -> `Clipboard.setStringAsync`
//   4. Teal "Copied to clipboard" StatusPill that fades after 2s
//   5. Standing caveat copy from `EXPORT_PACKET_CAVEAT`

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  RADIUS_MD,
  RADIUS_SM,
  StatusPill,
  TONE_COLOR,
} from '@/components/shared/ui-kit';
import { useGenerateExportPacket } from '@/hooks/use-export-packet';
import type {
  ExportPacketKind,
  ExportPacketReceipt,
} from '@/lib/types/compliance-export.types';

const COPIED_FADE_MS = 2_000;

export interface ExportPacketButtonProps {
  kind: ExportPacketKind;
  subjectId: string;
  subjectLabel: string;
}

export function ExportPacketButton({
  kind,
  subjectId,
  subjectLabel,
}: ExportPacketButtonProps) {
  const generate = useGenerateExportPacket();
  const [receipt, setReceipt] = React.useState<ExportPacketReceipt | null>(null);
  const [copied, setCopied] = React.useState(false);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const onGenerate = React.useCallback(() => {
    generate.mutate(
      { kind, subjectId },
      {
        onSuccess: (data) => {
          if (data) setReceipt(data);
        },
      },
    );
  }, [generate, kind, subjectId]);

  const onCopy = React.useCallback(async () => {
    if (!receipt) return;
    await Clipboard.setStringAsync(JSON.stringify(receipt.mockJsonPayload, null, 2));
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), COPIED_FADE_MS);
  }, [receipt]);

  const isGenerating = generate.isPending;
  const sizeLabel = receipt
    ? `${receipt.size.fields} fields · ${receipt.size.pages} ${receipt.size.pages === 1 ? 'page' : 'pages'}`
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="cloud-download-outline" size={16} color={TONE_COLOR.info} />
        <Text style={styles.title}>Compliance export packet</Text>
      </View>
      <Text style={styles.subtitle} numberOfLines={2}>
        {subjectLabel}
      </Text>

      {!receipt ? (
        <Pressable
          onPress={onGenerate}
          disabled={isGenerating}
          accessibilityRole="button"
          accessibilityLabel="Generate compliance export packet"
          style={({ pressed }) => [
            styles.primaryCta,
            (pressed || isGenerating) && { opacity: 0.7 },
          ]}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator size="small" color="#000000" />
              <Text style={styles.primaryCtaText}>Generating…</Text>
            </>
          ) : (
            <>
              <Ionicons name="document-text-outline" size={15} color="#000000" />
              <Text style={styles.primaryCtaText}>Generate export packet</Text>
            </>
          )}
        </Pressable>
      ) : (
        <View style={styles.readyBlock}>
          <View style={styles.pillRow}>
            <StatusPill label="Ready" tone="success" icon="checkmark-circle-outline" />
            {sizeLabel ? (
              <Text style={styles.sizeText}>{sizeLabel}</Text>
            ) : null}
          </View>

          <Pressable
            onPress={onCopy}
            accessibilityRole="button"
            accessibilityLabel="Copy export packet JSON preview to clipboard"
            style={({ pressed }) => [
              styles.secondaryCta,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons name="copy-outline" size={14} color={TONE_COLOR.info} />
            <Text style={styles.secondaryCtaText}>Copy JSON preview</Text>
          </Pressable>

          {copied ? (
            <View style={styles.copiedRow}>
              <StatusPill
                label="Copied to clipboard"
                tone="success"
                icon="clipboard-outline"
              />
            </View>
          ) : null}
        </View>
      )}

      <Text style={styles.caveat} numberOfLines={4}>
        {receipt?.caveat ??
          "Proslync is not an official CSC submitter — exported packets are the school's reviewer record only. Verify with school counsel before any external use."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 14,
  },
  head: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS_SM,
    backgroundColor: TONE_COLOR.info,
    marginTop: 4,
  },
  primaryCtaText: {
    color: '#000000',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  readyBlock: {
    gap: 10,
    marginTop: 4,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  sizeText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS_SM,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${TONE_COLOR.info}55`,
    backgroundColor: CARD_BG_INSET,
  },
  secondaryCtaText: {
    color: TONE_COLOR.info,
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  copiedRow: {
    flexDirection: 'row',
  },
  caveat: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 4,
  },
});
