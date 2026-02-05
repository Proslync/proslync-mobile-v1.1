import * as React from 'react';
import { useRouter, useSegments } from 'expo-router';
import { authApi } from '../api/auth';
import { apiClient } from '../api/client';
import type { User, UserRole } from '../types/auth.types';

// Partial user returned from verify-otp (doesn't include full profile fields)
interface PartialUser {
  id: number;
  phoneNumber: string;
  role: UserRole;
  status: string;
  isProfileComplete: boolean;
  isAppleMessagesLinked?: boolean;
  requiresAppleMessagesLinking?: boolean;
  assignedRoles?: {
    bouncer?: number[];
    host?: number[];
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (partialUser: PartialUser, accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  switchAccount: (accessToken: string, refreshToken?: string) => Promise<boolean>;
  hasRole: (role: UserRole) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const segments = useSegments();

  const isAuthenticated = !!user;

  // Check for existing auth on mount
  React.useEffect(() => {
    checkAuth();
  }, []);

  // Handle navigation based on auth state
  React.useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'signin';

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated, redirect to signin
      router.replace('/signin');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated, redirect to main app
      if (user && !user.isProfileComplete) {
        // Profile incomplete, would redirect to profile setup
        // For now, just go to tabs
        router.replace('/(tabs)');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  const checkAuth = async () => {
    try {
      const token = await apiClient.getAccessToken();
      console.log('[Auth] Token found:', !!token);
      if (token) {
        // Fetch full user data directly from /api/auth/me
        const userData = await authApi.getCurrentUser();
        console.log('[Auth] User data from API:', JSON.stringify(userData, null, 2));
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.log('[Auth] Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (partialUser: PartialUser, accessToken: string) => {
    console.log('[Auth] Login called with partial user:', JSON.stringify(partialUser, null, 2));

    // Store access token first
    await apiClient.setAccessToken(accessToken);

    // Immediately fetch full user profile from /api/auth/me
    // This gets all profile fields: firstName, lastName, userName, bio, avatar, etc.
    try {
      const fullUserData = await authApi.getCurrentUser();
      console.log('[Auth] Full user data from /api/auth/me:', JSON.stringify(fullUserData, null, 2));
      setUser(fullUserData);
    } catch (error) {
      console.log('[Auth] Failed to fetch full user data:', error);
      // Fallback to partial user if full fetch fails
      setUser(partialUser as unknown as User);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.log('Logout API error:', error);
    } finally {
      await apiClient.clearAccessToken();
      await apiClient.clearRefreshToken();
      setUser(null);
      router.replace('/signin');
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.log('Failed to refresh user:', error);
    }
  };

  const switchAccount = async (accessToken: string, refreshToken?: string): Promise<boolean> => {
    try {
      console.log('[Auth] Switching account...');

      // Set the tokens for the new account
      await apiClient.setAccessToken(accessToken);
      if (refreshToken) {
        await apiClient.setRefreshToken(refreshToken);
      }

      // Fetch the user data for this account
      const userData = await authApi.getCurrentUser();
      console.log('[Auth] Switched to user:', userData.id);
      setUser(userData);

      return true;
    } catch (error) {
      console.error('[Auth] Failed to switch account:', error);
      // If switch fails, the tokens are still set - user might need to re-login
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    switchAccount,
    hasRole,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
