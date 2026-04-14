// Dashboard Revenue Analytics — Revenue trends across all user events

import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated as RNAnimated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { MetricDetailModal } from '@/components/analytics/metric-detail-modal';
import { NativeSheet } from '@/components/ui/native-sheet';
import { type PresentationDetent } from '@expo/ui/swift-ui/modifiers';
import Svg, { Polyline, Defs, LinearGradient as SvgGrad, Stop, Path, Line } from 'react-native-svg';
import { GlassSurface } from '@/components/glass/glass-surface';
import {
  HeroLineChart,
  HeroMetricHeader,
  RangeSelector,
  MetricTile,
  calcDelta,
  getRangeLabel,
  emptySeriesFor,
  DASHBOARD_TIME_RANGES,
  type AnalyticsMetric,
  type TimeRange,
} from '@/components/analytics/analytics-chart';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRevenueTimeSeries, REVENUE_TIMESERIES_KEY } from '@/hooks/use-revenue-analytics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EMPTY_SERIES = emptySeriesFor(DASHBOARD_TIME_RANGES);

function formatCents(cents: number): string {
  if (cents >= 100_00) {
    return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${(cents / 100).toFixed(2)}`;
}

// ---- Scrolling Ticker (Stocks-style) ----
const TICKER_ITEM_W = 128;

function TickerBar({ metrics, visible }: { metrics: AnalyticsMetric[]; visible: boolean }) {
  const opacity = React.useRef(new RNAnimated.Value(0)).current;
  const scrollX = React.useRef(new RNAnimated.Value(0)).current;
  const animRef = React.useRef<RNAnimated.CompositeAnimation | null>(null);

  React.useEffect(() => {
    if (visible && metrics.length > 0) {
      RNAnimated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      const totalW = metrics.length * TICKER_ITEM_W;
      scrollX.setValue(0);
      animRef.current = RNAnimated.loop(
        RNAnimated.timing(scrollX, { toValue: -totalW, duration: totalW * 30, easing: Easing.linear, useNativeDriver: true }),
      );
      animRef.current.start();
    } else {
      animRef.current?.stop();
      RNAnimated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
    return () => { animRef.current?.stop(); };
  }, [visible, metrics.length]);

  if (metrics.length === 0) return null;

  const abbreviate = (label: string) => {
    if (label.length <= 8) return label;
    const abbrevs: Record<string, string> = {
      'Net Revenue': 'Net Rev',
      'Gross Revenue': 'Gross Rev',
      'Platform Fees': 'Fees',
      'Transactions': 'Txns',
      'Avg / Transaction': 'Avg/Txn',
      'Avg / Event': 'Avg/Evt',
    };
    return abbrevs[label] || label.slice(0, 8) + '.';
  };

  const renderItems = () =>
    metrics.map((m, i) => {
      const delta = m.deltaText.split(' ')[0] ?? '';
      const color = m.isPositive ? '#30D158' : '#FF3B30';
      const sData = Object.values(m.seriesByRange).find((arr) => arr.length > 2) ?? [0, 0];
      const SW = 44, SHt = 28, mid = SHt / 2;
      let sparkLine = '';
      let sparkArea = '';
      if (sData.length >= 2) {
        const avg = sData.reduce((a, b) => a + b, 0) / sData.length;
        const maxDev = Math.max(...sData.map((v) => Math.abs(v - avg))) || 1;
        const pts = sData.map((v, j) => ({ x: (j / (sData.length - 1)) * SW, y: mid - ((v - avg) / maxDev) * (mid - 2) }));
        sparkLine = pts.map((p) => `${p.x},${p.y}`).join(' ');
        sparkArea = `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') + ` L ${SW} ${mid} L 0 ${mid} Z`;
      }
      const gradId = `rvGrad${m.id}${i}`;
      return (
        <View key={`${m.id}-${i}`} style={tk.item}>
          <View style={tk.labels}>
            <Text style={tk.name} numberOfLines={1}>{abbreviate(m.label)}</Text>
            <Text style={tk.val}>{m.primaryValue}</Text>
            <Text style={[tk.delta, { color }]}>{delta}</Text>
          </View>
          {sparkLine ? (
            <Svg width={SW} height={SHt} viewBox={`0 0 ${SW} ${SHt}`}>
              <Defs>
                <SvgGrad id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={color} stopOpacity="0.4" />
                  <Stop offset="1" stopColor={color} stopOpacity="0" />
                </SvgGrad>
              </Defs>
              <Line x1={0} y1={mid} x2={SW} y2={mid} stroke="rgba(0,0,0,0.08)" strokeWidth={1} strokeDasharray="2 2" />
              <Path d={sparkArea} fill={`url(#${gradId})`} />
              <Polyline points={sparkLine} fill="none" stroke={color} strokeWidth={1.5} />
            </Svg>
          ) : null}
        </View>
      );
    });

  return (
    <RNAnimated.View style={[tk.bar, { opacity }]}>
      <View style={tk.track}>
        <RNAnimated.View style={[tk.scroll, { transform: [{ translateX: scrollX }] }]}>
          {renderItems()}
          {renderItems()}
        </RNAnimated.View>
      </View>
    </RNAnimated.View>
  );
}

// ---- Sparkline (same as analytics) ----
function Sparkline({ data, negative }: { data: number[]; negative?: boolean }) {
  if (data.length < 2) return <View style={rs.sparkBox} />;
  const w = 80, h = 28, pad = 2;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - mn) / rng) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const color = negative ? '#FF3B30' : '#30D158';
  return (
    <View style={rs.sparkBox}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={negative ? '4 3' : undefined} />
      </Svg>
    </View>
  );
}

// ---- Metric Row (same as analytics) ----
function MetricRow({ metric, selectedRange, onPress, isLast }: { metric: AnalyticsMetric; selectedRange: TimeRange; onPress: () => void; isLast?: boolean }) {
  const data = metric.seriesByRange[selectedRange] ?? [];
  const deltaParts = metric.deltaText.split(' ');
  const deltaPercent = deltaParts.length >= 2 ? `${deltaParts[0]} ${deltaParts[1]}` : deltaParts[0] ?? '';
  return (
    <TouchableOpacity style={[rs.row, !isLast && rs.rowBorder]} onPress={onPress} activeOpacity={0.6}>
      <View style={rs.rowLeft}>
        <Text style={rs.rowName} numberOfLines={1}>{metric.label}</Text>
      </View>
      <Sparkline data={data} negative={!metric.isPositive} />
      <View style={rs.rowRight}>
        <Text style={rs.rowValue}>{metric.primaryValue}</Text>
        <View style={[rs.pill, metric.isPositive ? rs.pillUp : rs.pillDown]}>
          <Text style={[rs.pillText, { color: metric.isPositive ? '#30D158' : '#FF3B30' }]}>{deltaPercent}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const rs = StyleSheet.create({
  sparkBox: { width: 80, height: 28, marginHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', height: 64, paddingHorizontal: 16 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.1)' },
  rowLeft: { flex: 1 },
  rowName: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  rowRight: { alignItems: 'flex-end' },
  rowValue: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  pill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  pillUp: { backgroundColor: 'rgba(0,0,0,0.06)' },
  pillDown: { backgroundColor: 'rgba(0,0,0,0.06)' },
  pillText: { fontSize: 13, fontWeight: '600' },
});

const tk = StyleSheet.create({
  bar: { overflow: 'hidden', paddingBottom: 4 },
  track: { height: 70, overflow: 'hidden' },
  scroll: { flexDirection: 'row', alignItems: 'center', height: 70 },
  item: { width: TICKER_ITEM_W, paddingRight: 20, flexDirection: 'row', alignItems: 'center' },
  labels: { marginRight: 10 },
  name: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
  val: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginTop: 1 },
  delta: { fontSize: 12, fontWeight: '700', marginTop: 1 },
});

export default function DashboardRevenueScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { organizationId: orgIdParam } = useLocalSearchParams<{ organizationId?: string }>();
  const orgId = orgIdParam ? parseInt(orgIdParam, 10) : undefined;
  const { colors, isDark } = useAppTheme();
  const queryClient = useQueryClient();

  const [selectedRange, setSelectedRange] = React.useState<TimeRange>('1M');
  const [refreshing, setRefreshing] = React.useState(false);
  const [scrollEnabled, setScrollEnabled] = React.useState(true);
  const [heroMetricId, setHeroMetricId] = React.useState('netRevenue');
  const [metricsOrder, setMetricsOrder] = React.useState<string[]>([]);

  const { data, isLoading } = useRevenueTimeSeries(selectedRange, undefined, orgId);

  const handleRangeChange = React.useCallback((range: TimeRange) => {
    setSelectedRange(range);
  }, []);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: [REVENUE_TIMESERIES_KEY] });
    setRefreshing(false);
  }, [queryClient]);

  // Build metrics from revenue data
  const metrics = React.useMemo((): AnalyticsMetric[] => {
    const totals = data?.totals;
    const tsData = data?.data;
    const hasTimeSeries = tsData && tsData.length >= 2;
    const rangeLabel = getRangeLabel(selectedRange);

    const netSeries = hasTimeSeries ? tsData.map((d) => d.netRevenue) : [0, 0];
    const grossSeries = hasTimeSeries ? tsData.map((d) => d.grossRevenue) : [0, 0];
    const feesSeries = hasTimeSeries ? tsData.map((d) => d.platformFees) : [0, 0];
    const txnSeries = hasTimeSeries ? tsData.map((d) => d.transactionCount) : [0, 0];

    const netDelta = calcDelta(netSeries);
    const grossDelta = calcDelta(grossSeries);
    const feesDelta = calcDelta(feesSeries);
    const txnDelta = calcDelta(txnSeries);

    return [
      {
        id: 'netRevenue',
        label: 'Net Revenue',
        primaryValue: formatCents(totals?.netRevenue ?? 0),
        deltaText: hasTimeSeries ? `${netDelta.text} ${rangeLabel}` : `+0.0% ${rangeLabel}`,
        isPositive: netDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: netSeries },
      },
      {
        id: 'grossRevenue',
        label: 'Gross Revenue',
        primaryValue: formatCents(totals?.grossRevenue ?? 0),
        deltaText: hasTimeSeries ? `${grossDelta.text} ${rangeLabel}` : `+0.0% ${rangeLabel}`,
        isPositive: grossDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: grossSeries },
      },
      {
        id: 'platformFees',
        label: 'Platform Fees',
        primaryValue: formatCents(totals?.platformFees ?? 0),
        deltaText: hasTimeSeries ? `${feesDelta.text} ${rangeLabel}` : `+0.0% ${rangeLabel}`,
        isPositive: !feesDelta.isPositive, // Lower fees = positive
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: feesSeries },
      },
      {
        id: 'transactions',
        label: 'Transactions',
        primaryValue: (totals?.transactionCount ?? 0).toLocaleString(),
        deltaText: hasTimeSeries ? `${txnDelta.text} ${rangeLabel}` : `+0.0% ${rangeLabel}`,
        isPositive: txnDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: txnSeries },
      },
      {
        id: 'avgPerTransaction',
        label: 'Avg / Transaction',
        primaryValue: formatCents(totals?.avgPerTransaction ?? 0),
        deltaText: totals?.transactionCount ? `${totals.transactionCount} total` : `+0.0% ${rangeLabel}`,
        isPositive: true,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: [0, 0] },
      },
      {
        id: 'avgPerEvent',
        label: 'Avg / Event',
        primaryValue: formatCents(totals?.avgPerEvent ?? 0),
        deltaText: totals?.eventCount ? `Across ${totals.eventCount} events` : `+0.0% ${rangeLabel}`,
        isPositive: true,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: [0, 0] },
      },
    ];
  }, [data, selectedRange]);

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

  const [detailMetricId, setDetailMetricId] = React.useState<string | null>(null);
  const [detailExpanded, setDetailExpanded] = React.useState(false);
  const [insightsDetent, setInsightsDetent] = React.useState<PresentationDetent>({ fraction: 0.185 });
  const [showInsights] = React.useState(true);
  const detailMetric = detailMetricId ? metrics.find((m) => m.id === detailMetricId) ?? null : null;

  const heroData = heroMetric?.seriesByRange[selectedRange] ?? [];

  // Loading
  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Revenue</Text>
            <Text style={styles.headerDate}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8E8E93" />
        </View>
      </View>
    );
  }

  // Empty state
  if (!heroMetric || !data) {
    return (
      <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Revenue</Text>
            <Text style={styles.headerDate}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="trending-up-outline" size={56} color="rgba(0,0,0,0.15)" />
          <Text style={styles.emptyTitle}>No revenue data yet</Text>
          <Text style={styles.emptyHint}>Revenue from ticket sales will appear here</Text>
        </View>
      </View>
    );
  }

  const totals = data.totals;

  return (
    <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>

      {/* Header */}
      <View style={[styles.stickyHeader, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Revenue</Text>
            <Text style={styles.headerDate}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top + 56, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8E8E93" />
        }
      >
        {/* Range Selector — inline chips (same as analytics) */}
        <View style={styles.rangeRow}>
          {DASHBOARD_TIME_RANGES.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeChip, r === selectedRange && styles.rangeChipActive]}
              onPress={() => handleRangeChange(r)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rangeText, r === selectedRange && styles.rangeTextActive]}>
                {r === '5Y' ? 'All' : r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Metric rows (same as analytics) */}
        {metrics.map((metric, i) => (
          <MetricRow
            key={metric.id}
            metric={metric}
            selectedRange={selectedRange}
            onPress={() => setDetailMetricId(metric.id)}
            isLast={i === metrics.length - 1}
          />
        ))}
      </ScrollView>

      {/* Insights Sheet */}
      <NativeSheet
        isPresented={detailMetric === null && showInsights}
        onDismiss={() => setInsightsDetent({ fraction: 0.185 })}
        detents={[{ fraction: 0.185 }, { fraction: 0.45 }, { fraction: 0.96 }]}
        selectedDetent={insightsDetent}
        onDetentChange={setInsightsDetent}
        backgroundInteraction="enabled"
        preventDismiss
        rnContent
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1A1A' }}>Insights</Text>
          </View>
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Ionicons name="trending-up" size={14} color="rgba(0,0,0,0.4)" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Highlights</Text>
            </View>
            <Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)', lineHeight: 20 }}>No insights available yet. Insights will appear here once there is enough revenue data.</Text>
          </View>
        </ScrollView>
      </NativeSheet>

      {/* Fixed Ticker Bar — shows above the detail modal */}
      {detailMetric !== null && (
        <View style={[styles.fixedTicker, { paddingTop: insets.top - 6 }]}>
          <TickerBar metrics={metrics} visible={detailMetric !== null} />
        </View>
      )}

      {/* Detail Modal */}
      <MetricDetailModal
        visible={detailMetric !== null}
        metric={detailMetric}
        allMetrics={metrics}
        selectedRange={selectedRange}
        onClose={() => { setDetailMetricId(null); setDetailExpanded(false); }}
        onExpandedChange={setDetailExpanded}
        onRangeChange={handleRangeChange}
        tickerContent={null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedTicker: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#f2f2f2', zIndex: 1000 },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 12 },
  rangeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  rangeChipActive: { backgroundColor: 'rgba(0,0,0,0.08)' },
  rangeText: { fontSize: 15, fontWeight: '600', color: 'rgba(0,0,0,0.4)' },
  rangeTextActive: { color: '#1A1A1A' },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: '#f2f2f2' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  headerDate: { fontSize: 13, color: '#8E8E93', marginTop: 2, fontWeight: 'bold' },
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
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 8,
  },
  emptyHint: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  // Summary card
  summaryCard: {
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0, 0, 0, 0.5)',
    marginBottom: 4,
  },
  summaryGross: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#000',
  },
  summaryFees: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#ef4444',
  },
  summaryNet: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    color: '#22c55e',
  },
  // Chart area
  divider: {
    height: 1,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  tilesContainer: {
    paddingHorizontal: 16,
  },
  tileSeparator: {
    height: 1,
  },
});
