// Dashboard Analytics — Aggregated analytics across all user events
import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import {
  AnalyticsScreenShell,
  calcDelta,
  getRangeLabel,
  EMPTY_SERIES,
  type AnalyticsMetric,
  type TimeRange,
} from '@/components/analytics/analytics-chart';

const DASHBOARD_TIMESERIES_KEY = 'dashboard-timeseries';

export default function DashboardAnalyticsScreen() {
  const queryClient = useQueryClient();

  const [selectedRange, setSelectedRange] = React.useState<TimeRange>('1M');

  const timeSeriesQuery = useQuery({
    queryKey: [DASHBOARD_TIMESERIES_KEY, selectedRange],
    queryFn: () => analyticsApi.getDashboardTimeSeries(selectedRange),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Build all 8 metrics from range-filtered totals + time series
  const metrics = React.useMemo((): AnalyticsMetric[] => {
    const totals = timeSeriesQuery.data?.totals;
    const totalViews = totals?.views ?? 0;
    const totalUniqueVisitors = totals?.uniqueVisitors ?? 0;
    const totalRSVPs = totals?.rsvps ?? 0;
    const totalCheckIns = totals?.checkIns ?? 0;
    const totalNewEvents = totals?.newEvents ?? 0;
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
    const eventsSeries = hasTimeSeries
      ? (() => {
          let cumulative = 0;
          return tsData.map((d) => {
            cumulative += d.newEvents;
            return cumulative;
          });
        })()
      : [0, 0];
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
    const uniqueDelta = calcDelta(uniqueSeries);
    const rsvpsDelta = calcDelta(rsvpsSeries);
    const checkInRateSeries = hasTimeSeries
      ? tsData.map((d) => (d.rsvps > 0 ? ((d.checkIns ?? 0) / d.rsvps) * 100 : 0))
      : [0, 0];
    const checkInRate = totalRSVPs > 0 ? (totalCheckIns / totalRSVPs) * 100 : 0;

    const checkInsDelta = calcDelta(checkInsSeries);
    const checkInRateDelta = calcDelta(checkInRateSeries);
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
        id: 'unique',
        label: 'Unique Visitors',
        primaryValue: totalUniqueVisitors.toLocaleString(),
        deltaText: hasTimeSeries ? `${uniqueDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: uniqueDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: uniqueSeries },
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
        id: 'checkIns',
        label: 'Check-Ins',
        primaryValue: totalCheckIns.toLocaleString(),
        deltaText: hasTimeSeries ? `${checkInsDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: checkInsDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: checkInsSeries },
      },
      {
        id: 'checkInRate',
        label: 'Check-in Rate',
        primaryValue: `${checkInRate.toFixed(1)}%`,
        deltaText: hasTimeSeries ? `${checkInRateDelta.text} ${rangeLabel}` : '—',
        isPositive: checkInRateDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: checkInRateSeries },
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
        primaryValue: totalNewEvents.toLocaleString(),
        deltaText: hasTimeSeries ? `${eventsDelta.text} ${rangeLabel}` : totalNewEvents > 0 ? `${totalNewEvents} total` : 'No events yet',
        isPositive: eventsDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: eventsSeries },
      },
      {
        id: 'perEvent',
        label: 'RSVPs / Event',
        primaryValue: totalNewEvents > 0 ? Math.round(totalRSVPs / totalNewEvents).toLocaleString() : '0',
        deltaText: hasTimeSeries ? `${perEventDelta.text} ${rangeLabel}` : totalNewEvents > 0 ? `Avg across ${totalNewEvents} events` : '—',
        isPositive: perEventDelta.isPositive,
        seriesByRange: { ...EMPTY_SERIES, [selectedRange]: perEventSeries },
      },
    ];
  }, [timeSeriesQuery.data, selectedRange]);

  const handleRefresh = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: [DASHBOARD_TIMESERIES_KEY] });
  }, [queryClient]);

  return (
    <AnalyticsScreenShell
      metrics={metrics}
      isLoading={timeSeriesQuery.isLoading}
      onRefresh={handleRefresh}
      onRangeChange={setSelectedRange}
      emptyMessage="No analytics yet"
    />
  );
}
