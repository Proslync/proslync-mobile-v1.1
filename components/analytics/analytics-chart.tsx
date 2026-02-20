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
  PanResponder,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle, Line } from 'react-native-svg';
import { useAppTheme, type ThemeColors } from '@/hooks/use-app-theme';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Types ──────────────────────────────────────────────────
export type TimeRange = '12H' | '1D' | '1W' | '2W' | '1M' | '3M' | '6M' | '1Y' | '5Y';

export interface AnalyticsMetric {
  id: string;
  label: string;
  primaryValue: string;
  deltaText: string;
  isPositive: boolean;
  seriesByRange: Record<string, number[]>;
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

// ─── Delta Calculator ───────────────────────────────────────
export function calcDelta(series: number[]): { text: string; isPositive: boolean } {
  if (series.length < 2) return { text: '', isPositive: true };
  const first = series[0];
  const last = series[series.length - 1];
  const diff = last - first;
  const pct = first > 0 ? (diff / first) * 100 : 0;
  const isPositive = diff >= 0;
  const arrow = isPositive ? '▲' : '▼';
  return {
    text: `${arrow} ${Math.abs(pct).toFixed(1)}%`,
    isPositive,
  };
}

// ─── SVG Path Builders ──────────────────────────────────────
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

// ─── Point Calculator (for tooltip) ─────────────────────────
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

// ─── Hero Line Chart ────────────────────────────────────────
export function HeroLineChart({
  data,
  isPositive,
  metricLabel,
  colors,
  isDark,
}: {
  data: number[];
  isPositive: boolean;
  metricLabel?: string;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const chartWidth = SCREEN_WIDTH - 32;
  const chartHeight = SCREEN_HEIGHT * 0.28;
  const chartPadding = 4;
  const color = isPositive ? '#00D632' : '#FF3B30';
  const gradientId = 'heroGrad';

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const linePath = buildSmoothPath(data, chartWidth, chartHeight, chartPadding);
  const areaPath = buildAreaPath(data, chartWidth, chartHeight, chartPadding);
  const points = React.useMemo(
    () => getChartPoints(data, chartWidth, chartHeight, chartPadding),
    [data, chartWidth, chartHeight],
  );

  const findNearestIndex = React.useCallback(
    (touchX: number) => {
      if (points.length === 0) return null;
      let nearest = 0;
      let minDist = Math.abs(points[0].x - touchX);
      for (let i = 1; i < points.length; i++) {
        const dist = Math.abs(points[i].x - touchX);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      }
      return nearest;
    },
    [points],
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          const touchX = evt.nativeEvent.locationX;
          setActiveIndex(findNearestIndex(touchX));
        },
        onPanResponderMove: (evt: GestureResponderEvent) => {
          const touchX = evt.nativeEvent.locationX;
          setActiveIndex(findNearestIndex(touchX));
        },
        onPanResponderRelease: () => {
          setActiveIndex(null);
        },
        onPanResponderTerminate: () => {
          setActiveIndex(null);
        },
      }),
    [findNearestIndex],
  );

  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  // Format tooltip value
  const tooltipValue = activePoint
    ? metricLabel?.toLowerCase().includes('rate')
      ? `${activePoint.value.toFixed(1)}%`
      : activePoint.value.toLocaleString()
    : '';

  // Tooltip position — keep it within bounds
  const tooltipWidth = 80;
  const tooltipX = activePoint
    ? Math.max(0, Math.min(activePoint.x - tooltipWidth / 2, chartWidth - tooltipWidth))
    : 0;
  const tooltipY = activePoint
    ? Math.max(0, activePoint.y - 36)
    : 0;

  return (
    <View style={{ marginHorizontal: 16, marginTop: 8 }} {...panResponder.panHandlers}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <SvgGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.25" />
            <Stop offset="0.6" stopColor={color} stopOpacity="0.08" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </SvgGradient>
        </Defs>
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

        {/* Tooltip indicator line + dot */}
        {activePoint && (
          <>
            <Line
              x1={activePoint.x}
              y1={0}
              x2={activePoint.x}
              y2={chartHeight}
              stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}
              strokeWidth={1}
              strokeDasharray="4 3"
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
      </Svg>

      {/* Floating tooltip label */}
      {activePoint && (
        <View
          style={[
            styles.tooltip,
            {
              left: tooltipX,
              top: tooltipY,
              backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.75)',
            },
          ]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.tooltipText,
              { color: isDark ? '#fff' : '#fff' },
            ]}
          >
            {tooltipValue}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Mini Sparkline ─────────────────────────────────────────
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

// ─── Hero Metric Header ─────────────────────────────────────
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

// ─── Range Selector ─────────────────────────────────────────
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
            style={[styles.rangeChip, isActive && styles.rangeChipActive]}
            onPress={() => onSelect(r)}
            activeOpacity={0.7}
          >
            <Text style={[styles.rangeText, { color: colors.textTertiary }, isActive && styles.rangeTextActive]}>
              {r}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Metric Tile ────────────────────────────────────────────
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

// ─── Full Analytics Screen Shell ────────────────────────────
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
  const [heroMetricId, setHeroMetricId] = React.useState<string>(
    metrics[0]?.id ?? 'views',
  );
  const [selectedRange, setSelectedRange] = React.useState<TimeRange>(defaultRange);
  const handleRangeChange = React.useCallback((range: TimeRange) => {
    setSelectedRange(range);
    onRangeChange?.(range);
  }, [onRangeChange]);
  const [metricsOrder, setMetricsOrder] = React.useState<string[]>([]);

  const doRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  // Sync order when metrics first load
  React.useEffect(() => {
    if (metrics.length > 0 && metricsOrder.length === 0) {
      setMetricsOrder(metrics.slice(1).map((m) => m.id));
    }
  }, [metrics]);

  const heroMetric = metrics.find((m) => m.id === heroMetricId) ?? metrics[0];
  const tileMetrics = metricsOrder
    .map((id) => metrics.find((m) => m.id === id)!)
    .filter(Boolean);

  const handleSwap = (tappedId: string) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(350, 'easeInEaseOut', 'opacity'),
    );
    const previousHeroId = heroMetricId;
    setHeroMetricId(tappedId);
    setMetricsOrder((prev) =>
      prev.map((id) => (id === tappedId ? previousHeroId : id)),
    );
  };

  const heroData = heroMetric?.seriesByRange[selectedRange] ?? [];

  const navBtnBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <DarkGradientBg />
        <View style={[styles.topNav, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity
            style={[styles.navBackBtn, { backgroundColor: navBtnBg }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <DarkGradientBg />
        <View style={[styles.topNav, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity
            style={[styles.navBackBtn, { backgroundColor: navBtnBg }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DarkGradientBg />
      <View style={[styles.topNav, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          style={[styles.navBackBtn, { backgroundColor: navBtnBg }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.navRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
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
          isPositive={heroMetric.isPositive}
          metricLabel={heroMetric.label}
          colors={colors}
          isDark={isDark}
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
                onPress={() => handleSwap(metric.id)}
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
    fontFamily: 'Lato_700Bold',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  heroHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  heroLabel: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 38,
    fontFamily: 'Lato_700Bold',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroDelta: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
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
  rangeChipActive: {
    backgroundColor: 'rgba(0, 214, 50, 0.12)',
  },
  rangeText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
  },
  rangeTextActive: {
    color: '#00D632',
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
    fontFamily: 'Lato_400Regular',
    marginBottom: 3,
  },
  metricTileValue: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    marginBottom: 2,
  },
  metricTileDelta: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  metricTileRight: {
    alignItems: 'flex-end',
  },
  tileSeparator: {
    height: 1,
  },
  // Tooltip
  tooltip: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  tooltipText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
  },
});
