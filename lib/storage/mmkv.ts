import AsyncStorage from '@react-native-async-storage/async-storage';

let MMKV: any = null;
let storage: any = null;

try {
  const mod = require('react-native-mmkv');
  MMKV = mod.MMKV;
  storage = new MMKV();
} catch {
  // Native module not available — fall back to AsyncStorage wrapper
}

/** Synchronous if MMKV available, async-but-cached if fallback */
const cache = new Map<string, string>();

export const mmkv = {
  getString: (key: string): string | undefined => {
    if (storage) return storage.getString(key);
    return cache.get(key);
  },
  setString: (key: string, value: string) => {
    if (storage) { storage.set(key, value); return; }
    cache.set(key, value);
    AsyncStorage.setItem(key, value).catch(() => {});
  },
  getJSON: <T>(key: string): T | undefined => {
    const raw = mmkv.getString(key);
    if (!raw) return undefined;
    try { return JSON.parse(raw) as T; } catch { return undefined; }
  },
  setJSON: (key: string, value: unknown) => {
    mmkv.setString(key, JSON.stringify(value));
  },
  delete: (key: string) => {
    if (storage) { storage.delete(key); return; }
    cache.delete(key);
    AsyncStorage.removeItem(key).catch(() => {});
  },
  contains: (key: string): boolean => {
    if (storage) return storage.contains(key);
    return cache.has(key);
  },
  /** Preload keys from AsyncStorage into cache (call once at startup) */
  preload: async (keys: string[]) => {
    if (storage) return; // MMKV is synchronous, no preload needed
    const pairs = await AsyncStorage.multiGet(keys);
    for (const [k, v] of pairs) {
      if (v != null) cache.set(k, v);
    }
  },
} as const;
