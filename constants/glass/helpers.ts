import type { ViewStyle, TextStyle } from 'react-native';
import {
  glassFill,
  glassBorder,
  radius,
  shadow,
  textColor,
  fontFamily,
} from './tokens';
import type {
  GlassCardStyleOptions,
  GlassButtonStyleOptions,
  GlassTextStyleOptions,
} from './types';

export function glassCardStyle(options: GlassCardStyleOptions = {}): ViewStyle {
  const {
    fill = 'subtle',
    border = 'subtle',
    cornerRadius = 'xl',
    shadowLevel = 'xl',
  } = options;

  const borderToken = glassBorder[border];

  return {
    backgroundColor: `rgba(255, 255, 255, ${glassFill[fill]})`,
    borderRadius: radius[cornerRadius],
    borderWidth: borderToken.borderWidth,
    borderColor: `rgba(255, 255, 255, ${borderToken.opacity})`,
    overflow: 'hidden' as const,
    ...shadow[shadowLevel],
  };
}

export function glassButtonStyle(options: GlassButtonStyleOptions = {}): ViewStyle {
  const {
    fill = 'medium',
    border = 'medium',
    cornerRadius = 'sm',
  } = options;

  const borderToken = glassBorder[border];

  return {
    backgroundColor: `rgba(255, 255, 255, ${glassFill[fill]})`,
    borderRadius: radius[cornerRadius],
    borderWidth: borderToken.borderWidth,
    borderColor: `rgba(255, 255, 255, ${borderToken.opacity})`,
  };
}

export function glassTextStyle(options: GlassTextStyleOptions = {}): TextStyle {
  const {
    hierarchy = 'primary',
    weight = 'regular',
    size = 16,
  } = options;

  return {
    color: textColor[hierarchy],
    fontFamily: fontFamily[weight],
    fontSize: size,
  };
}

export function absoluteFill(): ViewStyle {
  return {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };
}

export function sheetBackgroundStyle(): ViewStyle {
  return {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    ...absoluteFill(),
  };
}
