// Event Revenue Analytics — Revenue trends for a specific event

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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import {
  HeroLineChart,
  HeroMetricHeader,
  RangeSelector,
  MetricTile,
  calcDelta,
  getRangeLabel,
  emptySeriesFor,
  EVENT_TIME_RANGES,
  type AnalyticsMetric,
  type TimeRange,
} from '@/components/analytics/analytics-chart';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRevenueTimeSeries, REVENUE_TIMESERIES_KEY } from '@/hooks/use-revenue-analytics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EMPTY_EVENT_SERIES = emptySeriesFor(EVENT_TIME_RANGES);

function formatCents(cents: number): string {
  if (cents >= 100_00) {
    return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${(cents / 100).toFixed(2)}`;
}

export default function EventRevenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id ? parseInt(id, 10) : 0;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const queryClient = useQueryClient();

  const [selectedRange, setSelectedRange] = React.useState<TimeRange>('1M');
  const [refreshing, setRefreshing] = React.useState(false);
  const [scrollEnabled, setScrollEnabled] = React.useState(true);
  const [heroMetricId, setHeroMetricId] = React.useState('netRevenue');
  const [metricsOrder, setMetricsOrder] = React.useState<string[]>([]);

  const { data, isLoading } = useRevenueTimeSeries(selectedRange, eventId);

  const handleRangeChange = React.useCallback((range: TimeRange) => {
    setSelectedRange(range);
  }, []);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: [REVENUE_TIMESERIES_KEY, undefined, eventId] });
    setRefreshing(false);
  }, [queryClient, eventId]);

  // Build metrics (no avgPerEvent/eventCount for per-event view)
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
        deltaText: hasTimeSeries ? `${netDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: netDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: netSeries },
      },
      {
        id: 'grossRevenue',
        label: 'Gross Revenue',
        primaryValue: formatCents(totals?.grossRevenue ?? 0),
        deltaText: hasTimeSeries ? `${grossDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: grossDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: grossSeries },
      },
      {
        id: 'platformFees',
        label: 'Platform Fees',
        primaryValue: formatCents(totals?.platformFees ?? 0),
        deltaText: hasTimeSeries ? `${feesDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: !feesDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: feesSeries },
      },
      {
        id: 'transactions',
        label: 'Transactions',
        primaryValue: (totals?.transactionCount ?? 0).toLocaleString(),
        deltaText: hasTimeSeries ? `${txnDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: txnDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: txnSeries },
      },
      {
        id: 'avgPerTransaction',
        label: 'Avg / Transaction',
        primaryValue: formatCents(totals?.avgPerTransaction ?? 0),
        deltaText: totals?.transactionCount ? `${totals.transactionCount} total` : 'No data yet',
        isPositive: true,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: [0, 0] },
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

  // Loading
  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isDark && <DarkGradientBg />}
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Event Revenue</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </View>
    );
  }

  // Empty state
  if (!heroMetric || !data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isDark && <DarkGradientBg />}
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Event Revenue</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="trending-up-outline" size={56} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No revenue data yet</Text>
          <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>Once tickets start selling, revenue trends and analytics will appear here</Text>
        </View>
      </View>
    );
  }

  const totals = data.totals;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Event Revenue</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text} />
        }
      >
        {/* Summary Card */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Gross</Text>
                <Text style={[styles.summaryGross, { color: colors.text }]}>{formatCents(totals.grossRevenue)}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Fees</Text>
                <Text style={styles.summaryFees}>-{formatCents(totals.platformFees)}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>Net</Text>
                <Text style={styles.summaryNet}>{formatCents(totals.netRevenue)}</Text>
              </View>
            </View>
          </GlassSurface>
        </Animated.View>

        {/* Hero Chart */}
        <HeroMetricHeader key={heroMetricId} metric={heroMetric} colors={colors} />
        <HeroLineChart
          key={`chart-${heroMetricId}-${selectedRange}`}
          data={heroData}
          isPositive={heroMetric.isPositive}
          metricLabel={heroMetric.label}
          colors={colors}
          isDark={isDark}
          onTouchActive={(active) => setScrollEnabled(!active)}
        />

        {/* Range Selector */}
        <RangeSelector
          selected={selectedRange}
          onSelect={handleRangeChange}
          ranges={EVENT_TIME_RANGES}
          colors={colors}
        />

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.separator }]} />

        {/* Metric Tiles */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
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
  emptyHint: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  scrollView: {
    flex: 1,
  },
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
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginBottom: 4,
  },
  summaryGross: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
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
