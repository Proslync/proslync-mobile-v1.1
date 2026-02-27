import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import {
  blur as blurTokens,
  glassFill as glassFillTokens,
  glassBorder as glassBorderTokens,
  radius as radiusTokens,
  shadow as shadowTokens,
  fontFamily,
  accent,
} from '@/constants/glass/tokens';
import { absoluteFill } from '@/constants/glass/helpers';
import { buttonPress } from '@/constants/glass/animations';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { GlassButtonVariant, GlassButtonSize } from '@/constants/glass/types';

const sizeMap: Record<GlassButtonSize, { height: number; fontSize: number; paddingH: number }> = {
  sm: { height: 36, fontSize: 13, paddingH: 14 },
  md: { height: 44, fontSize: 15, paddingH: 18 },
  lg: { height: 48, fontSize: 16, paddingH: 22 },
};

interface VariantConfig {
  fillOpacity: number;
  borderOpacity: number;
  blurIntensity: number;
  useFrostedFill: boolean;
}

interface ThemedVariantConfig extends VariantConfig {
  blurTint: 'light' | 'dark';
  textColor: string;
  frostedBg: string;
}

const baseVariantConfigs: Record<GlassButtonVariant, VariantConfig> = {
  glass: {
    fillOpacity: 1,
    borderOpacity: 0,
    blurIntensity: 0,
    useFrostedFill: true,
  },
  frosted: {
    fillOpacity: 1,
    borderOpacity: 0,
    blurIntensity: 0,
    useFrostedFill: true,
  },
  accent: {
    fillOpacity: 1,
    borderOpacity: 0,
    blurIntensity: 0,
    useFrostedFill: false,
  },
  danger: {
    fillOpacity: 1,
    borderOpacity: 0,
    blurIntensity: 0,
    useFrostedFill: false,
  },
};

function getThemedConfig(variant: GlassButtonVariant, isDark: boolean): ThemedVariantConfig {
  const base = baseVariantConfigs[variant];

  if (variant === 'danger') {
    return {
      ...base,
      blurTint: isDark ? 'dark' : 'light',
      textColor: '#ffffff',
      frostedBg: accent.red,
    };
  }

  // For glass, frosted, accent variants
  return {
    ...base,
    blurTint: isDark ? 'dark' : 'light',
    textColor: isDark ? '#ffffff' : '#1a1a1a',
    frostedBg: isDark ? 'rgba(255, 255, 255, 0.15)' : '#D3D3D3',
  };
}

interface GlassButtonProps {
  label: string;
  icon?: React.ReactNode;
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

/**
 * Animated touchable with glass variants and press animation.
 * Automatically adapts to light/dark theme.
 * - glass: translucent blur (follow buttons)
 * - frosted: opaque blur (inverted-button CTA)
 * - accent: solid color (primary CTA)
 * - danger: solid red (stop/delete)
 */
export function GlassButton({
  label,
  icon,
  variant = 'glass',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: GlassButtonProps) {
  const { isDark } = useAppTheme();
  const scale = useSharedValue(1);
  const config = getThemedConfig(variant, isDark);
  const sizeConfig = sizeMap[size];

  const handlePress = () => {
    if (disabled || loading) return;
    buttonPress.sequence(scale);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isAccentVariant = variant === 'accent';
  const isDangerVariant = variant === 'danger';
  const isSolidVariant = isAccentVariant || isDangerVariant;

  const containerStyle: ViewStyle = {
    height: sizeConfig.height,
    borderRadius: radiusTokens.md,
    overflow: 'hidden' as const,
    ...(isSolidVariant
      ? {
          backgroundColor: isDangerVariant ? accent.red : config.frostedBg,
        }
      : {
          backgroundColor: config.frostedBg,
        }),
    ...shadowTokens.md,
    opacity: disabled ? 0.5 : 1,
  };

  const textStyle: TextStyle = {
    fontSize: sizeConfig.fontSize,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.5,
    color: config.textColor,
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={disabled ? 1 : 0.9}
      disabled={disabled || loading}
      style={fullWidth ? styles.fullWidth : undefined}
    >
      <Animated.View
        style={[containerStyle, fullWidth && styles.fullWidth, style, animatedStyle]}
      >
        {/* Blur layer (glass / frosted only) */}
        {!isSolidVariant && config.blurIntensity > 0 && (
          <BlurView
            intensity={config.blurIntensity}
            tint={config.blurTint}
            style={styles.absolute}
          />
        )}

        {/* Fill layer */}
        {!isSolidVariant && (
          <View
            style={[
              styles.absolute,
              {
                backgroundColor: config.useFrostedFill
                  ? config.frostedBg
                  : `rgba(255, 255, 255, ${config.fillOpacity})`,
              },
            ]}
          />
        )}

        {/* Content */}
        <View style={[styles.content, { paddingHorizontal: sizeConfig.paddingH }]}>
          {loading ? (
            <ActivityIndicator color={config.textColor} size="small" />
          ) : (
            <>
              {icon && <View style={styles.icon}>{icon}</View>}
              <Text style={textStyle}>{label}</Text>
            </>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    flex: 1,
  },
  absolute: absoluteFill(),
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
});
