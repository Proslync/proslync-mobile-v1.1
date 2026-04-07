import * as React from 'react';
import * as Haptics from 'expo-haptics';
import { Platform, RefreshControl, RefreshControlProps } from 'react-native';

interface UseRefreshControlOptions {
  onRefresh: () => Promise<void> | void;
  tintColor?: string;
  progressBackgroundColor?: string;
}

interface UseRefreshControlResult {
  refreshing: boolean;
  refreshControl: React.ReactElement<RefreshControlProps>;
  triggerRefresh: () => Promise<void>;
}

export function useRefreshControl({
  onRefresh,
  tintColor = 'rgba(0,0,0,0.35)',
  progressBackgroundColor,
}: UseRefreshControlOptions): UseRefreshControlResult {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(async () => {
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
        colors={[tintColor]}
        progressBackgroundColor={progressBackgroundColor}
        // Pull the spinner down a bit so it doesn't hide behind nav bars
        progressViewOffset={Platform.OS === 'android' ? 20 : 0}
      />
    ),
    [refreshing, handleRefresh, tintColor, progressBackgroundColor]
  );

  return {
    refreshing,
    refreshControl,
    triggerRefresh: handleRefresh,
  };
}
