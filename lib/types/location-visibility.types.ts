// Location Visibility Types — Snapchat-style "Who can see my location" settings

export type LocationVisibilityMode = 'everyone' | 'friends' | 'only' | 'except';

export interface LocationVisibilitySettings {
  mode: LocationVisibilityMode;
  /** User IDs that CAN see location (used when mode === 'only') */
  allowList: number[];
  /** User IDs that CANNOT see location (used when mode === 'except') */
  blockList: number[];
}

export const DEFAULT_VISIBILITY_SETTINGS: LocationVisibilitySettings = {
  mode: 'everyone',
  allowList: [],
  blockList: [],
};

export const VISIBILITY_MODE_LABELS: Record<LocationVisibilityMode, string> = {
  everyone: 'Everyone',
  friends: 'My Friends',
  only: 'Only These Friends',
  except: 'Everyone Except...',
};

export const VISIBILITY_MODE_ICONS: Record<LocationVisibilityMode, string> = {
  everyone: 'globe-outline',
  friends: 'people-outline',
  only: 'person-add-outline',
  except: 'eye-off-outline',
};
