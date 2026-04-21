// Dashboard Analytics — iOS Stocks-style layout with full interactivity
import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polyline, Defs, LinearGradient as SvgGrad, Stop, Path, Line } from 'react-native-svg';
import { analyticsApi } from '@/lib/api/analytics';
import { useAnalyticsSocket } from '@/hooks/use-analytics-socket';
import {
  calcDelta,
  getRangeLabel,
  EMPTY_SERIES,
  DASHBOARD_TIME_RANGES,
  type AnalyticsMetric,
  type TimeRange,
} from '@/components/analytics/analytics-chart';
import { useAppTheme } from '@/hooks/use-app-theme';
import { MetricDetailModal } from '@/components/analytics/metric-detail-modal';
import { NativeSheet } from '@/components/ui/native-sheet';
import type { PresentationDetent } from '@expo/ui/swift-ui/modifiers';

const DASHBOARD_TIMESERIES_KEY = 'dashboard-timeseries';

// ---- Sparkline ----
function Sparkline({ data, negative }: { data: number[]; negative?: boolean }) {
  if (data.length < 2) return <View style={s.sparkBox} />;
  const w = 80, h = 28, pad = 2;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - mn) / rng) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
  const color = negative ? '#FF3B30' : '#30D158';
  return (
    <View style={s.sparkBox}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={negative ? '4 3' : undefined}
        />
      </Svg>
    </View>
  );
}

// ---- Metric Row ----
function MetricRow({
  metric,
  selectedRange,
  onPress,
  isLast,
}: {
  metric: AnalyticsMetric;
  selectedRange: TimeRange;
  onPress: () => void;
  isLast?: boolean;
}) {
  const data = metric.seriesByRange[selectedRange] ?? [];
  // Extract just the percentage part (e.g., "▲ 12.5%") from deltaText like "▲ 12.5% This month"
  const deltaParts = metric.deltaText.split(' ');
  const deltaPercent = deltaParts.length >= 2 ? `${deltaParts[0]} ${deltaParts[1]}` : deltaParts[0] ?? '';
  return (
    <TouchableOpacity
      style={[s.row, !isLast && s.rowBorder]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={s.rowLeft}>
        <Text style={s.rowName} numberOfLines={1}>{metric.label}</Text>
      </View>
      <Sparkline data={data} negative={!metric.isPositive} />
      <View style={s.rowRight}>
        <Text style={s.rowValue}>{metric.primaryValue}</Text>
        <View style={[s.pill, metric.isPositive ? s.pillUp : s.pillDown]}>
          <Text style={[s.pillText, { color: metric.isPositive ? '#30D158' : '#FF3B30' }]}>
            {deltaPercent}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ---- Scrolling Ticker (Stocks-style) ----
const TICKER_ITEM_W = 128;

function TickerBar({ metrics, visible }: { metrics: AnalyticsMetric[]; visible: boolean }) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const animRef = React.useRef<Animated.CompositeAnimation | null>(null);

  React.useEffect(() => {
    if (visible && metrics.length > 0) {
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      const totalW = metrics.length * TICKER_ITEM_W;
      scrollX.setValue(0);
      animRef.current = Animated.loop(
        Animated.timing(scrollX, {
          toValue: -totalW,
          duration: totalW * 30,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animRef.current.start();
    } else {
      animRef.current?.stop();
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
    return () => { animRef.current?.stop(); };
  }, [visible, metrics.length]);

  if (metrics.length === 0) return null;

  const abbreviate = (label: string) => {
    if (label.length <= 6) return label;
    const abbrevs: Record<string, string> = {
      'Total Views': 'Views',
      'Unique Visitors': 'Uniq V.',
      'Check-Ins': 'Chk-In',
      'Check-in Rate': 'Chk %',
      'Conversion Rate': 'Conv %',
      'RSVPs / Event': 'RSVP/E',
      'Event Views': 'Views',
      'New Events': 'Events',
    };
    return abbrevs[label] || label.slice(0, 6) + '.';
  };

  const renderItems = () =>
    metrics.map((m, i) => {
      const delta = m.deltaText.split(' ')[0] ?? '';
      const color = m.isPositive ? '#30D158' : '#FF3B30';
      const sData = Object.values(m.seriesByRange).find((arr) => arr.length > 2) ?? [0, 0];
      const SW = 44, SHt = 28;
      const mid = SHt / 2;
      let sparkLine = '';
      let sparkArea = '';
      if (sData.length >= 2) {
        // Center the baseline: values above avg go up, below go down
        const avg = sData.reduce((a, b) => a + b, 0) / sData.length;
        const maxDev = Math.max(...sData.map((v) => Math.abs(v - avg))) || 1;
        const pts = sData.map((v, j) => ({
          x: (j / (sData.length - 1)) * SW,
          y: mid - ((v - avg) / maxDev) * (mid - 2),
        }));
        sparkLine = pts.map((p) => `${p.x},${p.y}`).join(' ');
        // Fill area between line and center
        sparkArea = `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') + ` L ${SW} ${mid} L 0 ${mid} Z`;
      }
      const gradId = `tkGrad${m.id}${i}`;
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
              {/* Center baseline */}
              <Line x1={0} y1={mid} x2={SW} y2={mid} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="2 2" />
              <Path d={sparkArea} fill={`url(#${gradId})`} />
              <Polyline points={sparkLine} fill="none" stroke={color} strokeWidth={1.5} />
            </Svg>
          ) : null}
        </View>
      );
    });

  return (
    <Animated.View style={[tk.bar, { opacity }]}>
      <View style={tk.track}>
        <Animated.View style={[tk.scroll, { transform: [{ translateX: scrollX }] }]}>
          {renderItems()}
          {renderItems()}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

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

// ---- Screen ----
export default function DashboardAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { organizationId: orgIdParam } = useLocalSearchParams<{ organizationId?: string }>();
  const orgId = orgIdParam ? parseInt(orgIdParam, 10) : undefined;
  const queryClient = useQueryClient();
  const { colors } = useAppTheme();

  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedRange, setSelectedRange] = React.useState<TimeRange>('1M');
  const [detailMetricId, setDetailMetricId] = React.useState<string | null>(null);
  const [detailExpanded, setDetailExpanded] = React.useState(false);
  const [insightsDetent, setInsightsDetent] = React.useState<PresentationDetent>({ fraction: 0.185 });
  const [insightsExpanded, setInsightsExpanded] = React.useState(false);
  const [scrolledPastHeader, setScrolledPastHeader] = React.useState(false);
  const [showInsights, setShowInsights] = React.useState(true);

  const handleBack = React.useCallback(() => {
    setShowInsights(false);
    setTimeout(() => router.back(), 50);
  }, [router]);

  const timeSeriesQuery = useQuery({
    queryKey: [DASHBOARD_TIMESERIES_KEY, selectedRange, orgId],
    queryFn: () => analyticsApi.getDashboardTimeSeries(selectedRange, orgId),
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
  });

  const handleSocketUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [DASHBOARD_TIMESERIES_KEY] });
  }, [queryClient]);

  useAnalyticsSocket({ onUpdate: handleSocketUpdate });

  const handleRangeChange = React.useCallback((range: TimeRange) => {
    setSelectedRange(range);
  }, []);

  const handleSelectMetric = React.useCallback((tappedId: string) => {
    setDetailMetricId(tappedId);
  }, []);

  const doRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: [DASHBOARD_TIMESERIES_KEY] });
    setRefreshing(false);
  }, [queryClient]);

  // Build metrics (same logic as original)
  const metrics = React.useMemo((): AnalyticsMetric[] => {
    const totals = timeSeriesQuery.data?.totals;
    const tsData = timeSeriesQuery.data?.data;
    const hasTimeSeries = tsData && tsData.length >= 2;

    const totalViews = totals?.views ?? 0;
    const totalUniqueVisitors = totals?.uniqueVisitors ?? 0;
    const totalRSVPs = totals?.rsvps ?? 0;
    const totalCheckIns = totals?.checkIns ?? 0;
    const totalNewEvents = totals?.newEvents ?? 0;
    const conversionRate = totals?.conversionRate ?? 0;

    const dateDates = hasTimeSeries ? tsData.map((d) => d.date) : [];
    const viewsSeries = hasTimeSeries ? tsData.map((d) => d.views) : [0, 0];
    const uniqueSeries = hasTimeSeries ? tsData.map((d) => d.uniqueVisitors) : [0, 0];
    const rsvpsSeries = hasTimeSeries ? tsData.map((d) => d.rsvps) : [0, 0];
    const checkInsSeries = hasTimeSeries ? tsData.map((d) => d.checkIns ?? 0) : [0, 0];
    const conversionSeries = hasTimeSeries
      ? tsData.map((d) => d.uniqueVisitors > 0 ? (d.rsvps / d.uniqueVisitors) * 100 : 0)
      : [0, 0];
    const eventsSeries = hasTimeSeries
      ? (() => { let c = 0; return tsData.map((d) => { c += d.newEvents; return c; }); })()
      : [0, 0];
    const perEventSeries = hasTimeSeries
      ? (() => { let ce = 0, cr = 0; return tsData.map((d) => { ce += d.newEvents; cr += d.rsvps; return ce > 0 ? Math.round(cr / ce) : 0; }); })()
      : [0, 0];
    const checkInRateSeries = hasTimeSeries
      ? tsData.map((d) => (d.rsvps > 0 ? ((d.checkIns ?? 0) / d.rsvps) * 100 : 0))
      : [0, 0];
    const checkInRate = totalRSVPs > 0 ? (totalCheckIns / totalRSVPs) * 100 : 0;

    const rangeLabel = getRangeLabel(selectedRange);
    const dates = { [selectedRange]: dateDates };

    return [
      { id: 'views', label: 'Total Views', primaryValue: totalViews.toLocaleString(), deltaText: hasTimeSeries ? `${calcDelta(viewsSeries).text} ${rangeLabel}` : 'No data yet', isPositive: calcDelta(viewsSeries).isPositive, seriesByRange: { ...EMPTY_SERIES, [selectedRange]: viewsSeries }, datesByRange: dates },
      { id: 'unique', label: 'Unique Visitors', primaryValue: totalUniqueVisitors.toLocaleString(), deltaText: hasTimeSeries ? `${calcDelta(uniqueSeries).text} ${rangeLabel}` : 'No data yet', isPositive: calcDelta(uniqueSeries).isPositive, seriesByRange: { ...EMPTY_SERIES, [selectedRange]: uniqueSeries }, datesByRange: dates },
      { id: 'rsvps', label: 'RSVPs', primaryValue: totalRSVPs.toLocaleString(), deltaText: hasTimeSeries ? `${calcDelta(rsvpsSeries).text} ${rangeLabel}` : 'No data yet', isPositive: calcDelta(rsvpsSeries).isPositive, seriesByRange: { ...EMPTY_SERIES, [selectedRange]: rsvpsSeries }, datesByRange: dates },
      { id: 'checkIns', label: 'Check-Ins', primaryValue: totalCheckIns.toLocaleString(), deltaText: hasTimeSeries ? `${calcDelta(checkInsSeries).text} ${rangeLabel}` : 'No data yet', isPositive: calcDelta(checkInsSeries).isPositive, seriesByRange: { ...EMPTY_SERIES, [selectedRange]: checkInsSeries }, datesByRange: dates },
      { id: 'checkInRate', label: 'Check-in Rate', primaryValue: `${checkInRate.toFixed(1)}%`, deltaText: hasTimeSeries ? `${calcDelta(checkInRateSeries).text} ${rangeLabel}` : '—', isPositive: calcDelta(checkInRateSeries).isPositive, seriesByRange: { ...EMPTY_SERIES, [selectedRange]: checkInRateSeries } },
      { id: 'conversion', label: 'Conversion Rate', primaryValue: `${conversionRate.toFixed(1)}%`, deltaText: hasTimeSeries ? `${calcDelta(conversionSeries).text} ${rangeLabel}` : '—', isPositive: calcDelta(conversionSeries).isPositive, seriesByRange: { ...EMPTY_SERIES, [selectedRange]: conversionSeries }, datesByRange: dates },
      { id: 'events', label: 'Events', primaryValue: totalNewEvents.toLocaleString(), deltaText: hasTimeSeries ? `${calcDelta(eventsSeries).text} ${rangeLabel}` : totalNewEvents > 0 ? `${totalNewEvents} total` : 'No events yet', isPositive: calcDelta(eventsSeries).isPositive, seriesByRange: { ...EMPTY_SERIES, [selectedRange]: eventsSeries }, datesByRange: dates },
      { id: 'perEvent', label: 'RSVPs / Event', primaryValue: totalNewEvents > 0 ? Math.round(totalRSVPs / totalNewEvents).toLocaleString() : '0', deltaText: hasTimeSeries ? `${calcDelta(perEventSeries).text} ${rangeLabel}` : totalNewEvents > 0 ? `Avg across ${totalNewEvents} events` : '—', isPositive: calcDelta(perEventSeries).isPositive, seriesByRange: { ...EMPTY_SERIES, [selectedRange]: perEventSeries }, datesByRange: dates },
    ];
  }, [timeSeriesQuery.data, selectedRange]);

  const detailMetric = detailMetricId ? metrics.find((m) => m.id === detailMetricId) ?? null : null;

  // Loading state
  if (timeSeriesQuery.isLoading && !refreshing) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={s.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Analytics</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
        <View style={s.loadingBox}>
          <ActivityIndicator color="#8E8E93" size="large" />
        </View>
      </View>
    );
  }

  // Empty state
  if (metrics.length === 0) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={s.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Analytics</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
        <View style={s.loadingBox}>
          <Ionicons name="stats-chart-outline" size={56} color="#3A3A3C" />
          <Text style={s.emptyText}>No analytics yet</Text>
          <Text style={s.emptySubText}>Data will appear here once there is activity</Text>
        </View>
      </View>
    );
  }

  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <View style={s.container}>

      {/* Fixed Header */}
      <View style={[s.stickyHeader, { paddingTop: insets.top }, scrolledPastHeader && s.headerScrolled]}>
        <View style={s.header}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={s.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Analytics</Text>
            <Text style={s.headerDate}>{dateStr}</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
        {scrolledPastHeader && (
          <LinearGradient
            colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0)']}
            style={s.headerFade}
            pointerEvents="none"
          />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 56, paddingBottom: insets.bottom + 100 }}
        scrollEnabled
        style={insightsExpanded ? { opacity: 0 } : undefined}
        onScroll={(e) => setScrolledPastHeader(e.nativeEvent.contentOffset.y > 10)}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor="#8E8E93" />
        }
      >
        {/* Range Selector */}
        <View style={s.rangeRow}>
          {DASHBOARD_TIME_RANGES.map((r) => (
            <TouchableOpacity
              key={r}
              style={[s.rangeChip, r === selectedRange && s.rangeChipActive]}
              onPress={() => handleRangeChange(r)}
              activeOpacity={0.7}
            >
              <Text style={[s.rangeText, r === selectedRange && s.rangeTextActive]}>
                {r === '5Y' ? 'All' : r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Metric rows */}
        {metrics.map((metric, i) => (
          <MetricRow
            key={metric.id}
            metric={metric}
            selectedRange={selectedRange}
            onPress={() => handleSelectMetric(metric.id)}
            isLast={i === metrics.length - 1}
          />
        ))}
      </ScrollView>

      {/* Insights NativeSheet — visible when no detail metric is selected */}
        <NativeSheet
          isPresented={detailMetric === null && showInsights}
          onDismiss={() => setInsightsDetent({ fraction: 0.185 })}
          detents={[{ fraction: 0.185 }, { fraction: 0.45 }, { fraction: 0.96 }]}
          selectedDetent={insightsDetent}
          onDetentChange={(d) => {
            setInsightsDetent(d);
            const isFrac = typeof d === 'object' && 'fraction' in d;
            setInsightsExpanded(isFrac && (d as { fraction: number }).fraction >= 0.9);
          }}
          backgroundInteraction="enabled"
          preventDismiss
          rnContent
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={s.sheetHeader}>
              <Text style={s.sheetHeaderTitle}>Insights</Text>
            </View>

            <View style={s.insightSection}>
              <View style={s.insightSectionHeader}>
                <Ionicons name="trending-up" size={14} color="rgba(255,255,255,0.5)" />
                <Text style={s.insightSectionTitle}>Highlights</Text>
              </View>
              <Text style={s.insightText}>No insights available yet. Insights will appear here once there is enough analytics data.</Text>
            </View>
          </ScrollView>
        </NativeSheet>

      {/* Fixed Ticker Bar — shows above the detail modal */}
      {detailMetric !== null && (
        <View style={[s.fixedTicker, { paddingTop: insets.top - 6 }]}>
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },

  // Fixed ticker
  fixedTicker: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#000000', zIndex: 1000 },

  // Header
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  headerFade: { height: 24, marginTop: -1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerScrolled: { backgroundColor: 'rgba(242,242,242,0.95)' },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  headerDate: { fontSize: 13, color: '#8E8E93', marginTop: 2, fontWeight: 'bold' },

  // Section
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, marginBottom: 8, paddingHorizontal: 16 },
  sectionLabel: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },

  // Range selector
  rangeRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 12 },
  rangeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  rangeChipActive: { backgroundColor: 'rgba(0,0,0,0.08)' },
  rangeText: { fontSize: 15, fontWeight: '600', color: 'rgba(0,0,0,0.4)' },
  rangeTextActive: { color: '#1A1A1A' },

  // Row
  row: { flexDirection: 'row', alignItems: 'center', height: 64, paddingHorizontal: 16 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#666' },
  rowLeft: { flex: 1 },
  rowName: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  sparkBox: { width: 80, height: 28, marginHorizontal: 16 },
  rowRight: { alignItems: 'flex-end' },
  rowValue: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },

  // Pill
  pill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  pillUp: { backgroundColor: 'rgba(0,0,0,0.06)' },
  pillDown: { backgroundColor: 'rgba(0,0,0,0.06)' },
  pillText: { fontSize: 13, fontWeight: '600' },

  // Loading / Empty
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 20, fontWeight: '600', color: '#8E8E93' },
  emptySubText: { fontSize: 15, color: '#3A3A3C' },

  // Insights sheet
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 12 },
  sheetHeaderTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  insightSection: { marginBottom: 20 },
  insightSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  insightSectionTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  insightText: { fontSize: 14, color: 'rgba(0,0,0,0.3)', lineHeight: 20 },
});
