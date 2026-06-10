// ── DISCLOSURE FORM (Sprint 3.4) ─────────────────────────
// Read-only render of the NIL Go-shaped athlete disclosure packet
// (`ComplianceDisclosure`). Sections render in NIL Go's order:
//
//   1. CSC discipline banner (always visible, yellow tone)
//   2. Threshold + payor association
//   3. Counterparties
//   4. Arrangement terms
//   5. Compensation + payment schedule
//   6. Service providers
//   7. Attachments
//   8. Attestation
//   9. Action history
//
// Visual tokens are pulled from `components/shared/ui-kit/tokens.ts`
// (radius 10, hairline borders, dark-glass `rgba(255,255,255,0.055)`).
//
// PLAN.md §3.4 + Mrs. Wilson P5. The `cscNote` discipline is non-optional —
// every render carries the "Proslync is NOT an official CSC submitter"
// banner above the first section.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { DisclosureEditSheet } from '@/components/disclosure/disclosure-edit-sheet';
import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  RADIUS_MD,
  RADIUS_PILL,
  SectionCard,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import type { MoneyAmount } from '@/lib/types/comparable-deal.types';
import type {
  ComplianceDisclosure,
  DisclosureAction,
  DisclosureActionLogEntry,
  DisclosureAttachmentState,
  DisclosurePaymentSchedule,
  DisclosureReviewState,
  DisclosureThresholdState,
  PayorAssociationStatus,
} from '@/lib/types/compliance-disclosure.types';

// Reviewer states that lock the disclosure — Edit pill hides once a
// disclosure is in school review or approved. Drafts, flagged, amended,
// and submitted-but-not-yet-acknowledged remain editable for athlete
// self-correction.
const LOCKED_REVIEW_STATES: readonly DisclosureReviewState[] = [
  'school-review',
  'approved',
];

export interface DisclosureFormProps {
  disclosure: ComplianceDisclosure;
  /**
   * Optional save handler. Called with the patch when the inline edit
   * sheet's Save button fires. If omitted, the Edit affordance is
   * suppressed (read-only mode).
   */
  onSave?: (patch: Partial<ComplianceDisclosure>) => void;
  /** True while an `onSave` mutation is in-flight. */
  isSaving?: boolean;
  /**
   * Bumps the "Updated!" toast — pass an incrementing counter from the
   * parent (e.g. mutation success count) to flash the pill again.
   */
  savedTick?: number;
}

export function DisclosureForm({
  disclosure,
  onSave,
  isSaving = false,
  savedTick = 0,
}: DisclosureFormProps) {
  const [editing, setEditing] = React.useState(false);
  const lockedForEdit = LOCKED_REVIEW_STATES.includes(disclosure.reviewState);
  const canEdit = Boolean(onSave) && !lockedForEdit;

  // "Updated!" pill auto-fades after 2s on every savedTick bump.
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [showSaved, setShowSaved] = React.useState(false);
  const lastTickRef = React.useRef(savedTick);

  React.useEffect(() => {
    if (savedTick === lastTickRef.current) return;
    lastTickRef.current = savedTick;
    setShowSaved(true);
    fadeAnim.setValue(1);
    const timeout = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start(() => setShowSaved(false));
    }, 1700);
    return () => clearTimeout(timeout);
  }, [savedTick, fadeAnim]);

  const handleSave = React.useCallback(
    (patch: Partial<ComplianceDisclosure>) => {
      onSave?.(patch);
      setEditing(false);
    },
    [onSave],
  );

  return (
    <View style={styles.root}>
      <CscBanner note={disclosure.cscNote} />
      {canEdit ? (
        <View style={styles.editHeader}>
          <Pressable
            onPress={() => setEditing((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={editing ? 'Close edit panel' : 'Edit disclosure fields'}
            style={({ pressed }) => [
              styles.editPill,
              editing && styles.editPillActive,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons
              name={editing ? 'close' : 'create-outline'}
              size={13}
              color={editing ? '#000000' : TONE_COLOR.accent}
            />
            <Text
              style={[
                styles.editPillText,
                editing && styles.editPillTextActive,
              ]}
            >
              {editing ? 'Close' : 'Edit'}
            </Text>
          </Pressable>
          {showSaved ? (
            <Animated.View style={{ opacity: fadeAnim }}>
              <StatusPill
                tone="success"
                label="Updated!"
                icon="checkmark-circle-outline"
              />
            </Animated.View>
          ) : null}
        </View>
      ) : null}
      {editing && onSave ? (
        <DisclosureEditSheet
          disclosure={disclosure}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          isSaving={isSaving}
        />
      ) : null}
      <ThresholdSection
        thresholdState={disclosure.thresholdState}
        payorStatus={disclosure.payorAssociationStatus}
        reviewState={disclosure.reviewState}
      />
      <CounterpartiesSection counterparties={disclosure.counterparties} />
      <ArrangementSection terms={disclosure.arrangementTerms} />
      <CompensationSection compensation={disclosure.compensation} />
      <ServiceProvidersSection providers={disclosure.serviceProviders} />
      <AttachmentsSection attachments={disclosure.attachments} />
      <AttestationSection attestation={disclosure.attestation} />
      <ActionHistorySection history={disclosure.actionHistory} />
    </View>
  );
}

// ── CSC DISCIPLINE BANNER ────────────────────────────────

function CscBanner({ note }: { note: string }) {
  return (
    <View style={styles.banner}>
      <Ionicons name="warning-outline" size={16} color={TONE_COLOR.warning} />
      <View style={styles.bannerBody}>
        <Text style={styles.bannerTitle}>Reviewer record — not a CSC submission</Text>
        <Text style={styles.bannerText}>{note}</Text>
      </View>
    </View>
  );
}

// ── THRESHOLD + PAYOR ────────────────────────────────────

const THRESHOLD_TONE: Record<DisclosureThresholdState, Tone> = {
  'below-600': 'muted',
  aggregating: 'warning',
  crossed: 'accent',
  unknown: 'muted',
};

const THRESHOLD_LABEL: Record<DisclosureThresholdState, string> = {
  'below-600': 'Under $600',
  aggregating: 'Aggregating payors',
  crossed: 'Disclosure required',
  unknown: 'Unknown',
};

const PAYOR_TONE: Record<PayorAssociationStatus, Tone> = {
  unaffiliated: 'success',
  'school-associated': 'warning',
  unknown: 'muted',
  'pending-verification': 'warning',
};

const PAYOR_LABEL: Record<PayorAssociationStatus, string> = {
  unaffiliated: 'Unaffiliated payor',
  'school-associated': 'School-associated payor',
  unknown: 'Association unknown',
  'pending-verification': 'Pending verification',
};

const REVIEW_TONE: Record<DisclosureReviewState, Tone> = {
  draft: 'muted',
  submitted: 'info',
  'school-review': 'info',
  approved: 'success',
  flagged: 'danger',
  amended: 'warning',
};

const REVIEW_LABEL: Record<DisclosureReviewState, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  'school-review': 'School review',
  approved: 'Approved',
  flagged: 'Flagged',
  amended: 'Amended',
};

function ThresholdSection({
  thresholdState,
  payorStatus,
  reviewState,
}: {
  thresholdState: DisclosureThresholdState;
  payorStatus: PayorAssociationStatus;
  reviewState: DisclosureReviewState;
}) {
  return (
    <SectionCard title="Threshold & payor" icon="shield-checkmark-outline">
      <View style={styles.pillRow}>
        <StatusPill
          tone={THRESHOLD_TONE[thresholdState]}
          label={THRESHOLD_LABEL[thresholdState]}
          icon="cash-outline"
        />
        <StatusPill
          tone={PAYOR_TONE[payorStatus]}
          label={PAYOR_LABEL[payorStatus]}
          icon="business-outline"
        />
        <StatusPill
          tone={REVIEW_TONE[reviewState]}
          label={REVIEW_LABEL[reviewState]}
          icon="document-text-outline"
        />
      </View>
      <Text style={styles.caveat}>
        $600 / aggregating-payor logic mirrors the NIL Go threshold guidance. Bylaw 22
        payor-association status drives the structured-layering review path.
      </Text>
    </SectionCard>
  );
}

// ── COUNTERPARTIES ───────────────────────────────────────

function CounterpartiesSection({
  counterparties,
}: {
  counterparties: ComplianceDisclosure['counterparties'];
}) {
  return (
    <SectionCard title="Counterparties" icon="people-outline">
      <FieldRow label="Athlete" value={counterparties.athlete.name} sub={counterparties.athlete.school} />
      <Divider />
      <FieldRow label="Brand / payor" value={counterparties.brand.name} sub={counterparties.brand.category} />
      {counterparties.agentOfRecord ? (
        <>
          <Divider />
          <FieldRow
            label="Agent of record"
            value={counterparties.agentOfRecord.name}
            sub={counterparties.agentOfRecord.firm}
          />
        </>
      ) : null}
    </SectionCard>
  );
}

// ── ARRANGEMENT TERMS ────────────────────────────────────

function ArrangementSection({
  terms,
}: {
  terms: ComplianceDisclosure['arrangementTerms'];
}) {
  return (
    <SectionCard title="Arrangement terms" icon="document-outline">
      <View style={styles.pillRow}>
        {terms.categories.map((c) => (
          <StatusPill key={c} tone="accent" label={c} />
        ))}
      </View>
      <KeyValue label="Duration" value={`${terms.durationDays} days · ${terms.renewable ? 'renewable' : 'non-renewable'}`} />
      {terms.exclusivityScope ? <KeyValue label="Exclusivity" value={terms.exclusivityScope} /> : null}
      <BulletBlock title="Services granted" items={terms.servicesGranted} />
      <BulletBlock title="Rights granted" items={terms.rightsGranted} />
    </SectionCard>
  );
}

// ── COMPENSATION ─────────────────────────────────────────

const STRUCTURE_LABEL: Record<
  ComplianceDisclosure['compensation']['structure'],
  string
> = {
  flat: 'Flat',
  milestone: 'Milestone',
  royalty: 'Royalty',
  mixed: 'Mixed',
};

function CompensationSection({
  compensation,
}: {
  compensation: ComplianceDisclosure['compensation'];
}) {
  const scheduleTotal =
    compensation.paymentSchedule.atSignature +
    compensation.paymentSchedule.atContentProof +
    compensation.paymentSchedule.atFinalReport;

  return (
    <SectionCard title="Compensation" icon="wallet-outline">
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total disclosed value</Text>
        <Text style={styles.totalValue}>{formatMoney(compensation.totalCents)}</Text>
      </View>
      <View style={styles.pillRow}>
        <StatusPill tone="info" label={`${STRUCTURE_LABEL[compensation.structure]} structure`} icon="layers-outline" />
      </View>
      <ScheduleBlock schedule={compensation.paymentSchedule} totalCents={scheduleTotal} />
      {compensation.nonCashItems && compensation.nonCashItems.length > 0 ? (
        <View style={styles.subBlock}>
          <Text style={styles.subBlockTitle}>Non-cash items</Text>
          {compensation.nonCashItems.map((item, i) => (
            <View key={`nc-${i}`} style={styles.kvRow}>
              <Text style={styles.kvLabel} numberOfLines={2}>{item.label}</Text>
              <Text style={styles.kvValue}>{formatMoney(item.estimatedCents)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </SectionCard>
  );
}

function ScheduleBlock({
  schedule,
  totalCents,
}: {
  schedule: DisclosurePaymentSchedule;
  totalCents: number;
}) {
  return (
    <View style={styles.subBlock}>
      <Text style={styles.subBlockTitle}>Payment schedule</Text>
      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>At signature</Text>
        <Text style={styles.kvValue}>{formatCents(schedule.atSignature)}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>At content proof</Text>
        <Text style={styles.kvValue}>{formatCents(schedule.atContentProof)}</Text>
      </View>
      <View style={styles.kvRow}>
        <Text style={styles.kvLabel}>At final report</Text>
        <Text style={styles.kvValue}>{formatCents(schedule.atFinalReport)}</Text>
      </View>
      <View style={styles.kvRowTotal}>
        <Text style={styles.kvLabelTotal}>Scheduled total</Text>
        <Text style={styles.kvValueTotal}>{formatCents(totalCents)}</Text>
      </View>
      {schedule.otherDescription ? (
        <Text style={styles.scheduleNote}>{schedule.otherDescription}</Text>
      ) : null}
    </View>
  );
}

// ── SERVICE PROVIDERS ────────────────────────────────────

function ServiceProvidersSection({
  providers,
}: {
  providers: ComplianceDisclosure['serviceProviders'];
}) {
  return (
    <SectionCard title="Service providers" icon="briefcase-outline">
      {providers.length === 0 ? (
        <Text style={styles.caveat}>No professional service providers disclosed.</Text>
      ) : (
        providers.map((p, i) => (
          <View key={`sp-${i}`} style={styles.kvRow}>
            <View style={styles.flex}>
              <Text style={styles.kvLabel} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.kvSub}>{p.role}</Text>
            </View>
            <Text style={styles.kvValue}>
              {p.compensationCents ? formatMoney(p.compensationCents) : '—'}
            </Text>
          </View>
        ))
      )}
    </SectionCard>
  );
}

// ── ATTACHMENTS ──────────────────────────────────────────

const ATT_TONE: Record<DisclosureAttachmentState, Tone> = {
  attached: 'success',
  missing: 'danger',
  pending: 'warning',
};

const ATT_ICON: Record<
  DisclosureAttachmentState,
  React.ComponentProps<typeof StatusPill>['icon']
> = {
  attached: 'checkmark-circle-outline',
  missing: 'close-circle-outline',
  pending: 'time-outline',
};

function AttachmentsSection({
  attachments,
}: {
  attachments: ComplianceDisclosure['attachments'];
}) {
  return (
    <SectionCard title="Attachments" icon="attach-outline">
      {attachments.map((att) => (
        <View key={att.id} style={styles.kvRow}>
          <Text style={styles.kvLabel} numberOfLines={2}>{att.label}</Text>
          <StatusPill tone={ATT_TONE[att.state]} label={att.state} icon={ATT_ICON[att.state]} />
        </View>
      ))}
    </SectionCard>
  );
}

// ── ATTESTATION ──────────────────────────────────────────

function AttestationSection({
  attestation,
}: {
  attestation: ComplianceDisclosure['attestation'];
}) {
  return (
    <SectionCard title="Attestation" icon="finger-print-outline">
      <View style={styles.pillRow}>
        <StatusPill
          tone={attestation.athleteSigned ? 'success' : 'warning'}
          label={attestation.athleteSigned ? 'Athlete signed' : 'Athlete signature pending'}
          icon={attestation.athleteSigned ? 'checkmark-circle-outline' : 'time-outline'}
        />
        {attestation.statementId ? (
          <StatusPill tone="info" label={attestation.statementId} icon="document-text-outline" />
        ) : null}
      </View>
      {attestation.signedAt ? (
        <KeyValue label="Signed at" value={formatDate(attestation.signedAt)} />
      ) : null}
    </SectionCard>
  );
}

// ── ACTION HISTORY ───────────────────────────────────────

const ACTION_TONE: Record<DisclosureAction, Tone> = {
  created: 'muted',
  edited: 'muted',
  submitted: 'info',
  'school-acknowledged': 'info',
  'csc-submitted': 'accent',
  reviewed: 'warning',
  amended: 'warning',
  withdrawn: 'danger',
};

function ActionHistorySection({
  history,
}: {
  history: DisclosureActionLogEntry[];
}) {
  if (history.length === 0) {
    return (
      <SectionCard title="Action history" icon="time-outline">
        <Text style={styles.caveat}>No actions recorded yet.</Text>
      </SectionCard>
    );
  }
  return (
    <SectionCard title="Action history" icon="time-outline">
      {history.map((entry) => (
        <View key={entry.id} style={styles.historyRow}>
          <View style={styles.historyHead}>
            <StatusPill
              tone={ACTION_TONE[entry.action] ?? 'muted'}
              label={entry.action.replace(/-/g, ' ')}
            />
            <Text style={styles.historyTime}>{formatDate(entry.at)}</Text>
          </View>
          <Text style={styles.historyActor}>
            {entry.actor.label} <Text style={styles.historyActorKind}>· {entry.actor.kind}</Text>
          </Text>
          {entry.note ? <Text style={styles.historyNote}>{entry.note}</Text> : null}
        </View>
      ))}
    </SectionCard>
  );
}

// ── SHARED ROW PRIMITIVES ────────────────────────────────

function FieldRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
      {sub ? <Text style={styles.fieldSub}>{sub}</Text> : null}
    </View>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

function BulletBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.subBlock}>
      <Text style={styles.subBlockTitle}>{title}</Text>
      {items.map((item, i) => (
        <View key={`b-${i}`} style={styles.bulletRow}>
          <View style={styles.bullet} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ── HELPERS ──────────────────────────────────────────────

function formatMoney(amount: MoneyAmount): string {
  return formatCents(amount.cents);
}

function formatCents(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── STYLES ───────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    gap: 14,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${TONE_COLOR.accent}66`,
    backgroundColor: `${TONE_COLOR.accent}1F`,
  },
  editPillActive: {
    backgroundColor: TONE_COLOR.accent,
    borderColor: TONE_COLOR.accent,
  },
  editPillText: {
    color: TONE_COLOR.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  editPillTextActive: {
    color: '#000000',
  },
  banner: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${TONE_COLOR.warning}55`,
    backgroundColor: `${TONE_COLOR.warning}14`,
  },
  bannerBody: {
    flex: 1,
    gap: 3,
  },
  bannerTitle: {
    color: TONE_COLOR.warning,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  bannerText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  caveat: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16,
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  fieldValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  fieldSub: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: CARD_BORDER,
  },
  kvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  kvRowTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  kvLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  kvLabelTotal: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  kvValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  kvValueTotal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  kvSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },
  flex: { flex: 1 },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: RADIUS_MD,
    backgroundColor: CARD_BG_INSET,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  totalValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subBlock: {
    gap: 6,
    padding: 10,
    borderRadius: RADIUS_MD,
    backgroundColor: CARD_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  subBlockTitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.42)',
    marginTop: 7,
  },
  bulletText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 17,
    flex: 1,
  },
  scheduleNote: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 4,
    fontStyle: 'italic',
  },
  historyRow: {
    gap: 4,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CARD_BORDER,
  },
  historyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  historyTime: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 11,
    fontWeight: '600',
  },
  historyActor: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  historyActorKind: {
    color: 'rgba(255,255,255,0.50)',
    fontWeight: '500',
  },
  historyNote: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16,
  },
});
