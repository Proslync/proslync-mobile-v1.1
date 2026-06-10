import type { Persister } from '@tanstack/react-query-persist-client';
import { mmkv } from '@/lib/storage/mmkv';

const CACHE_KEY = 'proslync:rq-cache:v1';
const GC_TIME_MS = 24 * 60 * 60 * 1000; // 24 hours

export const mmkvPersister: Persister = {
  persistClient: (client) => {
    mmkv.setString(CACHE_KEY, JSON.stringify(client));
  },
  restoreClient: () => {
    const raw = mmkv.getString(CACHE_KEY);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  },
  removeClient: () => {
    mmkv.delete(CACHE_KEY);
  },
};

export { GC_TIME_MS };
