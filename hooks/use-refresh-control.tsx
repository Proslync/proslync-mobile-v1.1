import * as React from 'react';
import * as Haptics from 'expo-haptics';
import { RefreshControl, RefreshControlProps } from 'react-native';

interface UseRefreshControlOptions {
  onRefresh: () => Promise<void> | void;
  tintColor?: string;
}

interface UseRefreshControlResult {
  refreshing: boolean;
  refreshControl: React.ReactElement<RefreshControlProps>;
  triggerRefresh: () => Promise<void>;
}

export function useRefreshControl({
  onRefresh,
  tintColor = '#fff',
}: UseRefreshControlOptions): UseRefreshControlResult {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(async () => {
    // Trigger haptic feedback when pull-to-refresh is activated
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const refreshControl = React.useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={handleRefresh}
        tintColor={tintColor}
        colors={[tintColor]} // Android
      />
    ),
    [refreshing, handleRefresh, tintColor]
  );

  return {
    refreshing,
    refreshControl,
    triggerRefresh: handleRefresh,
  };
}
