// Menu API — venue menu categories and items
import { apiClient } from './client';
import type { VenueMenuCategory, VenueMenuItem } from '../types/menu.types';

export const menuApi = {
  /**
   * Get full venue menu (categories with nested items)
   * Backend endpoint: GET /api/pos/venues/:venueId/menu
   */
  getMenu: async (venueId: number): Promise<VenueMenuCategory[]> => {
    return apiClient.get<VenueMenuCategory[]>(`/api/pos/venues/${venueId}/menu`);
  },

  /**
   * Create a new menu category
   * Backend endpoint: POST /api/pos/venues/:venueId/menu/categories
   */
  createCategory: async (
    venueId: number,
    data: { name: string; description?: string },
  ): Promise<VenueMenuCategory> => {
    return apiClient.post<VenueMenuCategory>(
      `/api/pos/venues/${venueId}/menu/categories`,
      data,
    );
  },

  /**
   * Update a menu category
   * Backend endpoint: PUT /api/pos/venues/:venueId/menu/categories/:categoryId
   */
  updateCategory: async (
    venueId: number,
    categoryId: number,
    data: Partial<{
      name: string;
      description: string;
      displayOrder: number;
      isActive: boolean;
    }>,
  ): Promise<VenueMenuCategory> => {
    return apiClient.put<VenueMenuCategory>(
      `/api/pos/venues/${venueId}/menu/categories/${categoryId}`,
      data,
    );
  },

  /**
   * Delete a menu category
   * Backend endpoint: DELETE /api/pos/venues/:venueId/menu/categories/:categoryId
   */
  deleteCategory: async (
    venueId: number,
    categoryId: number,
  ): Promise<void> => {
    return apiClient.delete<void>(
      `/api/pos/venues/${venueId}/menu/categories/${categoryId}`,
    );
  },

  /**
   * Create a new menu item
   * Backend endpoint: POST /api/pos/venues/:venueId/menu/items
   */
  createItem: async (
    venueId: number,
    data: {
      categoryId: number;
      name: string;
      description?: string;
      price: number;
      tags?: string[];
    },
  ): Promise<VenueMenuItem> => {
    return apiClient.post<VenueMenuItem>(
      `/api/pos/venues/${venueId}/menu/items`,
      data,
    );
  },

  /**
   * Update a menu item
   * Backend endpoint: PUT /api/pos/venues/:venueId/menu/items/:itemId
   */
  updateItem: async (
    venueId: number,
    itemId: number,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      displayOrder: number;
      isActive: boolean;
      tags: string[];
      categoryId: number;
    }>,
  ): Promise<VenueMenuItem> => {
    return apiClient.put<VenueMenuItem>(
      `/api/pos/venues/${venueId}/menu/items/${itemId}`,
      data,
    );
  },

  /**
   * Delete a menu item
   * Backend endpoint: DELETE /api/pos/venues/:venueId/menu/items/:itemId
   */
  deleteItem: async (venueId: number, itemId: number): Promise<void> => {
    return apiClient.delete<void>(
      `/api/pos/venues/${venueId}/menu/items/${itemId}`,
    );
  },
};
