// React Query hooks for venue menu categories and items
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '@/lib/api/menu';
import type { VenueMenuCategory } from '@/lib/types/menu.types';

export const VENUE_MENU_KEY = 'venue-menu';

export function useVenueMenu(venueId?: number) {
  return useQuery<VenueMenuCategory[]>({
    queryKey: [VENUE_MENU_KEY, venueId],
    queryFn: () => menuApi.getMenu(venueId!),
    enabled: !!venueId,
    staleTime: 60_000,
  });
}

export function useCreateMenuCategory(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      menuApi.createCategory(venueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_MENU_KEY, venueId] });
    },
  });
}

export function useUpdateMenuCategory(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: number;
      data: Partial<{ name: string; description: string; displayOrder: number; isActive: boolean }>;
    }) => menuApi.updateCategory(venueId, categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_MENU_KEY, venueId] });
    },
  });
}

export function useDeleteMenuCategory(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: number) =>
      menuApi.deleteCategory(venueId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_MENU_KEY, venueId] });
    },
  });
}

export function useCreateMenuItem(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      categoryId: number;
      name: string;
      description?: string;
      price: number;
      tags?: string[];
    }) => menuApi.createItem(venueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_MENU_KEY, venueId] });
    },
  });
}

export function useUpdateMenuItem(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: number;
      data: Partial<{
        name: string;
        description: string;
        price: number;
        displayOrder: number;
        isActive: boolean;
        tags: string[];
        categoryId: number;
      }>;
    }) => menuApi.updateItem(venueId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_MENU_KEY, venueId] });
    },
  });
}

export function useDeleteMenuItem(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => menuApi.deleteItem(venueId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_MENU_KEY, venueId] });
    },
  });
}
