// ── SPARKLINE ─────────────────────────────────────────────
// Standalone sparkline extracted so other components (badge rows,
// inline cells, list items) can compose with the same visual that
// lives inside KpiTile. No axes, no points — just a normalised
// polyline (and optional fill area).

import * as React from 'react';
import Svg, { Polygon, Polyline } from 'react-native-svg';

import { Brand } from '@/constants/brand';

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: boolean;
}

const MAX_POINTS = 24;
const FILL_ALPHA = 0.12;

// Brand.copperScale[400] in 8-digit hex for the default fill alpha.
// We compute it from the stroke at render-time so a custom `stroke`
// prop still gets a matching fill.
function withAlpha(hex: string, alpha: number): string {
  // Accept #RRGGBB only — anything else passes through (consumer's
  // problem if they handed us rgba() and asked for fill).
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${match[1]}${a}`;
}

export function Sparkline({
  data,
  width = 60,
  height = 18,
  stroke = Brand.copperScale[400],
  strokeWidth = 1.5,
  fill = false,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const series = data.slice(-MAX_POINTS);
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const stepX = width / (series.length - 1);

  const coords = series.map((n, i) => {
    const x = i * stepX;
    const y = height - ((n - min) / range) * height;
    return { x, y };
  });

  const polylinePoints = coords
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');

  // Close the polygon with the bottom-right and bottom-left corners
  // so the fill sits beneath the line all the way to the baseline.
  const polygonPoints = fill
    ? `${polylinePoints} ${width.toFixed(2)},${height.toFixed(2)} 0,${height.toFixed(2)}`
    : '';

  return (
    <Svg width={width} height={height}>
      {fill ? (
        <Polygon points={polygonPoints} fill={withAlpha(stroke, FILL_ALPHA)} />
      ) : null}
      <Polyline
        points={polylinePoints}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
