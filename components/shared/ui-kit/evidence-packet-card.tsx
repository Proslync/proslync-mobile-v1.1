// ── EVIDENCE PACKET CARD ──────────────────────────────────
// AI-compliance "evidence packet" block: match-score header, summary
// line, optional commitment row (status dot + label + due), optional
// source row (label + state + freshness). Used inside a `<DealRow>`
// children slot or as a standalone block in deal-detail surfaces.
//
// Lifts from `app/(tabs)/deals.tsx` (DealCard inline `evidenceBlock`
// View — lines ~95–122) which currently re-implements the layout +
// hard-codes the teal color. The same shape recurs in the Brand HQ
// open-deals card and the NIL Manager queue review row; centralizing
// here keeps the matchScore typography + status-dot semantics
// consistent and routes the tint through Status tokens.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Status } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAppTheme } from '@/hooks/use-app-theme';

export type EvidenceCommitmentStatus = 'done' | 'active' | 'queued' | 'blocked';

const COMMITMENT_TONE: Record<EvidenceCommitmentStatus, keyof typeof Status> = {
  done: 'success',
  active: 'warning',  // copper — active is the in-flight signal
  queued: 'info',
  blocked: 'critical',
};

export interface EvidencePacketCommitment {
  title: string;
  due: string;
  status: EvidenceCommitmentStatus;
}

export interface EvidencePacketSource {
  label: string;
  state: string;
  freshness: string;
}

export interface EvidencePacketCardProps {
  /** AI match confidence, 0–100. */
  matchScore: number;
  /** One-line summary of the AI compliance verdict. */
  summary: string;
  /** Up to 3 commitments rendered as status-dot rows. Pass `[]` to skip. */
  commitments?: EvidencePacketCommitment[];
  /** Up to 2 sources rendered as muted footnotes. Pass `[]` to skip. */
  sources?: EvidencePacketSource[];
  /** Override the header label. Default: "Evidence packet". */
  label?: string;
  /** Container style passthrough. */
  style?: StyleProp<ViewStyle>;
}

const MAX_COMMITMENTS = 3;
const MAX_SOURCES = 2;

export function EvidencePacketCard({
  matchScore,
  summary,
  commitments = [],
  sources = [],
  label = 'Evidence packet',
  style,
}: EvidencePacketCardProps) {
  const { colors } = useAppTheme();
  const accent = Status.success; // verdict surface — "we have evidence"

  const visibleCommitments = commitments.slice(0, MAX_COMMITMENTS);
  const visibleSources = sources.slice(0, MAX_SOURCES);

  return (
    <View
      style={[
        styles.block,
        {
          backgroundColor: accent.soft,
          borderColor: `${accent.fill}33`,
        },
        style,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`${label}, score ${matchScore}. ${summary}`}
    >
      <View style={styles.header}>
        <Ionicons
          name="shield-checkmark-outline"
          size={15}
          color={accent.ink}
        />
        <Text style={[styles.label, { color: accent.ink }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.score, { color: accent.ink }]}>{matchScore}</Text>
      </View>

      <Text
        style={[styles.summary, { color: colors.text }]}
        numberOfLines={3}
      >
        {summary}
      </Text>

      {visibleCommitments.length > 0 ? (
        <View style={styles.commitments}>
          {visibleCommitments.map((c, i) => (
            <View key={`${c.title}-${i}`} style={styles.commitmentRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: Status[COMMITMENT_TONE[c.status]].fill },
                ]}
              />
              <Text
                style={[styles.commitmentText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {c.title} due {c.due}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {visibleSources.length > 0 ? (
        <View style={styles.sources}>
          {visibleSources.map((s, i) => (
            <Text
              key={`${s.label}-${i}`}
              style={[styles.sourceText, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {s.label}: {s.state} · {s.freshness}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
    padding: Spacing.md - 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs + 3,
  },
  label: {
    flex: 1,
    fontFamily: Typography.micro.fontFamily,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  score: {
    fontFamily: Typography.title.fontFamily,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  summary: {
    fontFamily: Typography.callout.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  commitments: {
    gap: Spacing.xs,
  },
  commitmentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs + 3,
  },
  dot: {
    borderRadius: 5,
    height: 7,
    width: 7,
  },
  commitmentText: {
    flex: 1,
    fontFamily: Typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
  },
  sources: {
    gap: 2,
  },
  sourceText: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
});
