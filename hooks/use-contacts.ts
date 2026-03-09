import { useInfiniteQuery } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api/events';
import type { Contact, ContactsResponse } from '@/lib/types/events.types';

const PAGE_SIZE = 20;

export const CONTACTS_KEY = 'contacts';

interface UseContactsOptions {
  ownerId: number | undefined;
  search?: string;
}

export function useContacts({ ownerId, search }: UseContactsOptions) {
  const query = useInfiniteQuery<ContactsResponse, Error>({
    queryKey: [CONTACTS_KEY, ownerId, search],
    queryFn: async ({ pageParam }) => {
      if (!ownerId) throw new Error('Owner ID required');
      return eventsApi.getContacts(ownerId, {
        page: pageParam as number,
        limit: PAGE_SIZE,
        search: search || undefined,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext && lastPage.page) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!ownerId,
    staleTime: 1000 * 60 * 2,
  });

  const contacts: Contact[] = query.data?.pages.flatMap((page) => page.contacts) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return {
    ...query,
    contacts,
    total,
  };
}
