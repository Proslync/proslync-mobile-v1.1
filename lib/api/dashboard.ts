// Dashboard API client for fetching dashboard statistics
import { apiClient } from './client';
import type { Event, EventsSearchResponse } from '../types/events.types';

export interface MarketingStats {
  eventLinkViews: number;
  uniqueVisitors: number;
  totalRSVPs: number;
  conversionRate: number;
}

export interface DashboardStats {
  totalEvents: number;
  totalRSVPs: number;
  totalViews: number;
  engagementRate: number;
  events: Event[];
}

export const dashboardApi = {
  /**
   * Get events created by the current user
   */
  getMyEvents: async (): Promise<Event[]> => {
    const response = await apiClient.get<EventsSearchResponse>('/api/events?myEvents=true');
    return response.events;
  },

  /**
   * Get marketing stats for a specific event
   */
  getEventMarketingStats: async (eventId: number): Promise<MarketingStats> => {
    return apiClient.get<MarketingStats>(`/api/analytics/events/${eventId}/marketing/stats`);
  },

  /**
   * Get aggregated dashboard stats for all user's events
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    // First fetch all user's events
    const events = await dashboardApi.getMyEvents();

    if (events.length === 0) {
      return {
        totalEvents: 0,
        totalRSVPs: 0,
        totalViews: 0,
        engagementRate: 0,
        events: [],
      };
    }

    // Fetch marketing stats for each event in parallel
    const statsPromises = events.map(async (event) => {
      try {
        const stats = await dashboardApi.getEventMarketingStats(event.id);
        return stats;
      } catch {
        // If we can't get stats for an event (e.g., permission issue), return zeros
        return {
          eventLinkViews: 0,
          uniqueVisitors: 0,
          totalRSVPs: event.attendeeCount || 0,
          conversionRate: 0,
        };
      }
    });

    const allStats = await Promise.all(statsPromises);

    // Aggregate stats
    const totalViews = allStats.reduce((sum, stats) => sum + stats.eventLinkViews, 0);
    const totalRSVPs = allStats.reduce((sum, stats) => sum + stats.totalRSVPs, 0);
    const totalUniqueVisitors = allStats.reduce((sum, stats) => sum + stats.uniqueVisitors, 0);

    // Calculate overall engagement rate (RSVPs / unique visitors)
    const engagementRate = totalUniqueVisitors > 0
      ? (totalRSVPs / totalUniqueVisitors) * 100
      : 0;

    return {
      totalEvents: events.length,
      totalRSVPs,
      totalViews,
      engagementRate: parseFloat(engagementRate.toFixed(1)),
      events,
    };
  },
};
