import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { textBlastsApi } from '@/lib/api/text-blasts';
import type {
  TextBlastResponse,
  SendTextBlastRequest,
  SendTextBlastResponse,
  RecipientCountResponse,
  TextBlastAudience,
} from '@/lib/types/text-blast.types';

export const TEXT_BLASTS_KEY = 'text-blasts';
export const RECIPIENT_COUNT_KEY = 'text-blast-recipient-count';

export function useTextBlasts(eventId: number) {
  return useQuery<TextBlastResponse[]>({
    queryKey: [TEXT_BLASTS_KEY, eventId],
    queryFn: () => textBlastsApi.getTextBlasts(eventId),
    enabled: eventId > 0,
    staleTime: 30 * 1000,
  });
}

export function useRecipientCount(eventId: number, audience: TextBlastAudience = 'all') {
  return useQuery<RecipientCountResponse>({
    queryKey: [RECIPIENT_COUNT_KEY, eventId, audience],
    queryFn: () => textBlastsApi.getRecipientCount(eventId, audience),
    enabled: eventId > 0,
    staleTime: 60 * 1000,
  });
}

export function useSendTextBlast(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation<SendTextBlastResponse, Error, SendTextBlastRequest>({
    mutationFn: (data) => textBlastsApi.sendTextBlast(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEXT_BLASTS_KEY, eventId] });
    },
  });
}
