/**
 * Theme Provider for Status app
 * Similar to next-themes but for React Native
 *
 * Features:
 * - Light/Dark/System theme modes
 * - Persists theme preference to AsyncStorage
 * - Follows system theme when set to 'system'
 * - Provides colors and theme utilities via context
 */

import * as React from 'react';
import { useColorScheme } from 'react-native';
import { mmkv } from '@/lib/storage/mmkv';
import {
  Colors,
  LightColors,
  DarkColors,
  BaseColors,
  type ThemeMode,
  type ThemeColors,
} from '@/constants/colors';

const THEME_STORAGE_KEY = '@status_theme_mode';

interface ThemeContextValue {
  // Current resolved theme (always 'light' or 'dark')
  theme: 'light' | 'dark';
  // User's theme preference (can be 'system')
  themeMode: ThemeMode;
  // Set theme mode
  setThemeMode: (mode: ThemeMode) => void;
  // Toggle between light and dark
  toggleTheme: () => void;
  // Whether theme is being loaded
  isLoading: boolean;
  // Current theme colors
  colors: ThemeColors;
  // Base colors (not theme-dependent)
  baseColors: typeof BaseColors;
  // Is dark mode active
  isDark: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  // Default theme mode (defaults to 'system')
  defaultTheme?: ThemeMode;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  // MMKV reads are synchronous — no loading state needed
  const [themeMode, setThemeModeState] = React.useState<ThemeMode>(() => {
    const saved = mmkv.getString(THEME_STORAGE_KEY);
    if (saved && ['light', 'dark', 'system'].includes(saved)) return saved as ThemeMode;
    return defaultTheme;
  });
  const isLoading = false;

  const setThemeMode = React.useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    mmkv.setString(THEME_STORAGE_KEY, mode);
  }, []);

  const toggleTheme = React.useCallback(() => {
    const currentTheme = themeMode === 'system'
      ? (systemColorScheme || 'light')
      : themeMode;

    setThemeMode(currentTheme === 'dark' ? 'light' : 'dark');
  }, [themeMode, systemColorScheme, setThemeMode]);

  // Force light theme — app uses light backgrounds
  const theme = 'light' as const;

  // Get colors for current theme
  const colors = React.useMemo((): ThemeColors => {
    return theme === 'dark' ? DarkColors : LightColors;
  }, [theme]);

  const value = React.useMemo((): ThemeContextValue => ({
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
    isLoading,
    colors,
    baseColors: BaseColors,
    isDark: theme === 'dark',
  }), [theme, themeMode, setThemeMode, toggleTheme, isLoading, colors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export function useAppTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeColors(): ThemeColors & { base: typeof BaseColors } {
  const { colors, baseColors } = useAppTheme();
  return { ...colors, base: baseColors };
}

// Re-export types
export type { ThemeMode, ThemeColors };
