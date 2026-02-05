import { apiClient } from './client';
import type {
  RequestOtpRequest,
  RequestOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  RefreshTokenResponse,
  LogoutResponse,
  User,
  CheckAuthResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  AvatarPresignedUrlResponse,
  ConfirmUploadResponse,
  PublicUserProfile,
} from '../types/auth.types';

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Request OTP code for phone number
   */
  requestOtp: async (data: RequestOtpRequest): Promise<RequestOtpResponse> => {
    return apiClient.post<RequestOtpResponse>('/api/auth/request-otp', data, {
      skipAuth: true,
    });
  },

  /**
   * Verify OTP code
   */
  verifyOtp: async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    return apiClient.post<VerifyOtpResponse>('/api/auth/verify-otp', data, {
      skipAuth: true,
    });
  },

  /**
   * Refresh access token
   */
  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const refreshToken = await apiClient.getRefreshToken();
    return apiClient.post<RefreshTokenResponse>(
      '/api/auth/refresh',
      { refreshToken },
      { skipAuth: true }
    );
  },

  /**
   * Logout user
   */
  logout: async (): Promise<LogoutResponse> => {
    return apiClient.post<LogoutResponse>('/api/auth/logout');
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>('/api/auth/me');
  },

  /**
   * Check if user is authenticated
   */
  checkAuth: async (): Promise<CheckAuthResponse> => {
    try {
      const user = await apiClient.get<User>('/api/auth/me');
      return { isAuthenticated: true, user };
    } catch (error) {
      return { isAuthenticated: false };
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    return apiClient.put<UpdateProfileResponse>('/api/users/profile', data);
  },

  /**
   * Search for a user by username
   */
  getUserByUsername: async (userName: string): Promise<PublicUserProfile | null> => {
    const response = await apiClient.get<{
      events: unknown[];
      venues: unknown[];
      people: Array<{
        id: number;
        userName: string | null;
        firstName: string;
        lastName: string;
        avatar: { id: string; url: string } | null;
      }>;
    }>(`/api/search?query=${encodeURIComponent(userName)}&eventsLimit=0&venuesLimit=0&peopleLimit=10`);

    // Find exact username match (case-insensitive)
    const user = response.people.find(
      (p) => p.userName?.toLowerCase() === userName.toLowerCase()
    );

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      userName: user.userName || undefined,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar
        ? { id: user.avatar.id, url: user.avatar.url }
        : null,
    };
  },

  /**
   * Get public user profile by ID (includes event stats and follow stats)
   */
  getUserById: async (userId: number): Promise<PublicUserProfile | null> => {
    try {
      const response = await apiClient.get<PublicUserProfile>(`/api/users/${userId}`);
      return response;
    } catch (error) {
      console.error('[Auth] Error fetching user by ID:', error);
      return null;
    }
  },

  /**
   * Follow a user
   */
  followUser: async (userId: number): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/api/users/${userId}/follow`, {});
  },

  /**
   * Unfollow a user
   */
  unfollowUser: async (userId: number): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/api/users/${userId}/follow`);
  },

  /**
   * Check if current user is following a specific user
   */
  getFollowStatus: async (userId: number): Promise<{ isFollowing: boolean }> => {
    return apiClient.get<{ isFollowing: boolean }>(`/api/users/${userId}/follow-status`);
  },

  /**
   * Get presigned URL for avatar upload
   */
  getAvatarPresignedUrl: async (
    fileName: string,
    mimeType: string,
    fileSize: number
  ): Promise<AvatarPresignedUrlResponse> => {
    return apiClient.post<AvatarPresignedUrlResponse>('/api/files/avatar/presigned-url', {
      fileName,
      mimeType,
      fileSize: String(fileSize),
    });
  },

  /**
   * Confirm file upload
   */
  confirmUpload: async (fileId: string): Promise<ConfirmUploadResponse> => {
    return apiClient.post<ConfirmUploadResponse>(`/api/files/confirm-upload/${fileId}`);
  },

  /**
   * Upload file to presigned URL
   */
  uploadToPresignedUrl: async (
    uploadUrl: string,
    uri: string,
    mimeType: string
  ): Promise<void> => {
    // For local storage, use the API client's upload method
    if (uploadUrl.startsWith('/api/')) {
      await apiClient.uploadFile(
        uploadUrl,
        { uri, name: 'avatar', type: mimeType },
        'file'
      );
      return;
    }

    console.log('[Auth] Uploading to cloud storage:', uploadUrl.substring(0, 80) + '...');

    // For cloud storage (S3/GCS), read the file and upload as blob
    // React Native's fetch can read local file URIs
    try {
      // Read the file as blob using fetch
      const fileResponse = await fetch(uri);
      const blob = await fileResponse.blob();

      console.log('[Auth] File blob created, size:', blob.size);

      // Upload to presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
        },
        body: blob,
      });

      console.log('[Auth] Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error('[Auth] Upload error:', error);
      throw new Error(error?.message || 'Failed to upload file');
    }
  },
};
