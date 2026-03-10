import { useQuery } from '@tanstack/react-query';
import { getMembershipCard, MembershipCardResponse } from '@/lib/api/wallet';

export const MEMBERSHIP_CARD_KEY = 'membership-card';

export function useMembershipCard(enabled: boolean) {
  return useQuery<MembershipCardResponse>({
    queryKey: [MEMBERSHIP_CARD_KEY],
    queryFn: getMembershipCard,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
