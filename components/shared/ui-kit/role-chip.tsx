// ── ROLE CHIP ─────────────────────────────────────────────
// Quiet identity marker that shows which persona is currently
// active. Maps to RoleAccent (constants/brand.ts). Emphasis
// stays in typography — never in a pastel fill. Three variants:
//   subtle  (default) — accent tint on cardElevated
//   outline           — transparent fill, accent border
//   solid             — full accent fill (use sparingly)
//
// Spec: atlas/design/2026-04-15/design-pastel-shift-2026-04-15.md

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, RoleAccent, type Role } from '@/constants/brand';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAppTheme } from '@/hooks/use-app-theme';

export type RoleChipSize = 'sm' | 'md';
export type RoleChipVariant = 'subtle' | 'outline' | 'solid';

export interface RoleChipProps {
  role: Role;
  /** Overrides the default capitalized role label. */
  label?: string;
  size?: RoleChipSize;
  variant?: RoleChipVariant;
  /** Optional leading icon — small SF Symbol / Ionicons / etc. */
  icon?: React.ReactNode;
}

// ── helpers ────────────────────────────────────────────────
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Friendly default label. Handles compound keys like `nilManager`
// → "NIL Manager" defensively even though Role doesn't include
// them today, so additions to RoleAccent don't read as "Nilmanager".
function defaultLabelFor(role: string): string {
  const knownAcronyms: Record<string, string> = {
    nilManager: 'NIL Manager',
    nilmanager: 'NIL Manager',
  };
  if (knownAcronyms[role]) return knownAcronyms[role];
  // camelCase → "Camel Case", then capitalize.
  const spaced = role.replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// ── component ──────────────────────────────────────────────
export function RoleChip({
  role,
  label,
  size = 'sm',
  variant = 'subtle',
  icon,
}: RoleChipProps) {
  const { colors } = useAppTheme();
  const accent = RoleAccent[role];
  const resolvedLabel = label ?? defaultLabelFor(role);

  const isSm = size === 'sm';
  const typeStyle = isSm ? Typography.micro : Typography.caption;
  const paddingHorizontal = isSm ? Spacing.sm : Spacing.md;
  const paddingVertical = Spacing.xs;

  // Variant-specific surface + text resolution.
  let backgroundColor: string;
  let borderColor: string;
  let borderWidth: number;
  let textColor: string;

  if (variant === 'solid') {
    backgroundColor = accent;
    borderColor = accent;
    borderWidth = StyleSheet.hairlineWidth;
    textColor = colors.textInverse;
  } else if (variant === 'outline') {
    backgroundColor = 'transparent';
    borderColor = accent;
    borderWidth = 1.5;
    textColor = colors.text;
  } else {
    // subtle: 12% accent overlay on cardElevated, 20% border.
    backgroundColor = withAlpha(accent, 0.12);
    borderColor = withAlpha(accent, 0.2);
    borderWidth = 1;
    textColor = colors.text;
  }

  // Hint TS that micro's textTransform literal is preserved.
  const textStyle = {
    ...typeStyle,
    color: textColor,
    fontFamily: Brand.fonts.body,
  };

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor,
          borderColor,
          borderWidth,
          paddingHorizontal,
          paddingVertical,
          // subtle stacks tint on top of cardElevated; underlay it so the
          // tint reads consistently against any parent background.
          ...(variant === 'subtle'
            ? { backgroundColor: colors.cardElevated }
            : null),
        },
      ]}
    >
      {/* subtle overlay tint — only on `subtle` variant */}
      {variant === 'subtle' ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: withAlpha(accent, 0.12),
              borderRadius: Radius.pill,
            },
          ]}
        />
      ) : null}
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={textStyle} numberOfLines={1}>
        {resolvedLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: Spacing.xs,
    overflow: 'hidden',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
