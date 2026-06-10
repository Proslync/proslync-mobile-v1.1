// 7-field activation/category spine card.
//
// Shared between the NIL Manager deal-detail surface and the disclosure
// review surface so the same evidence shape lands in both places. Used
// by Brand HQ via inline chips on the campaign card (different visual
// density, same field set).
//
// Anchors:
//   - PLAN.md §0b — Sprint 2 type spine
//   - lib/types/activation.types.ts — canonical 7-field shape
//   - queue_item:01KR7Z1J63022KXAQ49PYHNNGM — closeout deliverable

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type {
  DealRightsLiteracy,
  DealTransferPolicy,
  DisclosureMode,
  FundingSourceKind,
  NilCategory,
  PaymentConfidence,
} from '@/lib/types/activation.types';

const ACCENT = '#EB621A';
const TEAL = '#14B8A6';
const YELLOW = '#FFD60A';

export type ActivationSpineProps = {
  nilCategory?: NilCategory;
  fundingSource?: FundingSourceKind;
  paymentConfidence?: PaymentConfidence;
  transferPolicy?: DealTransferPolicy;
  disclosureModes?: DisclosureMode[];
  rightsLiteracy?: DealRightsLiteracy;
  activationRequirementsLabel?: string;
  /** Compact density used in the disclosure review row. */
  compact?: boolean;
};

export function formatSpineToken(value: string): string {
  return value
    .split('-')
    .map((part) => (part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
}

function paymentConfidenceColor(level?: PaymentConfidence): string {
  if (level === 'paid') return TEAL;
  if (level === 'contracted') return TEAL;
  if (level === 'represented') return YELLOW;
  if (level === 'disputed') return '#FF453A';
  return 'rgba(255,255,255,0.55)';
}

function transferPolicyColor(policy?: DealTransferPolicy): string {
  if (policy === 'continues') return TEAL;
  if (policy === 'renegotiates') return YELLOW;
  if (policy === 'terminates') return '#FF453A';
  return 'rgba(255,255,255,0.55)';
}

export function ActivationSpineCard(props: ActivationSpineProps): React.ReactElement | null {
  const {
    nilCategory,
    fundingSource,
    paymentConfidence,
    transferPolicy,
    disclosureModes,
    rightsLiteracy,
    activationRequirementsLabel,
    compact,
  } = props;

  const hasAny =
    nilCategory ||
    fundingSource ||
    paymentConfidence ||
    transferPolicy ||
    (disclosureModes && disclosureModes.length > 0) ||
    rightsLiteracy ||
    activationRequirementsLabel;
  if (!hasAny) return null;

  return (
    <View style={[styles.card, compact && styles.cardCompact]} accessibilityLabel="Activation spine">
      <View style={styles.headRow}>
        <Ionicons name="layers-outline" size={14} color={ACCENT} />
        <Text style={styles.headLabel}>ACTIVATION SPINE · 7 FIELDS</Text>
      </View>

      <View style={styles.chipRow}>
        {nilCategory && (
          <Chip label="NIL CATEGORY" value={formatSpineToken(nilCategory)} tint="rgba(255,111,60,0.16)" border="rgba(255,111,60,0.40)" textColor={ACCENT} />
        )}
        {fundingSource && (
          <Chip label="FUNDING" value={formatSpineToken(fundingSource)} tint="rgba(255,255,255,0.06)" border="rgba(255,255,255,0.16)" textColor="#FFF" />
        )}
        {paymentConfidence && (
          <Chip
            label="PAYMENT"
            value={formatSpineToken(paymentConfidence)}
            tint={`${paymentConfidenceColor(paymentConfidence)}1A`}
            border={`${paymentConfidenceColor(paymentConfidence)}55`}
            textColor={paymentConfidenceColor(paymentConfidence)}
          />
        )}
        {transferPolicy && (
          <Chip
            label="TRANSFER"
            value={formatSpineToken(transferPolicy)}
            tint={`${transferPolicyColor(transferPolicy)}1A`}
            border={`${transferPolicyColor(transferPolicy)}55`}
            textColor={transferPolicyColor(transferPolicy)}
          />
        )}
        {disclosureModes && disclosureModes.length > 0 && (
          <Chip
            label="DISCLOSURE"
            value={disclosureModes.map(formatSpineToken).join(' + ')}
            tint="rgba(20,184,166,0.10)"
            border="rgba(20,184,166,0.40)"
            textColor={TEAL}
          />
        )}
      </View>

      {!compact && activationRequirementsLabel && (
        <View style={styles.requirementBlock}>
          <Text style={styles.fieldLabel}>ACTIVATION REQUIREMENTS</Text>
          <Text style={styles.fieldValue}>{activationRequirementsLabel}</Text>
        </View>
      )}

      {!compact && rightsLiteracy && (
        <View style={styles.rightsBlock}>
          <Text style={styles.fieldLabel}>RIGHTS LITERACY</Text>
          {rightsLiteracy.contentOwnership && (
            <RightsLine label="Content ownership" value={rightsLiteracy.contentOwnership} />
          )}
          {rightsLiteracy.exclusivityScope && (
            <RightsLine label="Exclusivity scope" value={rightsLiteracy.exclusivityScope} />
          )}
          {rightsLiteracy.durationSummary && (
            <RightsLine label="Duration" value={rightsLiteracy.durationSummary} />
          )}
          {rightsLiteracy.representativeFeeSummary && (
            <RightsLine label="Rep fee" value={rightsLiteracy.representativeFeeSummary} />
          )}
          {rightsLiteracy.workloadWindow && (
            <RightsLine label="Workload" value={rightsLiteracy.workloadWindow} />
          )}
          {rightsLiteracy.valuesFitRationale && (
            <RightsLine label="Values fit" value={rightsLiteracy.valuesFitRationale} />
          )}
          {rightsLiteracy.caveat && (
            <View style={styles.caveatRow}>
              <Ionicons name="warning-outline" size={12} color={ACCENT} />
              <Text style={styles.caveatText}>{rightsLiteracy.caveat}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function Chip({
  label,
  value,
  tint,
  border,
  textColor,
}: {
  label: string;
  value: string;
  tint: string;
  border: string;
  textColor: string;
}): React.ReactElement {
  return (
    <View style={[styles.chip, { backgroundColor: tint, borderColor: border }]}>
      <Text style={[styles.chipLabel, { color: textColor }]}>{label}</Text>
      <Text style={[styles.chipValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

function RightsLine({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.rightsLine}>
      <Text style={styles.rightsLabel}>{label}</Text>
      <Text style={styles.rightsValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.34)',
    backgroundColor: 'rgba(255,111,60,0.06)',
    padding: 12,
    gap: 10,
    marginTop: 4,
  },
  cardCompact: {
    padding: 10,
    gap: 8,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    color: ACCENT,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  chipLabel: { fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5, opacity: 0.85 },
  chipValue: { fontSize: 11, fontWeight: '800' },

  requirementBlock: {
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 10,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.55)',
  },
  fieldValue: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 17,
  },

  rightsBlock: {
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 10,
    gap: 6,
  },
  rightsLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rightsLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '800',
    letterSpacing: 0.3,
    width: 96,
    paddingTop: 1,
  },
  rightsValue: {
    flex: 1,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.86)',
    lineHeight: 16,
  },
  caveatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 4,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  caveatText: {
    flex: 1,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    lineHeight: 15,
  },
});
