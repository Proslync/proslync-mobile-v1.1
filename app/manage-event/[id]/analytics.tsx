// Event Analytics — identical layout to dashboard analytics
import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Defs, LinearGradient as SvgGrad, Stop, Path, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { analyticsApi } from '@/lib/api/analytics';
import { useAnalyticsSocket } from '@/hooks/use-analytics-socket';
import { MetricDetailModal } from '@/components/analytics/metric-detail-modal';
import { NativeSheet } from '@/components/ui/native-sheet';
import { type PresentationDetent } from '@expo/ui/swift-ui/modifiers';
import {
  calcDelta, getRangeLabel, EMPTY_EVENT_SERIES, EVENT_TIME_RANGES,
  type AnalyticsMetric, type TimeRange,
} from '@/components/analytics/analytics-chart';

const EVENT_TIMESERIES_KEY = 'event-timeseries';

// ---- Sparkline ----
function Sparkline({ data, negative }: { data: number[]; negative?: boolean }) {
  if (data.length < 2) return <View style={s.sparkBox} />;
  const w = 80, h = 28, pad = 2;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - mn) / rng) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const color = negative ? '#FF3B30' : '#30D158';
  return (
    <View style={s.sparkBox}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={negative ? '4 3' : undefined} />
      </Svg>
    </View>
  );
}

// ---- Metric Row ----
function MetricRow({ metric, selectedRange, onPress, isLast }: { metric: AnalyticsMetric; selectedRange: TimeRange; onPress: () => void; isLast?: boolean }) {
  const data = metric.seriesByRange[selectedRange] ?? [];
  const deltaParts = metric.deltaText.split(' ');
  const deltaPercent = deltaParts.length >= 2 ? `${deltaParts[0]} ${deltaParts[1]}` : deltaParts[0] ?? '';
  return (
    <TouchableOpacity style={[s.row, !isLast && s.rowBorder]} onPress={onPress} activeOpacity={0.6}>
      <View style={s.rowLeft}><Text style={s.rowName} numberOfLines={1}>{metric.label}</Text></View>
      <Sparkline data={data} negative={!metric.isPositive} />
      <View style={s.rowRight}>
        <Text style={s.rowValue}>{metric.primaryValue}</Text>
        <View style={[s.pill, metric.isPositive ? s.pillUp : s.pillDown]}>
          <Text style={[s.pillText, { color: metric.isPositive ? '#30D158' : '#FF3B30' }]}>{deltaPercent}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ---- Ticker ----
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
      animRef.current = Animated.loop(Animated.timing(scrollX, { toValue: -totalW, duration: totalW * 30, easing: Easing.linear, useNativeDriver: true }));
      animRef.current.start();
    } else { animRef.current?.stop(); Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(); }
    return () => { animRef.current?.stop(); };
  }, [visible, metrics.length]);
  if (metrics.length === 0) return null;
  const abbreviate = (label: string) => {
    const abbrevs: Record<string, string> = { 'Event Views': 'Views', 'Unique Visitors': 'Uniq V.', 'Check-Ins': 'Chk-In', 'Check-in Rate': 'Chk %', 'Conversion Rate': 'Conv %' };
    return abbrevs[label] || (label.length <= 8 ? label : label.slice(0, 6) + '.');
  };
  const renderItems = () => metrics.map((m, i) => {
    const delta = m.deltaText.split(' ')[0] ?? '';
    const color = m.isPositive ? '#30D158' : '#FF3B30';
    const sData = Object.values(m.seriesByRange).find((arr) => arr.length > 2) ?? [0, 0];
    const SW = 44, SHt = 28, mid = SHt / 2;
    let sparkLine = '', sparkArea = '';
    if (sData.length >= 2) {
      const avg = sData.reduce((a, b) => a + b, 0) / sData.length;
      const maxDev = Math.max(...sData.map((v) => Math.abs(v - avg))) || 1;
      const pts = sData.map((v, j) => ({ x: (j / (sData.length - 1)) * SW, y: mid - ((v - avg) / maxDev) * (mid - 2) }));
      sparkLine = pts.map((p) => `${p.x},${p.y}`).join(' ');
      sparkArea = `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') + ` L ${SW} ${mid} L 0 ${mid} Z`;
    }
    const gradId = `evtGrad${m.id}${i}`;
    return (
      <View key={`${m.id}-${i}`} style={tk.item}>
        <View style={tk.labels}>
          <Text style={tk.name} numberOfLines={1}>{abbreviate(m.label)}</Text>
          <Text style={tk.val}>{m.primaryValue}</Text>
          <Text style={[tk.delta, { color }]}>{delta}</Text>
        </View>
        {sparkLine ? (
          <Svg width={SW} height={SHt} viewBox={`0 0 ${SW} ${SHt}`}>
            <Defs><SvgGrad id={gradId} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={color} stopOpacity="0.4" /><Stop offset="1" stopColor={color} stopOpacity="0" /></SvgGrad></Defs>
            <Line x1={0} y1={mid} x2={SW} y2={mid} stroke="rgba(0,0,0,0.08)" strokeWidth={1} strokeDasharray="2 2" />
            <Path d={sparkArea} fill={`url(#${gradId})`} />
            <Polyline points={sparkLine} fill="none" stroke={color} strokeWidth={1.5} />
          </Svg>
        ) : null}
      </View>
    );
  });
  return (
    <Animated.View style={[tk.bar, { opacity }]}>
      <View style={tk.track}><Animated.View style={[tk.scroll, { transform: [{ translateX: scrollX }] }]}>{renderItems()}{renderItems()}</Animated.View></View>
    </Animated.View>
  );
}
const tk = StyleSheet.create({
  bar: { overflow: 'hidden', paddingBottom: 4 }, track: { height: 70, overflow: 'hidden' },
  scroll: { flexDirection: 'row', alignItems: 'center', height: 70 },
  item: { width: TICKER_ITEM_W, paddingRight: 20, flexDirection: 'row', alignItems: 'center' },
  labels: { marginRight: 10 }, name: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
  val: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginTop: 1 },
  delta: { fontSize: 12, fontWeight: '700', marginTop: 1 },
});

// ---- Screen ----
export default function EventAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id ? parseInt(id, 10) : 0;
  const queryClient = useQueryClient();

  const [selectedRange, setSelectedRange] = React.useState<TimeRange>('1M');
  const [detailMetricId, setDetailMetricId] = React.useState<string | null>(null);
  const [detailExpanded, setDetailExpanded] = React.useState(false);
  const [insightsDetent, setInsightsDetent] = React.useState<PresentationDetent>({ fraction: 0.185 });
  const [refreshing, setRefreshing] = React.useState(false);

  const timeSeriesQuery = useQuery({
    queryKey: [EVENT_TIMESERIES_KEY, eventId, selectedRange],
    queryFn: () => analyticsApi.getEventTimeSeries(eventId, selectedRange),
    enabled: eventId > 0, staleTime: 0, gcTime: 10 * 60 * 1000,
  });

  const handleSocketUpdate = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [EVENT_TIMESERIES_KEY, eventId] });
  }, [queryClient, eventId]);
  useAnalyticsSocket({ eventId, onUpdate: handleSocketUpdate, enabled: eventId > 0 });

  const metrics = React.useMemo((): AnalyticsMetric[] => {
    const totals = timeSeriesQuery.data?.totals;
    const tsData = timeSeriesQuery.data?.data;
    const hasTimeSeries = tsData && tsData.length >= 2;
    const rangeLabel = getRangeLabel(selectedRange);
    const dates = hasTimeSeries ? { [selectedRange]: tsData.map((d) => d.date) } : {};

    const mk = (id: string, label: string, val: number, fmt: string, series: number[], delta: ReturnType<typeof calcDelta>) => ({
      id, label, primaryValue: fmt,
      deltaText: hasTimeSeries ? `${delta.text} ${rangeLabel}` : `+0.0% ${rangeLabel}`,
      isPositive: delta.isPositive,
      seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: series },
      datesByRange: dates,
    });

    const viewsSeries = hasTimeSeries ? tsData.map((d) => d.views) : [0, 0];
    const uniqueSeries = hasTimeSeries ? tsData.map((d) => d.uniqueVisitors) : [0, 0];
    const rsvpsSeries = hasTimeSeries ? tsData.map((d) => d.rsvps) : [0, 0];
    const checkInsSeries = hasTimeSeries ? tsData.map((d) => d.checkIns ?? 0) : [0, 0];
    const checkInRateSeries = hasTimeSeries ? tsData.map((d) => (d.rsvps > 0 ? ((d.checkIns ?? 0) / d.rsvps) * 100 : 0)) : [0, 0];
    const conversionSeries = hasTimeSeries ? tsData.map((d) => d.uniqueVisitors > 0 ? (d.rsvps / d.uniqueVisitors) * 100 : 0) : [0, 0];

    const tv = totals?.views ?? 0, uv = totals?.uniqueVisitors ?? 0, tr = totals?.rsvps ?? 0;
    const tc = totals?.checkIns ?? 0, cr = totals?.conversionRate ?? 0;
    const cir = tr > 0 ? (tc / tr) * 100 : 0;

    return [
      mk('views', 'Event Views', tv, tv.toLocaleString(), viewsSeries, calcDelta(viewsSeries)),
      mk('unique', 'Unique Visitors', uv, uv.toLocaleString(), uniqueSeries, calcDelta(uniqueSeries)),
      mk('rsvps', 'RSVPs', tr, tr.toLocaleString(), rsvpsSeries, calcDelta(rsvpsSeries)),
      mk('checkIns', 'Check-Ins', tc, tc.toLocaleString(), checkInsSeries, calcDelta(checkInsSeries)),
      mk('checkInRate', 'Check-in Rate', cir, `${cir.toFixed(1)}%`, checkInRateSeries, calcDelta(checkInRateSeries)),
      mk('conversion', 'Conversion Rate', cr, `${cr.toFixed(1)}%`, conversionSeries, calcDelta(conversionSeries)),
    ];
  }, [timeSeriesQuery.data, selectedRange]);

  const detailMetric = detailMetricId ? metrics.find((m) => m.id === detailMetricId) ?? null : null;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const doRefresh = async () => { setRefreshing(true); await queryClient.invalidateQueries({ queryKey: [EVENT_TIMESERIES_KEY, eventId] }); setRefreshing(false); };
  const handleRangeChange = (r: TimeRange) => setSelectedRange(r);

  if (timeSeriesQuery.isLoading && !refreshing) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={28} color="#000" /></TouchableOpacity>
          <View style={s.headerCenter}><Text style={s.headerTitle}>Analytics</Text></View>
          <View style={{ width: 32 }} />
        </View>
        <View style={s.loadingBox}><ActivityIndicator color="#8E8E93" size="large" /></View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={[s.stickyHeader, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={28} color="#000" /></TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Analytics</Text>
            <Text style={s.headerDate}>{dateStr}</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 56, paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor="#8E8E93" />}
      >
        <View style={s.rangeRow}>
          {EVENT_TIME_RANGES.map((r) => (
            <TouchableOpacity key={r} style={[s.rangeChip, r === selectedRange && s.rangeChipActive]} onPress={() => handleRangeChange(r)} activeOpacity={0.7}>
              <Text style={[s.rangeText, r === selectedRange && s.rangeTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {metrics.map((metric, i) => (
          <MetricRow key={metric.id} metric={metric} selectedRange={selectedRange} onPress={() => setDetailMetricId(metric.id)} isLast={i === metrics.length - 1} />
        ))}
      </ScrollView>

      <NativeSheet isPresented={detailMetric === null} onDismiss={() => setInsightsDetent({ fraction: 0.185 })} detents={[{ fraction: 0.185 }, { fraction: 0.45 }, { fraction: 0.96 }]} selectedDetent={insightsDetent} onDetentChange={setInsightsDetent} backgroundInteraction="enabled" preventDismiss rnContent>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}><Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1A1A' }}>Insights</Text></View>
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Ionicons name="trending-up" size={14} color="rgba(0,0,0,0.4)" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.4)', letterSpacing: 0.5, textTransform: 'uppercase' }}>Highlights</Text>
            </View>
            <Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.5)', lineHeight: 20 }}>No insights available yet. Insights will appear here once there is enough analytics data.</Text>
          </View>
        </ScrollView>
      </NativeSheet>

      {detailMetric !== null && (
        <View style={[s.fixedTicker, { paddingTop: insets.top - 6 }]}>
          <TickerBar metrics={metrics} visible={detailMetric !== null} />
        </View>
      )}

      <MetricDetailModal
        visible={detailMetric !== null} metric={detailMetric} allMetrics={metrics} selectedRange={selectedRange}
        onClose={() => { setDetailMetricId(null); setDetailExpanded(false); }}
        onExpandedChange={setDetailExpanded} onRangeChange={handleRangeChange} tickerContent={null}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  fixedTicker: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#000000', zIndex: 1000 },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  headerDate: { fontSize: 13, color: '#8E8E93', marginTop: 2, fontWeight: 'bold' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 12 },
  rangeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  rangeChipActive: { backgroundColor: 'rgba(0,0,0,0.08)' },
  rangeText: { fontSize: 15, fontWeight: '600', color: 'rgba(0,0,0,0.4)' },
  rangeTextActive: { color: '#1A1A1A' },
  row: { flexDirection: 'row', alignItems: 'center', height: 64, paddingHorizontal: 16 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.1)' },
  rowLeft: { flex: 1 }, rowName: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  sparkBox: { width: 80, height: 28, marginHorizontal: 16 },
  rowRight: { alignItems: 'flex-end' }, rowValue: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
  pill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  pillUp: { backgroundColor: 'rgba(0,0,0,0.06)' }, pillDown: { backgroundColor: 'rgba(0,0,0,0.06)' },
  pillText: { fontSize: 13, fontWeight: '600' },
});
