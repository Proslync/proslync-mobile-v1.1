/**
 * AbstractArt — four seeded, deterministic art recipes for the masonry fan feed.
 * Props: { seed, width, height }. Memoized — same seed+size → identical output.
 * Recipes 0-2 render inside one <Svg>; recipe 3 uses plain Views + LinearGradient.
 */

import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { View } from 'react-native';
import { Circle, Path, Polygon, Rect, Svg } from 'react-native-svg';

import { hashCode, mulberry32, seededPick } from '@/lib/fan/seeded';

const PALETTE = ['#FF6F3C', '#EB621A', '#FFFFFF', '#2A2A2A'] as const;
const BG = '#1A1A1A';

type Rand = () => number;
type Props = { seed: string; width: number; height: number };

// ─── helpers ────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[], rand: Rand): T {
  return arr[Math.floor(rand() * arr.length)];
}

/** Build an SVG arc path from (cx,cy) at radius r, start→end angles (degrees). */
function arcPath(cx: number, cy: number, r: number, startDeg: number, sweepDeg: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const endDeg = startDeg + sweepDeg;
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = sweepDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

// ─── Recipe 0: Arc Burst ────────────────────────────────────────────────────

function ArcBurst({ rand, width, height }: { rand: Rand; width: number; height: number }) {
  const minDim = Math.min(width, height);
  const maxR = (minDim / 2) * 0.9;
  const cx = width / 2 + (rand() - 0.5) * width * 0.3;
  const cy = height / 2 + (rand() - 0.5) * height * 0.3;
  const count = 10 + Math.floor(rand() * 7); // 10–16
  const arcs: React.ReactElement[] = [];
  for (let i = 0; i < count; i++) {
    const r = maxR * (0.1 + rand() * 0.9);
    const startDeg = rand() * 360;
    const sweepDeg = 40 + rand() * 160; // 40–200
    const color = pick(PALETTE.slice(0, 3), rand); // no dark on dark
    const opacity = 0.25 + rand() * 0.65;
    arcs.push(
      <Path
        key={i}
        d={arcPath(cx, cy, r, startDeg, sweepDeg)}
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={opacity}
        fill="none"
      />,
    );
  }
  return <>{arcs}</>;
}

// ─── Recipe 1: Bauhaus Grid ─────────────────────────────────────────────────

type CellKind = 'empty' | 'bar' | 'circle' | 'triangle' | 'arc';
const CELL_WEIGHTS: [CellKind, number][] = [
  ['empty', 0.35], ['bar', 0.2], ['circle', 0.2], ['triangle', 0.15], ['arc', 0.1],
];

function weightedPick(weights: [CellKind, number][], rand: Rand): CellKind {
  let r = rand();
  for (const [kind, w] of weights) {
    r -= w;
    if (r < 0) return kind;
  }
  return weights[weights.length - 1][0];
}

function BauhausGrid({ rand, width, height }: { rand: Rand; width: number; height: number }) {
  const cols = 3;
  const rows = 4;
  const cellW = width / cols;
  const cellH = height / rows;
  const inset = 0.12;
  const shapes: React.ReactElement[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const kind = weightedPick(CELL_WEIGHTS, rand);
      if (kind === 'empty') continue;

      const ox = col * cellW;
      const oy = row * cellH;
      const iw = cellW * (1 - inset * 2);
      const ih = cellH * (1 - inset * 2);
      const ix = ox + cellW * inset;
      const iy = oy + cellH * inset;
      const cx = ox + cellW / 2;
      const cy = oy + cellH / 2;

      // favor dark and white, rarely orange
      const colorIdx = Math.floor(rand() * 10);
      const color =
        colorIdx < 4 ? '#2A2A2A' : colorIdx < 7 ? '#FFFFFF' : colorIdx < 9 ? '#FF6F3C' : '#EB621A';
      const opacity = 0.3 + rand() * 0.5;
      const key = `${row}-${col}`;

      if (kind === 'bar') {
        const horiz = rand() < 0.5;
        shapes.push(
          <Rect
            key={key}
            x={horiz ? ix : cx - iw * 0.1}
            y={horiz ? cy - ih * 0.1 : iy}
            width={horiz ? iw : iw * 0.2}
            height={horiz ? ih * 0.2 : ih}
            fill={color}
            fillOpacity={opacity}
          />,
        );
      } else if (kind === 'circle') {
        shapes.push(
          <Circle
            key={key}
            cx={cx}
            cy={cy}
            r={Math.min(iw, ih) / 2}
            fill={color}
            fillOpacity={opacity}
          />,
        );
      } else if (kind === 'triangle') {
        const pts = `${ix},${iy + ih} ${ix + iw / 2},${iy} ${ix + iw},${iy + ih}`;
        shapes.push(<Polygon key={key} points={pts} fill={color} fillOpacity={opacity} />);
      } else if (kind === 'arc') {
        const r = Math.min(iw, ih) * 0.5;
        const startDeg = Math.floor(rand() * 4) * 90; // 0, 90, 180, or 270
        shapes.push(
          <Path
            key={key}
            d={arcPath(cx, cy, r, startDeg, 90)}
            stroke={color}
            strokeWidth={2}
            strokeOpacity={opacity}
            fill="none"
          />,
        );
      }
    }
  }
  return <>{shapes}</>;
}

// ─── Recipe 2: Organic Blob ─────────────────────────────────────────────────

function blobPath(points: [number, number][]): string {
  const n = points.length;
  // Midpoint smoothing: draw quadratic bezier from midpoint to midpoint through each control point
  const mids: [number, number][] = points.map((p, i) => {
    const next = points[(i + 1) % n];
    return [(p[0] + next[0]) / 2, (p[1] + next[1]) / 2];
  });
  let d = `M ${mids[0][0]} ${mids[0][1]}`;
  for (let i = 0; i < n; i++) {
    const cp = points[i];
    const end = mids[(i + 1) % n];
    d += ` Q ${cp[0]} ${cp[1]} ${end[0]} ${end[1]}`;
  }
  return d + ' Z';
}

function OrganicBlob({ rand, width, height }: { rand: Rand; width: number; height: number }) {
  const minDim = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;
  const baseR = minDim * (0.3 + rand() * 0.12); // 0.30–0.42 × minDim
  const nPts = 6;

  const pts: [number, number][] = Array.from({ length: nPts }, (_, i) => {
    const angle = (i / nPts) * Math.PI * 2;
    const r = baseR * (1 + (rand() - 0.5) * 0.7); // jitter ±35%
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  });

  const opacity1 = 0.55 + rand() * 0.25;
  const showSecond = rand() < 0.5;

  const secondBlob = showSecond
    ? (() => {
        const pts2: [number, number][] = pts.map(([x, y]) => [
          cx + (x - cx) * 0.6,
          cy + (y - cy) * 0.6,
        ]);
        return (
          <Path key="blob2" d={blobPath(pts2)} fill="#FFFFFF" fillOpacity={0.08} />
        );
      })()
    : null;

  return (
    <>
      <Path d={blobPath(pts)} fill="#FF6F3C" fillOpacity={opacity1} />
      {secondBlob}
    </>
  );
}

// ─── Recipe 3: Radial Mesh (plain Views + LinearGradient) ───────────────────

function RadialMesh({ rand, width, height }: { rand: Rand; width: number; height: number }) {
  const sizes = [0.8, 0.5, 0.25];
  const circles = sizes.map((frac, i) => {
    const d = Math.round(width * frac);
    const colorBase = pick(PALETTE.slice(0, 3), rand); // no pure dark
    // 8-digit hex for transparent stop
    const transparentStop = colorBase + '00';
    // seeded center, keep within bounds
    const maxOffsetX = (width - d) / 2;
    const maxOffsetY = (height - d) / 2;
    const left = Math.round(width / 2 - d / 2 + (rand() - 0.5) * maxOffsetX * 1.2);
    const top = Math.round(height / 2 - d / 2 + (rand() - 0.5) * maxOffsetY * 1.2);
    return (
      <View
        key={i}
        style={{
          position: 'absolute',
          left,
          top,
          width: d,
          height: d,
          borderRadius: 9999,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={[colorBase, transparentStop]}
          style={{ width: d, height: d }}
        />
      </View>
    );
  });
  return <>{circles}</>;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export const AbstractArt = React.memo(function AbstractArt({ seed, width, height }: Props) {
  const recipe = seededPick(seed, 4);
  const rand = mulberry32(hashCode('art:' + seed));

  if (recipe === 3) {
    // Radial mesh: plain Views, no Svg
    return (
      <View style={{ width, height, backgroundColor: BG, overflow: 'hidden' }}>
        <RadialMesh rand={rand} width={width} height={height} />
      </View>
    );
  }

  return (
    <View style={{ width, height, backgroundColor: BG, overflow: 'hidden' }}>
      <Svg width={width} height={height}>
        {recipe === 0 && <ArcBurst rand={rand} width={width} height={height} />}
        {recipe === 1 && <BauhausGrid rand={rand} width={width} height={height} />}
        {recipe === 2 && <OrganicBlob rand={rand} width={width} height={height} />}
      </Svg>
    </View>
  );
});
