import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';

export const MY_TEAM_INVITATIONS_KEY = 'my-team-invitations';

export function useMyTeamInvitations() {
  return useQuery({
    queryKey: [MY_TEAM_INVITATIONS_KEY],
    queryFn: () => notificationsApi.getMyTeamInvitations(),
    staleTime: 30_000,
  });
}

export function useAcceptTeamInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: number) =>
      notificationsApi.acceptTeamInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MY_TEAM_INVITATIONS_KEY] });
    },
  });
}

export function useDeclineTeamInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: number) =>
      notificationsApi.declineTeamInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MY_TEAM_INVITATIONS_KEY] });
    },
  });
}
