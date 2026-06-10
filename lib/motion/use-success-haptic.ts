import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export function useSuccessHaptic() {
  return useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
}

export function useLightHaptic() {
  return useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
}

export function useMediumHaptic() {
  return useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);
}
