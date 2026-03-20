// React Query hooks for bar tab ordering and payments
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { barTabsApi } from '@/lib/api/bar-tabs';
import type {
  ActiveTabsResponse,
  AddItemsRequest,
  BarTab,
  BarTabSummary,
  CloseTabRequest,
  CloseTabResponse,
  OpenTabRequest,
} from '@/lib/types/bar-tab.types';

export const BAR_TABS_KEY = 'bar-tabs';
export const BAR_TAB_KEY = 'bar-tab';
export const BAR_SUMMARY_KEY = 'bar-summary';
export const MY_BAR_TAB_KEY = 'my-bar-tab';

// --- Queries ---

export function useBarTabs(eventId?: number) {
  return useQuery<ActiveTabsResponse>({
    queryKey: [BAR_TABS_KEY, eventId],
    queryFn: () => barTabsApi.getTabs(eventId!),
    enabled: !!eventId,
    staleTime: 30_000,
    refetchInterval: 15_000,
  });
}

export function useBarTab(eventId?: number, tabId?: number) {
  return useQuery<BarTab>({
    queryKey: [BAR_TAB_KEY, eventId, tabId],
    queryFn: () => barTabsApi.getTab(eventId!, tabId!),
    enabled: !!eventId && !!tabId,
    staleTime: 10_000,
  });
}

export function useBarSummary(eventId?: number) {
  return useQuery<BarTabSummary>({
    queryKey: [BAR_SUMMARY_KEY, eventId],
    queryFn: () => barTabsApi.getSummary(eventId!),
    enabled: !!eventId,
    staleTime: 60_000,
  });
}

export function useMyBarTab(eventId?: number) {
  return useQuery<BarTab | null>({
    queryKey: [MY_BAR_TAB_KEY, eventId],
    queryFn: () => barTabsApi.getMyTab(eventId!),
    enabled: !!eventId,
    staleTime: 15_000,
  });
}

// --- Mutations ---

export function useOpenTab(eventId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OpenTabRequest) => barTabsApi.openTab(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BAR_TABS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [BAR_SUMMARY_KEY, eventId] });
    },
  });
}

export function useAddItems(eventId: number, tabId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddItemsRequest) => barTabsApi.addItems(eventId, tabId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BAR_TAB_KEY, eventId, tabId] });
      queryClient.invalidateQueries({ queryKey: [BAR_TABS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [MY_BAR_TAB_KEY, eventId] });
    },
  });
}

export function useVoidItem(eventId: number, tabId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => barTabsApi.voidItem(eventId, tabId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BAR_TAB_KEY, eventId, tabId] });
      queryClient.invalidateQueries({ queryKey: [BAR_TABS_KEY, eventId] });
    },
  });
}

export function useCloseTab(eventId: number, tabId: number) {
  const queryClient = useQueryClient();
  return useMutation<CloseTabResponse, Error, CloseTabRequest>({
    mutationFn: (data) => barTabsApi.closeTab(eventId, tabId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BAR_TAB_KEY, eventId, tabId] });
      queryClient.invalidateQueries({ queryKey: [BAR_TABS_KEY, eventId] });
    },
  });
}

export function useMarkTabPaid(eventId: number, tabId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => barTabsApi.markPaid(eventId, tabId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BAR_TAB_KEY, eventId, tabId] });
      queryClient.invalidateQueries({ queryKey: [BAR_TABS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [BAR_SUMMARY_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [MY_BAR_TAB_KEY, eventId] });
    },
  });
}
