import * as SecureStore from 'expo-secure-store';

// ── PROSLYNC FAN TOKEN STORE ───────────────────────────────
// Phase 2 — fan auth runs on a SEPARATE keychain entry from the pro
// auth token (`proslync.accessToken`). The two identity surfaces are
// independent at the network layer (different `Authorization: Bearer`
// values, different refresh flows), so they must be independent at
// the storage layer too. Mixing them would mean a fan signin
// silently clobbers a pro session.

const FAN_ACCESS_TOKEN_KEY = 'proslync.fan.accessToken';
const FAN_REFRESH_TOKEN_KEY = 'proslync.fan.refreshToken';

export interface FanTokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Tokens live in the OS keychain (Keychain on iOS, Keystore on Android).
 * Every SecureStore call is guarded so the fan auth path never crashes
 * the app even if the secure store is unavailable.
 */
export const fanTokens = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(FAN_ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(FAN_ACCESS_TOKEN_KEY, token);
    } catch {
      // ignore; UI surfaces auth errors elsewhere
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(FAN_REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(FAN_REFRESH_TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },

  async get(): Promise<FanTokenPair | null> {
    const [access, refresh] = await Promise.all([
      this.getAccessToken(),
      this.getRefreshToken(),
    ]);
    if (!access || !refresh) return null;
    return { accessToken: access, refreshToken: refresh };
  },

  async set(pair: FanTokenPair): Promise<void> {
    await Promise.all([
      this.setAccessToken(pair.accessToken),
      this.setRefreshToken(pair.refreshToken),
    ]);
  },

  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(FAN_ACCESS_TOKEN_KEY);
    } catch {
      // ignore
    }
    try {
      await SecureStore.deleteItemAsync(FAN_REFRESH_TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};
