import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { config } from '../config';
import { ApiClientError } from './errors';

interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<void> | null = null;
  private onAuthErrorCallback: (() => void) | null = null;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
  }

  /**
   * Set callback for auth errors (session expired, refresh failed)
   * Called by AuthProvider to handle automatic logout
   */
  setOnAuthError(callback: () => void): void {
    this.onAuthErrorCallback = callback;
  }

  clearOnAuthError(): void {
    this.onAuthErrorCallback = null;
  }

  private notifyAuthError(): void {
    if (this.onAuthErrorCallback) {
      this.onAuthErrorCallback();
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(config.auth.tokenKey);
    } catch {
      return null;
    }
  }

  async setAccessToken(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }
    try {
      await SecureStore.setItemAsync(config.auth.tokenKey, token);
    } catch (error) {
      console.error('Failed to store access token:', error);
    }
  }

  async clearAccessToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(config.auth.tokenKey);
    } catch (error) {
      console.error('Failed to clear access token:', error);
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(config.auth.refreshTokenKey);
    } catch {
      return null;
    }
  }

  async setRefreshToken(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }
    try {
      await SecureStore.setItemAsync(config.auth.refreshTokenKey, token);
    } catch (error) {
      console.error('Failed to store refresh token:', error);
    }
  }

  async clearRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(config.auth.refreshTokenKey);
    } catch (error) {
      console.error('Failed to clear refresh token:', error);
    }
  }

  private async buildHeaders(
    customHeaders?: Record<string, string>,
    skipAuth?: boolean
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (!skipAuth) {
      const token = await this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async performTokenRefresh(): Promise<void> {
    // Prevent concurrent refresh requests
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async doRefresh(): Promise<void> {
    const refreshToken = await this.getRefreshToken();

    if (!refreshToken) {
      // No refresh token stored — session expired, user must re-authenticate.
      this.notifyAuthError();
      throw new ApiClientError('Session expired', 401);
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));        await this.clearAccessToken();
        await this.clearRefreshToken();
        // Notify auth provider to clear user state and redirect to signin
        this.notifyAuthError();
        throw new ApiClientError('Session expired. Please log in again.', 401);
      }

      const data = await response.json();
      if (data.accessToken) {
        await this.setAccessToken(data.accessToken);
      }
      if (data.refreshToken) {
        await this.setRefreshToken(data.refreshToken);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.clearAccessToken();
      await this.clearRefreshToken();
      // Notify auth provider to clear user state and redirect to signin
      this.notifyAuthError();
      throw error;
    }
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    requestConfig?: RequestConfig
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.buildHeaders(
      requestConfig?.headers,
      requestConfig?.skipAuth
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      requestConfig?.timeout || this.timeout
    );

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      let data: unknown;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle 401 - try to refresh token
      if (response.status === 401 && !requestConfig?.skipAuth) {
        // Don't retry refresh endpoint to avoid infinite loops
        if (endpoint.includes('/auth/refresh')) {          throw ApiClientError.fromResponse(response, data);
        }

        try {
          await this.performTokenRefresh();
          // Retry the original request with new token
          return this.request<T>(method, endpoint, body, requestConfig);
        } catch {
          // Refresh failed (no token or expired) — throw the original 401
          throw ApiClientError.fromResponse(response, data);
        }
      }

      // Handle 403 - account suspended
      if (response.status === 403) {
        const message =
          (data as Record<string, unknown>)?.message ?? '';
        if (
          typeof message === 'string' &&
          message.toLowerCase().includes('suspended')
        ) {
          await this.clearAccessToken();
          await this.clearRefreshToken();
          Alert.alert(
            'Account Suspended',
            'Your account has been suspended. Please contact support if you believe this is an error.',
          );
          this.notifyAuthError();
          throw new ApiClientError('Your account has been suspended', 403);
        }
      }

      // Handle other errors
      if (!response.ok) {
        throw ApiClientError.fromResponse(response, data);
      }

      // Store new access token if provided in response
      const responseData = data as Record<string, unknown>;
      if (responseData?.accessToken && typeof responseData.accessToken === 'string') {
        await this.setAccessToken(responseData.accessToken);
      }
      if (responseData?.refreshToken && typeof responseData.refreshToken === 'string') {
        await this.setRefreshToken(responseData.refreshToken);
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw ApiClientError.fromTimeout();
        }
        throw ApiClientError.fromNetworkError(error);
      }

      throw new ApiClientError('Unknown error occurred', 0);
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  async post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', endpoint, body, config);
  }

  async put<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', endpoint, body, config);
  }

  async patch<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', endpoint, body, config);
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  async uploadFile<T>(
    endpoint: string,
    file: { uri: string; name: string; type: string },
    fieldName: string = 'file',
    config?: RequestConfig
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {};
    if (!config?.skipAuth) {
      const token = await this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // React Native FormData requires this specific format for file uploads
    const formData = new FormData();
    // @ts-expect-error - React Native FormData accepts this format
    formData.append(fieldName, {
      uri: file.uri,
      name: file.name,
      type: file.type,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      config?.timeout || 60000 // Longer timeout for uploads
    );

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: unknown;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      // Handle 401 - try to refresh token
      if (response.status === 401 && !config?.skipAuth) {
        try {
          await this.performTokenRefresh();
          return this.uploadFile<T>(endpoint, file, fieldName, config);
        } catch (refreshError) {
          throw ApiClientError.fromResponse(response, data);
        }
      }

      if (!response.ok) {
        console.error('Upload failed:', data);
        throw ApiClientError.fromResponse(response, data);
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Upload error:', error);

      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw ApiClientError.fromTimeout();
        }
        throw ApiClientError.fromNetworkError(error);
      }

      throw new ApiClientError('Unknown error occurred', 0);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
