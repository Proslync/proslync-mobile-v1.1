// ── DISCLOSURE FLOW STEP ──────────────────────────────────
// Canonical step-frame for the NIL-deal disclosure flow.
// Hosts a single step's form body inside a header (progress
// meter + title + hint + optional cancel) and a footer
// (back / save-draft / primary advance).
//
// This component is presentational only — it does not own
// persistence, navigation, or scrolling. The parent screen /
// sheet is responsible for:
//   - laying this out inside a flex column (header / body /
//     footer stack), and providing its own ScrollView around
//     the children if the form body needs to scroll.
//   - wiring `onSaveDraft` to actual storage.
//   - routing on `onAdvance` / `onBack` / `onCancel`.
//
// The footer is rendered inline at the end of the frame.
// Sticky-to-bottom behavior is the parent's responsibility
// (e.g., flex: 1 on the body, footer outside the scroll).

import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand, DesignCeilings } from '@/constants/brand';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAppTheme } from '@/hooks/use-app-theme';
import { InlineMeter } from '@/components/shared/ui-kit/inline-meter';

export interface DisclosureStep {
  id: string;
  title: string;
  hint?: string;
}

export interface DisclosureFlowStepProps {
  steps: DisclosureStep[];
  currentStepId: string;
  children: React.ReactNode;
  onAdvance: () => void;
  onBack?: () => void;
  onSaveDraft?: () => void;
  onCancel?: () => void;
  canAdvance?: boolean;
  advanceLabel?: string;
  pending?: boolean;
}

export function DisclosureFlowStep({
  steps,
  currentStepId,
  children,
  onAdvance,
  onBack,
  onSaveDraft,
  onCancel,
  canAdvance = true,
  advanceLabel = 'Continue',
  pending = false,
}: DisclosureFlowStepProps) {
  const { colors } = useAppTheme();

  const total = steps.length;
  const index = steps.findIndex((s) => s.id === currentStepId);
  const isKnown = index >= 0;
  const current = isKnown ? index + 1 : 0;
  const step = isKnown ? steps[index] : undefined;
  const isFirstStep = index === 0;

  const advanceDisabled = !canAdvance || pending;

  return (
    <View style={styles.frame}>
      {/* ── Header ───────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.meterSlot}>
            <InlineMeter
              current={current}
              total={total}
              label="step"
              size="md"
              tone="default"
              showTrack
            />
          </View>
          {onCancel ? (
            <Pressable
              onPress={onCancel}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cancel disclosure"
              style={({ pressed }) => [
                styles.cancelButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text
                style={[
                  Typography.callout,
                  { color: colors.textSecondary },
                ]}
              >
                Cancel
              </Text>
            </Pressable>
          ) : null}
        </View>

        {isKnown && step ? (
          <>
            <Text
              style={[
                Typography.heading,
                styles.title,
                { color: colors.text },
              ]}
            >
              {step.title}
            </Text>
            {step.hint ? (
              <Text
                style={[
                  Typography.callout,
                  styles.hint,
                  { color: colors.textSecondary },
                ]}
              >
                {step.hint}
              </Text>
            ) : null}
          </>
        ) : (
          <Text
            style={[
              Typography.callout,
              styles.hint,
              { color: colors.textSecondary },
            ]}
          >
            Unknown step
          </Text>
        )}
      </View>

      {/* ── Body ─────────────────────────────────────────── */}
      {/*
        Consumer slots the actual form fields here. If the
        form needs to scroll, wrap children in a ScrollView
        upstream with keyboardShouldPersistTaps="handled".
      */}
      <View style={styles.body}>{children}</View>

      {/* ── Footer ───────────────────────────────────────── */}
      {/*
        Parent owns sticky positioning. This footer is
        rendered inline at the bottom of the frame; for a
        sticky-to-bottom pattern, parent should give the body
        flex: 1 and keep this component outside any scroll.
      */}
      <View
        style={[
          styles.footer,
          { borderTopColor: colors.separator },
        ]}
      >
        <View style={styles.footerLeft}>
          {!isFirstStep && onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Back to previous step"
              style={({ pressed }) => [
                styles.textButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text
                style={[
                  Typography.callout,
                  { color: colors.textSecondary },
                ]}
              >
                Back
              </Text>
            </Pressable>
          ) : null}
          {onSaveDraft ? (
            <Pressable
              onPress={onSaveDraft}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Save draft"
              style={({ pressed }) => [
                styles.textButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text
                style={[
                  Typography.callout,
                  { color: colors.textSecondary },
                ]}
              >
                Save draft
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={advanceDisabled ? undefined : onAdvance}
          disabled={advanceDisabled}
          accessibilityRole="button"
          accessibilityState={{ disabled: advanceDisabled, busy: pending }}
          accessibilityLabel={advanceLabel}
          style={({ pressed }) => [
            styles.advanceButton,
            {
              backgroundColor: advanceDisabled
                ? colors.buttonDisabled
                : Brand.copperScale['500'],
              shadowColor: colors.shadow,
              shadowOpacity: advanceDisabled
                ? 0
                : DesignCeilings.shadow.ctaOpacity,
              shadowRadius: DesignCeilings.shadow.ctaRadius,
              shadowOffset: { width: 0, height: 2 },
              elevation: advanceDisabled
                ? 0
                : DesignCeilings.shadow.ctaElevation,
              opacity:
                advanceDisabled && !pending
                  ? 0.5
                  : pressed
                    ? 0.85
                    : 1,
            },
          ]}
        >
          {pending ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text
              style={[
                Typography.callout,
                styles.advanceLabel,
                { color: colors.textInverse },
              ]}
            >
              {advanceLabel}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'stretch',
  },
  header: {
    paddingTop: Spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  meterSlot: {
    flex: 1,
  },
  cancelButton: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  title: {
    marginTop: Spacing.sm,
  },
  hint: {
    marginTop: Spacing.xs,
  },
  body: {
    paddingVertical: Spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
  },
  textButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  advanceButton: {
    minHeight: 44,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  advanceLabel: {
    fontWeight: '600',
  },
});
