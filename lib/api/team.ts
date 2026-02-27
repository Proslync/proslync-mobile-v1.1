import { apiClient } from './client';
import type {
  RoleResponseDto,
  CreateRoleRequest,
  UpdateRoleRequest,
  UpdateRolePermissionsRequest,
  GetTeamMembersResponse,
  UpdateMemberRoleRequest,
  TeamMemberResponseDto,
  InviteByUserIdRequest,
  InvitationResponseDto,
  GetInvitationsResponse,
  TeamStatsResponse,
} from '../types/team.types';

export const teamApi = {

  getRoles: async (eventId: number): Promise<RoleResponseDto[]> => {
    return apiClient.get<RoleResponseDto[]>(
      `/api/events/${eventId}/team/roles`,
    );
  },

  createRole: async (
    eventId: number,
    data: CreateRoleRequest,
  ): Promise<RoleResponseDto> => {
    return apiClient.post<RoleResponseDto>(
      `/api/events/${eventId}/team/roles`,
      data,
    );
  },

  updateRole: async (
    eventId: number,
    roleId: number,
    data: UpdateRoleRequest,
  ): Promise<RoleResponseDto> => {
    return apiClient.put<RoleResponseDto>(
      `/api/events/${eventId}/team/roles/${roleId}`,
      data,
    );
  },

  deleteRole: async (eventId: number, roleId: number): Promise<void> => {
    return apiClient.delete(`/api/events/${eventId}/team/roles/${roleId}`);
  },

  updateRolePermissions: async (
    eventId: number,
    roleId: number,
    data: UpdateRolePermissionsRequest,
  ): Promise<RoleResponseDto> => {
    return apiClient.put<RoleResponseDto>(
      `/api/events/${eventId}/team/roles/${roleId}/permissions`,
      data,
    );
  },


  getMembers: async (
    eventId: number,
    page = 1,
    limit = 50,
  ): Promise<GetTeamMembersResponse> => {
    return apiClient.get<GetTeamMembersResponse>(
      `/api/events/${eventId}/team/members?page=${page}&limit=${limit}`,
    );
  },

  updateMemberRole: async (
    eventId: number,
    memberId: number,
    data: UpdateMemberRoleRequest,
  ): Promise<TeamMemberResponseDto> => {
    return apiClient.put<TeamMemberResponseDto>(
      `/api/events/${eventId}/team/members/${memberId}/role`,
      data,
    );
  },

  removeMember: async (eventId: number, memberId: number): Promise<void> => {
    return apiClient.delete(
      `/api/events/${eventId}/team/members/${memberId}`,
    );
  },


  inviteByUserId: async (
    eventId: number,
    data: InviteByUserIdRequest,
  ): Promise<InvitationResponseDto> => {
    return apiClient.post<InvitationResponseDto>(
      `/api/events/${eventId}/team/invite-user`,
      data,
    );
  },

  getInvitations: async (
    eventId: number,
    status?: 'pending' | 'accepted' | 'cancelled' | 'expired',
    page = 1,
    limit = 50,
  ): Promise<GetInvitationsResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', String(page));
    params.append('limit', String(limit));
    return apiClient.get<GetInvitationsResponse>(
      `/api/events/${eventId}/team/invitations?${params.toString()}`,
    );
  },

  cancelInvitation: async (
    eventId: number,
    invitationId: number,
  ): Promise<void> => {
    return apiClient.delete(
      `/api/events/${eventId}/team/invitations/${invitationId}`,
    );
  },


  getStats: async (eventId: number): Promise<TeamStatsResponse> => {
    return apiClient.get<TeamStatsResponse>(
      `/api/events/${eventId}/team/stats`,
    );
  },
};
