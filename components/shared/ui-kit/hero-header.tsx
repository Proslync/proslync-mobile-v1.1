// ── HERO HEADER ───────────────────────────────────────────
// Editorial title block. Replaces the ad-hoc eyebrow + title +
// subtitle pattern that's been recreated screen-by-screen. The
// critical rule is content-driven typography: the title size is
// picked from `title.length`, not from a prop — this is what
// stops "Syracuse University" wrapping across three lines.

import * as React from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';

import { Brand, type Role } from '@/constants/brand';
import { RoleSurface } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAppTheme } from '@/hooks/use-app-theme';

export interface HeroHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  role?: Role;
  align?: 'left' | 'center';
  rightSlot?: React.ReactNode;
}

// Content-length → typography. Smaller titles get more weight; long
// titles drop down to title size so they stay on one line on iPhone.
function pickTitleStyle(title: string): TextStyle {
  if (title.length <= 14) return Typography.display;
  if (title.length <= 28) return Typography.heading;
  return Typography.title;
}

export function HeroHeader({
  eyebrow,
  title,
  subtitle,
  role,
  align = 'left',
  rightSlot,
}: HeroHeaderProps) {
  const { colors } = useAppTheme();
  const titleStyle = pickTitleStyle(title);
  const accent = role ? RoleSurface[role].accent : undefined;
  const isCenter = align === 'center';

  return (
    <View style={styles.container}>
      {accent ? (
        <View style={[styles.roleBand, { backgroundColor: accent }]} />
      ) : null}

      <View style={[styles.block, accent ? { marginTop: Spacing.lg } : null]}>
        {eyebrow ? (
          <Text
            numberOfLines={1}
            style={[
              Typography.micro,
              styles.eyebrow,
              { color: Brand.copperScale[400] },
              isCenter ? styles.centerText : null,
            ]}
          >
            {eyebrow}
          </Text>
        ) : null}

        <View style={[styles.titleRow, isCenter ? styles.centerRow : null]}>
          <Text
            style={[
              titleStyle,
              { color: colors.text, flexShrink: 1 },
              isCenter ? styles.centerText : null,
            ]}
          >
            {title}
          </Text>
          {rightSlot ? (
            <View style={styles.rightSlot}>{rightSlot}</View>
          ) : null}
        </View>

        {subtitle ? (
          <Text
            style={[
              Typography.callout,
              styles.subtitle,
              { color: colors.textSecondary },
              isCenter ? styles.centerText : null,
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.lg,
  },
  roleBand: {
    height: 2,
    width: '100%',
  },
  block: {
    flexDirection: 'column',
  },
  eyebrow: {
    marginBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  centerRow: {
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  rightSlot: {
    flexShrink: 0,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
});
