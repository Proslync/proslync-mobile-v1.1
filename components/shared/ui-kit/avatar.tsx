// ── AVATAR ────────────────────────────────────────────────
// Persona avatar with image, initials fallback, optional role tint,
// and an optional presence status dot. We've been re-implementing
// this in deal cards, chat rows, network lists, and applicant rows
// — this is the canonical version.

import * as React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { Brand, type Role } from '@/constants/brand';
import { RoleSurface } from '@/constants/colors';
import { Typography } from '@/constants/typography';
import { useAppTheme } from '@/hooks/use-app-theme';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'live' | 'idle' | 'offline';

export interface AvatarProps {
  name: string;
  imageUrl?: string;
  role?: Role;
  size?: AvatarSize;
  status?: AvatarStatus;
}

const DIAMETER: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

// Brand.signal exposes success / info / danger / neutral but no
// `warning` member; the comment in brand.ts is explicit that copper
// IS the warning signal. Build an idle (warning-equivalent) tint
// from the copper scale to honour that.
const STATUS_COLOR: Record<AvatarStatus, string> = {
  live: Brand.signal.success.mid,
  idle: Brand.copperScale[400],
  offline: Brand.signal.neutral.mid,
};

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0] ?? '';
  const last = parts[parts.length - 1][0] ?? '';
  return `${first}${last}`.toUpperCase();
}

export function Avatar({
  name,
  imageUrl,
  role,
  size = 'md',
  status,
}: AvatarProps) {
  const { colors } = useAppTheme();
  const [imageFailed, setImageFailed] = React.useState(false);

  const diameter = DIAMETER[size];
  const roleSurface = role ? RoleSurface[role] : undefined;

  const showImage = !!imageUrl && !imageFailed;

  const backgroundColor = roleSurface?.surface ?? colors.cardElevated;
  const borderColor = roleSurface?.border ?? colors.border;
  const textColor = roleSurface?.accent ?? colors.text;

  const initialsTypography: TextStyle =
    size === 'xs' || size === 'sm' ? Typography.caption : Typography.title;

  const container: ViewStyle = {
    width: diameter,
    height: diameter,
    borderRadius: diameter / 2,
    backgroundColor,
    borderColor,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const imageStyle: ImageStyle = {
    width: diameter,
    height: diameter,
    borderRadius: diameter / 2,
  };

  // Status dot sits ON TOP of the rounded container, so the wrapper
  // must NOT clip it. Inner view does the clipping for image/initials.
  const dotSize = Math.round(diameter * 0.25);
  const dotRing = 2;

  return (
    <View
      style={{ width: diameter, height: diameter }}
      accessibilityLabel={name}
    >
      <View style={container}>
        {showImage ? (
          <Image
            source={{ uri: imageUrl }}
            style={imageStyle}
            onError={() => setImageFailed(true)}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text
            numberOfLines={1}
            style={[initialsTypography, { color: textColor, fontWeight: '900' }]}
          >
            {initialsFor(name)}
          </Text>
        )}
      </View>

      {status ? (
        <View
          style={[
            styles.statusDot,
            {
              width: dotSize + dotRing * 2,
              height: dotSize + dotRing * 2,
              borderRadius: (dotSize + dotRing * 2) / 2,
              backgroundColor: colors.background,
            },
          ]}
        >
          <View
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor:
                status === 'offline'
                  ? colors.textTertiary
                  : STATUS_COLOR[status],
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  statusDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
