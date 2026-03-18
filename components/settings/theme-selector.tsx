/**
 * Theme Selector Component
 * Allows users to switch between Light, Dark, and System themes
 *
 * Usage:
 *   import { ThemeSelector } from '@/components/settings/theme-selector';
 *   <ThemeSelector />
 */

import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme, type ThemeMode } from '@/hooks/use-app-theme';

interface ThemeOptionProps {
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isSelected: boolean;
  onSelect: () => void;
  colors: {
    text: string;
    textSecondary: string;
    background: string;
    border: string;
    buttonPrimary: string;
  };
}

function ThemeOption({
  mode,
  label,
  icon,
  isSelected,
  onSelect,
  colors,
}: ThemeOptionProps) {
  return (
    <TouchableOpacity
      style={[
        styles.option,
        {
          backgroundColor: isSelected ? colors.buttonPrimary : colors.background,
          borderColor: isSelected ? colors.buttonPrimary : colors.border,
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isSelected ? '#FFFFFF' : colors.textSecondary}
      />
      <Text
        style={[
          styles.optionLabel,
          { color: isSelected ? '#FFFFFF' : colors.text },
        ]}
      >
        {label}
      </Text>
      {isSelected && (
        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  );
}

export function ThemeSelector() {
  const { themeMode, setThemeMode, colors } = useAppTheme();

  const options: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: 'light', label: 'Light', icon: 'sunny-outline' },
    { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
    { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Choose how Status looks to you
      </Text>
      <View style={styles.options}>
        {options.map((option) => (
          <ThemeOption
            key={option.mode}
            mode={option.mode}
            label={option.label}
            icon={option.icon}
            isSelected={themeMode === option.mode}
            onSelect={() => setThemeMode(option.mode)}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Simple toggle for dark mode (for use in header/toolbar)
 */
export function DarkModeToggle() {
  const { isDark, toggleTheme, colors } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[styles.toggle, { backgroundColor: isDark ? undefined : colors.backgroundSecondary, overflow: 'hidden' as const }]}
      activeOpacity={0.7}
    >
      {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={20} style={StyleSheet.absoluteFillObject} />}
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={22}
        color={colors.text}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginBottom: 16,
  },
  options: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
  },
  toggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
