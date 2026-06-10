// DestructiveConfirm — gated confirmation sheet for irreversible actions.
//
// Compliance contexts (voiding a deal, deleting a disclosure, revoking
// consent) demand more than a flat "Are you sure?" — this sheet gates the
// primary button with one of two friction patterns:
//
//   • requireTypeMatch: caller passes a phrase (e.g. athlete last name);
//     primary button disabled until the user types it (case-insensitive,
//     trimmed).
//   • delaySec: countdown (default 3s) before the primary button enables.
//
// Tapping the backdrop calls `onCancel`, never `onConfirm`.

import * as React from 'react';
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

import { useAppTheme } from '@/hooks/use-app-theme';
import { Brand } from '@/constants/brand';
import { Spacing, Radius } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export interface DestructiveConfirmProps {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Seconds to delay the primary button. Default 3. Ignored if requireTypeMatch is set. */
  delaySec?: number;
  /** Phrase the user must type (case-insensitive, trimmed). Supersedes delaySec. */
  requireTypeMatch?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const DestructiveConfirm = forwardRef<
  BottomSheetModal,
  DestructiveConfirmProps
>(function DestructiveConfirm(
  {
    title,
    body,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    delaySec = 3,
    requireTypeMatch,
    onConfirm,
    onCancel,
  },
  ref,
) {
  const { colors } = useAppTheme();

  // Internal ref so we can both forward to the caller AND dismiss ourselves
  // on confirm/cancel. The forwarded ref is set by gorhom; we shadow it via
  // a callback ref pattern by holding our own.
  const innerRef = React.useRef<BottomSheetModal>(null);
  React.useImperativeHandle(
    ref,
    () => innerRef.current as BottomSheetModal,
    [],
  );

  const gateMode: 'type' | 'delay' = requireTypeMatch ? 'type' : 'delay';
  const [typed, setTyped] = useState('');
  const [remaining, setRemaining] = useState(delaySec);

  // Reset gate state every time the sheet is shown.
  const handleChange = useCallback(
    (index: number) => {
      if (index >= 0) {
        setTyped('');
        setRemaining(delaySec);
      }
    },
    [delaySec],
  );

  // Countdown tick — only active for the delay mode.
  useEffect(() => {
    if (gateMode !== 'delay') return;
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearTimeout(t);
  }, [gateMode, remaining]);

  const typeMatches = useMemo(() => {
    if (!requireTypeMatch) return false;
    return (
      typed.trim().toLowerCase() === requireTypeMatch.trim().toLowerCase()
    );
  }, [typed, requireTypeMatch]);

  const canConfirm = gateMode === 'type' ? typeMatches : remaining === 0;

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleConfirm = useCallback(
    (_e: GestureResponderEvent) => {
      if (!canConfirm) return;
      innerRef.current?.dismiss();
      onConfirm();
    },
    [canConfirm, onConfirm],
  );

  const handleCancel = useCallback(() => {
    innerRef.current?.dismiss();
    onCancel?.();
  }, [onCancel]);

  const confirmLabelDisplay = useMemo(() => {
    if (gateMode === 'delay' && remaining > 0) {
      return `${confirmLabel} (${remaining}s)`;
    }
    return confirmLabel;
  }, [gateMode, remaining, confirmLabel]);

  return (
    <BottomSheetModal
      ref={innerRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onCancel}
      onChange={handleChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: colors.card,
        borderTopLeftRadius: Radius.xl,
        borderTopRightRadius: Radius.xl,
      }}
      handleIndicatorStyle={{
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
      }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={styles.container}>
        <Text
          style={[styles.title, { color: Brand.signal.danger.mid }]}
          numberOfLines={3}
        >
          {title}
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {body}
        </Text>

        {gateMode === 'type' ? (
          <View style={styles.typeGate}>
            <Text style={[styles.typePrompt, { color: colors.textSecondary }]}>
              Type{' '}
              <Text style={[styles.typePromptStrong, { color: colors.text }]}>
                {`"${requireTypeMatch}"`}
              </Text>{' '}
              to confirm.
            </Text>
            <BottomSheetTextInput
              value={typed}
              onChangeText={setTyped}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              placeholder={requireTypeMatch}
              placeholderTextColor={colors.placeholder}
              style={[
                styles.input,
                {
                  backgroundColor: colors.input,
                  borderColor: typeMatches
                    ? Brand.signal.danger.mid
                    : colors.inputBorder,
                  color: colors.text,
                },
              ]}
            />
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={handleCancel}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed ? { opacity: 0.6 } : null,
            ]}
            hitSlop={8}
          >
            <Text
              style={[styles.cancelLabel, { color: colors.textSecondary }]}
            >
              {cancelLabel}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleConfirm}
            disabled={!canConfirm}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canConfirm }}
            style={({ pressed }) => [
              styles.confirmBtn,
              {
                backgroundColor: Brand.signal.danger.mid,
                opacity: !canConfirm ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[styles.confirmLabel, { color: colors.textInverse }]}
              numberOfLines={1}
            >
              {confirmLabelDisplay}
            </Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    ...Typography.heading,
  },
  body: {
    ...Typography.body,
  },
  typeGate: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  typePrompt: {
    ...Typography.callout,
  },
  typePromptStrong: {
    ...Typography.callout,
    fontFamily: Brand.fonts.heading,
  },
  input: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  cancelBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  cancelLabel: {
    ...Typography.button,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  confirmLabel: {
    ...Typography.button,
  },
});
