// useLocationVisibility — AsyncStorage-persisted location visibility settings

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  LocationVisibilityMode,
  LocationVisibilitySettings,
} from '@/lib/types/location-visibility.types';
import { DEFAULT_VISIBILITY_SETTINGS } from '@/lib/types/location-visibility.types';

const STORAGE_KEY = 'LOCATION_VISIBILITY_SETTINGS';

export function useLocationVisibility() {
  const [settings, setSettings] = useState<LocationVisibilitySettings>(
    DEFAULT_VISIBILITY_SETTINGS
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: LocationVisibilitySettings = JSON.parse(raw);
          setSettings(parsed);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Persist helper
  const persist = useCallback(async (next: LocationVisibilitySettings) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to persist settings:', e);
    }
  }, []);

  const setMode = useCallback(
    (mode: LocationVisibilityMode) => {
      persist({ ...settings, mode });
    },
    [settings, persist]
  );

  const toggleAllowList = useCallback(
    (userId: number) => {
      const list = settings.allowList.includes(userId)
        ? settings.allowList.filter((id) => id !== userId)
        : [...settings.allowList, userId];
      persist({ ...settings, allowList: list });
    },
    [settings, persist]
  );

  const toggleBlockList = useCallback(
    (userId: number) => {
      const list = settings.blockList.includes(userId)
        ? settings.blockList.filter((id) => id !== userId)
        : [...settings.blockList, userId];
      persist({ ...settings, blockList: list });
    },
    [settings, persist]
  );

  /** Check if a given userId should be able to see the current user's location */
  const isUserVisible = useCallback(
    (userId: number): boolean => {
      switch (settings.mode) {
        case 'everyone':
          return true;
        case 'friends':
          // "friends" mode — all followers can see (server already limits to followers)
          return true;
        case 'only':
          return settings.allowList.includes(userId);
        case 'except':
          return !settings.blockList.includes(userId);
        default:
          return true;
      }
    },
    [settings]
  );

  return {
    settings,
    isLoaded,
    setMode,
    toggleAllowList,
    toggleBlockList,
    isUserVisible,
  };
}
