import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config';
import { ApiClientError } from './errors';

interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  skipAuth?: boolean;
}

/**
 * API Client for React Native
 * Handles authentication, token refresh, and API requests
 */
class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
  }

  /**
   * Get stored access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(config.auth.tokenKey);
    } catch {
      return null;
    }
  }

  /**
   * Store access token
   */
  async setAccessToken(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }
    try {
      await AsyncStorage.setItem(config.auth.tokenKey, token);
    } catch (error) {
      console.error('Failed to store access token:', error);
    }
  }

  /**
   * Remove access token (logout)
   */
  async clearAccessToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(config.auth.tokenKey);
    } catch (error) {
      console.error('Failed to clear access token:', error);
    }
  }

  /**
   * Get stored refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(config.auth.refreshTokenKey);
    } catch {
      return null;
    }
  }

  /**
   * Store refresh token
   */
  async setRefreshToken(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }
    try {
      await AsyncStorage.setItem(config.auth.refreshTokenKey, token);
    } catch (error) {
      console.error('Failed to store refresh token:', error);
    }
  }

  /**
   * Remove refresh token
   */
  async clearRefreshToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(config.auth.refreshTokenKey);
    } catch (error) {
      console.error('Failed to clear refresh token:', error);
    }
  }

  /**
   * Build request headers
   */
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

  /**
   * Perform token refresh
   */
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
      console.log('[ApiClient] No refresh token available');
      throw new ApiClientError('No refresh token available', 401);
    }

    console.log('[ApiClient] Attempting token refresh...');

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('[ApiClient] Token refresh failed:', response.status, errorData);
        await this.clearAccessToken();
        await this.clearRefreshToken();
        throw new ApiClientError('Session expired. Please log in again.', 401);
      }

      const data = await response.json();
      console.log('[ApiClient] Token refresh successful');

      if (data.accessToken) {
        await this.setAccessToken(data.accessToken);
      }
      if (data.refreshToken) {
        await this.setRefreshToken(data.refreshToken);
      }
    } catch (error) {
      console.error('[ApiClient] Token refresh error:', error);
      await this.clearAccessToken();
      await this.clearRefreshToken();
      throw error;
    }
  }

  /**
   * Make HTTP request
   */
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
        if (endpoint.includes('/auth/refresh')) {
          console.log('[ApiClient] 401 on refresh endpoint, not retrying');
          throw ApiClientError.fromResponse(response, data);
        }

        console.log('[ApiClient] 401 received, attempting token refresh for:', endpoint);
        try {
          await this.performTokenRefresh();
          console.log('[ApiClient] Retrying request after token refresh:', endpoint);
          // Retry the original request with new token
          return this.request<T>(method, endpoint, body, requestConfig);
        } catch (refreshError) {
          console.error('[ApiClient] Token refresh failed, throwing original error');
          throw ApiClientError.fromResponse(response, data);
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

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', endpoint, body, config);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', endpoint, body, config);
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PATCH', endpoint, body, config);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  /**
   * Upload file with multipart/form-data
   */
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
      console.log('[ApiClient] Uploading file to:', url);
      console.log('[ApiClient] File info:', { name: file.name, type: file.type, uri: file.uri.substring(0, 50) + '...' });

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

      console.log('[ApiClient] Upload response status:', response.status);

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
        console.error('[ApiClient] Upload failed:', data);
        throw ApiClientError.fromResponse(response, data);
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[ApiClient] Upload error:', error);

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
