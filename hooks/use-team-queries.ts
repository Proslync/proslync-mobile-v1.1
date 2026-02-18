import { useQuery } from '@tanstack/react-query';
import { teamApi } from '@/lib/api/team';
import type {
  RoleResponseDto,
  GetTeamMembersResponse,
  GetInvitationsResponse,
  TeamStatsResponse,
} from '@/lib/types/team.types';

export const TEAM_MEMBERS_KEY = 'team-members';
export const TEAM_ROLES_KEY = 'team-roles';
export const TEAM_INVITATIONS_KEY = 'team-invitations';
export const TEAM_STATS_KEY = 'team-stats';

export function useTeamMembers(eventId: number) {
  return useQuery<GetTeamMembersResponse>({
    queryKey: [TEAM_MEMBERS_KEY, eventId],
    queryFn: () => teamApi.getMembers(eventId),
    enabled: Boolean(eventId),
    staleTime: 60 * 1000,
  });
}

export function useTeamRoles(eventId: number) {
  return useQuery<RoleResponseDto[]>({
    queryKey: [TEAM_ROLES_KEY, eventId],
    queryFn: () => teamApi.getRoles(eventId),
    enabled: Boolean(eventId),
    staleTime: 60 * 1000,
  });
}

export function useTeamInvitations(eventId: number) {
  return useQuery<GetInvitationsResponse>({
    queryKey: [TEAM_INVITATIONS_KEY, eventId],
    queryFn: () => teamApi.getInvitations(eventId, 'pending'),
    enabled: Boolean(eventId),
    staleTime: 60 * 1000,
  });
}

export function useTeamStats(eventId: number) {
  return useQuery<TeamStatsResponse>({
    queryKey: [TEAM_STATS_KEY, eventId],
    queryFn: () => teamApi.getStats(eventId),
    enabled: Boolean(eventId),
    staleTime: 60 * 1000,
  });
}
