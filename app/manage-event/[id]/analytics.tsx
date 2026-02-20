// Event Analytics — Per-event analytics with real time series
import * as React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import {
  AnalyticsScreenShell,
  calcDelta,
  getRangeLabel,
  EMPTY_EVENT_SERIES,
  EVENT_TIME_RANGES,
  type AnalyticsMetric,
  type TimeRange,
} from '@/components/analytics/analytics-chart';

const EVENT_TIMESERIES_KEY = 'event-timeseries';

export default function EventAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = id ? parseInt(id, 10) : 0;
  const queryClient = useQueryClient();

  const [selectedRange, setSelectedRange] = React.useState<TimeRange>('1M');

  // Fetch time series + range-filtered totals for the selected range
  const timeSeriesQuery = useQuery({
    queryKey: [EVENT_TIMESERIES_KEY, eventId, selectedRange],
    queryFn: () => analyticsApi.getEventTimeSeries(eventId, selectedRange),
    enabled: eventId > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Build 5 metrics: Views, Unique Visitors, RSVPs, Check-Ins, Conversion Rate
  // Primary values come from range-filtered totals (not all-time stats)
  const metrics = React.useMemo((): AnalyticsMetric[] => {
    const totals = timeSeriesQuery.data?.totals;
    const totalViews = totals?.views ?? 0;
    const uniqueVisitors = totals?.uniqueVisitors ?? 0;
    const totalRSVPs = totals?.rsvps ?? 0;
    const totalCheckIns = totals?.checkIns ?? 0;
    const conversionRate = totals?.conversionRate ?? 0;

    const tsData = timeSeriesQuery.data?.data;
    const hasTimeSeries = tsData && tsData.length >= 2;

    const viewsSeries = hasTimeSeries ? tsData.map((d) => d.views) : [0, 0];
    const uniqueSeries = hasTimeSeries ? tsData.map((d) => d.uniqueVisitors) : [0, 0];
    const rsvpsSeries = hasTimeSeries ? tsData.map((d) => d.rsvps) : [0, 0];
    const checkInsSeries = hasTimeSeries ? tsData.map((d) => d.checkIns ?? 0) : [0, 0];
    const conversionSeries = hasTimeSeries
      ? tsData.map((d) =>
          d.uniqueVisitors > 0 ? (d.rsvps / d.uniqueVisitors) * 100 : 0,
        )
      : [0, 0];

    const viewsDelta = calcDelta(viewsSeries);
    const uniqueDelta = calcDelta(uniqueSeries);
    const rsvpsDelta = calcDelta(rsvpsSeries);
    const checkInsDelta = calcDelta(checkInsSeries);
    const conversionDelta = calcDelta(conversionSeries);

    const rangeLabel = getRangeLabel(selectedRange);

    return [
      {
        id: 'views',
        label: 'Event Views',
        primaryValue: totalViews.toLocaleString(),
        deltaText: hasTimeSeries ? `${viewsDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: viewsDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: viewsSeries },
      },
      {
        id: 'unique',
        label: 'Unique Visitors',
        primaryValue: uniqueVisitors.toLocaleString(),
        deltaText: hasTimeSeries ? `${uniqueDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: uniqueDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: uniqueSeries },
      },
      {
        id: 'rsvps',
        label: 'RSVPs',
        primaryValue: totalRSVPs.toLocaleString(),
        deltaText: hasTimeSeries ? `${rsvpsDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: rsvpsDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: rsvpsSeries },
      },
      {
        id: 'checkIns',
        label: 'Check-Ins',
        primaryValue: totalCheckIns.toLocaleString(),
        deltaText: hasTimeSeries ? `${checkInsDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: checkInsDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: checkInsSeries },
      },
      {
        id: 'conversion',
        label: 'Conversion Rate',
        primaryValue: `${conversionRate.toFixed(1)}%`,
        deltaText: hasTimeSeries ? `${conversionDelta.text} ${rangeLabel}` : '—',
        isPositive: conversionDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: conversionSeries },
      },
    ];
  }, [timeSeriesQuery.data, selectedRange]);

  const handleRefresh = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: [EVENT_TIMESERIES_KEY, eventId] });
  }, [queryClient, eventId]);

  return (
    <AnalyticsScreenShell
      metrics={metrics}
      isLoading={timeSeriesQuery.isLoading}
      onRefresh={handleRefresh}
      onRangeChange={setSelectedRange}
      ranges={EVENT_TIME_RANGES}
      emptyMessage="No views yet for this event"
    />
  );
}
