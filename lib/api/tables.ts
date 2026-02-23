// Tables API — venue table sections, venue tables, and event table configuration
import { apiClient } from './client';
import type {
  VenueTableSection,
  VenueTableItem,
  EventTableItem,
  ConfigureEventTableRequest,
} from '../types/tables.types';

export const tablesApi = {
  // ── Venue Table Sections ─────────────────────────────────

  /**
   * Get all table sections for a venue
   * Backend endpoint: GET /api/venues/:venueId/tables/sections
   */
  getSections: async (venueId: number): Promise<VenueTableSection[]> => {
    return apiClient.get<VenueTableSection[]>(`/api/venues/${venueId}/tables/sections`);
  },

  /**
   * Create a new table section for a venue
   * Backend endpoint: POST /api/venues/:venueId/tables/sections
   */
  createSection: async (
    venueId: number,
    data: { name: string; description?: string; displayOrder?: number }
  ): Promise<VenueTableSection> => {
    return apiClient.post<VenueTableSection>(`/api/venues/${venueId}/tables/sections`, data);
  },

  /**
   * Update an existing table section
   * Backend endpoint: PUT /api/venues/:venueId/tables/sections/:sectionId
   */
  updateSection: async (
    venueId: number,
    sectionId: number,
    data: Partial<{ name: string; description?: string; displayOrder: number; isActive: boolean }>
  ): Promise<VenueTableSection> => {
    return apiClient.put<VenueTableSection>(
      `/api/venues/${venueId}/tables/sections/${sectionId}`,
      data
    );
  },

  /**
   * Delete a table section
   * Backend endpoint: DELETE /api/venues/:venueId/tables/sections/:sectionId
   */
  deleteSection: async (venueId: number, sectionId: number): Promise<void> => {
    return apiClient.delete<void>(`/api/venues/${venueId}/tables/sections/${sectionId}`);
  },

  // ── Venue Tables ─────────────────────────────────────────

  /**
   * Create a new table within a venue section
   * Backend endpoint: POST /api/venues/:venueId/tables
   */
  createTable: async (
    venueId: number,
    data: {
      sectionId: number;
      label: string;
      seatCount: number;
      minimumSpend?: number;
      imageUrl?: string;
      displayOrder?: number;
    }
  ): Promise<VenueTableItem> => {
    return apiClient.post<VenueTableItem>(`/api/venues/${venueId}/tables`, data);
  },

  /**
   * Update an existing venue table
   * Backend endpoint: PUT /api/venues/:venueId/tables/:tableId
   */
  updateTable: async (
    venueId: number,
    tableId: number,
    data: Partial<{
      sectionId: number;
      label: string;
      seatCount: number;
      minimumSpend: number;
      displayOrder: number;
      isActive: boolean;
    }>
  ): Promise<VenueTableItem> => {
    return apiClient.put<VenueTableItem>(`/api/venues/${venueId}/tables/${tableId}`, data);
  },

  /**
   * Delete a venue table
   * Backend endpoint: DELETE /api/venues/:venueId/tables/:tableId
   */
  deleteTable: async (venueId: number, tableId: number): Promise<void> => {
    return apiClient.delete<void>(`/api/venues/${venueId}/tables/${tableId}`);
  },

  // ── Event Tables ─────────────────────────────────────────

  /**
   * Get all tables configured for an event
   * Backend endpoint: GET /api/events/:eventId/tables
   */
  getEventTables: async (eventId: number): Promise<EventTableItem[]> => {
    return apiClient.get<EventTableItem[]>(`/api/events/${eventId}/tables`);
  },

  /**
   * Configure (bulk upsert) tables for an event with pricing
   * Backend endpoint: POST /api/events/:eventId/tables/configure
   */
  configureEventTables: async (
    eventId: number,
    tables: ConfigureEventTableRequest[]
  ): Promise<EventTableItem[]> => {
    return apiClient.post<EventTableItem[]>(`/api/events/${eventId}/tables/configure`, { tables });
  },

  /**
   * Purchase a specific table at an event
   * Backend endpoint: POST /api/events/:eventId/tables/:eventTableId/purchase
   */
  purchaseTable: async (
    eventId: number,
    eventTableId: number
  ): Promise<{
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
  }> => {
    return apiClient.post<{
      clientSecret: string;
      paymentIntentId: string;
      amount: number;
      currency: string;
    }>(`/api/events/${eventId}/tables/${eventTableId}/purchase`);
  },
};
