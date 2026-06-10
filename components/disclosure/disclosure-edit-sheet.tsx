// ── DISCLOSURE EDIT SHEET (Sprint 3.4 — write surface) ───
// Modal-less inline editor for the most-edited subset of a NIL Go-shaped
// `ComplianceDisclosure`. Renders as a slide-down panel inside the form
// (no real React Native Modal) so the surrounding scroll context stays
// intact. Editable scope is limited to:
//
//   - arrangementTerms.categories       (multi-select chip set)
//   - arrangementTerms.rightsGranted    (textarea — comma-separated)
//   - arrangementTerms.durationDays     (number input)
//   - compensation.totalCents           (dollar input — converted to cents on save)
//   - compensation.structure            (single-select)
//   - attestation.athleteSigned         (toggle)
//
// All other fields stay read-only on the parent form — a "contact your
// NIL Manager to change" hint is rendered below the edit panel.
//
// Validation: numbers must be > 0; categories must contain ≥1 entry.
// Money goes in/out in integer cents per project convention.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  CARD_BG,
  CARD_BG_INSET,
  CARD_BORDER,
  RADIUS_MD,
  RADIUS_PILL,
  TONE_COLOR,
} from '@/components/shared/ui-kit';
import type {
  ComplianceDisclosure,
  DisclosureCompensationStructure,
} from '@/lib/types/compliance-disclosure.types';

// Canonical category set per task spec.
const CATEGORY_OPTIONS = [
  'endorsement',
  'appearance',
  'merch-licensing',
  'affiliate',
  'royalty',
] as const;

const STRUCTURE_OPTIONS: readonly {
  value: DisclosureCompensationStructure;
  label: string;
}[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'royalty', label: 'Royalty' },
  { value: 'mixed', label: 'Mixed' },
];

export interface DisclosureEditSheetProps {
  disclosure: ComplianceDisclosure;
  /** Called with the patch on Save — typically wired to `useUpdateDisclosure().mutate`. */
  onSave: (patch: Partial<ComplianceDisclosure>) => void;
  /** Called when the user taps Cancel. */
  onCancel: () => void;
  /** True while the underlying mutation is in-flight. */
  isSaving?: boolean;
}

interface FormState {
  categories: string[];
  rightsGrantedText: string;
  durationDaysText: string;
  totalDollarsText: string;
  structure: DisclosureCompensationStructure;
  athleteSigned: boolean;
}

function fromDisclosure(d: ComplianceDisclosure): FormState {
  return {
    categories: [...d.arrangementTerms.categories],
    rightsGrantedText: d.arrangementTerms.rightsGranted.join(', '),
    durationDaysText: String(d.arrangementTerms.durationDays),
    totalDollarsText: (d.compensation.totalCents.cents / 100).toString(),
    structure: d.compensation.structure,
    athleteSigned: d.attestation.athleteSigned,
  };
}

interface ValidationResult {
  ok: boolean;
  errors: { categories?: string; duration?: string; total?: string };
}

function validate(state: FormState): ValidationResult {
  const errors: ValidationResult['errors'] = {};
  if (state.categories.length === 0) {
    errors.categories = 'Pick at least one category.';
  }
  const duration = Number(state.durationDaysText);
  if (!Number.isFinite(duration) || duration <= 0) {
    errors.duration = 'Duration must be a positive number of days.';
  }
  const total = Number(state.totalDollarsText);
  if (!Number.isFinite(total) || total <= 0) {
    errors.total = 'Total must be a positive dollar amount.';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

export function DisclosureEditSheet({
  disclosure,
  onSave,
  onCancel,
  isSaving = false,
}: DisclosureEditSheetProps) {
  const [state, setState] = React.useState<FormState>(() =>
    fromDisclosure(disclosure),
  );
  const validation = React.useMemo(() => validate(state), [state]);

  const toggleCategory = React.useCallback((category: string) => {
    setState((prev) =>
      prev.categories.includes(category)
        ? { ...prev, categories: prev.categories.filter((c) => c !== category) }
        : { ...prev, categories: [...prev.categories, category] },
    );
  }, []);

  const handleSave = React.useCallback(() => {
    if (!validation.ok || isSaving) return;
    const rightsGranted = state.rightsGrantedText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const durationDays = Math.round(Number(state.durationDaysText));
    const totalCents = Math.round(Number(state.totalDollarsText) * 100);
    const patch: Partial<ComplianceDisclosure> = {
      arrangementTerms: {
        ...disclosure.arrangementTerms,
        categories: [...state.categories],
        rightsGranted,
        durationDays,
      },
      compensation: {
        ...disclosure.compensation,
        totalCents: { cents: totalCents, currency: 'USD' },
        structure: state.structure,
      },
      attestation: {
        ...disclosure.attestation,
        athleteSigned: state.athleteSigned,
        signedAt: state.athleteSigned
          ? (disclosure.attestation.signedAt ?? new Date().toISOString())
          : disclosure.attestation.signedAt,
      },
    };
    onSave(patch);
  }, [
    disclosure,
    state,
    validation.ok,
    isSaving,
    onSave,
  ]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Ionicons name="create-outline" size={16} color={TONE_COLOR.accent} />
        <Text style={styles.headerTitle}>Edit disclosure</Text>
      </View>

      {/* CATEGORIES */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>NIL categories</Text>
        <View style={styles.chipRow}>
          {CATEGORY_OPTIONS.map((opt) => {
            const selected = state.categories.includes(opt);
            return (
              <Pressable
                key={opt}
                onPress={() => toggleCategory(opt)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`Toggle ${opt} category`}
                style={[
                  styles.chip,
                  selected && {
                    borderColor: `${TONE_COLOR.accent}88`,
                    backgroundColor: `${TONE_COLOR.accent}26`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected && { color: TONE_COLOR.accent },
                  ]}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {validation.errors.categories ? (
          <Text style={styles.errorText}>{validation.errors.categories}</Text>
        ) : null}
      </View>

      {/* RIGHTS GRANTED */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Rights granted</Text>
        <Text style={styles.helper}>
          Comma-separated. e.g. social posts, paid usage 90 days
        </Text>
        <TextInput
          value={state.rightsGrantedText}
          onChangeText={(rightsGrantedText) =>
            setState((prev) => ({ ...prev, rightsGrantedText }))
          }
          multiline
          placeholder="rights granted"
          placeholderTextColor="rgba(255,255,255,0.32)"
          style={[styles.input, styles.textarea]}
          accessibilityLabel="Rights granted, comma separated"
        />
      </View>

      {/* DURATION */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Duration (days)</Text>
        <TextInput
          value={state.durationDaysText}
          onChangeText={(durationDaysText) =>
            setState((prev) => ({ ...prev, durationDaysText }))
          }
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="rgba(255,255,255,0.32)"
          style={styles.input}
          accessibilityLabel="Duration in days"
        />
        {validation.errors.duration ? (
          <Text style={styles.errorText}>{validation.errors.duration}</Text>
        ) : null}
      </View>

      {/* TOTAL */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Total disclosed value (USD)</Text>
        <TextInput
          value={state.totalDollarsText}
          onChangeText={(totalDollarsText) =>
            setState((prev) => ({ ...prev, totalDollarsText }))
          }
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor="rgba(255,255,255,0.32)"
          style={styles.input}
          accessibilityLabel="Total disclosed value in dollars"
        />
        {validation.errors.total ? (
          <Text style={styles.errorText}>{validation.errors.total}</Text>
        ) : null}
      </View>

      {/* STRUCTURE */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Compensation structure</Text>
        <View style={styles.chipRow}>
          {STRUCTURE_OPTIONS.map((opt) => {
            const selected = state.structure === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() =>
                  setState((prev) => ({ ...prev, structure: opt.value }))
                }
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Select ${opt.label} structure`}
                style={[
                  styles.chip,
                  selected && {
                    borderColor: `${TONE_COLOR.info}88`,
                    backgroundColor: `${TONE_COLOR.info}26`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected && { color: TONE_COLOR.info },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ATTESTATION TOGGLE */}
      <View style={[styles.fieldGroup, styles.toggleRow]}>
        <View style={styles.flex}>
          <Text style={styles.label}>Athlete signed</Text>
          <Text style={styles.helper}>
            Toggle on once you have signed the attestation statement.
          </Text>
        </View>
        <Switch
          value={state.athleteSigned}
          onValueChange={(athleteSigned) =>
            setState((prev) => ({ ...prev, athleteSigned }))
          }
          trackColor={{ false: '#3A3A3C', true: `${TONE_COLOR.success}AA` }}
          thumbColor={state.athleteSigned ? TONE_COLOR.success : '#F4F4F5'}
          accessibilityLabel="Athlete signed toggle"
        />
      </View>

      {/* READ-ONLY HINT */}
      <View style={styles.hintBox}>
        <Ionicons name="lock-closed-outline" size={13} color={TONE_COLOR.muted} />
        <Text style={styles.hintText}>
          Other fields are read-only — contact your NIL Manager to change.
        </Text>
      </View>

      {/* ACTIONS */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={onCancel}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Cancel edit"
          style={({ pressed }) => [
            styles.actionButton,
            styles.cancelButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={!validation.ok || isSaving}
          accessibilityRole="button"
          accessibilityLabel="Save changes"
          style={({ pressed }) => [
            styles.actionButton,
            styles.saveButton,
            (!validation.ok || isSaving) && styles.saveButtonDisabled,
            pressed && { opacity: 0.85 },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Ionicons name="save-outline" size={14} color="#000000" />
              <Text style={styles.saveText}>Save</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 14,
    padding: 14,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${TONE_COLOR.accent}55`,
    backgroundColor: `${TONE_COLOR.accent}0F`,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: TONE_COLOR.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  helper: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 15,
  },
  errorText: {
    color: TONE_COLOR.danger,
    fontSize: 11.5,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS_PILL,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
  },
  chipText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG_INSET,
  },
  textarea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: { flex: 1 },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS_MD,
    backgroundColor: CARD_BG_INSET,
  },
  hintText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11.5,
    fontWeight: '500',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS_MD,
  },
  cancelButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  saveButton: {
    backgroundColor: TONE_COLOR.accent,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
