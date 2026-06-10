// DetentSheet — Apple-Maps style two-detent sheet.
//
// Canonical pattern for athlete-profile / deal-detail / brand-HQ peek
// surfaces. Caller controls open/close via the forwarded ref:
//
//   const ref = useRef<BottomSheetModal>(null);
//   ref.current?.present();
//   ref.current?.snapToIndex(1);
//   ref.current?.dismiss();
//
// Tokens-only. Background uses colors.card (warm gray ramp), handle uses
// colors.border (copper-tinted hairline). Header is optional — pass title
// and/or subtitle to render it; omit both for a chrome-less peek.

import * as React from 'react';
import { forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

import { useAppTheme } from '@/hooks/use-app-theme';
import { Spacing, Radius } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

export interface DetentSheetProps {
  /** Optional title — renders the header band when present. */
  title?: string;
  /** Optional subtitle — only rendered when `title` is also set. */
  subtitle?: string;
  /**
   * Two detents as percentage strings (or numeric pixel heights). Defaults
   * to ['50%', '90%'] which matches the Apple-Maps peek pattern.
   */
  detents?: [string, string];
  /** Which detent to open at (0 = smaller, 1 = larger). Default 0. */
  initialDetent?: 0 | 1;
  /** Whether to show the drag handle. Default true. */
  showHandle?: boolean;
  /** Wrap children in a scroll view. Default true. */
  scrollable?: boolean;
  /** Fired after the sheet is dismissed. */
  onDismiss?: () => void;
  children: React.ReactNode;
}

export const DetentSheet = forwardRef<BottomSheetModal, DetentSheetProps>(
  function DetentSheet(
    {
      title,
      subtitle,
      detents = ['50%', '90%'],
      initialDetent = 0,
      showHandle = true,
      scrollable = true,
      onDismiss,
      children,
    },
    ref,
  ) {
    const { colors } = useAppTheme();

    // Stable reference so gorhom doesn't re-derive snap points each render.
    const snapPoints = useMemo<[string, string]>(
      () => detents,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [detents[0], detents[1]],
    );

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

    const hasHeader = Boolean(title);

    const header = hasHeader ? (
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    ) : null;

    const body = scrollable ? (
      <BottomSheetScrollView contentContainerStyle={styles.bodyScroll}>
        {header}
        {children}
      </BottomSheetScrollView>
    ) : (
      <BottomSheetView style={styles.body}>
        {header}
        {children}
      </BottomSheetView>
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        index={initialDetent}
        enableDynamicSizing={false}
        enablePanDownToClose
        onDismiss={onDismiss}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: colors.card,
          borderTopLeftRadius: Radius.xl,
          borderTopRightRadius: Radius.xl,
        }}
        handleStyle={showHandle ? undefined : styles.handleHidden}
        handleIndicatorStyle={{
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
        }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        {body}
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  handleHidden: {
    height: 0,
    paddingVertical: 0,
  },
  body: {
    flex: 1,
  },
  bodyScroll: {
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  title: {
    ...Typography.heading,
  },
  subtitle: {
    ...Typography.callout,
  },
});
