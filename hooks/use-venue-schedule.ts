import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  venueScheduleApi,
  type VenueStaffMember,
  type VenueShift,
} from "@/lib/api/venue-schedule";

// Query keys
export const VENUE_STAFF_KEY = "venue-staff";
export const VENUE_SHIFTS_KEY = "venue-shifts";

// --- Staff Hooks ---

export function useVenueStaff(venueId: number) {
  return useQuery({
    queryKey: [VENUE_STAFF_KEY, venueId],
    queryFn: () => venueScheduleApi.getStaff(venueId),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!venueId,
  });
}

export function useAddVenueStaff(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: number; role: string; notes?: string }) =>
      venueScheduleApi.addStaff(venueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_STAFF_KEY, venueId] });
    },
  });
}

export function useUpdateVenueStaff(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      staffId: number;
      data: { role?: string; notes?: string };
    }) => venueScheduleApi.updateStaff(venueId, params.staffId, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_STAFF_KEY, venueId] });
    },
  });
}

export function useRemoveVenueStaff(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (staffId: number) =>
      venueScheduleApi.removeStaff(venueId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_STAFF_KEY, venueId] });
    },
  });
}

// --- Shift Hooks ---

export function useVenueShifts(
  venueId: number,
  params?: { startDate?: string; endDate?: string },
) {
  return useQuery({
    queryKey: [VENUE_SHIFTS_KEY, venueId, params?.startDate, params?.endDate],
    queryFn: () => venueScheduleApi.getShifts(venueId, params),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!venueId,
  });
}

export function useCreateVenueShift(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      label: string;
      date: string;
      startTime: string;
      endTime: string;
      notes?: string;
    }) => venueScheduleApi.createShift(venueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_SHIFTS_KEY, venueId] });
    },
  });
}

export function useUpdateVenueShift(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      shiftId: number;
      data: {
        label?: string;
        date?: string;
        startTime?: string;
        endTime?: string;
        notes?: string;
      };
    }) => venueScheduleApi.updateShift(venueId, params.shiftId, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_SHIFTS_KEY, venueId] });
    },
  });
}

export function useDeleteVenueShift(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shiftId: number) =>
      venueScheduleApi.deleteShift(venueId, shiftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_SHIFTS_KEY, venueId] });
    },
  });
}

export function useAssignShiftStaff(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { shiftId: number; venueUserIds: number[] }) =>
      venueScheduleApi.assignStaff(
        venueId,
        params.shiftId,
        params.venueUserIds,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VENUE_SHIFTS_KEY, venueId] });
    },
  });
}
