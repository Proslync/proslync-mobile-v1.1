// components/school/triage-detail-sheet.tsx
// ── NIL GO TRIAGE — FLAG DETAIL SHEET ─────────────────────────────────────
// Charter-safe expansion of a single NIL Go Triage row. The school/AD role is
// a DERIVATIVE-STATE CONSUMER only: this sheet shows the clock, the flag state,
// the BANDED value, and the SPARTA/AE flags — and offers EXPORT as the only
// action (mirrors the SPARTA ledger's export-only pattern).
//
// CHARTER LAW — this sheet deliberately does NOT and MUST NOT:
//   · show a per-athlete dollar amount (banded ranges only)
//   · expose approve / veto controls (review and flag; never approve or veto)
//   · surface a payer/fan identity or rev-share tooling
// It reuses the Modal / scrim / slide-up pattern + shared ui-kit tokens.
// No animations beyond the slide (charter law). Tabular numerals on the band.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  ACCENT,
  HAIRLINE,
  HAIRLINE_SUBTLE,
  RADIUS_CARD,
  RADIUS_LG,
  RADIUS_SM,
  SIGNAL_NEGATIVE,
  SIGNAL_POSITIVE,
  SIGNAL_WARN,
  SP_LG,
  SP_MD,
  SP_SM,
  SP_XS,
  SURFACE,
  SURFACE_SUBTLE,
  TEXT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  WEIGHT,
} from '@/components/shared/ui-kit/tokens';

// ── Public shape — what a caller hands the sheet ──────────────────────────
// Mirrors the `TriageRow` fixture in school-home.tsx (kept structural so the
// two can converge without a shared type import either direction).
export interface TriageDetail {
  id: string;
  athlete: string;
  /** Brand / collective / window label (the row's "entity"). */
  entity: string;
  /** Clock + clearance state copy, e.g. "2 days left on clock". */
  status: string;
  statusType: 'clear' | 'warn' | 'amber';
  /** Banded value only — never a precise per-athlete dollar amount. */
  detail?: string;
}

interface TriageDetailSheetProps {
  row: TriageDetail | null;
  visible: boolean;
  onClose: () => void;
}

function signalColor(statusType: TriageDetail['statusType']): string {
  if (statusType === 'clear') return SIGNAL_POSITIVE;
  if (statusType === 'warn') return SIGNAL_NEGATIVE;
  return SIGNAL_WARN;
}

function clockLabel(statusType: TriageDetail['statusType']): string {
  if (statusType === 'clear') return 'Cleared — no clock running';
  if (statusType === 'warn') return 'On the clock — action window closing';
  return 'Resubmission window open';
}

// Derive the SPARTA/AE flag lines from the row state. These are FLAGS the
// office reviews — never actions it takes.
function flagLines(row: TriageDetail): { icon: keyof typeof Ionicons.glyphMap; text: string; tone: string }[] {
  const lines: { icon: keyof typeof Ionicons.glyphMap; text: string; tone: string }[] = [];
  if (row.statusType === 'warn') {
    lines.push({
      icon: 'flag',
      text: 'SPARTA: disclosure undisclosed past the clock — flag for follow-up',
      tone: SIGNAL_NEGATIVE,
    });
    lines.push({
      icon: 'business-outline',
      text: 'AE: associated-entity deal — confirm valid-business-purpose docs',
      tone: SIGNAL_WARN,
    });
  } else if (row.statusType === 'amber') {
    lines.push({
      icon: 'time-outline',
      text: 'SPARTA: resubmission in progress — within the 14-day window',
      tone: SIGNAL_WARN,
    });
  } else {
    lines.push({
      icon: 'checkmark-circle',
      text: 'SPARTA: submitted and cleared — no open flags',
      tone: SIGNAL_POSITIVE,
    });
  }
  return lines;
}

export function TriageDetailSheet({ row, visible, onClose }: TriageDetailSheetProps) {
  if (!row) return null;

  const color = signalColor(row.statusType);
  const flags = flagLines(row);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Pressable style={styles.sheetScrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Header — athlete · entity */}
            <Text style={styles.eyebrow}>NIL GO TRIAGE · FLAG DETAIL</Text>
            <Text style={styles.athlete}>{row.athlete}</Text>
            <Text style={styles.entity} numberOfLines={2}>
              {row.entity}
            </Text>

            {/* Clock + clearance state */}
            <View style={styles.clockCard}>
              <View style={[styles.clockStripe, { backgroundColor: color }]} />
              <View style={styles.clockContent}>
                <Text style={styles.clockLabel}>{clockLabel(row.statusType)}</Text>
                <Text style={[styles.clockStatus, { color }]}>{row.status}</Text>
              </View>
            </View>

            {/* Banded value — ranges only, never a precise dollar amount */}
            <Text style={styles.sectionLabel}>VALUE BAND</Text>
            <View style={styles.bandCard}>
              <Text style={styles.bandValue}>{row.detail ?? 'Band not yet disclosed'}</Text>
              <Text style={styles.bandNote}>
                Banded range only — the office never sees the athlete's exact figure.
              </Text>
            </View>

            {/* SPARTA / AE flags */}
            <Text style={styles.sectionLabel}>FLAGS</Text>
            <View style={styles.flagsCard}>
              {flags.map((f, i) => (
                <View key={f.text} style={[styles.flagRow, i > 0 && styles.flagRowBorder]}>
                  <Ionicons name={f.icon} size={15} color={f.tone} />
                  <Text style={styles.flagText}>{f.text}</Text>
                </View>
              ))}
            </View>

            {/* EXPORT — the only action (review-and-flag charter, export-only) */}
            <Pressable
              style={({ pressed }) => [styles.ghostBtn, { opacity: pressed ? 0.65 : 1 }]}
              onPress={() =>
                Alert.alert(
                  'Export ready',
                  "This triage flag has been exported in the office's review schema.",
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Export this triage flag"
            >
              <Ionicons name="document-outline" size={14} color={ACCENT} />
              <Text style={styles.ghostBtnText}>EXPORT FLAG</Text>
            </Pressable>

            {/* Charter restatement — review and flag; never approve or veto */}
            <Text style={styles.charterNote}>
              Review and flag — never approve or veto. Proslync surfaces clocks and flags, never the
              athlete's ledger.
            </Text>

            <Pressable
              style={styles.secondaryBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close triage detail"
            >
              <Text style={styles.secondaryBtnText}>Close</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: RADIUS_LG,
    borderTopRightRadius: RADIUS_LG,
    paddingTop: SP_SM,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: SP_SM,
  },
  scroll: { paddingHorizontal: SP_LG, paddingBottom: SP_SM },

  eyebrow: {
    color: TEXT_TERTIARY,
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    letterSpacing: 1,
    marginBottom: SP_XS,
  },
  athlete: {
    color: TEXT_PRIMARY,
    fontSize: TEXT.heading,
    fontWeight: WEIGHT.bold,
    letterSpacing: -0.3,
  },
  entity: {
    color: TEXT_SECONDARY,
    fontSize: TEXT.label,
    marginTop: SP_XS,
    lineHeight: 18,
  },

  clockCard: {
    flexDirection: 'row',
    borderRadius: RADIUS_SM,
    overflow: 'hidden',
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    marginTop: SP_LG,
  },
  clockStripe: {
    width: 3,
    borderTopLeftRadius: RADIUS_SM,
    borderBottomLeftRadius: RADIUS_SM,
  },
  clockContent: {
    flex: 1,
    paddingHorizontal: SP_SM,
    paddingVertical: SP_SM,
    gap: 3,
  },
  clockLabel: {
    color: TEXT_SECONDARY,
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.semibold,
  },
  clockStatus: {
    fontSize: TEXT.label,
    fontWeight: WEIGHT.bold,
    fontVariant: ['tabular-nums'],
  },

  sectionLabel: {
    color: TEXT_TERTIARY,
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    letterSpacing: 0.8,
    marginTop: SP_LG,
    marginBottom: SP_SM,
  },

  bandCard: {
    backgroundColor: SURFACE,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    paddingHorizontal: SP_MD,
    paddingVertical: SP_MD,
    gap: SP_XS,
  },
  bandValue: {
    color: TEXT_PRIMARY,
    fontSize: TEXT.title,
    fontWeight: WEIGHT.bold,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  bandNote: {
    color: TEXT_TERTIARY,
    fontSize: TEXT.caption,
    lineHeight: 16,
  },

  flagsCard: {
    backgroundColor: SURFACE,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    paddingHorizontal: SP_MD,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SP_SM,
    paddingVertical: SP_MD,
  },
  flagRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE_SUBTLE,
  },
  flagText: {
    flex: 1,
    color: TEXT_SECONDARY,
    fontSize: TEXT.label,
    lineHeight: 18,
  },

  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: SP_LG,
    minHeight: 48,
    paddingVertical: 11,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ACCENT}55`,
    backgroundColor: `${ACCENT}10`,
  },
  ghostBtnText: {
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    color: ACCENT,
    letterSpacing: 0.7,
  },

  charterNote: {
    color: TEXT_TERTIARY,
    fontSize: TEXT.caption,
    marginTop: SP_MD,
    lineHeight: 16,
    textAlign: 'center',
  },

  secondaryBtn: {
    marginTop: SP_MD,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS_CARD,
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  secondaryBtnText: {
    color: TEXT_SECONDARY,
    fontSize: TEXT.body,
    fontWeight: WEIGHT.semibold,
  },
});
