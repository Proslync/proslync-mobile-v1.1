// app/deal-engine/new.tsx
// NIL Deal Engine — Create & Sign flow (Phase D1 + D2).
//
// Internal steps:
//   1. Template picker (5 template cards)
//   2. Form (prefilled from Kiyan persona, required fields)
//   3. Plain-language summary (required reading + "I understand" check)
//   4. WILL THIS CLEAR? pre-check (Phase D2 — three CSC tests + AE banner)
//   5. Signature step (draw-to-sign + typed name)
//   6. Confirmation (Deal ID + DEMO pill + open deal button)
//
// All state is local. On sign, the new deal is merged into AsyncStorage
// key DEAL_ENGINE_STORAGE_KEY alongside the fixture.

import * as React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  PanResponder,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

import {
  CONTRACT_TEMPLATES,
  DEAL_ENGINE_STORAGE_KEY,
} from '@/lib/data/mock-deal-engine';
import type { ContractTemplate, EngineDeal, DealEvent } from '@/lib/types/deal-engine.types';
import {
  generateDealId,
  defaultRand,
  computeFees,
  milestoneAutoApproveAt,
} from '@/lib/deal-engine/engine';
import {
  scorePreclearance,
} from '@/lib/compliance/preclearance';
import type { PreclearanceResult } from '@/lib/compliance/preclearance';
import {
  ASSOCIATED_ENTITY_TYPES,
  RULES_VERSION,
} from '@/lib/compliance/rules-2026-06';
import {
  predictClearance,
  FMV_DISCLAIMER,
} from '@/lib/fmv/fmv-engine';
import { getMockAthleteSocialReach } from '@/lib/data/mock-social-reach';

// ── Constants ─────────────────────────────────────────────────────────────

const COPPER = '#EB621A';
const BG = '#000000';
const CARD_BG = 'rgba(255,255,255,0.055)';
const CARD_BORDER = 'rgba(255,255,255,0.10)';
const MUTED = 'rgba(255,255,255,0.52)';
const WHITE = '#FFFFFF';
const INPUT_BG = 'rgba(255,255,255,0.07)';
const SIGN_PAD_BG = 'rgba(255,255,255,0.04)';
const SIGN_PAD_BORDER = 'rgba(255,255,255,0.15)';

// Tone colors for verdict/test semantics
const TONE_PASS = '#30D158';   // green
const TONE_WARN = '#FF9F0A';   // amber
const TONE_FAIL = '#FF453A';   // red

// ── Kiyan Anthony persona defaults ────────────────────────────────────────

const KIYAN_NAME = 'Kiyan Anthony';
const KIYAN_SCHOOL = 'Syracuse University';
const FIXTURE_IP = '192.168.1.24';

type Step = 'picker' | 'form' | 'summary' | 'precheck' | 'sign' | 'confirm';

// Payer entity type for pre-check selector
type PayerEntityType = 'brand' | 'collective' | 'booster-llc' | 'mmr-partner' | 'school-sponsor';

const PAYER_ENTITY_LABELS: Record<PayerEntityType, string> = {
  brand: 'Brand',
  collective: 'Collective',
  'booster-llc': 'Booster LLC',
  'mmr-partner': 'MMR Partner',
  'school-sponsor': 'School Sponsor',
};

// ── Helpers ───────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function kindLabel(kind: ContractTemplate['kind']): string {
  const map: Record<ContractTemplate['kind'], string> = {
    endorsement: 'ENDORSEMENT',
    'social-post': 'SOCIAL POST',
    appearance: 'APPEARANCE',
    autograph: 'AUTOGRAPH',
    licensing: 'LICENSING',
  };
  return map[kind];
}

/** Interpolate {{placeholder}} values in a template string. */
function interpolateSummary(
  template: string,
  values: Record<string, string>,
  meta: {
    athleteName: string;
    brandName: string;
    dealId: string;
    amountDollars: string;
    brandFee: string;
    brandTotal: string;
    termStart: string;
    termEnd: string;
  },
): string {
  const all: Record<string, string> = { ...values, ...meta };
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => all[key] ?? `{{${key}}}`);
}

// ── Step 1: Template Picker ────────────────────────────────────────────────

interface TemplatePickerProps {
  onSelect: (tpl: ContractTemplate) => void;
}

function TemplatePicker({ onSelect }: TemplatePickerProps) {
  return (
    <ScrollView
      contentContainerStyle={pickerStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={pickerStyles.title}>Choose a deal type</Text>
      <Text style={pickerStyles.subtitle}>Select the template that best fits your deal.</Text>
      {CONTRACT_TEMPLATES.map((tpl) => (
        <TouchableOpacity
          key={tpl.id}
          style={pickerStyles.card}
          activeOpacity={0.82}
          onPress={() => onSelect(tpl)}
          accessibilityRole="button"
          accessibilityLabel={`Select ${tpl.title}`}
        >
          <View style={pickerStyles.cardTop}>
            <Text style={pickerStyles.cardTitle}>{tpl.title}</Text>
            <View style={pickerStyles.versionChip}>
              <Text style={pickerStyles.versionText}>{kindLabel(tpl.kind)} · v{tpl.version}</Text>
            </View>
          </View>
          <Text style={pickerStyles.cardDesc}>{tpl.description}</Text>
          <Text style={pickerStyles.cardFields}>
            {tpl.requiredFields.length} required fields
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const pickerStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: WHITE,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '500',
    marginBottom: 4,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 16,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: WHITE,
  },
  versionChip: {
    backgroundColor: 'rgba(235,98,26,0.15)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(235,98,26,0.35)',
  },
  versionText: {
    fontSize: 10,
    fontWeight: '700',
    color: COPPER,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardDesc: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '500',
    lineHeight: 18,
  },
  cardFields: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.32)',
    fontWeight: '600',
  },
});

// ── Step 2: Deal Form ──────────────────────────────────────────────────────

interface DealFormProps {
  template: ContractTemplate;
  fieldValues: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

function DealForm({ template, fieldValues, onChange, onContinue, onBack }: DealFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  function validate(): boolean {
    for (const field of template.requiredFields) {
      if (!fieldValues[field.key]?.trim()) {
        setError(`"${field.label}" is required.`);
        return false;
      }
    }
    const raw = parseFloat(fieldValues['dealValue'] ?? '');
    if (isNaN(raw) || raw <= 0) {
      setError('Deal value must be a positive number.');
      return false;
    }
    setError(null);
    return true;
  }

  function handleContinue() {
    if (validate()) onContinue();
  }

  const amountCents = Math.round((parseFloat(fieldValues['dealValue'] ?? '0') || 0) * 100);
  const fees = computeFees(amountCents);

  return (
    <ScrollView
      contentContainerStyle={formStyles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={formStyles.title}>{template.title}</Text>
      <Text style={formStyles.subtitle}>Fill in the deal details below.</Text>

      {/* Locked-in chips: athlete name + school */}
      <View style={formStyles.lockedRow}>
        <View style={formStyles.lockedChip}>
          <Text style={formStyles.lockedLabel}>ATHLETE</Text>
          <Text style={formStyles.lockedValue}>{KIYAN_NAME}</Text>
        </View>
        <View style={formStyles.lockedChip}>
          <Text style={formStyles.lockedLabel}>SCHOOL</Text>
          <Text style={formStyles.lockedValue}>{KIYAN_SCHOOL}</Text>
        </View>
      </View>

      {/* Dynamic required fields */}
      {template.requiredFields.map((field) => (
        <View key={field.key} style={formStyles.fieldGroup}>
          <Text style={formStyles.fieldLabel}>{field.label}</Text>
          {field.type === 'select' && field.options ? (
            <View style={formStyles.optionRow}>
              {field.options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    formStyles.optionChip,
                    fieldValues[field.key] === opt && formStyles.optionChipSelected,
                  ]}
                  onPress={() => onChange(field.key, opt)}
                  activeOpacity={0.75}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: fieldValues[field.key] === opt }}
                >
                  <Text
                    style={[
                      formStyles.optionText,
                      fieldValues[field.key] === opt && formStyles.optionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TextInput
              style={formStyles.input}
              value={fieldValues[field.key] ?? ''}
              onChangeText={(v) => onChange(field.key, v)}
              placeholder={field.placeholder ?? ''}
              placeholderTextColor="rgba(255,255,255,0.28)"
              keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'}
              autoCapitalize="none"
              accessibilityLabel={field.label}
            />
          )}
        </View>
      ))}

      {/* Fee preview */}
      {amountCents > 0 && (
        <View style={formStyles.feeCard}>
          <Text style={formStyles.feeTitle}>FEE PREVIEW</Text>
          <FeeRow label="You receive (athlete)" value={`$${formatCents(fees.athleteCents)}`} highlight />
          <FeeRow label="Brand pays (deal amount)" value={`$${formatCents(fees.athleteCents)}`} />
          <FeeRow label="Brand pays (platform fee 10%)" value={`$${formatCents(fees.brandFeeCents)}`} />
          <View style={formStyles.feeDivider} />
          <FeeRow label="Brand total" value={`$${formatCents(fees.brandTotalCents)}`} bold />
        </View>
      )}

      {error && <Text style={formStyles.error}>{error}</Text>}

      <View style={formStyles.buttonRow}>
        <TouchableOpacity style={formStyles.backBtn} onPress={onBack} activeOpacity={0.75}>
          <Text style={formStyles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={formStyles.continueBtn} onPress={handleContinue} activeOpacity={0.82}>
          <Text style={formStyles.continueBtnText}>REVIEW SUMMARY</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function FeeRow({
  label,
  value,
  highlight,
  bold,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  bold?: boolean;
}) {
  return (
    <View style={formStyles.feeRow}>
      <Text style={[formStyles.feeLabel, bold && { fontWeight: '800' }]}>{label}</Text>
      <Text
        style={[
          formStyles.feeValue,
          highlight && { color: COPPER },
          bold && { fontWeight: '800' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const formStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: WHITE,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '500',
    marginBottom: 2,
  },
  lockedRow: {
    flexDirection: 'row',
    gap: 10,
  },
  lockedChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 10,
    gap: 3,
  },
  lockedLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1,
  },
  lockedValue: {
    fontSize: 13,
    fontWeight: '700',
    color: WHITE,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: WHITE,
    fontVariant: ['tabular-nums'],
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: CARD_BG,
    minHeight: 44,
    justifyContent: 'center',
  },
  optionChipSelected: {
    backgroundColor: 'rgba(235,98,26,0.18)',
    borderColor: COPPER,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
  },
  optionTextSelected: {
    color: COPPER,
    fontWeight: '700',
  },
  feeCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  feeTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 12,
    color: MUTED,
    fontWeight: '600',
    flex: 1,
  },
  feeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: WHITE,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  feeDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: CARD_BORDER,
    marginVertical: 2,
  },
  error: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  backBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  backBtnText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '700',
  },
  continueBtn: {
    flex: 2,
    backgroundColor: 'rgba(235,98,26,0.15)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COPPER,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  continueBtnText: {
    color: COPPER,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

// ── Step 3: Plain-Language Summary ────────────────────────────────────────

interface SummaryProps {
  summaryText: string;
  acknowledged: boolean;
  onToggle: () => void;
  onContinue: () => void;
  onBack: () => void;
}

function SummaryStep({ summaryText, acknowledged, onToggle, onContinue, onBack }: SummaryProps) {
  return (
    <ScrollView
      contentContainerStyle={summaryStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={summaryStyles.title}>Read Before Signing</Text>
      <Text style={summaryStyles.subtitle}>
        Review this plain-language summary. You must acknowledge understanding before proceeding.
      </Text>

      <View style={summaryStyles.summaryCard}>
        <Text style={summaryStyles.summaryLabel}>PLAIN-LANGUAGE SUMMARY</Text>
        <Text style={summaryStyles.summaryText}>{summaryText}</Text>
      </View>

      <TouchableOpacity
        style={summaryStyles.checkRow}
        onPress={onToggle}
        activeOpacity={0.75}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acknowledged }}
      >
        <View style={[summaryStyles.checkbox, acknowledged && summaryStyles.checkboxChecked]}>
          {acknowledged && <Text style={summaryStyles.checkmark}>✓</Text>}
        </View>
        <Text style={summaryStyles.checkLabel}>I understand this agreement and its terms.</Text>
      </TouchableOpacity>

      <View style={formStyles.buttonRow}>
        <TouchableOpacity style={formStyles.backBtn} onPress={onBack} activeOpacity={0.75}>
          <Text style={formStyles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[formStyles.continueBtn, !acknowledged && summaryStyles.disabledBtn]}
          onPress={acknowledged ? onContinue : undefined}
          activeOpacity={acknowledged ? 0.82 : 1}
        >
          <Text style={[formStyles.continueBtnText, !acknowledged && summaryStyles.disabledText]}>
            PRE-CHECK & SIGN
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const summaryStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: WHITE,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 16,
    gap: 10,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1.2,
  },
  summaryText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    fontWeight: '500',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: CARD_BORDER,
    backgroundColor: INPUT_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: COPPER,
    borderColor: COPPER,
  },
  checkmark: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '900',
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    color: WHITE,
    fontWeight: '600',
    lineHeight: 20,
  },
  disabledBtn: {
    opacity: 0.4,
  },
  disabledText: {},
});

// ── Step 4: Signature Pad ─────────────────────────────────────────────────

interface SignatureStepProps {
  typedName: string;
  onTypedNameChange: (v: string) => void;
  svgPath: string;
  onSvgPathChange: (p: string) => void;
  onSign: () => void;
  onBack: () => void;
}

const PAD_W = 340;
const PAD_H = 180;

function SignatureStep({
  typedName,
  onTypedNameChange,
  svgPath,
  onSvgPathChange,
  onSign,
  signing,
}: SignatureStepProps & { onBack: () => void; signing: boolean }) {
  // Build SVG path string from touch tracking via PanResponder
  const pathRef = React.useRef<string>('');
  const isDrawing = React.useRef(false);
  const scrollRef = React.useRef<ScrollView>(null);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          scrollRef.current?.setNativeProps({ scrollEnabled: false });
          const { locationX: x, locationY: y } = e.nativeEvent;
          pathRef.current = `${pathRef.current}M${x.toFixed(1)},${y.toFixed(1)} `;
          isDrawing.current = true;
          onSvgPathChange(pathRef.current);
        },
        onPanResponderMove: (e) => {
          if (!isDrawing.current) return;
          const { locationX: x, locationY: y } = e.nativeEvent;
          pathRef.current = `${pathRef.current}L${x.toFixed(1)},${y.toFixed(1)} `;
          onSvgPathChange(pathRef.current);
        },
        onPanResponderRelease: () => {
          isDrawing.current = false;
          scrollRef.current?.setNativeProps({ scrollEnabled: true });
        },
        onPanResponderTerminate: () => {
          isDrawing.current = false;
          scrollRef.current?.setNativeProps({ scrollEnabled: true });
        },
      }),
    [onSvgPathChange],
  );

  function handleClear() {
    pathRef.current = '';
    onSvgPathChange('');
  }

  const canSign = svgPath.trim().length > 10 && typedName.trim().length > 1;

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={signStyles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={signStyles.title}>Sign the Deal</Text>
      <Text style={signStyles.subtitle}>
        Draw your signature below and type your full name to confirm.
      </Text>

      {/* Signature drawing pad */}
      <View style={signStyles.padWrapper}>
        <Text style={signStyles.padLabel}>SIGNATURE PAD — draw with your finger</Text>
        <View
          style={signStyles.pad}
          {...panResponder.panHandlers}
          accessibilityLabel="Signature drawing pad"
        >
          <Svg width={PAD_W} height={PAD_H} style={signStyles.svg}>
            {svgPath.trim().length > 0 && (
              <Path
                d={svgPath}
                stroke={WHITE}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </Svg>
          {svgPath.trim().length === 0 && (
            <View style={signStyles.padHint} pointerEvents="none">
              <Text style={signStyles.padHintText}>Draw here</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={signStyles.clearBtn}
          onPress={handleClear}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Clear signature"
        >
          <Text style={signStyles.clearBtnText}>CLEAR</Text>
        </TouchableOpacity>
      </View>

      {/* Typed name */}
      <View style={formStyles.fieldGroup}>
        <Text style={formStyles.fieldLabel}>FULL LEGAL NAME</Text>
        <TextInput
          style={formStyles.input}
          value={typedName}
          onChangeText={onTypedNameChange}
          placeholder="Type your full name exactly as it appears on your ID"
          placeholderTextColor="rgba(255,255,255,0.28)"
          autoCapitalize="words"
          accessibilityLabel="Typed full name for signing"
        />
      </View>

      {/* Legal notice */}
      <View style={signStyles.legalCard}>
        <Text style={signStyles.legalText}>
          By signing, you confirm: (1) you are the named athlete, (2) you have read and understood
          the plain-language summary, (3) you are entering this agreement voluntarily.
          Your signature, typed name, and IP address (
          {FIXTURE_IP}) will be recorded in the deal audit trail with a timestamp.
          This is a DEMO — no legal obligations are created.
        </Text>
      </View>

      <TouchableOpacity
        style={[signStyles.signBtn, (!canSign || signing) && signStyles.signBtnDisabled]}
        onPress={canSign && !signing ? onSign : undefined}
        activeOpacity={canSign && !signing ? 0.82 : 1}
        accessibilityRole="button"
        accessibilityLabel="Sign the deal"
      >
        <Text style={signStyles.signBtnText}>{signing ? 'SIGNING…' : 'SIGN DEAL'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const signStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: WHITE,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '500',
  },
  padWrapper: {
    gap: 8,
  },
  padLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1,
  },
  pad: {
    width: PAD_W,
    height: PAD_H,
    backgroundColor: SIGN_PAD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SIGN_PAD_BORDER,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  padHint: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padHintText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.18)',
    fontWeight: '600',
  },
  clearBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    minHeight: 44,
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 0.8,
  },
  legalCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 12,
  },
  legalText: {
    fontSize: 11,
    color: MUTED,
    lineHeight: 17,
    fontWeight: '500',
  },
  signBtn: {
    backgroundColor: COPPER,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  signBtnDisabled: {
    opacity: 0.38,
  },
  signBtnText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});

// ── Step 5: Confirmation ──────────────────────────────────────────────────

interface ConfirmationProps {
  dealId: string;
  onOpenDeal: () => void;
}

function ConfirmationStep({ dealId, onOpenDeal }: ConfirmationProps) {
  return (
    <View style={confirmStyles.container}>
      <View style={confirmStyles.card}>
        <Text style={confirmStyles.emoji}>Deal signed</Text>
        <View style={confirmStyles.demoRow}>
          <View style={confirmStyles.demoPill}>
            <Text style={confirmStyles.demoPillText}>DEMO</Text>
          </View>
        </View>
        <Text style={confirmStyles.label}>DEAL ID</Text>
        <Text style={confirmStyles.dealId} selectable>
          {dealId}
        </Text>
        <Text style={confirmStyles.body}>
          Your deal has been submitted and is awaiting brand countersignature.
          Your signature, typed name, timestamp, and IP have been recorded in the audit trail.
          This is a DEMO — no legal obligations have been created.
        </Text>
      </View>
      <TouchableOpacity
        style={confirmStyles.openBtn}
        onPress={onOpenDeal}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`Open deal ${dealId}`}
      >
        <Text style={confirmStyles.openBtnText}>OPEN DEAL COCKPIT</Text>
      </TouchableOpacity>
    </View>
  );
}

const confirmStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 24,
    gap: 20,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 22,
    gap: 12,
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 20,
    fontWeight: '900',
    color: WHITE,
  },
  demoRow: {
    flexDirection: 'row',
  },
  demoPill: {
    backgroundColor: 'rgba(255,214,10,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,214,10,0.4)',
  },
  demoPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFD60A',
    letterSpacing: 1.2,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1.2,
    marginTop: 4,
  },
  dealId: {
    fontSize: 18,
    fontWeight: '900',
    color: COPPER,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  body: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 20,
    fontWeight: '500',
  },
  openBtn: {
    backgroundColor: COPPER,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  openBtnText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});

// ── Step 4: WILL THIS CLEAR? Pre-check ────────────────────────────────────

const KIND_COMP_RANGES: Record<ContractTemplate['kind'], { lowCents: number; highCents: number }> = {
  endorsement: { lowCents: 50_000, highCents: 500_000_00 },
  'social-post': { lowCents: 5_000, highCents: 50_000_00 },
  appearance: { lowCents: 20_000, highCents: 200_000_00 },
  autograph: { lowCents: 10_000, highCents: 100_000_00 },
  licensing: { lowCents: 30_000, highCents: 300_000_00 },
};

interface PrecheckStepProps {
  amountCents: number;
  dealKind: ContractTemplate['kind'];
  deliverableDescription: string;
  payerEntityType: PayerEntityType;
  onPayerChange: (v: PayerEntityType) => void;
  onContinue: () => void;
  onBack: () => void;
}

function testColor(result: 'pass' | 'warn' | 'fail'): string {
  if (result === 'pass') return TONE_PASS;
  if (result === 'warn') return TONE_WARN;
  return TONE_FAIL;
}

function testLabel(result: 'pass' | 'warn' | 'fail'): string {
  if (result === 'pass') return 'PASS';
  if (result === 'warn') return 'REVIEW';
  return 'FAIL';
}

function verdictColor(verdict: PreclearanceResult['verdict']): string {
  if (verdict === 'likely-clear') return TONE_PASS;
  if (verdict === 'needs-review') return TONE_WARN;
  return TONE_FAIL;
}

function verdictLabel(verdict: PreclearanceResult['verdict']): string {
  if (verdict === 'likely-clear') return 'LIKELY CLEAR';
  if (verdict === 'needs-review') return 'NEEDS REVIEW';
  return 'LIKELY REJECTED';
}

const CSC_TEST_LABELS: Record<string, string> = {
  businessPurpose: 'Valid Business Purpose',
  activation: 'Real Activation',
  compRange: 'Comp-Range Alignment',
};

function PrecheckStep({
  amountCents,
  dealKind,
  deliverableDescription,
  payerEntityType,
  onPayerChange,
  onContinue,
  onBack,
}: PrecheckStepProps) {
  const [showComps, setShowComps] = React.useState(false);

  // Kiyan's reach for demo predictions (athlete 'a-1')
  const reach = getMockAthleteSocialReach('a-1');

  const prediction = React.useMemo(
    () =>
      predictClearance({
        amountCents,
        dealKind,
        deliverableDescription,
        payerEntityType,
        totalFollowers: reach?.totalFollowers ?? 0,
        engagementRate7d: reach?.engagementRate7d ?? 0,
      }),
    [amountCents, dealKind, deliverableDescription, payerEntityType, reach],
  );

  const { band, bandLabel, reason, fmv, fmvApplies, gate } = prediction;
  const result = gate; // alias — keeps the rest of the original code unchanged
  const isAE = (ASSOCIATED_ENTITY_TYPES as readonly string[]).includes(payerEntityType);

  const bandColor =
    band === 'likely'     ? TONE_PASS :
    band === 'borderline' ? TONE_WARN :
                            TONE_FAIL;

  const fmtDollars = (cents: number) =>
    '$' + Math.round(cents / 100).toLocaleString('en-US');

  return (
    <ScrollView
      contentContainerStyle={precheckStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={precheckStyles.title}>Will This Clear?</Text>
      <Text style={precheckStyles.subtitle}>
        Pre-check against the three CSC tests before you sign.
        This is a copilot — not an official CSC determination.
      </Text>

      {/* ── Clearance band pill (headline) ────────────────────────── */}
      <View style={precheckStyles.bandCard}>
        <View style={precheckStyles.bandTop}>
          <Text style={precheckStyles.bandHeadingLabel}>CLEARANCE OUTLOOK</Text>
          <View style={[precheckStyles.bandPill, { borderColor: bandColor, backgroundColor: `${bandColor}18` }]}>
            <Text style={[precheckStyles.bandPillText, { color: bandColor }]}>
              {bandLabel.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={precheckStyles.bandReason}>{reason}</Text>
      </View>

      {/* ── FMV range line ─────────────────────────────────────────── */}
      <View style={precheckStyles.fmvCard}>
        <Text style={precheckStyles.fmvLabel}>FAIR-MARKET VALUE ESTIMATE</Text>
        <Text style={precheckStyles.fmvRange}>
          {fmtDollars(fmv.lowCents)}–{fmtDollars(fmv.highCents)}
          {' · '}point {fmtDollars(fmv.pointCents)}
          {' · '}{fmv.confidence} confidence ({fmv.compsUsedCount} comps)
        </Text>
        {!fmvApplies && (
          <Text style={precheckStyles.fmvNoApply}>
            FMV review does not apply below $2,500 — business-purpose gate is primary.
          </Text>
        )}
      </View>

      {/* ── Expandable comparables ────────────────────────────────── */}
      <View style={precheckStyles.card}>
        <TouchableOpacity
          style={precheckStyles.compsToggleRow}
          onPress={() => setShowComps((v) => !v)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={showComps ? 'Hide comparables' : 'Show comparables'}
        >
          <Text style={precheckStyles.cardTitle}>COMPARABLES USED</Text>
          <Text style={precheckStyles.compsToggleLabel}>
            {showComps ? 'Hide ▲' : 'Show ▼'}
          </Text>
        </TouchableOpacity>
        {showComps && (
          fmv.compsUsedCount === 0 ? (
            <Text style={precheckStyles.compsEmpty}>
              Estimated from your reach + engagement (no direct comps yet).
            </Text>
          ) : (
            <Text style={precheckStyles.compsNote}>
              {fmv.compsUsedCount} comparable deal(s) used. Engagement-normalized IQR (P25–P75) applied.
              Roster/recruiting-category deals excluded per CSC guidance.
            </Text>
          )
        )}
      </View>

      {/* ── Overall verdict (secondary display) ──────────────────── */}
      <View style={precheckStyles.verdictRow}>
        <Text style={precheckStyles.verdictLabel}>OVERALL VERDICT</Text>
        <View
          style={[
            precheckStyles.verdictPill,
            { borderColor: verdictColor(result.verdict) },
          ]}
        >
          <Text style={[precheckStyles.verdictText, { color: verdictColor(result.verdict) }]}>
            {verdictLabel(result.verdict)}
          </Text>
        </View>
      </View>

      {/* Strong warning when likely-rejected */}
      {result.verdict === 'likely-rejected' && (
        <View style={precheckStyles.rejectedBanner}>
          <Text style={precheckStyles.rejectedBannerText}>
            One or more CSC tests failed. Signing is still your choice — this is a copilot,
            not a gate. Review the test results below and address before submitting to NIL Go.
          </Text>
        </View>
      )}

      {/* Payer entity type selector */}
      <View style={precheckStyles.selectorGroup}>
        <Text style={precheckStyles.selectorLabel}>PAYER ENTITY TYPE</Text>
        <View style={precheckStyles.chipRow}>
          {(Object.keys(PAYER_ENTITY_LABELS) as PayerEntityType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                precheckStyles.entityChip,
                payerEntityType === type && precheckStyles.entityChipSelected,
              ]}
              onPress={() => onPayerChange(type)}
              activeOpacity={0.75}
              accessibilityRole="radio"
              accessibilityState={{ selected: payerEntityType === type }}
            >
              <Text
                style={[
                  precheckStyles.entityChipText,
                  payerEntityType === type && precheckStyles.entityChipTextSelected,
                ]}
              >
                {PAYER_ENTITY_LABELS[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Associated-Entity banner */}
      {isAE && (
        <View style={precheckStyles.aeBanner}>
          <Text style={precheckStyles.aeBannerTitle}>ASSOCIATED-ENTITY PAYER</Text>
          <Text style={precheckStyles.aeBannerBody}>
            Enhanced CSC review likely — document business purpose and deliverables.
            The "{payerEntityType}" entity type triggers heightened scrutiny under
            CSC June 2026 rules.
          </Text>
        </View>
      )}

      {/* Three CSC test rows */}
      <View style={precheckStyles.card}>
        <Text style={precheckStyles.cardTitle}>CSC TEST RESULTS</Text>
        {(Object.entries(result.tests) as [string, 'pass' | 'warn' | 'fail'][]).map(([key, val]) => (
          <View key={key} style={precheckStyles.testRow}>
            <Text style={precheckStyles.testName}>{CSC_TEST_LABELS[key] ?? key}</Text>
            <View
              style={[
                precheckStyles.testPill,
                { borderColor: testColor(val) },
              ]}
            >
              <Text style={[precheckStyles.testPillText, { color: testColor(val) }]}>
                {testLabel(val)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Flags */}
      {result.flags.filter((f) => f.kind !== 'csc-report-required').map((flag) => (
        <View key={flag.kind} style={precheckStyles.flagCard}>
          <Text style={precheckStyles.flagLabel}>{flag.label.toUpperCase()}</Text>
          <Text style={precheckStyles.flagDetail}>{flag.detail}</Text>
        </View>
      ))}

      {/* FMV Disclaimer */}
      <Text style={precheckStyles.disclaimer}>
        {FMV_DISCLAIMER}
      </Text>
      <Text style={precheckStyles.disclaimer}>
        Rules version: {RULES_VERSION} · Prepared with Proslync — not an official CSC submission.
        This pre-check is a copilot tool, not legal advice.
      </Text>

      <View style={formStyles.buttonRow}>
        <TouchableOpacity style={formStyles.backBtn} onPress={onBack} activeOpacity={0.75}>
          <Text style={formStyles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={formStyles.continueBtn} onPress={onContinue} activeOpacity={0.82}>
          <Text style={formStyles.continueBtnText}>SIGN THE DEAL</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const precheckStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: WHITE,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    fontWeight: '500',
    lineHeight: 19,
  },
  verdictRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  verdictLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1,
  },
  verdictPill: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  verdictText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  rejectedBanner: {
    backgroundColor: 'rgba(255,69,58,0.10)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,69,58,0.35)',
    padding: 14,
  },
  rejectedBannerText: {
    fontSize: 13,
    color: 'rgba(255,69,58,0.9)',
    fontWeight: '600',
    lineHeight: 19,
  },
  selectorGroup: {
    gap: 8,
  },
  selectorLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  entityChip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: CARD_BG,
    minHeight: 44,
    justifyContent: 'center',
  },
  entityChipSelected: {
    backgroundColor: 'rgba(235,98,26,0.18)',
    borderColor: COPPER,
  },
  entityChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
  },
  entityChipTextSelected: {
    color: COPPER,
    fontWeight: '700',
  },
  aeBanner: {
    backgroundColor: 'rgba(255,159,10,0.10)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,159,10,0.35)',
    padding: 14,
    gap: 5,
  },
  aeBannerTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: TONE_WARN,
    letterSpacing: 1.2,
  },
  aeBannerBody: {
    fontSize: 13,
    color: 'rgba(255,159,10,0.9)',
    fontWeight: '600',
    lineHeight: 19,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  testName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: WHITE,
  },
  testPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  testPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  compLine: {
    backgroundColor: CARD_BG,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  compLineLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1,
  },
  compLineValue: {
    fontSize: 12,
    color: WHITE,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  flagCard: {
    backgroundColor: 'rgba(255,159,10,0.07)',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,159,10,0.22)',
    padding: 12,
    gap: 4,
  },
  flagLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: TONE_WARN,
    letterSpacing: 1,
  },
  flagDetail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
    lineHeight: 17,
  },
  disclaimer: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.30)',
    fontWeight: '500',
    lineHeight: 15,
    marginTop: 2,
  },
  bandCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    padding: 14,
    gap: 8,
  },
  bandTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bandHeadingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1.2,
  },
  bandPill: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  bandPillText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  bandReason: {
    fontSize: 13,
    color: WHITE,
    fontWeight: '600',
    lineHeight: 19,
  },
  fmvCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 5,
  },
  fmvLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1,
  },
  fmvRange: {
    fontSize: 13,
    color: WHITE,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  fmvNoApply: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '500',
    lineHeight: 16,
  },
  compsToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  compsToggleLabel: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '700',
  },
  compsEmpty: {
    fontSize: 12,
    color: MUTED,
    fontWeight: '500',
    lineHeight: 17,
    paddingTop: 4,
  },
  compsNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.70)',
    fontWeight: '500',
    lineHeight: 17,
    paddingTop: 4,
  },
});

// ── Root screen component ─────────────────────────────────────────────────

export default function DealEngineNewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = React.useState<Step>('picker');
  const [template, setTemplate] = React.useState<ContractTemplate | null>(null);
  const [fieldValues, setFieldValues] = React.useState<Record<string, string>>({});
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [payerEntityType, setPayerEntityType] = React.useState<PayerEntityType>('brand');
  const [typedName, setTypedName] = React.useState(KIYAN_NAME);
  const [svgPath, setSvgPath] = React.useState('');
  const [dealId, setDealId] = React.useState('');
  const [signing, setSigning] = React.useState(false);

  const stepTitles: Record<Step, string> = {
    picker: 'Start a Deal',
    form: 'Deal Details',
    summary: 'Review Summary',
    precheck: 'Will This Clear?',
    sign: 'Sign',
    confirm: 'Confirmed',
  };

  // Pre-fill defaults when template selected
  function handleSelectTemplate(tpl: ContractTemplate) {
    setTemplate(tpl);
    const defaults: Record<string, string> = {};
    for (const f of tpl.requiredFields) {
      if (f.type === 'select' && f.options?.[0]) {
        defaults[f.key] = f.options[0];
      }
      if (f.key === 'termStart') defaults[f.key] = todayISO();
      if (f.key === 'termEnd') defaults[f.key] = plusDaysISO(90);
    }
    setFieldValues(defaults);
    setStep('form');
  }

  function handleFieldChange(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  function buildSummaryText(): string {
    if (!template) return '';
    const amountCents = Math.round((parseFloat(fieldValues['dealValue'] ?? '0') || 0) * 100);
    const fees = computeFees(amountCents);
    const placeholderDealId = 'PSY-' + new Date().getFullYear() + '-PREVIEW';

    return interpolateSummary(template.plainSummary, fieldValues, {
      athleteName: KIYAN_NAME,
      brandName: 'The Brand',
      dealId: placeholderDealId,
      amountDollars: formatCents(fees.athleteCents),
      brandFee: formatCents(fees.brandFeeCents),
      brandTotal: formatCents(fees.brandTotalCents),
      termStart: fieldValues['termStart'] ?? '',
      termEnd: fieldValues['termEnd'] ?? '',
    });
  }

  async function handleSign() {
    if (!template || signing) return;
    setSigning(true);

    const now = new Date().toISOString();
    const year = new Date().getFullYear();
    const newDealId = generateDealId(year, defaultRand);
    const amountCents = Math.round((parseFloat(fieldValues['dealValue'] ?? '0') || 0) * 100);
    const fees = computeFees(amountCents);

    // Compute preclearance result to store with the deal (Phase D2 + FMV1)
    // Use FMV-derived comp range instead of static KIND_COMP_RANGES lookup.
    const reachForSign = getMockAthleteSocialReach('a-1');
    const fmvForSign = predictClearance({
      amountCents,
      dealKind: template.kind,
      deliverableDescription: fieldValues['deliverableDescription'] ?? '',
      payerEntityType,
      totalFollowers: reachForSign?.totalFollowers ?? 0,
      engagementRate7d: reachForSign?.engagementRate7d ?? 0,
    });
    const compRange = { lowCents: fmvForSign.fmv.lowCents, highCents: fmvForSign.fmv.highCents };
    const preclearanceResult = fmvForSign.gate;

    const signEvent: DealEvent = {
      at: now,
      actor: 'athlete',
      kind: 'signed',
      note: `Athlete signed: ${typedName}. Typed name confirmed. Brand-side fee model applied.`,
      ip: FIXTURE_IP,
    };

    const m1Due = plusDaysISO(30);
    const m1AutoApproveAt = milestoneAutoApproveAt(
      new Date(Date.now() + 30 * 24 * 3600e3 + 1000).toISOString(),
    );

    const newDeal: EngineDeal = {
      dealId: newDealId,
      templateId: template.id,
      templateVersion: template.version,
      athlete: KIYAN_NAME,
      brand: 'Your Brand',
      amountCents,
      feeRate: 0.10,
      termStart: fieldValues['termStart'] ?? todayISO(),
      termEnd: fieldValues['termEnd'] ?? plusDaysISO(90),
      deliverableDescription: fieldValues['deliverableDescription'] ?? '',
      exclusivity: (fieldValues['exclusivity'] ?? 'None') !== 'None',
      exclusivityScope:
        (fieldValues['exclusivity'] ?? 'None') !== 'None'
          ? fieldValues['exclusivity']
          : undefined,
      paymentSchedule:
        (fieldValues['paymentSchedule'] as EngineDeal['paymentSchedule']) ?? 'single',
      status: 'awaiting-signature',
      milestones: [
        {
          id: 'ms-new-1',
          description: fieldValues['deliverableDescription'] ?? 'Deliverable 1',
          dueISO: m1Due,
          deliverableType: 'other',
          verificationMethod: 'brand-confirm',
          amountCents,
          status: 'pending',
          autoApproveAt: m1AutoApproveAt,
        },
      ],
      events: [
        {
          at: now,
          actor: 'athlete',
          kind: 'created',
          note: 'Deal created via deal engine flow.',
        },
        {
          at: now,
          actor: 'athlete',
          kind: 'template-selected',
          note: `Template: ${template.title} v${template.version}`,
        },
        {
          at: now,
          actor: 'athlete',
          kind: 'fields-submitted',
          note: `Deal value: $${formatCents(amountCents)}. Schedule: ${fieldValues['paymentSchedule'] ?? 'single'}.`,
        },
        {
          at: now,
          actor: 'athlete',
          kind: 'summary-acknowledged',
          note: 'Plain-language summary acknowledged.',
        },
        signEvent,
      ],
      escrow: {
        state: 'unfunded',
        fundedCents: 0,
        releasedCents: 0,
      },
      fieldValues,
      athleteSignedAt: now,
      athleteSignedName: typedName,
      athleteSignaturePath: svgPath,
      isDemo: true,
      preclearance: {
        ...preclearanceResult,
        payerEntityType,
        rulesVersion: RULES_VERSION,
        compRange,
      },
      createdAt: now,
      updatedAt: now,
    };

    // Persist to AsyncStorage — merge over existing stored deals
    try {
      const existing = await AsyncStorage.getItem(DEAL_ENGINE_STORAGE_KEY);
      const deals: EngineDeal[] = existing ? JSON.parse(existing) : [];
      deals.push(newDeal);
      await AsyncStorage.setItem(DEAL_ENGINE_STORAGE_KEY, JSON.stringify(deals));
    } catch (_) {
      // Non-blocking — demo can proceed without persistence
    }

    setDealId(newDealId);
    setStep('confirm');
  }

  const stepIndex = (['picker', 'form', 'summary', 'precheck', 'sign', 'confirm'] as Step[]).indexOf(step);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[screenStyles.root, { paddingTop: insets.top }]}>
        {/* Navigation bar */}
        <View style={screenStyles.navBar}>
          {step !== 'confirm' && (
            <Pressable
              onPress={() => {
                if (step === 'picker') {
                  router.back();
                } else if (step === 'form') {
                  setStep('picker');
                } else if (step === 'summary') {
                  setStep('form');
                } else if (step === 'precheck') {
                  setStep('summary');
                } else if (step === 'sign') {
                  setStep('precheck');
                }
              }}
              style={screenStyles.backPressable}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={12}
            >
              <Text style={screenStyles.navBack}>&#8249;</Text>
            </Pressable>
          )}
          <Text style={screenStyles.navTitle}>{stepTitles[step]}</Text>
          {/* Step indicator */}
          {step !== 'confirm' && (
            <View style={screenStyles.stepRow}>
              {([0, 1, 2, 3, 4] as number[]).map((i) => (
                <View
                  key={i}
                  style={[
                    screenStyles.stepDot,
                    i <= stepIndex && screenStyles.stepDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Step content */}
        {step === 'picker' && <TemplatePicker onSelect={handleSelectTemplate} />}
        {step === 'form' && template && (
          <DealForm
            template={template}
            fieldValues={fieldValues}
            onChange={handleFieldChange}
            onContinue={() => { setAcknowledged(false); setStep('summary'); }}
            onBack={() => setStep('picker')}
          />
        )}
        {step === 'summary' && (
          <SummaryStep
            summaryText={buildSummaryText()}
            acknowledged={acknowledged}
            onToggle={() => setAcknowledged((p) => !p)}
            onContinue={() => setStep('precheck')}
            onBack={() => setStep('form')}
          />
        )}
        {step === 'precheck' && template && (
          <PrecheckStep
            amountCents={Math.round((parseFloat(fieldValues['dealValue'] ?? '0') || 0) * 100)}
            dealKind={template.kind}
            deliverableDescription={fieldValues['deliverableDescription'] ?? ''}
            payerEntityType={payerEntityType}
            onPayerChange={setPayerEntityType}
            onContinue={() => setStep('sign')}
            onBack={() => setStep('summary')}
          />
        )}
        {step === 'sign' && (
          <SignatureStep
            typedName={typedName}
            onTypedNameChange={setTypedName}
            svgPath={svgPath}
            onSvgPathChange={setSvgPath}
            onSign={handleSign}
            onBack={() => setStep('summary')}
            signing={signing}
          />
        )}
        {step === 'confirm' && (
          <ConfirmationStep
            dealId={dealId}
            onOpenDeal={() =>
              router.replace({
                pathname: '/deal-engine/[id]',
                params: { id: dealId },
              })
            }
          />
        )}
      </View>
    </>
  );
}

const screenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 10,
  },
  backPressable: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  navBack: {
    color: WHITE,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  navTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: WHITE,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  stepDotActive: {
    backgroundColor: COPPER,
  },
});
