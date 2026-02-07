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
import type { GlassButtonVariant, GlassButtonSize } from '@/constants/glass/types';

// ── Size map ──────────────────────────────────────────────────────────
const sizeMap: Record<GlassButtonSize, { height: number; fontSize: number; paddingH: number }> = {
  sm: { height: 36, fontSize: 13, paddingH: 14 },
  md: { height: 44, fontSize: 15, paddingH: 18 },
  lg: { height: 48, fontSize: 16, paddingH: 22 },
};

// ── Variant configs ───────────────────────────────────────────────────
interface VariantConfig {
  fillOpacity: number;
  borderOpacity: number;
  blurIntensity: number;
  blurTint: 'light' | 'dark';
  textColor: string;
  useFrostedFill: boolean;
  frostedBg?: string;
}

const variantConfigs: Record<GlassButtonVariant, VariantConfig> = {
  glass: {
    fillOpacity: 1,
    borderOpacity: 0,
    blurIntensity: 0,
    blurTint: 'light',
    textColor: '#1a1a1a',
    useFrostedFill: true,
    frostedBg: '#D3D3D3',
  },
  frosted: {
    fillOpacity: 1,
    borderOpacity: 0,
    blurIntensity: 0,
    blurTint: 'light',
    textColor: '#1a1a1a',
    useFrostedFill: true,
    frostedBg: '#D3D3D3',
  },
  accent: {
    fillOpacity: 1,
    borderOpacity: 0,
    blurIntensity: 0,
    blurTint: 'light',
    textColor: '#1a1a1a',
    useFrostedFill: false,
  },
  danger: {
    fillOpacity: 1,
    borderOpacity: 0,
    blurIntensity: 0,
    blurTint: 'light',
    textColor: '#ffffff',
    useFrostedFill: false,
  },
};

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
 * - glass: translucent dark blur (follow buttons)
 * - frosted: opaque white blur (inverted-button CTA)
 * - accent: solid blue (primary CTA)
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
  const scale = useSharedValue(1);
  const config = variantConfigs[variant];
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
          backgroundColor: isAccentVariant ? '#D3D3D3' : accent.red,
        }
      : {
          backgroundColor: '#D3D3D3',
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
