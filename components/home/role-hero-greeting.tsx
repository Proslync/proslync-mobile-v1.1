// ── ROLE HERO GREETING ────────────────────────────────────
// Per-role greeting block: eyebrow (role + date) → soft greeting verb →
// large display name in the role's pastel accent → circular profile chip.
//
// Quiet by default. The accent color carries the role signal — no big
// gradient backgrounds, no orange unless the role IS brand. Treat the
// chip border as the only colored stroke; everything else is graphite.
//
// Spec: atlas/design/2026-04-15/design-pastel-shift-2026-04-15.md
//       arshia demo-ready-2026-04-15: AthleteHomeScreen hero block

import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import { MONO_FAMILY } from '@/components/stats/tokens';
import { getRoleAccent } from '@/lib/navigation/role-accent';
import { useRole } from '@/lib/providers/role-provider';

export interface RoleHeroGreetingProps {
  greeting: string;
  name: string;
  avatarUri?: string;
  onPressProfile?: () => void;
  /** Optional override label (e.g. 'BRAND HQ', 'AD AUDIT') in the eyebrow */
  contextLabel?: string;
}

function formatDateLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function RoleHeroGreeting({
  greeting,
  name,
  avatarUri,
  onPressProfile,
  contextLabel,
}: RoleHeroGreetingProps) {
  const { role } = useRole();
  const accent = getRoleAccent(role);
  const eyebrowLeft = contextLabel ?? role.toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.eyebrow}>
          {eyebrowLeft} <Text style={styles.eyebrowDim}>·  {formatDateLabel()}</Text>
        </Text>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={[styles.name, { color: accent }]} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        onPress={onPressProfile}
        style={({ pressed }) => [
          styles.chip,
          { borderColor: accent },
          pressed && styles.chipPressed,
        ]}
      >
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <Ionicons name="person" size={20} color={accent} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 16,
  },
  textBlock: { flex: 1, gap: 4 },
  eyebrow: {
    fontFamily: MONO_FAMILY,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.55)',
  },
  eyebrowDim: { color: 'rgba(255,255,255,0.32)' },
  greeting: {
    fontFamily: Brand.fonts.body,
    fontSize: 14,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.62)',
  },
  name: {
    fontFamily: Brand.fonts.heading,
    fontSize: 28,
    lineHeight: 32,
    marginTop: 2,
  },
  chip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipPressed: { opacity: 0.86 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
});
