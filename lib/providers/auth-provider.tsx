import * as React from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
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
  login: (partialUser: PartialUser, accessToken: string, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchAccount: (accessToken: string, refreshToken?: string) => Promise<boolean>;
  hasRole: (role: UserRole) => boolean;
  refreshUser: () => Promise<void>;
  skipAppleMessagesLinking: () => void;
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
  const [appleMessagesLinkingSkipped, setAppleMessagesLinkingSkipped] = React.useState(false);
  const router = useRouter();
  const segments = useSegments();
  const queryClient = useQueryClient();

  const isAuthenticated = !!user;

  // Handle auth errors from API client (session expired, refresh failed)
  const handleAuthError = React.useCallback(() => {
    queryClient.clear();
    setUser(null);
    // Navigation effect will handle redirect to signin
  }, [queryClient]);

  // Set up auth error callback on mount
  React.useEffect(() => {
    apiClient.setOnAuthError(handleAuthError);
    return () => {
      apiClient.clearOnAuthError();
    };
  }, [handleAuthError]);

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
      // Stay in signin for profile setup if profile is incomplete
      if (user && !user.isProfileComplete) {
        return;
      }
      // Stay in signin for Apple Messages linking if not yet linked (and not skipped)
      if (user && !user.isAppleMessagesLinked && !appleMessagesLinkingSkipped) {
        return;
      }
      // Authenticated with complete profile, redirect to main app
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, appleMessagesLinkingSkipped]);

  const checkAuth = async () => {
    try {
      const token = await apiClient.getAccessToken();      if (token) {
        // Fetch full user data directly from /api/auth/me
        const userData = await authApi.getCurrentUser();        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {    } finally {
      setIsLoading(false);
    }
  };

  const login = React.useCallback(async (partialUser: PartialUser, accessToken: string, refreshToken?: string) => {
    // Store tokens
    await apiClient.setAccessToken(accessToken);
    if (refreshToken) {
      await apiClient.setRefreshToken(refreshToken);    }

    // Immediately fetch full user profile from /api/auth/me
    // This gets all profile fields: firstName, lastName, userName, bio, avatar, etc.
    try {
      const fullUserData = await authApi.getCurrentUser();      setUser(fullUserData);
    } catch (error) {      // Fallback to partial user if full fetch fails
      setUser(partialUser as unknown as User);
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.log('Logout API error:', error);
    } finally {
      await apiClient.clearAccessToken();
      await apiClient.clearRefreshToken();
      queryClient.clear();
      setUser(null);
      router.replace('/signin');
    }
  }, [queryClient, router]);

  const hasRole = React.useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user?.role]);

  const refreshUser = React.useCallback(async () => {
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.log('Failed to refresh user:', error);
    }
  }, []);

  const skipAppleMessagesLinking = React.useCallback(() => {
    setAppleMessagesLinkingSkipped(true);
  }, []);

  const switchAccount = React.useCallback(async (accessToken: string, refreshToken?: string): Promise<boolean> => {
    try {
      // Clear previous user's cached data
      queryClient.clear();

      // Set the tokens for the new account
      await apiClient.setAccessToken(accessToken);
      if (refreshToken) {
        await apiClient.setRefreshToken(refreshToken);
      }

      // Fetch the user data for this account
      const userData = await authApi.getCurrentUser();      setUser(userData);

      return true;
    } catch (error) {
      console.error('Failed to switch account:', error);
      // If switch fails, the tokens are still set - user might need to re-login
      return false;
    }
  }, [queryClient]);

  const value = React.useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      switchAccount,
      hasRole,
      refreshUser,
      skipAppleMessagesLinking,
    }),
    [user, isAuthenticated, isLoading, login, logout, switchAccount, hasRole, refreshUser, skipAppleMessagesLinking],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
