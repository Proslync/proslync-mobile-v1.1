import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { textBlastsApi } from '@/lib/api/text-blasts';
import type {
  TextBlastResponse,
  SendCrossEventBlastRequest,
  SendTextBlastResponse,
  RecipientCountResponse,
} from '@/lib/types/text-blast.types';

export const CROSS_EVENT_BLASTS_KEY = 'cross-event-text-blasts';
export const CROSS_EVENT_RECIPIENT_COUNT_KEY = 'cross-event-recipient-count';

export function useCrossEventTextBlasts() {
  return useQuery<TextBlastResponse[]>({
    queryKey: [CROSS_EVENT_BLASTS_KEY],
    queryFn: () => textBlastsApi.getCrossEventBlasts(),
    staleTime: 30 * 1000,
  });
}

export function useCrossEventRecipientCount() {
  return useQuery<RecipientCountResponse>({
    queryKey: [CROSS_EVENT_RECIPIENT_COUNT_KEY],
    queryFn: () => textBlastsApi.getCrossEventRecipientCount(),
    staleTime: 60 * 1000,
  });
}

export function useSendCrossEventBlast() {
  const queryClient = useQueryClient();

  return useMutation<SendTextBlastResponse, Error, SendCrossEventBlastRequest>({
    mutationFn: (data) => textBlastsApi.sendCrossEventBlast(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CROSS_EVENT_BLASTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CROSS_EVENT_RECIPIENT_COUNT_KEY] });
    },
  });
}
