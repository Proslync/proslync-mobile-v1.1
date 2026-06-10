import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "proslync.accessToken";
const REFRESH_TOKEN_KEY = "proslync.refreshToken";

/**
 * Tokens live in the OS keychain (Keychain on iOS, Keystore on Android).
 * SecureStore can throw on web or in some simulator scenarios — every
 * call is guarded so the app never crashes in the auth path.
 */
export const secureTokens = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch {
      // in-memory fallback handled by apiClient
    }
  },

  async clearAccessToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      // ignore
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },

  async clearRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      // ignore
    }
  },

  async clearAll(): Promise<void> {
    await Promise.all([this.clearAccessToken(), this.clearRefreshToken()]);
  },
};
