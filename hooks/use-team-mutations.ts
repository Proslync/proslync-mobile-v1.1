import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '@/lib/api/team';
import {
  TEAM_MEMBERS_KEY,
  TEAM_ROLES_KEY,
  TEAM_INVITATIONS_KEY,
  TEAM_STATS_KEY,
} from './use-team-queries';
import type {
  CreateRoleRequest,
  UpdateRoleRequest,
  UpdateRolePermissionsRequest,
  UpdateMemberRoleRequest,
  InviteByUserIdRequest,
} from '@/lib/types/team.types';


export function useUpdateMemberRole(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: number; data: UpdateMemberRoleRequest }) =>
      teamApi.updateMemberRole(eventId, memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAM_MEMBERS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [TEAM_STATS_KEY, eventId] });
    },
  });
}

export function useRemoveTeamMember(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: number) => teamApi.removeMember(eventId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAM_MEMBERS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [TEAM_STATS_KEY, eventId] });
    },
  });
}


export function useCreateRole(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleRequest) => teamApi.createRole(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAM_ROLES_KEY, eventId] });
    },
  });
}

export function useUpdateRole(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: number; data: UpdateRoleRequest }) =>
      teamApi.updateRole(eventId, roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAM_ROLES_KEY, eventId] });
    },
  });
}

export function useDeleteRole(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: number) => teamApi.deleteRole(eventId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAM_ROLES_KEY, eventId] });
    },
  });
}

export function useUpdateRolePermissions(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: number; data: UpdateRolePermissionsRequest }) =>
      teamApi.updateRolePermissions(eventId, roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAM_ROLES_KEY, eventId] });
    },
  });
}


export function useInviteByUserId(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InviteByUserIdRequest) =>
      teamApi.inviteByUserId(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAM_INVITATIONS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [TEAM_STATS_KEY, eventId] });
    },
  });
}

export function useCancelInvitation(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: number) =>
      teamApi.cancelInvitation(eventId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEAM_INVITATIONS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [TEAM_STATS_KEY, eventId] });
    },
  });
}
