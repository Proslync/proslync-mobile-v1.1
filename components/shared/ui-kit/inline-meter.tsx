// ── INLINE METER ──────────────────────────────────────────
// Textual progress meter — Linear-style "3 of 5 disclosures
// complete" with an optional thin track underneath. Replaces
// decorative progress bars per DesignCeilings.chartsPerScreen.
//
// Edge cases:
//   - total === 0 → renders "—" and zero-width track.
//   - current > total → text shows literal "{c} of {t}";
//     fill clamps to 100% so the visual stays sensible.

import * as React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import { BaseColors } from '@/constants/colors';
import { Duration, Curve } from '@/constants/motion';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAppTheme } from '@/hooks/use-app-theme';

export type InlineMeterTone = 'default' | 'success' | 'warning' | 'danger';
export type InlineMeterSize = 'sm' | 'md';

export interface InlineMeterProps {
  current: number;
  total: number;
  /** Appended after "{current} of {total}" — e.g., "disclosures complete". */
  label?: string;
  /** Applied to both numbers — e.g., "$" or "%". */
  unit?: string;
  tone?: InlineMeterTone;
  /** Show the thin track underneath. Defaults to true. */
  showTrack?: boolean;
  size?: InlineMeterSize;
}

function toneFill(tone: InlineMeterTone): string {
  switch (tone) {
    case 'success':
      return BaseColors.success;
    case 'warning':
      return BaseColors.warning;
    case 'danger':
      return BaseColors.error;
    case 'default':
    default:
      return Brand.copperScale['500'];
  }
}

function clampRatio(current: number, total: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  const r = current / total;
  if (r <= 0) return 0;
  if (r >= 1) return 1;
  return r;
}

function formatNumberWithUnit(n: number, unit?: string): string {
  if (!unit) return String(n);
  // Currency-style units lead; percent-style trail.
  if (unit === '$' || unit === '€' || unit === '£' || unit === '¥') {
    return `${unit}${n}`;
  }
  return `${n}${unit}`;
}

export function InlineMeter({
  current,
  total,
  label,
  unit,
  tone = 'default',
  showTrack = true,
  size = 'md',
}: InlineMeterProps) {
  const { colors } = useAppTheme();

  const isZeroTotal = total === 0;
  const ratio = clampRatio(current, total);

  // Animate the fill width. Reset target whenever ratio changes.
  const widthAnim = React.useRef(new Animated.Value(ratio)).current;
  React.useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: ratio,
      duration: Duration.normal,
      easing: Curve.standard,
      useNativeDriver: false,
    }).start();
  }, [ratio, widthAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const trackHeight = size === 'sm' ? 4 : 6;
  const fillColor = toneFill(tone);

  return (
    <View style={styles.container}>
      <Text style={[Typography.callout, { color: colors.textSecondary }]}>
        {isZeroTotal ? (
          <Text style={{ color: colors.text }}>—</Text>
        ) : (
          <>
            <Text style={{ color: colors.text }}>
              {formatNumberWithUnit(current, unit)}
            </Text>
            <Text>{' of '}</Text>
            <Text style={{ color: colors.text }}>
              {formatNumberWithUnit(total, unit)}
            </Text>
            {label ? <Text>{` ${label}`}</Text> : null}
          </>
        )}
      </Text>
      {showTrack ? (
        <View
          style={[
            styles.track,
            {
              backgroundColor: colors.border,
              height: trackHeight,
              borderRadius: Radius.pill,
              marginTop: Spacing.xs,
            },
          ]}
        >
          <Animated.View
            style={{
              width: animatedWidth,
              height: trackHeight,
              backgroundColor: fillColor,
              borderRadius: Radius.pill,
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  track: {
    overflow: 'hidden',
    width: '100%',
  },
});
