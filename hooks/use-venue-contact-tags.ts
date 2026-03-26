import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { venueContactTagsApi } from '@/lib/api/venue-contact-tags';

export const VENUE_CONTACT_TAGS_KEY = 'venue-contact-tags';

export function useVenueContactTags(venueId: number | undefined) {
  return useQuery({
    queryKey: [VENUE_CONTACT_TAGS_KEY, venueId],
    queryFn: () => venueContactTagsApi.getAllForVenue(venueId!),
    enabled: !!venueId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUserVenueTags(
  venueId: number | undefined,
  userId: number | undefined,
) {
  return useQuery({
    queryKey: [VENUE_CONTACT_TAGS_KEY, venueId, userId],
    queryFn: () => venueContactTagsApi.getTagsForUser(venueId!, userId!),
    enabled: !!venueId && !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateVenueTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      venueId,
      userId,
      tags,
    }: {
      venueId: number;
      userId: number;
      tags: string[];
    }) => venueContactTagsApi.updateTags(venueId, userId, tags),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [VENUE_CONTACT_TAGS_KEY, variables.venueId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          VENUE_CONTACT_TAGS_KEY,
          variables.venueId,
          variables.userId,
        ],
      });
    },
  });
}
