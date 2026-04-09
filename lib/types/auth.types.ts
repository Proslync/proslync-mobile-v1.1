export enum UserRole {
  USER = 'user',
  OWNER = 'owner',
  ADMIN = 'admin',
  BOUNCER = 'bouncer',
  HOST = 'host',
}

export interface Avatar {
  id: string;
  url: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
}

export interface AssignedRoles {
  bouncer?: number[];
  host?: number[];
}

export interface EventStats {
  totalEvents: number;
  pastEvents: number;
  upcomingEvents: number;
}

export interface FollowStats {
  followers: number;
  following: number;
}

export interface Organization {
  id: number;
  name: string;
  role: 'owner' | 'admin' | 'manager' | 'viewer' | null;
  logo?: { id: string; url: string } | null;
}

export interface User {
  id: number;
  phoneNumber: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    [key: string]: string | undefined;
  } | null;
  role: UserRole;
  status: string;
  isProfileComplete: boolean;
  isVerified?: boolean;
  isAppleMessagesLinked?: boolean;
  requiresAppleMessagesLinking?: boolean;
  assignedRoles?: AssignedRoles;
  birthDate?: string;
  avatar?: Avatar | null;
  eventStats?: EventStats;
  organizations?: Organization[];
  createdAt?: string;
  updatedAt?: string;
}

// Request OTP
export interface RequestOtpRequest {
  phoneNumber: string;
}

export interface RequestOtpResponse {
  message: string;
  expiresAt?: string;
}

// Device info for verification
export interface DeviceInfo {
  platform: string;
  deviceType: string;
  userAgent: string;
}

// Verify OTP
export interface VerifyOtpRequest {
  phoneNumber: string;
  code: string;
  deviceInfo?: DeviceInfo;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: number;
    phoneNumber: string;
    role: UserRole;
    status: string;
    isProfileComplete: boolean;
    isAppleMessagesLinked?: boolean;
    requiresAppleMessagesLinking?: boolean;
    assignedRoles?: AssignedRoles;
  };
}

// Refresh Token
export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

// Logout
export interface LogoutResponse {
  message: string;
}

// Update Profile
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  userName?: string;
  email?: string;
  bio?: string;
  location?: string;
  website?: string;
  birthDate?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    [key: string]: string | undefined;
  };
}

export interface UpdateProfileResponse {
  message: string;
  success: boolean;
  user: User;
}

// Avatar Presigned URL
export interface AvatarPresignedUrlResponse {
  uploadUrl: string;
  fileId: string;
  message: string;
}

// Confirm Upload
export interface ConfirmUploadResponse {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  fileType: string;
  status: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

// Check Auth
export interface CheckAuthResponse {
  isAuthenticated: boolean;
  user?: User;
}

// Public User Profile
export interface PublicUserProfile {
  id: number;
  userName?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  isVerified?: boolean;
  avatar?: Avatar | null;
  eventStats?: EventStats;
  followStats?: FollowStats;
  isPrivate?: boolean;
  createdAt?: string;
  isBlocked?: boolean;
  isBlockedBy?: boolean;
}
