// ── EMPTY DEALS STATE ─────────────────────────────────────
// Persona-aware empty state for deal lists. Wraps `EmptyState` with
// per-persona copy + icon + role-tinted illustration ring + a
// copper-CTA so the empty surface still has one clear next action.
//
// Each persona sees the right framing:
//   athlete    → "No offers yet — make a profile post"
//   brand      → "No athletes match — broaden filters"
//   agent      → "No deals in motion — log a campaign"
//   coach      → "No NIL activity — invite athletes"
//   nilManager → "No deals to review — queue is clear"
//   school     → "No items in the approval queue"
//   fan        → "No drops yet — follow more athletes"
//
// Pass `cta` to override the default action label/handler.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from './empty-state';
import { RoleSurface } from '@/constants/colors';
import { Brand } from '@/constants/brand';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { ProfileRole } from '@/lib/providers/role-provider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface PersonaEmptyMeta {
  icon: IconName;
  title: string;
  body: string;
  ctaLabel: string;
}

const PERSONA_META: Record<ProfileRole, PersonaEmptyMeta> = {
  player: {
    icon: 'megaphone-outline',
    title: 'No offers yet',
    body: 'Brands look for athletes who post. Share what you do; the deals follow.',
    ctaLabel: 'Make a profile post',
  },
  brand: {
    icon: 'search-outline',
    title: 'No athletes match',
    body: 'Try widening your filters — sport, region, or audience size.',
    ctaLabel: 'Broaden filters',
  },
  agent: {
    icon: 'briefcase-outline',
    title: 'No deals in motion',
    body: 'Log a campaign or open a slot for one of your athletes.',
    ctaLabel: 'Log a campaign',
  },
  coach: {
    icon: 'people-outline',
    title: 'No NIL activity yet',
    body: 'Invite athletes on the roster to enable NIL visibility.',
    ctaLabel: 'Invite roster',
  },
  school: {
    icon: 'school-outline',
    title: 'Approval queue is clear',
    body: 'No items pending. Audit packets stay one tap away.',
    ctaLabel: 'View audit packet',
  },
  fan: {
    icon: 'sparkles-outline',
    title: 'No drops yet',
    body: 'Follow more athletes to see their offers, content, and live drops.',
    ctaLabel: 'Find athletes',
  },
  collective: {
    icon: 'people-circle-outline',
    title: 'No deals in pipeline',
    body: 'Fund a deal to start the clearance pipeline. VBP packets move through NIL Go faster.',
    ctaLabel: 'Start a deal',
  },
};

// Map ProfileRole → RoleSurface key (player → athlete).
function roleAccentKey(role: ProfileRole): keyof typeof RoleSurface {
  if (role === 'player') return 'athlete';
  return role as keyof typeof RoleSurface;
}

export interface EmptyDealsStateProps {
  role: ProfileRole;
  /** Override the default copy. */
  title?: string;
  body?: string;
  /** Override the CTA — pass `null` to suppress, omit to use default. */
  cta?: { label: string; onPress: () => void } | null;
  /** Override the default icon. */
  icon?: IconName;
}

export function EmptyDealsState({
  role,
  title,
  body,
  cta,
  icon,
}: EmptyDealsStateProps) {
  const { colors } = useAppTheme();
  const surface = RoleSurface[roleAccentKey(role)];
  const meta = PERSONA_META[role];

  // If caller passed `cta: undefined`, fall back to the per-persona CTA
  // string but with no handler — render as a static label hint instead
  // of an interactive button. Pass `cta: null` to suppress entirely.
  const showCta = cta !== null;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.illustration,
          {
            backgroundColor: surface.surface,
            borderColor: surface.border,
          },
        ]}
      >
        <Ionicons
          name={icon ?? meta.icon}
          size={36}
          color={surface.text}
        />
      </View>

      <EmptyState
        icon="ellipse-outline"
        title={title ?? meta.title}
        body={body ?? meta.body}
      />

      {showCta && cta ? (
        <Pressable
          onPress={cta.onPress}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: Brand.colors.copper },
            pressed && { opacity: 0.85 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={cta.label}
        >
          <Text style={[styles.ctaLabel, { color: colors.textInverse }]}>{cta.label}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  illustration: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
  },
  ctaLabel: {
    fontFamily: Typography.callout.fontFamily,
    fontSize: Typography.callout.fontSize,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
