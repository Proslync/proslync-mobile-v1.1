import { mmkv } from "../storage/mmkv";

const KEY_PREFIX = "@proslync_flag_";

/**
 * Typed feature flags. Add new flags here and update DEFAULTS.
 * The Backend cockpit reads this map to render its toggle list.
 */
export interface FeatureFlags {
  channels: boolean;
  backendCockpit: boolean;
  liveSockets: boolean;
}

const DEFAULTS: FeatureFlags = {
  channels: false,
  backendCockpit: false,
  liveSockets: false,
};

type FlagName = keyof FeatureFlags;
type Subscriber = (name: FlagName, value: boolean) => void;

const subscribers = new Set<Subscriber>();

function storageKey(name: FlagName): string {
  return `${KEY_PREFIX}${name}`;
}

export function getFlag<K extends FlagName>(name: K): FeatureFlags[K] {
  const stored = mmkv.getJSON<FeatureFlags[K]>(storageKey(name));
  return stored ?? DEFAULTS[name];
}

export function setFlag<K extends FlagName>(name: K, value: FeatureFlags[K]): void {
  mmkv.setJSON(storageKey(name), value);
  for (const sub of subscribers) sub(name, value);
}

export function resetFlag(name: FlagName): void {
  mmkv.delete(storageKey(name));
  for (const sub of subscribers) sub(name, DEFAULTS[name]);
}

export function listFlags(): { name: FlagName; value: boolean; isDefault: boolean }[] {
  return (Object.keys(DEFAULTS) as FlagName[]).map((name) => {
    const stored = mmkv.getJSON<boolean>(storageKey(name));
    return {
      name,
      value: stored ?? DEFAULTS[name],
      isDefault: stored === undefined,
    };
  });
}

export function subscribe(fn: Subscriber): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}
