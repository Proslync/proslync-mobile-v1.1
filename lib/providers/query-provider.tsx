import * as React from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';

// ============================================================================
// React Native specific: Online status management
// https://tanstack.com/query/v5/docs/framework/react/react-native
// ============================================================================
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// ============================================================================
// React Native specific: Refetch on App focus
// ============================================================================
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

// Create a client with sensible defaults for React Native
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30 seconds
      staleTime: 30 * 1000,
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Refetch when app comes to foreground (handled by focusManager)
      refetchOnWindowFocus: true,
      // Refetch when network reconnects (handled by onlineManager)
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Subscribe to AppState changes for focus management
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Export queryClient for use in hooks that need to invalidate queries
export { queryClient };
