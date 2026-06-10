// EntityAvatar — single shared avatar renderer for athletes/brands/schools/agents.
// Resolution priority: visual-assets registry → remote URL → initials chip → default-avatar.png.

import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image, type ImageStyle } from 'expo-image';
import { SvgXml } from 'react-native-svg';
import { resolveAsset } from '@/lib/dev/datasets/visual-assets';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

export interface EntityAvatarProps {
  /** Look up VISUAL_ASSETS[entityId] first. */
  entityId?: string | null;
  /** Optional require()'d local asset (e.g. a curated chat-contact PNG). */
  localSource?: number | object | null;
  /** Remote image URL fallback. */
  remoteUrl?: string | null;
  /** Initials chip text fallback (e.g. "KA"). */
  initials?: string | null;
  /** Background color for initials chip. */
  color?: string | null;

  /** Square dimensions in px. */
  size: number;
  /** Shape — default 'circle'. */
  shape?: 'circle' | 'rounded' | 'square';
  /** Optional border. */
  borderWidth?: number;
  borderColor?: string;
  /** Optional inline style overrides. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Resolves the avatar source in priority order and renders it.
 * For SVG assets from the registry, uses <SvgXml>. For raster (require'd or
 * remote), uses expo-image. Falls back to an initials chip when nothing
 * is available.
 */
export function EntityAvatar({
  entityId,
  localSource,
  remoteUrl,
  initials,
  color,
  size,
  shape = 'circle',
  borderWidth = 0,
  borderColor,
  style,
  testID,
}: EntityAvatarProps) {
  const radius =
    shape === 'circle' ? size / 2 : shape === 'rounded' ? size * 0.22 : 0;

  const viewStyle: StyleProp<ViewStyle> = [
    {
      width: size,
      height: size,
      borderRadius: radius,
      overflow: 'hidden',
      borderWidth,
      borderColor,
    },
    style,
  ];

  const imageStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    borderWidth,
    borderColor: borderColor as string | undefined,
  };

  // 1. Try the visual-assets registry first
  const asset = resolveAsset(entityId ?? undefined);
  if (asset) {
    return (
      <View
        style={[
          viewStyle,
          styles.svgBackground,
          { backgroundColor: tintFromColor(asset.color) },
        ]}
        testID={testID}
      >
        <SvgXml xml={normalizeSvg(asset.svg)} width={size * 0.7} height={size * 0.7} />
      </View>
    );
  }

  // 2. Try the local require() source
  if (localSource) {
    return (
      <Image
        source={localSource as never}
        style={imageStyle}
        contentFit="cover"
        testID={testID}
      />
    );
  }

  // 3. Try the remote URL
  if (remoteUrl) {
    return (
      <Image
        source={{ uri: remoteUrl }}
        style={imageStyle}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={150}
        testID={testID}
      />
    );
  }

  // 4. Initials chip
  if (initials) {
    return (
      <View
        style={[
          viewStyle,
          styles.initialsContainer,
          { backgroundColor: color ?? '#6B656B' },
        ]}
        testID={testID}
      >
        <Text
          style={[
            styles.initialsText,
            { fontSize: size * (initials.length > 2 ? 0.32 : 0.4) },
          ]}
          numberOfLines={1}
        >
          {initials}
        </Text>
      </View>
    );
  }

  // 5. Last-resort: default-avatar.png
  return (
    <Image
      source={DefaultAvatarImage}
      style={imageStyle}
      contentFit="cover"
      testID={testID}
    />
  );
}

/**
 * Strip the optional XML declaration, comments, and DOCTYPE prologue from
 * an SVG string. react-native-svg's SvgXml parser silently fails to render
 * when these are present (common on Wikimedia-sourced SVGs).
 */
function normalizeSvg(svg: string): string {
  return svg
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!DOCTYPE[^>]*(\[[\s\S]*?\])?>/g, '')
    .trimStart();
}

/**
 * Background fill behind the SVG mark.
 * For dark brand colors (which most simpleicons SVGs use — black silhouette
 * by default), returns a near-white tile so the mark is legible. For light
 * or saturated brand colors, returns a low-alpha tint of the color itself.
 */
function tintFromColor(hex: string): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16) || 107;
  const g = parseInt(cleaned.slice(2, 4), 16) || 101;
  const b = parseInt(cleaned.slice(4, 6), 16) || 107;
  // Perceptual luminance — Rec. 709 coefficients
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (luminance < 64) {
    // Dark brand color (Nike #111, Adidas #000, etc.) — render on near-white
    // tile so the black silhouette SVG is legible.
    return '#F4F4F4';
  }
  return `rgba(${r}, ${g}, ${b}, 0.18)`;
}

const styles = StyleSheet.create({
  svgBackground: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontFamily: 'Lato-Black',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
