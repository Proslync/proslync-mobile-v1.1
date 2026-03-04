// useMyTickets - React Query hook for fetching user's tickets with status filtering

import { useQuery } from '@tanstack/react-query';
import { ticketsApi, UserTicketsResponse } from '@/lib/api/tickets';

export const MY_TICKETS_KEY = 'my-tickets';

export function useMyTickets(ticketStatus?: string) {
  // Active tickets should only show upcoming events; other tabs show all
  const timeStatus = ticketStatus === 'active' ? 'upcoming' : 'all';

  const { data, isLoading, refetch } = useQuery<UserTicketsResponse>({
    queryKey: [MY_TICKETS_KEY, ticketStatus],
    queryFn: () =>
      ticketsApi.getMyTickets({
        ticketStatus,
        status: timeStatus,
        limit: 50,
        sortBy: 'eventDate',
        sortOrder: 'asc',
      }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    tickets: data?.tickets ?? [],
    isLoading,
    refetch,
  };
}
