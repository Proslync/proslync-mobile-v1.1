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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
        deltaText: hasTimeSeries ? `${netDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: netDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: netSeries },
      },
      {
        id: 'grossRevenue',
        label: 'Gross Revenue',
        primaryValue: formatCents(totals?.grossRevenue ?? 0),
        deltaText: hasTimeSeries ? `${grossDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: grossDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: grossSeries },
      },
      {
        id: 'platformFees',
        label: 'Platform Fees',
        primaryValue: formatCents(totals?.platformFees ?? 0),
        deltaText: hasTimeSeries ? `${feesDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: !feesDelta.isPositive, // Lower fees = positive
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: feesSeries },
      },
      {
        id: 'transactions',
        label: 'Transactions',
        primaryValue: (totals?.transactionCount ?? 0).toLocaleString(),
        deltaText: hasTimeSeries ? `${txnDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: txnDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: txnSeries },
      },
      {
        id: 'avgPerTransaction',
        label: 'Avg / Transaction',
        primaryValue: formatCents(totals?.avgPerTransaction ?? 0),
        deltaText: totals?.transactionCount ? `${totals.transactionCount} total` : 'No data yet',
        isPositive: true,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: [0, 0] },
      },
      {
        id: 'avgPerEvent',
        label: 'Avg / Event',
        primaryValue: formatCents(totals?.avgPerEvent ?? 0),
        deltaText: totals?.eventCount ? `Across ${totals.eventCount} events` : 'No data yet',
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
      <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Revenue</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </View>
    );
  }

  // Empty state
  if (!heroMetric || !data) {
    return (
      <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Revenue</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="trending-up-outline" size={56} color="rgba(255,255,255,0.3)" />
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
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revenue</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#fff" />
        }
      >
        {/* Summary Card */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Gross</Text>
                <Text style={styles.summaryGross}>{formatCents(totals.grossRevenue)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Fees</Text>
                <Text style={styles.summaryFees}>-{formatCents(totals.platformFees)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Net</Text>
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
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
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
    color: '#000',
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
