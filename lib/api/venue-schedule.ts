import { apiClient } from "./client";

// Types
export interface VenueStaffMember {
  id: number;
  venueId: number;
  userId: number;
  role: "user" | "host" | "bouncer" | "owner" | "admin";
  status: "active" | "inactive" | "pending";
  notes?: string;
  user: {
    id: number;
    userName?: string;
    firstName?: string;
    lastName?: string;
    avatar?: { url: string };
  };
  createdAt: string;
}

export interface VenueShiftAssignment {
  id: number;
  shiftId: number;
  venueUserId: number;
  roleOverride?: string;
  venueUser: VenueStaffMember;
}

export interface VenueShift {
  id: number;
  venueId: number;
  label: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  assignments: VenueShiftAssignment[];
  createdAt: string;
}

export const venueScheduleApi = {
  // Staff
  getStaff: (venueId: number) =>
    apiClient.get<VenueStaffMember[]>(`/api/venues/${venueId}/staff`),

  addStaff: (
    venueId: number,
    data: { userId: number; role: string; notes?: string },
  ) => apiClient.post<VenueStaffMember>(`/api/venues/${venueId}/staff`, data),

  updateStaff: (
    venueId: number,
    staffId: number,
    data: { role?: string; notes?: string },
  ) =>
    apiClient.put<VenueStaffMember>(
      `/api/venues/${venueId}/staff/${staffId}`,
      data,
    ),

  removeStaff: (venueId: number, staffId: number) =>
    apiClient.delete(`/api/venues/${venueId}/staff/${staffId}`),

  // Shifts
  getShifts: (
    venueId: number,
    params?: { startDate?: string; endDate?: string },
  ) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const qs = query.toString();
    return apiClient.get<VenueShift[]>(
      `/api/venues/${venueId}/shifts${qs ? `?${qs}` : ""}`,
    );
  },

  createShift: (
    venueId: number,
    data: {
      label: string;
      date: string;
      startTime: string;
      endTime: string;
      notes?: string;
    },
  ) => apiClient.post<VenueShift>(`/api/venues/${venueId}/shifts`, data),

  updateShift: (
    venueId: number,
    shiftId: number,
    data: {
      label?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      notes?: string;
    },
  ) =>
    apiClient.put<VenueShift>(`/api/venues/${venueId}/shifts/${shiftId}`, data),

  deleteShift: (venueId: number, shiftId: number) =>
    apiClient.delete(`/api/venues/${venueId}/shifts/${shiftId}`),

  assignStaff: (venueId: number, shiftId: number, venueUserIds: number[]) =>
    apiClient.put<VenueShift>(
      `/api/venues/${venueId}/shifts/${shiftId}/assign`,
      { venueUserIds },
    ),
};
