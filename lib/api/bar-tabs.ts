// Bar Tabs API — bar tab ordering and payments
import { apiClient } from './client';
import type {
  OpenTabRequest,
  OpenTabResponse,
  AddItemsRequest,
  AddItemsResponse,
  CloseTabRequest,
  CloseTabResponse,
  VoidItemResponse,
  ActiveTabsResponse,
  BarTab,
  BarTabSummary,
  MarkTabPaidResponse,
} from '../types/bar-tab.types';

export const barTabsApi = {
  /**
   * Get all active bar tabs for an event (staff)
   * Backend endpoint: GET /api/events/:eventId/bar/tabs
   */
  getTabs: async (eventId: number): Promise<ActiveTabsResponse> => {
    return apiClient.get<ActiveTabsResponse>(`/api/events/${eventId}/bar/tabs`);
  },

  /**
   * Get a single bar tab by ID
   * Backend endpoint: GET /api/events/:eventId/bar/tabs/:tabId
   */
  getTab: async (eventId: number, tabId: number): Promise<BarTab> => {
    return apiClient.get<BarTab>(`/api/events/${eventId}/bar/tabs/${tabId}`);
  },

  /**
   * Open a new bar tab
   * Backend endpoint: POST /api/events/:eventId/bar/tabs
   */
  openTab: async (eventId: number, data: OpenTabRequest): Promise<OpenTabResponse> => {
    return apiClient.post<OpenTabResponse>(`/api/events/${eventId}/bar/tabs`, data);
  },

  /**
   * Add items to an existing tab
   * Backend endpoint: POST /api/events/:eventId/bar/tabs/:tabId/items
   */
  addItems: async (
    eventId: number,
    tabId: number,
    data: AddItemsRequest,
  ): Promise<AddItemsResponse> => {
    return apiClient.post<AddItemsResponse>(
      `/api/events/${eventId}/bar/tabs/${tabId}/items`,
      data,
    );
  },

  /**
   * Void an item on a tab
   * Backend endpoint: DELETE /api/events/:eventId/bar/tabs/:tabId/items/:itemId
   */
  voidItem: async (
    eventId: number,
    tabId: number,
    itemId: number,
  ): Promise<VoidItemResponse> => {
    return apiClient.delete<VoidItemResponse>(
      `/api/events/${eventId}/bar/tabs/${tabId}/items/${itemId}`,
    );
  },

  /**
   * Close a tab and create a payment intent for Terminal collection
   * Backend endpoint: POST /api/events/:eventId/bar/tabs/:tabId/close
   */
  closeTab: async (
    eventId: number,
    tabId: number,
    data: CloseTabRequest,
  ): Promise<CloseTabResponse> => {
    return apiClient.post<CloseTabResponse>(
      `/api/events/${eventId}/bar/tabs/${tabId}/close`,
      data,
    );
  },

  /**
   * Mark a tab as paid after Terminal payment confirmation
   * Backend endpoint: POST /api/events/:eventId/bar/tabs/:tabId/pay
   */
  markPaid: async (eventId: number, tabId: number): Promise<MarkTabPaidResponse> => {
    return apiClient.post<MarkTabPaidResponse>(
      `/api/events/${eventId}/bar/tabs/${tabId}/pay`,
      {},
    );
  },

  /**
   * Get bar summary stats for an event
   * Backend endpoint: GET /api/events/:eventId/bar/summary
   */
  getSummary: async (eventId: number): Promise<BarTabSummary> => {
    return apiClient.get<BarTabSummary>(`/api/events/${eventId}/bar/summary`);
  },

  /**
   * Get the current user's open bar tab at an event (customer)
   * Backend endpoint: GET /api/events/:eventId/bar/my-tab
   */
  getMyTab: async (eventId: number): Promise<BarTab | null> => {
    return apiClient.get<BarTab | null>(`/api/events/${eventId}/bar/my-tab`);
  },
};
