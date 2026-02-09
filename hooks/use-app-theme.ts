/**
 * Re-export theme hooks for convenience
 *
 * Usage:
 *   import { useAppTheme, useThemeColors } from '@/hooks/use-app-theme';
 *
 *   // Full theme context
 *   const { theme, toggleTheme, colors, isDark } = useAppTheme();
 *
 *   // Just colors
 *   const colors = useThemeColors();
 */

export { useAppTheme, useThemeColors } from '@/lib/providers/theme-provider';
export type { ThemeMode, ThemeColors } from '@/lib/providers/theme-provider';
