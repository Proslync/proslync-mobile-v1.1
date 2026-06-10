// ── COMPLIANCE RING ───────────────────────────────────────
// Compact radial summarising the 3-track NIL compliance review
// (NCAA / school / ethics). Three arc segments, each lit by its
// track's review state. Replaces the inline `ComplianceTrack` row
// on space-tight surfaces (deal-row trailing, AD console review
// queue, dashboard tile) where the full label-up layout doesn't fit.
//
// Visual ranking matches the per-track tone map:
//   approved      → success.mid    (lit segment, full opacity)
//   flagged/warn  → copper         (lit segment)
//   rejected      → danger.mid     (lit segment)
//   pending       → info.mid       (lit segment, slight pulse)
//   not-required  → muted          (track stays dim)
// Stroke weight + diameter scale via `size`. Center label optional —
// defaults to the count of tracks approved (e.g. "2/3").

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { Brand } from '@/constants/brand';
import { useAppTheme } from '@/hooks/use-app-theme';

export type ComplianceRingState =
  | 'pending'
  | 'approved'
  | 'flagged'
  | 'rejected'
  | 'not-required';

export interface ComplianceRingProps {
  ncaa: ComplianceRingState;
  school: ComplianceRingState;
  ethics: ComplianceRingState;
  /** Diameter px. Stroke width derives proportionally. */
  size?: number;
  /** Center label override. Defaults to "<approved>/3". */
  centerLabel?: string;
  /** Hide the center label entirely. */
  hideLabel?: boolean;
}

const STATE_COLOR: Record<ComplianceRingState, string> = {
  approved: Brand.signal.success.mid,
  flagged: Brand.colors.copper,
  rejected: Brand.signal.danger.mid,
  pending: Brand.signal.info.mid,
  'not-required': Brand.signal.neutral.mid,
};

// Per-state alpha for the arc — lit states are bright, pending dims, n/a faintest.
const STATE_OPACITY: Record<ComplianceRingState, number> = {
  approved: 1,
  flagged: 1,
  rejected: 1,
  pending: 0.55,
  'not-required': 0.18,
};

export function ComplianceRing({
  ncaa,
  school,
  ethics,
  size = 56,
  centerLabel,
  hideLabel = false,
}: ComplianceRingProps) {
  const { colors } = useAppTheme();

  const stroke = Math.max(4, Math.round(size * 0.12));
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Each track owns one third of the circle. We render each as its own
  // Circle with a stroke-dasharray that paints exactly that arc.
  const segmentLen = circumference / 3;
  // Tiny gap between segments so the boundaries read.
  const gap = Math.max(2, segmentLen * 0.08);
  const dash = `${segmentLen - gap} ${circumference - (segmentLen - gap)}`;

  const tracks: { key: 'ncaa' | 'school' | 'ethics'; state: ComplianceRingState }[] = [
    { key: 'ncaa', state: ncaa },
    { key: 'school', state: school },
    { key: 'ethics', state: ethics },
  ];

  // Arcs start at -90deg (top) and rotate clockwise.
  // Segment offsets so they land at 12 / 4 / 8 o'clock positions.
  const segmentRotations = [-90, 30, 150];

  const approvedCount = tracks.filter((t) => t.state === 'approved').length;
  const required = tracks.filter((t) => t.state !== 'not-required').length;
  const label = centerLabel ?? `${approvedCount}/${required || 3}`;

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessibilityRole="image"
      accessibilityLabel={`Compliance — ${approvedCount} of ${required || 3} tracks approved`}
    >
      <Svg width={size} height={size}>
        {/* Background track ring */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={colors.border}
          strokeWidth={stroke}
          fill="none"
        />
        {tracks.map((t, i) => {
          const color = STATE_COLOR[t.state];
          const opacity = STATE_OPACITY[t.state];
          return (
            <G key={t.key} rotation={segmentRotations[i]} origin={`${cx}, ${cy}`}>
              <Circle
                cx={cx}
                cy={cy}
                r={radius}
                stroke={color}
                strokeOpacity={opacity}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={dash}
                fill="none"
              />
            </G>
          );
        })}
      </Svg>
      {!hideLabel ? (
        <View style={[styles.center, { width: size, height: size }]} pointerEvents="none">
          <Text
            style={[styles.label, { color: colors.text, fontSize: Math.round(size * 0.22) }]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
