// React Query hooks for venue table sections and event tables
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesApi } from '@/lib/api/tables';
import type { VenueTableSection, EventTableItem, ConfigureEventTableRequest } from '@/lib/types/tables.types';

export const VENUE_SECTIONS_KEY = 'venue-table-sections';
export const EVENT_TABLES_KEY = 'event-tables';


export function useVenueSections(venueId?: number) {
  return useQuery<VenueTableSection[]>({
    queryKey: [VENUE_SECTIONS_KEY, venueId],
    queryFn: () => tablesApi.getSections(venueId!),
    enabled: !!venueId,
    staleTime: 60_000,
  });
}

export function useCreateSection(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; displayOrder?: number }) =>
      tablesApi.createSection(venueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_SECTIONS_KEY, venueId] });
    },
  });
}

export function useUpdateSection(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sectionId,
      data,
    }: {
      sectionId: number;
      data: Partial<{ name: string; description?: string; displayOrder: number; isActive: boolean }>;
    }) => tablesApi.updateSection(venueId, sectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_SECTIONS_KEY, venueId] });
    },
  });
}

export function useDeleteSection(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sectionId: number) => tablesApi.deleteSection(venueId, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_SECTIONS_KEY, venueId] });
    },
  });
}


export function useCreateTable(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      sectionId: number;
      label: string;
      seatCount: number;
      minimumSpend?: number;
      imageUrl?: string;
      displayOrder?: number;
    }) => tablesApi.createTable(venueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_SECTIONS_KEY, venueId] });
    },
  });
}

export function useUpdateTable(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tableId,
      data,
    }: {
      tableId: number;
      data: Partial<{
        sectionId: number;
        label: string;
        seatCount: number;
        minimumSpend: number;
        displayOrder: number;
        isActive: boolean;
      }>;
    }) => tablesApi.updateTable(venueId, tableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_SECTIONS_KEY, venueId] });
    },
  });
}

export function useDeleteTable(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tableId: number) => tablesApi.deleteTable(venueId, tableId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_SECTIONS_KEY, venueId] });
    },
  });
}


export function useEventTables(eventId?: number) {
  return useQuery<EventTableItem[]>({
    queryKey: [EVENT_TABLES_KEY, eventId],
    queryFn: () => tablesApi.getEventTables(eventId!),
    enabled: !!eventId,
    staleTime: 30_000,
  });
}
