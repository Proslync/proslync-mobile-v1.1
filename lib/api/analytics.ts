import { apiClient } from './client';

export interface MarketingStats {
  eventLinkViews: number;
  uniqueVisitors: number;
  totalRSVPs: number;
  totalCheckIns: number;
  conversionRate: number;
}

export interface TimeSeriesPoint {
  date: string;
  views: number;
  uniqueVisitors: number;
  rsvps: number;
  checkIns: number;
  newEvents: number;
}

export interface TimeSeriesTotals {
  views: number;
  uniqueVisitors: number;
  rsvps: number;
  checkIns: number;
  conversionRate: number;
  newEvents?: number;
}

export interface TimeSeriesResponse {
  data: TimeSeriesPoint[];
  totals?: TimeSeriesTotals;
  range: string;
  eventId?: number;
}


export interface RevenueTimeSeriesPoint {
  date: string;
  grossRevenue: number;   // cents
  netRevenue: number;     // cents
  platformFees: number;   // cents
  transactionCount: number;
}

export interface RevenueTimeSeriesTotals {
  grossRevenue: number;
  netRevenue: number;
  platformFees: number;
  transactionCount: number;
  avgPerTransaction: number;
  avgPerEvent?: number;     // dashboard only
  eventCount?: number;      // dashboard only
}

export interface RevenueTimeSeriesResponse {
  data: RevenueTimeSeriesPoint[];
  totals: RevenueTimeSeriesTotals;
  range: string;
  eventId?: number;
}

export const analyticsApi = {
  /**
   * Track event page view
   * Fire-and-forget — silently ignores errors
   */
  trackEventView: async (
    eventId: number,
    source: 'mobile' | 'web' | 'share_link' = 'mobile',
  ): Promise<void> => {
    await apiClient.post<{ success: boolean }>(
      `/api/analytics/events/${eventId}/track-view`,
      { source },
    );
  },

  /**
   * Get marketing statistics for event owner
   */
  getMarketingStats: async (eventId: number): Promise<MarketingStats> => {
    return apiClient.get<MarketingStats>(
      `/api/analytics/events/${eventId}/marketing/stats`,
    );
  },

  /**
   * Get time series analytics for a specific event
   */
  getEventTimeSeries: async (
    eventId: number,
    range: string = '1M',
  ): Promise<TimeSeriesResponse> => {
    return apiClient.get<TimeSeriesResponse>(
      `/api/analytics/events/${eventId}/timeseries?range=${range}`,
    );
  },

  /**
   * Get aggregated time series for dashboard (all user events)
   */
  getDashboardTimeSeries: async (
    range: string = '1M',
  ): Promise<TimeSeriesResponse> => {
    return apiClient.get<TimeSeriesResponse>(
      `/api/analytics/dashboard/timeseries?range=${range}`,
    );
  },

  /**
   * Get revenue time series for dashboard (all user events)
   */
  getRevenueTimeSeries: async (
    range: string = '1M',
  ): Promise<RevenueTimeSeriesResponse> => {
    return apiClient.get<RevenueTimeSeriesResponse>(
      `/api/analytics/revenue/timeseries?range=${range}`,
    );
  },

  /**
   * Get revenue time series for a specific event
   */
  getEventRevenueTimeSeries: async (
    eventId: number,
    range: string = '1M',
  ): Promise<RevenueTimeSeriesResponse> => {
    return apiClient.get<RevenueTimeSeriesResponse>(
      `/api/analytics/events/${eventId}/revenue/timeseries?range=${range}`,
    );
  },

  /**
   * Get aggregated time series for a venue (all events at the venue)
   */
  getVenueTimeSeries: async (
    venueId: number,
    range: string = '1M',
  ): Promise<TimeSeriesResponse> => {
    return apiClient.get<TimeSeriesResponse>(
      `/api/analytics/venues/${venueId}/timeseries?range=${range}`,
    );
  },
};
