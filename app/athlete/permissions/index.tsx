// ── ATHLETE PERMISSIONS LIST ──────────────────────────────
// Sprint 3.7 (PLAN §3.7) — list of an athlete's outbound permission
// grants. Hero StatPill row (Active / Pending / Paused / Revoked),
// then a section per ConsentLevel (Full / Summary / Withheld). Each
// card taps through to `app/athlete/permissions/[id]`.
//
// Deep-link target: `proslync://athlete/permissions?athleteId=a-1`.
// Default athlete is `a-1` (Kiyan Anthony) so the demo deep-link
// works without a query param.

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  PermissionGrantCard,
} from '@/components/permissions/permission-grant-card';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { StatPill, TONE_COLOR } from '@/components/shared/ui-kit';
import { useAthletePermissionGrants } from '@/hooks/use-permission-grants';
import { BRAND_ATHLETES } from '@/lib/data/mock-brand-data';
import type { ConsentLevel } from '@/lib/data/mock-nil-manager-data';
import type { PermissionGrant } from '@/lib/types/permission-grant.types';

const DEFAULT_ATHLETE_ID = 'a-1';

const LEVEL_SECTIONS: readonly {
  level: ConsentLevel;
  label: string;
  blurb: string;
  tint: string;
}[] = [
  {
    level: 'full',
    label: 'Full access',
    blurb: 'Grantee may read everything in their assigned scopes.',
    tint: TONE_COLOR.success,
  },
  {
    level: 'summary',
    label: 'Summary only',
    blurb: 'Aggregates and counts only — no individual rows or amounts.',
    tint: TONE_COLOR.accent,
  },
  {
    level: 'withheld',
    label: 'Withheld',
    blurb: 'No reads allowed, even if a scope intersects. Recorded for the audit story.',
    tint: TONE_COLOR.muted,
  },
];

function normalizeParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function AthletePermissionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ athleteId?: string }>();
  const athleteId = normalizeParam(params.athleteId) ?? DEFAULT_ATHLETE_ID;
  const insets = useSafeAreaInsets();

  const { data: grants, isLoading } = useAthletePermissionGrants(athleteId);
  const athlete = React.useMemo(
    () => BRAND_ATHLETES.find((a) => a.id === athleteId),
    [athleteId],
  );

  const counts = React.useMemo(() => {
    const c = { active: 0, pending: 0, paused: 0, revoked: 0, expired: 0 };
    (grants ?? []).forEach((g) => {
      c[g.status] += 1;
    });
    return c;
  }, [grants]);

  const onBack = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/athlete');
    }
  }, [router]);

  const onTapGrant = React.useCallback(
    (grant: PermissionGrant) => {
      router.push({
        pathname: '/athlete/permissions/[id]',
        params: { id: grant.id },
      });
    },
    [router],
  );

  const grantsByLevel = React.useMemo(() => {
    const map: Record<ConsentLevel, PermissionGrant[]> = {
      full: [],
      summary: [],
      withheld: [],
    };
    (grants ?? []).forEach((g) => {
      map[g.level].push(g);
    });
    return map;
  }, [grants]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <DarkGradientBg />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
          ]}
        >
          <View style={styles.topRow}>
            <Pressable
              onPress={onBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={styles.flex}>
              <Text style={styles.kicker}>Who has access</Text>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {athlete ? `${athlete.name} · Permissions` : 'Permissions'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatPill value={String(counts.active)} label="Active" tint={TONE_COLOR.success} size="sm" />
            <StatPill value={String(counts.pending)} label="Pending" tint={TONE_COLOR.info} size="sm" />
            <StatPill value={String(counts.paused)} label="Paused" tint={TONE_COLOR.warning} size="sm" />
            <StatPill value={String(counts.revoked)} label="Revoked" tint={TONE_COLOR.danger} size="sm" />
          </View>

          {isLoading && !grants ? (
            <View style={styles.emptyBox}>
              <Ionicons name="hourglass-outline" size={28} color="rgba(255,255,255,0.62)" />
              <Text style={styles.emptyTitle}>Loading grants</Text>
            </View>
          ) : (grants ?? []).length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="lock-closed-outline" size={28} color="rgba(255,255,255,0.62)" />
              <Text style={styles.emptyTitle}>No grants yet</Text>
              <Text style={styles.emptyBody}>
                Once this athlete grants access to a role, an individual, or an organization,
                the grant appears here with a full audit trail.
              </Text>
            </View>
          ) : (
            <View style={styles.sections}>
              {LEVEL_SECTIONS.map((section) => {
                const items = grantsByLevel[section.level];
                if (items.length === 0) return null;
                return (
                  <View key={section.level} style={styles.section}>
                    <View style={styles.sectionHead}>
                      <View style={[styles.sectionDot, { backgroundColor: section.tint }]} />
                      <Text style={styles.sectionTitle}>{section.label}</Text>
                      <Text style={styles.sectionCount}>{items.length}</Text>
                    </View>
                    <Text style={styles.sectionBlurb}>{section.blurb}</Text>
                    <View style={styles.cardCol}>
                      {items.map((g) => (
                        <PermissionGrantCard
                          key={g.id}
                          grant={g}
                          onPress={onTapGrant}
                        />
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    gap: 18,
    paddingHorizontal: 16,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  flex: { flex: 1 },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  kicker: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 26,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyBox: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 28,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  emptyBody: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'center',
  },
  sections: {
    gap: 22,
  },
  section: {
    gap: 8,
  },
  sectionHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    flex: 1,
  },
  sectionCount: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 12,
    fontWeight: '900',
  },
  sectionBlurb: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 4,
  },
  cardCol: {
    gap: 10,
  },
});
