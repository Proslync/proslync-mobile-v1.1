/**
 * Color system for Status app
 * Mirrors the frontend web app theming approach
 *
 * Usage:
 *   import { Colors } from '@/constants/colors';
 *   import { useAppTheme } from '@/hooks/use-app-theme';
 *
 *   const { colors } = useAppTheme();
 *   <View style={{ backgroundColor: colors.background }} />
 */

// Base colors (not theme-dependent)
export const BaseColors = {
  // Brand colors
  primary: '#FFFFFF',       // White — liquid glass palette
  primaryLight: '#FFFFFF',
  primaryDark: '#E0E0E0',

  // Status colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#FFFFFF',

  // Social
  like: '#FF3B30',

  // Transparent
  transparent: 'transparent',

  // Overlay colors
  overlay: {
    light: 'rgba(255, 255, 255, 0.5)',
    medium: 'rgba(255, 255, 255, 0.7)',
    dark: 'rgba(0, 0, 0, 0.5)',
    heavy: 'rgba(0, 0, 0, 0.7)',
  },

  // Glass effects (for blur views)
  glass: {
    light: 'rgba(255, 255, 255, 0.8)',
    lightSubtle: 'rgba(255, 255, 255, 0.6)',
    dark: 'rgba(15, 9, 12, 0.56)',
    darkSubtle: 'rgba(15, 9, 12, 0.4)',
  },
} as const;

// Light theme colors
export const LightColors = {
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: '#EBEBEB',

  // Card backgrounds
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  // Text
  text: '#1A1A1A',
  textSecondary: 'rgba(0, 0, 0, 0.55)',
  textTertiary: 'rgba(0, 0, 0, 0.4)',
  textInverse: '#FFFFFF',

  // Borders
  border: 'rgba(0, 0, 0, 0.08)',
  borderStrong: 'rgba(0, 0, 0, 0.15)',

  // Input
  input: '#F5F5F5',
  inputBorder: 'rgba(0, 0, 0, 0.1)',
  inputFocusBorder: 'rgba(0, 0, 0, 0.3)',
  placeholder: 'rgba(0, 0, 0, 0.4)',

  // Buttons
  buttonPrimary: '#1A1A1A',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#E0E0E0',
  buttonSecondaryText: 'rgba(0, 0, 0, 0.7)',
  buttonDisabled: '#E0E0E0',
  buttonDisabledText: 'rgba(0, 0, 0, 0.3)',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarBorder: 'rgba(0, 0, 0, 0.08)',
  tabIconDefault: '#687076',
  tabIconSelected: '#1A1A1A',

  // Sidebar / Bottom sheet
  sidebar: '#FFFFFF',
  sidebarBorder: 'rgba(0, 0, 0, 0.08)',

  // Shadows
  shadow: '#000000',
  shadowOpacity: 0.1,

  // Skeleton loading
  skeleton: '#E0E0E0',
  skeletonHighlight: '#F5F5F5',

  // Separator
  separator: 'rgba(0, 0, 0, 0.08)',

  // Icon colors
  icon: '#687076',
  iconSecondary: 'rgba(0, 0, 0, 0.4)',

  // Verified badge
  verified: '#FF6F3C',

  // Proslync brand
  accent: '#FF6F3C',
  grayNeutral: '#A9A9A9',

  // Map
  mapOverlay: 'rgba(255, 255, 255, 0.9)',
} as const;

// Dark theme colors (matching frontend's dark theme)
export const DarkColors = {
  // Backgrounds
  background: '#121212',
  backgroundSecondary: '#1E1E1E',
  backgroundTertiary: '#2A2A2A',

  // Card backgrounds
  card: 'rgba(255, 255, 255, 0.03)',
  cardElevated: 'rgba(255, 255, 255, 0.06)',

  // Text
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  textInverse: '#1A1A1A',

  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(255, 255, 255, 0.2)',

  // Input
  input: 'rgba(255, 255, 255, 0.06)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  inputFocusBorder: 'rgba(255, 255, 255, 0.3)',
  placeholder: 'rgba(255, 255, 255, 0.4)',

  // Buttons
  buttonPrimary: '#FFFFFF',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: 'rgba(255, 255, 255, 0.1)',
  buttonSecondaryText: '#FFFFFF',
  buttonDisabled: 'rgba(255, 255, 255, 0.1)',
  buttonDisabledText: 'rgba(255, 255, 255, 0.3)',

  // Tab bar
  tabBar: '#0F090C',
  tabBarBorder: 'rgba(255, 255, 255, 0.1)',
  tabIconDefault: '#9BA1A6',
  tabIconSelected: '#FFFFFF',

  // Sidebar / Bottom sheet
  sidebar: 'rgba(15, 9, 12, 0.56)',  // From frontend glass effect
  sidebarBorder: '#B86E9F',          // Pink accent from frontend

  // Shadows
  shadow: '#000000',
  shadowOpacity: 0.3,

  // Skeleton loading
  skeleton: 'rgba(255, 255, 255, 0.1)',
  skeletonHighlight: 'rgba(255, 255, 255, 0.15)',

  // Separator
  separator: 'rgba(255, 255, 255, 0.1)',

  // Icon colors
  icon: '#9BA1A6',
  iconSecondary: 'rgba(255, 255, 255, 0.5)',

  // Verified badge
  verified: '#FF6F3C',

  // Proslync brand
  accent: '#FF6F3C',
  grayNeutral: '#A9A9A9',

  // Map
  mapOverlay: 'rgba(15, 9, 12, 0.8)',
} as const;

// Combined colors object for easy access
export const Colors = {
  base: BaseColors,
  light: LightColors,
  dark: DarkColors,
} as const;

// Type exports
export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColors = typeof LightColors;
