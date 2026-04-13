// Metric Detail Sheet — full-width modal positioned below ticker
import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PanResponder,
  Animated as RNAnimated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import Svg, {
  Path,
  Line,
  Defs,
  LinearGradient as SvgGrad,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import type { AnalyticsMetric, TimeRange } from './analytics-chart';
import { DASHBOARD_TIME_RANGES } from './analytics-chart';

const { width: SW, height: SH } = Dimensions.get('window');
const CHART_W = SW - 32;
const CHART_H = 200;

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function buildSmooth(data: number[], w: number, h: number, pad = 4): string {
  if (data.length < 2) return '';
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: pad + (h - pad * 2) - ((v - mn) / rng) * (h - pad * 2),
  }));
  let p = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const cpx = (pts[i].x + pts[i + 1].x) / 2;
    p += ` C ${cpx} ${pts[i].y}, ${cpx} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return p;
}

function buildArea(data: number[], w: number, h: number, pad = 4): string {
  const line = buildSmooth(data, w, h, pad);
  if (!line) return '';
  return `${line} L ${pad + (w - pad * 2)} ${h} L ${pad} ${h} Z`;
}

function deriveStat(data: number[], stat: string): string {
  if (data.length === 0) return '—';
  const mn = Math.min(...data), mx = Math.max(...data);
  const sum = data.reduce((a, b) => a + b, 0);
  const avg = sum / data.length;
  switch (stat) {
    case 'total': return sum.toLocaleString();
    case 'avg': return Math.round(avg).toLocaleString();
    case 'peak': return mx.toLocaleString();
    case 'lowest': return mn.toLocaleString();
    case 'latest': return data[data.length - 1]?.toLocaleString() ?? '—';
    case 'change': {
      if (data.length < 2) return '—';
      const diff = data[data.length - 1] - data[0];
      const sign = diff >= 0 ? '+' : '';
      return `${sign}${diff.toLocaleString()}`;
    }
    default: return '—';
  }
}

function getRangeLabel(range: TimeRange): string {
  switch (range) {
    case '12H': return 'Past 12 Hours';
    case '1D': return 'Today';
    case '1W': return 'Past Week';
    case '2W': return 'Past 2 Weeks';
    case '1M': return 'Past Month';
    case '3M': return 'Past 3 Months';
    case '6M': return 'Past 6 Months';
    case '1Y': return 'Past Year';
    case '5Y': return 'All Time';
    default: return '';
  }
}

// ═══════════════════════════════════════
// AREA CHART WITH SCRUBBER
// ═══════════════════════════════════════

function AreaChart({
  data,
  isPositive,
  onScrub,
  onScrubEnd,
}: {
  data: number[];
  isPositive: boolean;
  onScrub?: (index: number, value: number) => void;
  onScrubEnd?: () => void;
}) {
  const [scrubX, setScrubX] = React.useState<number | null>(null);
  const color = isPositive ? '#30D158' : '#FF3B30';
  const fillId = isPositive ? 'areaGreen' : 'areaRed';

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => handleTouch(e.nativeEvent.locationX),
      onPanResponderMove: (e) => handleTouch(e.nativeEvent.locationX),
      onPanResponderRelease: () => { setScrubX(null); onScrubEnd?.(); },
      onPanResponderTerminate: () => { setScrubX(null); onScrubEnd?.(); },
    }),
  ).current;

  const handleTouch = (x: number) => {
    setScrubX(x);
    if (data.length < 2) return;
    const idx = Math.round((x / CHART_W) * (data.length - 1));
    const ci = Math.max(0, Math.min(data.length - 1, idx));
    onScrub?.(ci, data[ci]);
  };

  if (data.length < 2) return <View style={{ width: CHART_W, height: CHART_H }} />;

  const pad = 4;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  // 4 horizontal grid lines
  const ySteps = 4;
  const yLabels = Array.from({ length: ySteps }, (_, i) => {
    const val = mx - (i / (ySteps - 1)) * rng;
    return { val, label: Math.round(val).toLocaleString(), y: pad + (i / (ySteps - 1)) * (CHART_H - pad * 2) };
  });
  // X-axis labels (5 evenly spaced)
  const xSteps = 5;
  const xLabels = Array.from({ length: xSteps }, (_, i) => {
    const idx = Math.round((i / (xSteps - 1)) * (data.length - 1));
    return { label: String(idx + 1), x: pad + (i / (xSteps - 1)) * (CHART_W - pad * 2) };
  });
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <View {...panResponder.panHandlers}>
        <Svg width={CHART_W} height={CHART_H + 20} viewBox={`0 0 ${CHART_W} ${CHART_H + 20}`}>
          <Defs>
            <SvgGrad id={fillId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.3" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </SvgGrad>
          </Defs>
          {/* Horizontal grid lines */}
          {yLabels.map((yl, i) => (
            <React.Fragment key={i}>
              <Line x1={pad} y1={yl.y} x2={CHART_W - pad} y2={yl.y} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
              <SvgText x={CHART_W - 2} y={yl.y - 4} fill="#b0b0b0" fontSize={11} fontWeight="600" textAnchor="end">
                {yl.label}
              </SvgText>
            </React.Fragment>
          ))}
          <Path d={buildArea(data, CHART_W, CHART_H)} fill={`url(#${fillId})`} />
          <Path d={buildSmooth(data, CHART_W, CHART_H)} stroke={color} strokeWidth={2} fill="none" />
          {/* X-axis labels */}
          {xLabels.map((xl, i) => (
            <SvgText key={i} x={xl.x} y={CHART_H + 14} fill="#b0b0b0" fontSize={11} fontWeight="600" textAnchor="middle">
              {xl.label}
            </SvgText>
          ))}
          {scrubX !== null && (
            <Line x1={scrubX} y1={0} x2={scrubX} y2={CHART_H} stroke="rgba(0,0,0,0.3)" strokeWidth={1} strokeDasharray="4 2" />
          )}
        </Svg>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════
// STATS GRID
// ═══════════════════════════════════════

function StatsGrid({ data }: { data: number[] }) {
  const col1 = [
    { label: 'Total', value: deriveStat(data, 'total') },
    { label: 'Peak', value: deriveStat(data, 'peak') },
    { label: 'Most Recent', value: deriveStat(data, 'latest') },
  ];
  const col2 = [
    { label: 'Daily Average', value: deriveStat(data, 'avg') },
    { label: 'Lowest', value: deriveStat(data, 'lowest') },
    { label: 'Net Change', value: deriveStat(data, 'change') },
  ];

  const renderCol = (items: { label: string; value: string }[]) => (
    <View style={gs.col}>
      {items.map((cell, i) => (
        <View key={i} style={gs.row}>
          <Text style={gs.label}>{cell.label}</Text>
          <Text style={gs.value}>{cell.value}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={gs.container}>
      {renderCol(col1)}
      <View style={gs.vertDivider} />
      {renderCol(col2)}
    </View>
  );
}

const gs = StyleSheet.create({
  container: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16 },
  col: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 4 },
  vertDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.1)', marginVertical: 2 },
  label: { fontSize: 12, color: '#8E8E93' },
  value: { fontSize: 12, fontWeight: '600', color: '#1A1A1A' },
});

// ═══════════════════════════════════════
// MAIN SHEET
// ═══════════════════════════════════════

export function MetricDetailModal({
  visible,
  metric,
  allMetrics,
  selectedRange,
  onClose,
  onRangeChange,
  onExpandedChange,
  tickerContent,
}: {
  visible: boolean;
  metric: AnalyticsMetric | null;
  allMetrics: AnalyticsMetric[];
  selectedRange: TimeRange;
  onClose: () => void;
  onRangeChange: (range: TimeRange) => void;
  onExpandedChange?: (expanded: boolean) => void;
  tickerContent?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [modalRange, setModalRange] = React.useState(selectedRange);
  const [scrubValue, setScrubValue] = React.useState<{ idx: number; val: number } | null>(null);

  React.useEffect(() => {
    if (visible) {
      setModalRange(selectedRange);
      setScrubValue(null);
      onExpandedChange?.(true);
    } else {
      onExpandedChange?.(false);
    }
  }, [visible]);

  // Slide up animation
  const slideY = React.useRef(new RNAnimated.Value(SH)).current;
  const [dismissed, setDismissed] = React.useState(false);
  React.useEffect(() => {
    if (visible && metric) {
      setDismissed(false);
      slideY.setValue(SH);
      RNAnimated.timing(slideY, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible, !!metric]);

  // Drag to dismiss — track scroll position to only drag when at top
  const scrollOffset = React.useRef(0);
  const [dragging, setDragging] = React.useState(false);
  const dismissPan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && scrollOffset.current <= 0,
      onPanResponderGrant: () => { setDragging(true); },
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) slideY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        setDragging(false);
        if (g.dy > 100 || g.vy > 0.5) {
          setDismissed(true);
          onClose();
        } else {
          RNAnimated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 20 }).start();
        }
      },
      onPanResponderTerminate: () => { setDragging(false); },
    })
  ).current;

  const handleModalRangeChange = (range: TimeRange) => {
    setModalRange(range);
    onRangeChange(range);
    setScrubValue(null);
  };

  const data = metric?.seriesByRange[modalRange] ?? metric?.seriesByRange[selectedRange] ?? [0, 0];
  const displayValue = scrubValue ? scrubValue.val.toLocaleString() : (metric?.primaryValue ?? '');
  const displayDelta = scrubValue ? '' : (metric?.deltaText ?? '');
  const rangeLabels: Record<string, string> = {
    '1D': '1D', '1W': '1W', '1M': '1M', '3M': '3M', '1Y': '1Y', '5Y': 'All',
  };
  // Ticker area height: safe area top + ticker track (56) + padding (4)
  const TICKER_HEIGHT = insets.top + 64;

  const backdropOpacity = slideY.interpolate({
    inputRange: [0, SH],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (!metric || dismissed) return null;

  return (
      <>
      <RNAnimated.View
        style={[ms.backdrop, { opacity: backdropOpacity }]}
        pointerEvents="none"
      />
      <RNAnimated.View
        style={[ms.fullScreen, { paddingTop: TICKER_HEIGHT + 4, transform: [{ translateY: slideY }] }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
      <View style={ms.card} {...dismissPan.panHandlers}>
          <View style={ms.dragHandleArea}>
            <View style={ms.dragHandle} />
          </View>
          <ScrollView
            style={ms.scrollView}
            contentContainerStyle={ms.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!dragging}
            bounces={false}
            onScroll={(e) => { scrollOffset.current = e.nativeEvent.contentOffset.y; }}
            scrollEventThrottle={16}
          >
            {/* ─── Header Row ─── */}
            <View style={ms.headerRow}>
              <TouchableOpacity style={ms.glassBtn} onPress={onClose} activeOpacity={0.7}>
                <GlassView {...liquidGlass.surface} tintColor="rgba(255,255,255,0.15)" borderRadius={22} style={StyleSheet.absoluteFill} />
                <Ionicons name="close" size={20} color="#1A1A1A" />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={[ms.glassBtn, { marginRight: 8 }]} activeOpacity={0.7}>
                <GlassView {...liquidGlass.surface} tintColor="rgba(255,255,255,0.15)" borderRadius={22} style={StyleSheet.absoluteFill} />
                <Ionicons name="share-outline" size={20} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            {/* ─── Metric Identity ─── */}
            <View style={ms.identity}>
              <Text style={ms.metricName}>{metric.label}</Text>
              <View style={ms.dividerThin} />
              <View style={ms.valueRow}>
                <Text style={ms.primaryValue}>{displayValue}</Text>
                {displayDelta ? (
                  <Text style={[ms.deltaValue, { color: metric.isPositive ? '#30D158' : '#FF3B30' }]}>
                    {'  '}{displayDelta.split(' ')[0]}
                  </Text>
                ) : null}
              </View>
              <Text style={ms.periodLabel}>{getRangeLabel(modalRange)}</Text>
            </View>

            {/* ─── Range Selector ─── */}
            <View style={ms.rangeRow}>
              {DASHBOARD_TIME_RANGES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[ms.rangeChip, r === modalRange && ms.rangeChipActive]}
                  onPress={() => handleModalRangeChange(r)}
                  activeOpacity={0.7}
                >
                  <Text style={[ms.rangeText, r === modalRange && ms.rangeTextActive]}>
                    {rangeLabels[r] ?? r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ─── Area Chart ─── */}
            <AreaChart
              data={data}
              isPositive={metric.isPositive}
              onScrub={(idx, val) => setScrubValue({ idx, val })}
              onScrubEnd={() => setScrubValue(null)}
            />

            {/* ─── Stats Grid ─── */}
            <StatsGrid data={data} />

          </ScrollView>
        </View>
      </RNAnimated.View>
      </>
  );
}

const ms = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 998, backgroundColor: '#f2f2f2' },
  fullScreen: { ...StyleSheet.absoluteFillObject, zIndex: 999 },
  card: { flex: 1, backgroundColor: '#e5e5e5', borderTopLeftRadius: 38, borderTopRightRadius: 38, overflow: 'hidden' },
  dragHandleArea: { paddingTop: 8, paddingBottom: 4, alignItems: 'center' },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)' },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 40 },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 12,
  },
  glassBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },

  // Identity
  identity: { paddingHorizontal: 20, marginTop: 12 },
  metricName: { fontSize: 32, fontWeight: '800', color: '#1A1A1A' },
  dividerThin: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.1)', marginVertical: 12 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  primaryValue: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  deltaValue: { fontSize: 17, fontWeight: '600' },
  periodLabel: { fontSize: 15, color: 'rgba(0,0,0,0.4)', marginTop: 4, fontWeight: '700' },

  // Range
  rangeRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginTop: 16, marginBottom: 16 },
  rangeChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  rangeChipActive: { backgroundColor: 'rgba(0,0,0,0.08)' },
  rangeText: { fontSize: 15, fontWeight: '600', color: 'rgba(0,0,0,0.4)' },
  rangeTextActive: { color: '#1A1A1A' },

});
