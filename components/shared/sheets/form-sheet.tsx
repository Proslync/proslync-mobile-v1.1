// FormSheet — Sticky header + scrollable body + sticky footer CTA.
//
// Canonical "fill out a form" sheet. The footer button is the screen's
// single allowed CTA bloom (per DesignCeilings.shadow.cta). Heavy form
// customization stays in `children`; the sheet only owns chrome.
//
//   const ref = useRef<BottomSheetModal>(null);
//   <FormSheet ref={ref} title="Edit deal" onSubmit={save}>...</FormSheet>
//   ref.current?.present();

import * as React from 'react';
import { forwardRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetFooter,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';

import { useAppTheme } from '@/hooks/use-app-theme';
import { Brand, DesignCeilings } from '@/constants/brand';
import { Spacing, Radius } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export interface FormSheetProps {
  title: string;
  /** Text-button shown in the header-left slot. Omit to hide cancel. */
  onCancel?: () => void;
  /** Primary CTA label. Default 'Save'. */
  submitLabel?: string;
  onSubmit: () => void;
  /** When true, footer button shows a spinner and is non-interactive. */
  submitting?: boolean;
  /** When false, the footer button reads as disabled. Default true. */
  canSubmit?: boolean;
  /** Footer button is rendered in danger tone. Default false. */
  destructive?: boolean;
  children: React.ReactNode;
}

export const FormSheet = forwardRef<BottomSheetModal, FormSheetProps>(
  function FormSheet(
    {
      title,
      onCancel,
      submitLabel = 'Save',
      onSubmit,
      submitting = false,
      canSubmit = true,
      destructive = false,
      children,
    },
    ref,
  ) {
    const { colors } = useAppTheme();

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.4}
        />
      ),
      [],
    );

    const enabled = canSubmit && !submitting;

    const footerBackground = !enabled
      ? colors.buttonDisabled
      : destructive
        ? Brand.signal.danger.mid
        : Brand.colors.copper;

    const handleSubmit = useCallback(
      (_e: GestureResponderEvent) => {
        if (!enabled) return;
        onSubmit();
      },
      [enabled, onSubmit],
    );

    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => (
        <BottomSheetFooter {...props} bottomInset={0}>
          <View
            style={[
              styles.footerWrap,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.separator,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !enabled, busy: submitting }}
              onPress={handleSubmit}
              disabled={!enabled}
              style={({ pressed }) => [
                styles.footerBtn,
                {
                  backgroundColor: footerBackground,
                  shadowColor: '#000',
                  shadowOpacity: DesignCeilings.shadow.ctaOpacity,
                  shadowRadius: DesignCeilings.shadow.ctaRadius,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: DesignCeilings.shadow.ctaElevation,
                },
                pressed && enabled ? { opacity: 0.85 } : null,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text
                  style={[styles.footerBtnLabel, { color: colors.textInverse }]}
                >
                  {submitLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </BottomSheetFooter>
      ),
      [
        colors.card,
        colors.separator,
        colors.textInverse,
        enabled,
        footerBackground,
        handleSubmit,
        submitLabel,
        submitting,
      ],
    );

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        maxDynamicContentSize={undefined}
        snapPoints={['90%']}
        index={0}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        footerComponent={renderFooter}
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
        {/* Sticky header (lives inside sheet, above scrollable body). */}
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.separator },
          ]}
        >
          <View style={styles.headerSlot}>
            {onCancel ? (
              <Pressable
                onPress={onCancel}
                disabled={submitting}
                accessibilityRole="button"
                hitSlop={8}
              >
                {({ pressed }) => (
                  <Text
                    style={[
                      styles.cancelLabel,
                      { color: colors.textSecondary },
                      pressed ? { opacity: 0.6 } : null,
                    ]}
                  >
                    Cancel
                  </Text>
                )}
              </Pressable>
            ) : null}
          </View>
          <View style={styles.headerCenter}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
          <View style={styles.headerSlot} />
        </View>

        <BottomSheetScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

const FOOTER_BTN_HEIGHT = 52;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSlot: {
    minWidth: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...Typography.title,
  },
  cancelLabel: {
    ...Typography.button,
  },
  body: {
    padding: Spacing.lg,
    // Leave room under the scroll body for the footer bloom so the last
    // input doesn't sit under it.
    paddingBottom: FOOTER_BTN_HEIGHT + Spacing.xl + Spacing.lg,
  },
  footerWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBtn: {
    height: FOOTER_BTN_HEIGHT,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  footerBtnLabel: {
    ...Typography.button,
  },
});
