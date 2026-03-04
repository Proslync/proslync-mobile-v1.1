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

export const authApi = {
  requestOtp: async (data: RequestOtpRequest): Promise<RequestOtpResponse> => {
    return apiClient.post<RequestOtpResponse>('/api/auth/request-otp', data, {
      skipAuth: true,
    });
  },

  verifyOtp: async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    return apiClient.post<VerifyOtpResponse>('/api/auth/verify-otp', data, {
      skipAuth: true,
    });
  },

  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const refreshToken = await apiClient.getRefreshToken();
    return apiClient.post<RefreshTokenResponse>(
      '/api/auth/refresh',
      { refreshToken },
      { skipAuth: true }
    );
  },

  logout: async (): Promise<LogoutResponse> => {
    return apiClient.post<LogoutResponse>('/api/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const raw = await apiClient.get<Record<string, unknown>>('/api/auth/me');
    // Normalize: backend may return userName or username
    if (!raw.userName && raw.username) {
      raw.userName = raw.username;
    }
    return raw as unknown as User;
  },

  checkAuth: async (): Promise<CheckAuthResponse> => {
    try {
      const user = await apiClient.get<User>('/api/auth/me');
      return { isAuthenticated: true, user };
    } catch (error) {
      return { isAuthenticated: false };
    }
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    return apiClient.put<UpdateProfileResponse>('/api/users/profile', data);
  },

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

  getUserById: async (userId: number): Promise<PublicUserProfile | null> => {
    try {
      const response = await apiClient.get<Record<string, unknown>>(`/api/users/${userId}`);
      // Normalize field names — backend may return userName or username
      const raw = response as Record<string, unknown>;
      return {
        id: (raw.id as number),
        userName: (raw.userName ?? raw.username) as string | undefined,
        firstName: (raw.firstName ?? raw.firstname) as string | undefined,
        lastName: (raw.lastName ?? raw.lastname) as string | undefined,
        bio: (raw.bio) as string | undefined,
        avatar: (raw.avatar) as PublicUserProfile['avatar'],
        eventStats: (raw.eventStats) as PublicUserProfile['eventStats'],
        followStats: (raw.followStats) as PublicUserProfile['followStats'],
        isPrivate: (raw.isPrivate) as boolean | undefined,
      };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  },

  followUser: async (userId: number): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/api/users/${userId}/follow`, {});
  },

  unfollowUser: async (userId: number): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/api/users/${userId}/follow`);
  },

  getFollowStatus: async (userId: number): Promise<{ isFollowing: boolean }> => {
    return apiClient.get<{ isFollowing: boolean }>(`/api/users/${userId}/follow-status`);
  },

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

  confirmUpload: async (fileId: string): Promise<ConfirmUploadResponse> => {
    return apiClient.post<ConfirmUploadResponse>(`/api/files/confirm-upload/${fileId}`);
  },

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
    // For cloud storage (S3/GCS), read the file and upload as blob
    // React Native's fetch can read local file URIs
    try {
      // Read the file as blob using fetch
      const fileResponse = await fetch(uri);
      const blob = await fileResponse.blob();
      // Upload to presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
        },
        body: blob,
      });
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      throw new Error(error?.message || 'Failed to upload file');
    }
  },
};
