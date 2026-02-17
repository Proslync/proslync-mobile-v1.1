// Dashboard Analytics — Investing-style portfolio analytics screen
// Hero chart at top with swappable metric tiles below
import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDashboard } from '@/hooks/use-dashboard';
import { analyticsApi } from '@/lib/api/analytics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Types ──────────────────────────────────────────────────
type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y';

interface AnalyticsMetric {
  id: string;
  label: string;
  primaryValue: string;
  deltaText: string;
  isPositive: boolean;
  seriesByRange: Record<TimeRange, number[]>;
}

const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', '5Y'];

const DASHBOARD_TIMESERIES_KEY = 'dashboard-timeseries';

function getRangeLabel(range: TimeRange): string {
  switch (range) {
    case '1D': return 'Today';
    case '1W': return 'This week';
    case '1M': return 'This month';
    case '3M': return 'Past 3 months';
    case '1Y': return 'This year';
    case '5Y': return 'Past 5 years';
  }
}

// ─── Delta Calculator ───────────────────────────────────────
function calcDelta(series: number[]): { text: string; isPositive: boolean } {
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

// ─── Empty series placeholder (flat line at 0) ──────────────
const EMPTY_SERIES: Record<TimeRange, number[]> = {
  '1D': [0, 0],
  '1W': [0, 0],
  '1M': [0, 0],
  '3M': [0, 0],
  '1Y': [0, 0],
  '5Y': [0, 0],
};

// ─── SVG Line Chart ─────────────────────────────────────────
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

// ─── Hero Line Chart Component ──────────────────────────────
function HeroLineChart({
  data,
  isPositive,
}: {
  data: number[];
  isPositive: boolean;
}) {
  const chartWidth = SCREEN_WIDTH - 32;
  const chartHeight = SCREEN_HEIGHT * 0.28;
  const color = isPositive ? '#00D632' : '#FF3B30';
  const gradientId = 'heroGrad';

  const linePath = buildSmoothPath(data, chartWidth, chartHeight, 4);
  const areaPath = buildAreaPath(data, chartWidth, chartHeight, 4);

  return (
    <View style={{ marginHorizontal: 16, marginTop: 8 }}>
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
      </Svg>
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
function HeroMetricHeader({
  metric,
}: {
  metric: AnalyticsMetric;
}) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={styles.heroHeader}
    >
      <Text style={styles.heroLabel}>{metric.label}</Text>
      <Text style={styles.heroValue}>{metric.primaryValue}</Text>
      <Text style={[styles.heroDelta, { color: metric.isPositive ? '#00D632' : '#FF3B30' }]}>
        {metric.deltaText}
      </Text>
    </Animated.View>
  );
}

// ─── Range Selector ─────────────────────────────────────────
function RangeSelector({
  selected,
  onSelect,
}: {
  selected: TimeRange;
  onSelect: (range: TimeRange) => void;
}) {
  return (
    <View style={styles.rangeRow}>
      {TIME_RANGES.map((r) => {
        const isActive = r === selected;
        return (
          <TouchableOpacity
            key={r}
            style={[styles.rangeChip, isActive && styles.rangeChipActive]}
            onPress={() => onSelect(r)}
            activeOpacity={0.7}
          >
            <Text style={[styles.rangeText, isActive && styles.rangeTextActive]}>
              {r}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Metric Tile ────────────────────────────────────────────
function MetricTile({
  metric,
  selectedRange,
  onPress,
}: {
  metric: AnalyticsMetric;
  selectedRange: TimeRange;
  onPress: () => void;
}) {
  const sparkData = metric.seriesByRange[selectedRange];

  return (
    <TouchableOpacity
      style={styles.metricTile}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.metricTileLeft}>
        <Text style={styles.metricTileLabel}>{metric.label}</Text>
        <Text style={styles.metricTileValue}>{metric.primaryValue}</Text>
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

// ═════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═════════════════════════════════════════════════════════════
export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { stats, isLoading, refetch } = useDashboard();

  const [refreshing, setRefreshing] = React.useState(false);
  const [heroMetricId, setHeroMetricId] = React.useState<string>('views');
  const [selectedRange, setSelectedRange] = React.useState<TimeRange>('1M');
  const [metricsOrder, setMetricsOrder] = React.useState<string[]>([]);

  // Fetch real time series for the selected range
  const timeSeriesQuery = useQuery({
    queryKey: [DASHBOARD_TIMESERIES_KEY, selectedRange],
    queryFn: () => analyticsApi.getDashboardTimeSeries(selectedRange),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: [DASHBOARD_TIMESERIES_KEY] }),
    ]);
    setRefreshing(false);
  }, [refetch, queryClient]);

  // Build all 5 metrics from real time series + aggregate stats
  const investingMetrics = React.useMemo(() => {
    const totalViews = stats?.totalViews ?? 0;
    const totalRSVPs = stats?.totalRSVPs ?? 0;
    const totalEvents = stats?.totalEvents ?? 0;
    const conversionRate = stats?.engagementRate ?? 0;

    const tsData = timeSeriesQuery.data?.data;
    const hasTimeSeries = tsData && tsData.length >= 2;

    // Extract real series from backend time series data
    const viewsSeries = hasTimeSeries ? tsData.map((d) => d.views) : [0, 0];
    const rsvpsSeries = hasTimeSeries ? tsData.map((d) => d.rsvps) : [0, 0];
    const conversionSeries = hasTimeSeries
      ? tsData.map((d) =>
          d.uniqueVisitors > 0 ? (d.rsvps / d.uniqueVisitors) * 100 : 0,
        )
      : [0, 0];
    // Cumulative events over time (shows portfolio growth)
    const eventsSeries = hasTimeSeries
      ? (() => {
          let cumulative = 0;
          return tsData.map((d) => {
            cumulative += d.newEvents;
            return cumulative;
          });
        })()
      : [0, 0];
    // RSVPs per event over time
    const perEventSeries = hasTimeSeries
      ? (() => {
          let cumulativeEvents = 0;
          let cumulativeRsvps = 0;
          return tsData.map((d) => {
            cumulativeEvents += d.newEvents;
            cumulativeRsvps += d.rsvps;
            return cumulativeEvents > 0
              ? Math.round(cumulativeRsvps / cumulativeEvents)
              : 0;
          });
        })()
      : [0, 0];

    const viewsDelta = calcDelta(viewsSeries);
    const rsvpsDelta = calcDelta(rsvpsSeries);
    const conversionDelta = calcDelta(conversionSeries);
    const eventsDelta = calcDelta(eventsSeries);
    const perEventDelta = calcDelta(perEventSeries);

    const rangeLabel = getRangeLabel(selectedRange);

    return [
      {
        id: 'views',
        label: 'Total Views',
        primaryValue: totalViews.toLocaleString(),
        deltaText: hasTimeSeries ? `${viewsDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: viewsDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: viewsSeries },
      },
      {
        id: 'rsvps',
        label: 'RSVPs',
        primaryValue: totalRSVPs.toLocaleString(),
        deltaText: hasTimeSeries ? `${rsvpsDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: rsvpsDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: rsvpsSeries },
      },
      {
        id: 'conversion',
        label: 'Conversion Rate',
        primaryValue: `${conversionRate.toFixed(1)}%`,
        deltaText: hasTimeSeries ? `${conversionDelta.text} ${rangeLabel}` : '—',
        isPositive: conversionDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: conversionSeries },
      },
      {
        id: 'events',
        label: 'Events',
        primaryValue: totalEvents.toLocaleString(),
        deltaText: hasTimeSeries ? `${eventsDelta.text} ${rangeLabel}` : totalEvents > 0 ? `${totalEvents} total` : 'No events yet',
        isPositive: eventsDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: eventsSeries },
      },
      {
        id: 'perEvent',
        label: 'RSVPs / Event',
        primaryValue: totalEvents > 0 ? Math.round(totalRSVPs / totalEvents).toLocaleString() : '0',
        deltaText: hasTimeSeries ? `${perEventDelta.text} ${rangeLabel}` : totalEvents > 0 ? `Avg across ${totalEvents} events` : '—',
        isPositive: perEventDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: perEventSeries },
      },
    ] as AnalyticsMetric[];
  }, [stats, timeSeriesQuery.data, selectedRange]);

  // Sync order when metrics load
  React.useEffect(() => {
    if (investingMetrics.length > 0 && metricsOrder.length === 0) {
      setMetricsOrder(investingMetrics.slice(1).map((m) => m.id));
    }
  }, [investingMetrics]);

  const heroMetric = investingMetrics.find((m) => m.id === heroMetricId) ?? investingMetrics[0];
  const tileMetrics = metricsOrder
    .map((id) => investingMetrics.find((m) => m.id === id)!)
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

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={[styles.topNav, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity
            style={styles.navBackBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.navRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="rgba(255,255,255,0.5)" size="large" />
        </View>
      </View>
    );
  }

  if (!heroMetric) {
    return (
      <View style={styles.container}>
        <View style={[styles.topNav, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity
            style={styles.navBackBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.navRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="stats-chart-outline" size={56} color="rgba(255,255,255,0.2)" />
          <Text style={styles.emptyTitle}>No analytics yet</Text>
          <Text style={styles.emptySub}>Create events to start tracking performance</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Top Nav ── */}
      <View style={[styles.topNav, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
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
            onRefresh={onRefresh}
            tintColor="rgba(255,255,255,0.4)"
          />
        }
      >
        {/* ── Hero Header ── */}
        <HeroMetricHeader key={heroMetricId} metric={heroMetric} />

        {/* ── Hero Chart ── */}
        <HeroLineChart
          key={`chart-${heroMetricId}-${selectedRange}`}
          data={heroData}
          isPositive={heroMetric.isPositive}
        />

        {/* ── Range Selector ── */}
        <RangeSelector selected={selectedRange} onSelect={setSelectedRange} />

        {/* ── Divider ── */}
        <View style={styles.sectionDivider} />

        {/* ── Metric Tiles ── */}
        <View style={styles.tilesContainer}>
          {tileMetrics.map((metric, index) => (
            <React.Fragment key={metric.id}>
              {index > 0 && <View style={styles.tileSeparator} />}
              <MetricTile
                metric={metric}
                selectedRange={selectedRange}
                onPress={() => handleSwap(metric.id)}
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
    backgroundColor: '#000',
  },

  // ── Top Nav ──
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navRight: {
    flexDirection: 'row',
    gap: 12,
  },
  // ── Scroll ──
  scroll: {
    flex: 1,
  },

  // ── Loading ──
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Empty State ──
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
  },

  // ── Hero Header ──
  heroHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  heroLabel: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 38,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroDelta: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.2,
  },

  // ── Range Selector ──
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
    color: 'rgba(255,255,255,0.35)',
  },
  rangeTextActive: {
    color: '#00D632',
  },

  // ── Divider ──
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },

  // ── Metric Tiles ──
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
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 3,
  },
  metricTileValue: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
