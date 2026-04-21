// Shared analytics chart components — used by both Dashboard and Event analytics
import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { useAppTheme, type ThemeColors } from '@/hooks/use-app-theme';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type TimeRange = '12H' | '1D' | '1W' | '2W' | '1M' | '3M' | '6M' | '1Y' | '5Y';

export interface AnalyticsMetric {
  id: string;
  label: string;
  primaryValue: string;
  deltaText: string;
  isPositive: boolean;
  seriesByRange: Record<string, number[]>;
  datesByRange?: Record<string, string[]>;
}

export const DASHBOARD_TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', '5Y'];
export const EVENT_TIME_RANGES: TimeRange[] = ['12H', '1D', '1W', '2W', '1M', '3M', '6M'];

/** @deprecated Use DASHBOARD_TIME_RANGES or EVENT_TIME_RANGES */
export const TIME_RANGES = DASHBOARD_TIME_RANGES;

export function emptySeriesFor(ranges: TimeRange[]): Record<string, number[]> {
  const obj: Record<string, number[]> = {};
  for (const r of ranges) obj[r] = [0, 0];
  return obj;
}

export const EMPTY_SERIES = emptySeriesFor(DASHBOARD_TIME_RANGES);
export const EMPTY_EVENT_SERIES = emptySeriesFor(EVENT_TIME_RANGES);

export function getRangeLabel(range: TimeRange): string {
  switch (range) {
    case '12H': return 'Past 12 hours';
    case '1D': return 'Today';
    case '1W': return 'This week';
    case '2W': return 'Past 2 weeks';
    case '1M': return 'This month';
    case '3M': return 'Past 3 months';
    case '6M': return 'Past 6 months';
    case '1Y': return 'This year';
    case '5Y': return 'Past 5 years';
  }
}

export function calcDelta(series: number[]): { text: string; isPositive: boolean } {
  if (series.length < 2) return { text: '', isPositive: true };

  const mid = Math.floor(series.length / 2);
  const firstHalf = series.slice(0, mid);
  const secondHalf = series.slice(mid);

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;
  const pct = avgFirst > 0 ? (diff / avgFirst) * 100 : avgSecond > 0 ? 100 : 0;
  const isPositive = diff >= 0;
  const sign = isPositive ? '+' : '-';
  return {
    text: `${sign}${Math.abs(pct).toFixed(1)}%`,
    isPositive,
  };
}

function buildSmoothPath(
  data: number[],
  width: number,
  height: number,
  padding: number = 0,
): string {
  if (data.length < 2) return '';

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * chartW,
    y: padding + chartH - ((val - min) / range) * chartH,
  }));

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpx = (curr.x + next.x) / 2;
    path += ` C ${cpx} ${curr.y}, ${cpx} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

function buildAreaPath(
  data: number[],
  width: number,
  height: number,
  padding: number = 0,
): string {
  if (data.length < 2) return '';

  const linePath = buildSmoothPath(data, width, height, padding);
  const chartW = width - padding * 2;
  const lastX = padding + chartW;
  const firstX = padding;
  const bottomY = height;

  return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
}

function getChartPoints(
  data: number[],
  width: number,
  height: number,
  padding: number = 0,
): { x: number; y: number; value: number }[] {
  if (data.length < 2) return [];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  return data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * chartW,
    y: padding + chartH - ((val - min) / range) * chartH,
    value: val,
  }));
}

/** Evaluate a cubic bezier at parameter t (0..1) for a single axis */
function cubicBezier(p0: number, cp1: number, cp2: number, p1: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * cp1 + 3 * u * t * t * cp2 + t * t * t * p1;
}

/** Given a touch X, interpolate smoothly along the bezier curve to get { x, y, value } */
function interpolateOnCurve(
  touchX: number,
  points: { x: number; y: number; value: number }[],
  padding: number,
  chartWidth: number,
): { x: number; y: number; value: number } | null {
  if (points.length < 2) return null;

  // Clamp touchX to chart bounds
  const minX = padding;
  const maxX = chartWidth - padding;
  const clampedX = Math.max(minX, Math.min(maxX, touchX));

  // Find which segment the touchX falls in
  let segIdx = 0;
  for (let i = 0; i < points.length - 1; i++) {
    if (clampedX >= points[i].x && clampedX <= points[i + 1].x) {
      segIdx = i;
      break;
    }
    if (i === points.length - 2) segIdx = i; // last segment
  }

  const curr = points[segIdx];
  const next = points[segIdx + 1];
  if (!next) return curr;

  // The control points for the cubic bezier match buildSmoothPath:
  // C cpx curr.y, cpx next.y, next.x next.y  where cpx = (curr.x + next.x) / 2
  const cpx = (curr.x + next.x) / 2;
  const cp1 = { x: cpx, y: curr.y };
  const cp2 = { x: cpx, y: next.y };

  // Find t where bezierX(t) ≈ clampedX using binary search
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const bx = cubicBezier(curr.x, cp1.x, cp2.x, next.x, mid);
    if (bx < clampedX) lo = mid;
    else hi = mid;
  }
  const t = (lo + hi) / 2;

  const x = cubicBezier(curr.x, cp1.x, cp2.x, next.x, t);
  const y = cubicBezier(curr.y, cp1.y, cp2.y, next.y, t);
  const value = curr.value + (next.value - curr.value) * t;

  return { x, y, value };
}

/** Generate Y-axis tick values — pick ~4 evenly-spaced nice numbers */
function getYTicks(data: number[], tickCount = 4): number[] {
  if (data.length === 0) return [0];
  const min = Math.min(...data);
  const max = Math.max(...data);
  if (min === max) return [min];

  const range = max - min;
  const step = range / (tickCount - 1);
  const ticks: number[] = [];
  for (let i = 0; i < tickCount; i++) {
    ticks.push(min + step * i);
  }
  return ticks;
}

/** Format a Y-axis value for display */
function formatYValue(value: number, isRate: boolean, isCurrency: boolean): string {
  if (isRate) return `${value.toFixed(0)}%`;
  if (isCurrency) {
    const dollars = value / 100;
    if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k`;
    return `$${dollars.toFixed(0)}`;
  }
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return Math.round(value).toString();
}

/** Format a date string for the tooltip based on the time range */
function formatTooltipDate(dateStr: string, range: TimeRange): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (range === '12H' || range === '1D') {
    const h = d.getHours();
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${months[d.getMonth()]} ${d.getDate()}, ${h % 12 || 12}:${min} ${h >= 12 ? 'PM' : 'AM'}`;
  }
  if (range === '1W' || range === '2W' || range === '1M') {
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** Pick evenly-spaced date strings and format for X-axis, positioned by actual timestamp */
function formatXAxisDates(dates: string[], range: TimeRange): { label: string; fraction: number }[] {
  if (dates.length < 2) return [];

  const timestamps = dates.map(d => new Date(d).getTime());
  const minT = timestamps[0];
  const maxT = timestamps[timestamps.length - 1];
  const totalSpan = maxT - minT;
  if (totalSpan <= 0) return [];

  const labelCount = Math.min(5, dates.length);
  const result: { label: string; fraction: number }[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < labelCount; i++) {
    const targetFraction = labelCount === 1 ? 0.5 : i / (labelCount - 1);
    const targetTime = minT + targetFraction * totalSpan;

    // Find closest data point to this target time
    let closestIdx = 0;
    let closestDist = Infinity;
    for (let j = 0; j < timestamps.length; j++) {
      const dist = Math.abs(timestamps[j] - targetTime);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = j;
      }
    }

    // Position based on actual timestamp, not array index
    const fraction = (timestamps[closestIdx] - minT) / totalSpan;
    const d = new Date(dates[closestIdx]);

    let label: string;
    if (range === '12H' || range === '1D') {
      const h = d.getHours();
      const min = d.getMinutes();
      label = min === 0
        ? `${h % 12 || 12}${h >= 12 ? 'PM' : 'AM'}`
        : `${h % 12 || 12}:${String(min).padStart(2, '0')}`;
    } else if (range === '1W') {
      label = days[d.getDay()];
    } else if (range === '2W' || range === '1M') {
      label = `${months[d.getMonth()]} ${d.getDate()}`;
    } else if (range === '3M' || range === '6M') {
      label = `${months[d.getMonth()]} ${d.getDate()}`;
    } else {
      label = `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
    }

    // Avoid duplicate labels
    if (result.length === 0 || result[result.length - 1].label !== label) {
      result.push({ label, fraction });
    }
  }

  return result;
}

export function HeroLineChart({
  data,
  dates,
  isPositive,
  metricLabel,
  selectedRange = '1M',
  colors,
  isDark,
  onTouchActive,
}: {
  data: number[];
  dates?: string[];
  isPositive: boolean;
  metricLabel?: string;
  selectedRange?: TimeRange;
  colors: ThemeColors;
  isDark: boolean;
  onTouchActive?: (active: boolean) => void;
}) {
  const svgWidth = SCREEN_WIDTH - 32;
  const yAxisWidth = 40; // space for Y-axis labels
  const chartWidth = svgWidth - yAxisWidth;
  const xAxisHeight = 24;
  const chartHeight = SCREEN_HEIGHT * 0.28;
  const totalHeight = chartHeight + xAxisHeight;
  const chartPadding = 4;
  const color = isPositive ? '#00D632' : '#FF3B30';
  const gradientId = 'heroGrad';
  const isRate = !!metricLabel?.toLowerCase().includes('rate');
  const isCurrency = !!metricLabel?.toLowerCase().includes('revenue') || !!metricLabel?.toLowerCase().includes('fees');
  const labelColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)';

  const [activePoint, setActivePoint] = React.useState<{ x: number; y: number; value: number } | null>(null);

  // Compute X-axis labels from real date strings
  const xLabels = React.useMemo(
    () => dates && dates.length >= 2 ? formatXAxisDates(dates, selectedRange) : [],
    [dates, selectedRange],
  );

  // Y-axis ticks
  const yTicks = React.useMemo(() => getYTicks(data, 4), [data]);

  // Build paths/points within the chart area (offset by yAxisWidth)
  const linePath = buildSmoothPath(data, chartWidth, chartHeight, chartPadding);
  const areaPath = buildAreaPath(data, chartWidth, chartHeight, chartPadding);
  const points = React.useMemo(
    () => getChartPoints(data, chartWidth, chartHeight, chartPadding),
    [data, chartWidth, chartHeight],
  );

  const interpolateTouch = React.useCallback(
    (touchX: number) => {
      // Adjust touch X for the Y-axis offset
      return interpolateOnCurve(touchX - yAxisWidth, points, chartPadding, chartWidth);
    },
    [points, chartWidth, yAxisWidth],
  );

  const dismissTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((e) => {
          if (dismissTimer.current) clearTimeout(dismissTimer.current);
          onTouchActive?.(true);
          setActivePoint(interpolateTouch(e.x));
        })
        .onUpdate((e) => {
          setActivePoint(interpolateTouch(e.x));
        })
        .onFinalize(() => {
          onTouchActive?.(false);
          dismissTimer.current = setTimeout(() => setActivePoint(null), 2000);
        }),
    [interpolateTouch, onTouchActive],
  );

  // Format tooltip value
  const tooltipValue = activePoint
    ? isRate
      ? `${activePoint.value.toFixed(1)}%`
      : metricLabel?.toLowerCase().includes('revenue') || metricLabel?.toLowerCase().includes('fees')
        ? `$${(activePoint.value / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : Math.round(activePoint.value).toLocaleString()
    : '';

  // Compute tooltip date from the active point's interpolated position
  const tooltipDateStr = React.useMemo(() => {
    if (!activePoint || !dates || dates.length < 2) return '';
    const chartW = chartWidth - chartPadding * 2;
    const frac = (activePoint.x - chartPadding) / chartW;
    const idx = Math.round(frac * (dates.length - 1));
    const clampedIdx = Math.max(0, Math.min(dates.length - 1, idx));
    return formatTooltipDate(dates[clampedIdx], selectedRange);
  }, [activePoint, dates, chartWidth, selectedRange]);

  // Y-axis: map data value to chart Y coordinate
  const dataMin = data.length > 0 ? Math.min(...data) : 0;
  const dataMax = data.length > 0 ? Math.max(...data) : 1;
  const dataRange = dataMax - dataMin || 1;
  const chartH = chartHeight - chartPadding * 2;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={{ marginHorizontal: 16, marginTop: 8 }}>
        <Svg width={svgWidth} height={totalHeight}>
          <Defs>
            <SvgGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.25" />
              <Stop offset="0.6" stopColor={color} stopOpacity="0.08" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </SvgGradient>
          </Defs>

          {/* Y-axis labels + grid lines */}
          {yTicks.map((tick, i) => {
            const y = chartPadding + chartH - ((tick - dataMin) / dataRange) * chartH;
            return (
              <React.Fragment key={`y-${i}`}>
                <Line
                  x1={yAxisWidth}
                  y1={y}
                  x2={svgWidth}
                  y2={y}
                  stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}
                  strokeWidth={1}
                />
                <SvgText
                  x={yAxisWidth - 6}
                  y={y + 3.5}
                  fontSize={10}
                  fill={labelColor}
                  textAnchor="end"
                >
                  {formatYValue(tick, isRate, isCurrency)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Chart area — offset by yAxisWidth */}
          <G transform={`translate(${yAxisWidth}, 0)`}>
            {areaPath ? <Path d={areaPath} fill={`url(#${gradientId})`} /> : null}
            {linePath ? (
              <Path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Tooltip indicator line + dot + floating value */}
            {activePoint && (
              <>
                <Line
                  x1={activePoint.x}
                  y1={0}
                  x2={activePoint.x}
                  y2={chartHeight}
                  stroke={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'}
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
                <Circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r={10}
                  fill={color}
                  opacity={0.15}
                />
                <Circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r={5}
                  fill={color}
                  stroke={isDark ? '#000' : '#fff'}
                  strokeWidth={2}
                />
              </>
            )}
          </G>

          {/* X-axis labels — offset by yAxisWidth */}
          {xLabels.map((item, i) => {
            const x = yAxisWidth + chartPadding + item.fraction * (chartWidth - chartPadding * 2);
            return (
              <SvgText
                key={`x-${i}`}
                x={x}
                y={chartHeight + 16}
                fontSize={10}
                fill={labelColor}
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
            );
          })}
        </Svg>

        {activePoint && (
          <View
            style={{
              position: 'absolute',
              left: yAxisWidth + Math.max(0, Math.min(activePoint.x - 50, chartWidth - 100)),
              top: Math.max(0, activePoint.y - 52),
              width: 100,
              alignItems: 'center',
            }}
            pointerEvents="none"
          >
            <View
              style={{
                backgroundColor: 'rgba(30,30,30,0.92)',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, }}>
                {tooltipValue}
              </Text>
              {tooltipDateStr ? (
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 }}>
                  {tooltipDateStr}
                </Text>
              ) : null}
            </View>
          </View>
        )}

      </Animated.View>
    </GestureDetector>
  );
}

function MiniSparkline({
  data,
  isPositive,
  width = 80,
  height = 32,
}: {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
}) {
  const color = isPositive ? '#00D632' : '#FF3B30';
  const linePath = buildSmoothPath(data, width, height, 2);

  return (
    <Svg width={width} height={height}>
      {linePath ? (
        <Path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </Svg>
  );
}

export function HeroMetricHeader({
  metric,
  colors,
}: {
  metric: AnalyticsMetric;
  colors: ThemeColors;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={styles.heroHeader}
    >
      <Text style={[styles.heroLabel, { color: colors.textTertiary }]}>{metric.label}</Text>
      <Text style={[styles.heroValue, { color: colors.text }]}>{metric.primaryValue}</Text>
      <Text style={[styles.heroDelta, { color: metric.isPositive ? '#00D632' : '#FF3B30' }]}>
        {metric.deltaText}
      </Text>
    </Animated.View>
  );
}

function rangeDisplayLabel(r: TimeRange): string {
  switch (r) {
    case '12H': return '12h';
    case '1D': return '1d';
    case '1W': return '1wk';
    case '2W': return '2wk';
    case '1M': return '1mo';
    case '3M': return '3m';
    case '6M': return '6m';
    case '1Y': return '1y';
    case '5Y': return 'All';
  }
}

export function RangeSelector({
  selected,
  onSelect,
  ranges = DASHBOARD_TIME_RANGES,
  colors,
}: {
  selected: TimeRange;
  onSelect: (range: TimeRange) => void;
  ranges?: TimeRange[];
  colors: ThemeColors;
}) {
  return (
    <View style={styles.rangeRow}>
      {ranges.map((r) => {
        const isActive = r === selected;
        return (
          <TouchableOpacity
            key={r}
            style={[styles.rangeChip, isActive && { overflow: 'hidden' as const }]}
            onPress={() => onSelect(r)}
            activeOpacity={0.7}
          >
            {isActive && <GlassView {...liquidGlass.fill} borderRadius={8} style={StyleSheet.absoluteFillObject} />}
            <Text style={[styles.rangeText, { color: colors.textTertiary }, isActive && styles.rangeTextActive]}>
              {rangeDisplayLabel(r)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function MetricTile({
  metric,
  selectedRange,
  onPress,
  colors,
}: {
  metric: AnalyticsMetric;
  selectedRange: TimeRange;
  onPress: () => void;
  colors: ThemeColors;
}) {
  const sparkData = metric.seriesByRange[selectedRange];

  return (
    <TouchableOpacity
      style={styles.metricTile}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.metricTileLeft}>
        <Text style={[styles.metricTileLabel, { color: colors.textSecondary }]}>{metric.label}</Text>
        <Text style={[styles.metricTileValue, { color: colors.text }]}>{metric.primaryValue}</Text>
        <Text
          style={[
            styles.metricTileDelta,
            { color: metric.isPositive ? '#00D632' : '#FF3B30' },
          ]}
        >
          {metric.deltaText}
        </Text>
      </View>
      <View style={styles.metricTileRight}>
        <MiniSparkline data={sparkData} isPositive={metric.isPositive} />
      </View>
    </TouchableOpacity>
  );
}

// Reusable container with hero chart, range selector, and metric tiles.
// Both Dashboard and Event analytics pages use this.
export function AnalyticsScreenShell({
  metrics,
  isLoading,
  onRefresh,
  onRangeChange,
  ranges = DASHBOARD_TIME_RANGES,
  defaultRange = '1M',
  emptyMessage,
}: {
  metrics: AnalyticsMetric[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onRangeChange?: (range: TimeRange) => void;
  ranges?: TimeRange[];
  defaultRange?: TimeRange;
  emptyMessage?: string;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const [refreshing, setRefreshing] = React.useState(false);
  const [scrollEnabled, setScrollEnabled] = React.useState(true);
  const [heroMetricId, setHeroMetricId] = React.useState<string>(
    metrics[0]?.id ?? 'views',
  );
  const [selectedRange, setSelectedRange] = React.useState<TimeRange>(defaultRange);
  const handleRangeChange = React.useCallback((range: TimeRange) => {
    setSelectedRange(range);
    onRangeChange?.(range);
  }, [onRangeChange]);
  const doRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const heroMetric = metrics.find((m) => m.id === heroMetricId) ?? metrics[0];
  const tileMetrics = metrics.filter((m) => m.id !== (heroMetric?.id ?? heroMetricId));

  const handleSelectMetric = (tappedId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(350, 'easeInEaseOut', 'opacity'));
    setHeroMetricId(tappedId);
  };

  const heroData = heroMetric?.seriesByRange[selectedRange] ?? [];
  const heroDates = heroMetric?.datesByRange?.[selectedRange] ?? [];

  // Nav button uses GlassView in dark mode

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <View style={[styles.topNav, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity
            style={[styles.navBackBtn, { overflow: 'hidden' as const, backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.06)' }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={12} style={StyleSheet.absoluteFillObject} />}
            <Ionicons name="chevron-back" size={22} color="#000" />
          </TouchableOpacity>
          <View style={styles.navRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.textTertiary} size="large" />
        </View>
      </View>
    );
  }

  if (!heroMetric) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <View style={[styles.topNav, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity
            style={[styles.navBackBtn, { overflow: 'hidden' as const, backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.06)' }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={12} style={StyleSheet.absoluteFillObject} />}
            <Ionicons name="chevron-back" size={22} color="#000" />
          </TouchableOpacity>
          <View style={styles.navRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="stats-chart-outline" size={56} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{emptyMessage ?? 'No analytics yet'}</Text>
          <Text style={[styles.emptySub, { color: colors.textTertiary }]}>Data will appear here once there is activity</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <View style={[styles.topNav, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          style={[styles.navBackBtn, { overflow: 'hidden' as const, backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.06)' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={12} style={StyleSheet.absoluteFillObject} />}
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.navRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={doRefresh}
            tintColor={colors.textTertiary}
          />
        }
      >
        <HeroMetricHeader key={heroMetricId} metric={heroMetric} colors={colors} />

        <HeroLineChart
          key={`chart-${heroMetricId}-${selectedRange}`}
          data={heroData}
          dates={heroDates}
          isPositive={heroMetric.isPositive}
          metricLabel={heroMetric.label}
          selectedRange={selectedRange}
          colors={colors}
          isDark={isDark}
          onTouchActive={(active) => setScrollEnabled(!active)}
        />

        <RangeSelector selected={selectedRange} onSelect={handleRangeChange} ranges={ranges} colors={colors} />

        <View style={[styles.sectionDivider, { backgroundColor: colors.separator }]} />

        <View style={styles.tilesContainer}>
          {tileMetrics.map((metric, index) => (
            <React.Fragment key={metric.id}>
              {index > 0 && <View style={[styles.tileSeparator, { backgroundColor: colors.separator }]} />}
              <MetricTile
                metric={metric}
                selectedRange={selectedRange}
                onPress={() => handleSelectMetric(metric.id)}
                colors={colors}
              />
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  navBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navRight: {
    flexDirection: 'row',
    gap: 12,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
  },
  heroHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  heroLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 38,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroDelta: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  rangeChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  rangeText: {
    fontSize: 13,
  },
  rangeTextActive: {
    color: '#FFFFFF',
  },
  sectionDivider: {
    height: 1,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  tilesContainer: {
    paddingHorizontal: 16,
  },
  metricTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  metricTileLeft: {
    flex: 1,
    marginRight: 16,
  },
  metricTileLabel: {
    fontSize: 14,
    marginBottom: 3,
  },
  metricTileValue: {
    fontSize: 20,
    marginBottom: 2,
  },
  metricTileDelta: {
    fontSize: 12,
  },
  metricTileRight: {
    alignItems: 'flex-end',
  },
  tileSeparator: {
    height: 1,
  },
});
