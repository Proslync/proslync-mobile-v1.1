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

  const renderItems = () =>
    metrics.map((m, i) => {
      const delta = m.deltaText;
      const color = m.isPositive ? '#30D158' : '#FF3B30';
      return (
        <View key={`${m.id}-${i}`} style={{ width: TICKER_ITEM_W, paddingHorizontal: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#1A1A1A' }} numberOfLines={1}>{m.label}</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1A1A' }}>{m.primaryValue}</Text>
          <Text style={{ fontSize: 10, fontWeight: '600', color }} numberOfLines={1}>{delta}</Text>
        </View>
      );
    });

  return (
    <RNAnimated.View style={{ opacity, height: 56, overflow: 'hidden', flexDirection: 'row' }}>
      <RNAnimated.View style={{ flexDirection: 'row', transform: [{ translateX: scrollX }] }}>
        {renderItems()}
        {renderItems()}
      </RNAnimated.View>
    </RNAnimated.View>
  );
}

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
        deltaText: hasTimeSeries ? `${netDelta.text} ${rangeLabel}` : '+0.0%',
        isPositive: netDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: netSeries },
      },
      {
        id: 'grossRevenue',
        label: 'Gross Revenue',
        primaryValue: formatCents(totals?.grossRevenue ?? 0),
        deltaText: hasTimeSeries ? `${grossDelta.text} ${rangeLabel}` : '+0.0%',
        isPositive: grossDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: grossSeries },
      },
      {
        id: 'platformFees',
        label: 'Platform Fees',
        primaryValue: formatCents(totals?.platformFees ?? 0),
        deltaText: hasTimeSeries ? `${feesDelta.text} ${rangeLabel}` : '+0.0%',
        isPositive: !feesDelta.isPositive, // Lower fees = positive
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: feesSeries },
      },
      {
        id: 'transactions',
        label: 'Transactions',
        primaryValue: (totals?.transactionCount ?? 0).toLocaleString(),
        deltaText: hasTimeSeries ? `${txnDelta.text} ${rangeLabel}` : '+0.0%',
        isPositive: txnDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: txnSeries },
      },
      {
        id: 'avgPerTransaction',
        label: 'Avg / Transaction',
        primaryValue: formatCents(totals?.avgPerTransaction ?? 0),
        deltaText: totals?.transactionCount ? `${totals.transactionCount} total` : '+0.0%',
        isPositive: true,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: [0, 0] },
      },
      {
        id: 'avgPerEvent',
        label: 'Avg / Event',
        primaryValue: formatCents(totals?.avgPerEvent ?? 0),
        deltaText: totals?.eventCount ? `Across ${totals.eventCount} events` : '+0.0%',
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
        {/* Range Selector — right below header */}
        <RangeSelector
          selected={selectedRange}
          onSelect={handleRangeChange}
          colors={colors}
        />

        {/* Metric Tiles */}
        <View style={styles.tilesContainer}>
          {[heroMetric, ...tileMetrics].map((metric, index) => (
            <React.Fragment key={metric.id}>
              {index > 0 && <View style={[styles.tileSeparator, { backgroundColor: colors.separator }]} />}
              <MetricTile
                metric={metric}
                selectedRange={selectedRange}
                onPress={() => setDetailMetricId(metric.id)}
                colors={colors}
              />
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

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
