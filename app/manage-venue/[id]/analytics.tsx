// Venue Analytics — Aggregated analytics across all events at a venue
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

const VENUE_TIMESERIES_KEY = 'venue-timeseries';

export default function VenueAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const venueId = id ? parseInt(id, 10) : 0;
  const queryClient = useQueryClient();

  const [selectedRange, setSelectedRange] = React.useState<TimeRange>('1M');

  const timeSeriesQuery = useQuery({
    queryKey: [VENUE_TIMESERIES_KEY, venueId, selectedRange],
    queryFn: () => analyticsApi.getVenueTimeSeries(venueId, selectedRange),
    enabled: venueId > 0,
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
  });

  const metrics = React.useMemo((): AnalyticsMetric[] => {
    const totals = timeSeriesQuery.data?.totals;
    const totalViews = totals?.views ?? 0;
    const uniqueVisitors = totals?.uniqueVisitors ?? 0;
    const totalRSVPs = totals?.rsvps ?? 0;
    const totalCheckIns = totals?.checkIns ?? 0;
    const conversionRate = totals?.conversionRate ?? 0;
    const newEvents = totals?.newEvents ?? 0;

    const tsData = timeSeriesQuery.data?.data;
    const hasTimeSeries = tsData && tsData.length >= 2;

    const dateDates = hasTimeSeries ? tsData.map((d) => d.date) : [];
    const viewsSeries = hasTimeSeries ? tsData.map((d) => d.views) : [0, 0];
    const uniqueSeries = hasTimeSeries ? tsData.map((d) => d.uniqueVisitors) : [0, 0];
    const rsvpsSeries = hasTimeSeries ? tsData.map((d) => d.rsvps) : [0, 0];
    const checkInsSeries = hasTimeSeries ? tsData.map((d) => d.checkIns ?? 0) : [0, 0];
    const conversionSeries = hasTimeSeries
      ? tsData.map((d) =>
          d.uniqueVisitors > 0 ? (d.rsvps / d.uniqueVisitors) * 100 : 0,
        )
      : [0, 0];
    const eventsSeries = hasTimeSeries ? tsData.map((d) => d.newEvents) : [0, 0];

    const viewsDelta = calcDelta(viewsSeries);
    const uniqueDelta = calcDelta(uniqueSeries);
    const rsvpsDelta = calcDelta(rsvpsSeries);
    const checkInsDelta = calcDelta(checkInsSeries);
    const conversionDelta = calcDelta(conversionSeries);
    const eventsDelta = calcDelta(eventsSeries);

    const rangeLabel = getRangeLabel(selectedRange);
    const dates = { [selectedRange]: dateDates };

    return [
      {
        id: 'views',
        label: 'Event Views',
        primaryValue: totalViews.toLocaleString(),
        deltaText: hasTimeSeries ? `${viewsDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: viewsDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: viewsSeries },
        datesByRange: dates,
      },
      {
        id: 'unique',
        label: 'Unique Visitors',
        primaryValue: uniqueVisitors.toLocaleString(),
        deltaText: hasTimeSeries ? `${uniqueDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: uniqueDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: uniqueSeries },
        datesByRange: dates,
      },
      {
        id: 'rsvps',
        label: 'RSVPs',
        primaryValue: totalRSVPs.toLocaleString(),
        deltaText: hasTimeSeries ? `${rsvpsDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: rsvpsDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: rsvpsSeries },
        datesByRange: dates,
      },
      {
        id: 'checkIns',
        label: 'Check-Ins',
        primaryValue: totalCheckIns.toLocaleString(),
        deltaText: hasTimeSeries ? `${checkInsDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: checkInsDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: checkInsSeries },
        datesByRange: dates,
      },
      {
        id: 'conversion',
        label: 'Conversion Rate',
        primaryValue: `${conversionRate.toFixed(1)}%`,
        deltaText: hasTimeSeries ? `${conversionDelta.text} ${rangeLabel}` : '—',
        isPositive: conversionDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: conversionSeries },
        datesByRange: dates,
      },
      {
        id: 'newEvents',
        label: 'New Events',
        primaryValue: newEvents.toLocaleString(),
        deltaText: hasTimeSeries ? `${eventsDelta.text} ${rangeLabel}` : 'No data yet',
        isPositive: eventsDelta.isPositive,
        seriesByRange: { ...EMPTY_EVENT_SERIES, [selectedRange]: eventsSeries },
        datesByRange: dates,
      },
    ];
  }, [timeSeriesQuery.data, selectedRange]);

  const handleRefresh = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: [VENUE_TIMESERIES_KEY, venueId] });
  }, [queryClient, venueId]);

  return (
    <AnalyticsScreenShell
      metrics={metrics}
      isLoading={timeSeriesQuery.isLoading}
      onRefresh={handleRefresh}
      onRangeChange={setSelectedRange}
      ranges={EVENT_TIME_RANGES}
      emptyMessage="No analytics yet for this venue"
    />
  );
}
