// ── AthleteDetailSheet ─────────────────────────────────────
// Bottom-sheet detail for a demo athlete, opened from any fan-side athlete
// tap (MY ATHLETES rows, roster chips, "Back a teammate" prompt). Reuses the
// FanHomeFeed Modal / scrim / slide-up pattern and the shared ui-kit tokens.
//
// Data source: the caller passes a lightweight `FanAthlete` shape (id + name +
// sport/school where known). The sheet hydrates richer fields from
// `lib/data/demo-roster.ts` via `rosterId` and, where the id maps, pulls a
// cross-platform reach packet from `lib/data/mock-social-reach.ts`. Everything
// degrades to a clean empty/derived state when a fixture is absent.
//
// Honest DEMO labeling: the "Support" CTA does not move money in the demo — it
// states so plainly. "View profile" is intentionally NOT a route to
// `/user/[username]` (backend-only; won't resolve demo athletes) — it surfaces
// the same honest note instead.

import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IdentityAvatar } from '@/components/shared/identity-avatar';
import { getAthlete } from '@/lib/data/demo-roster';
import { getMockAthleteSocialReach } from '@/lib/data/mock-social-reach';
import {
  ACCENT,
  HAIRLINE,
  HAIRLINE_SUBTLE,
  RADIUS_CARD,
  RADIUS_LG,
  SP_LG,
  SP_MD,
  SP_SM,
  SP_XS,
  SURFACE,
  SURFACE_RAISED,
  SURFACE_SUBTLE,
  TEXT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  WEIGHT,
} from '@/components/shared/ui-kit/tokens';

// ── Public shape — what a caller hands the sheet ──────────────────────────
export interface FanAthlete {
  /** Stable list id (e.g. FAN_FOLLOWING `f-3`). */
  id: string;
  name: string;
  /** Sport label if the caller already has one. */
  sport?: string;
  /** School / class line if the caller already has one. */
  school?: string;
  /** Bridge into `DEMO_ATHLETES` for rich hydration. */
  rosterId?: string;
  /** Bridge into the social-reach fixture map. */
  reachId?: string;
  /** Fallback initials / accent for the avatar. */
  initials?: string;
  accent?: string;
}

interface AthleteDetailSheetProps {
  athlete: FanAthlete | null;
  visible: boolean;
  onClose: () => void;
}

const SPORT_LABEL: Record<string, string> = {
  MBB: "Men's Basketball",
  WBB: "Women's Basketball",
  Football: 'Football',
  Gymnastics: 'Gymnastics',
  Volleyball: 'Volleyball',
  Baseball: 'Baseball',
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `${n}`;
}

export function AthleteDetailSheet({ athlete, visible, onClose }: AthleteDetailSheetProps) {
  // Hydrate richer data from the demo roster via the id bridge.
  const roster = athlete?.rosterId ? getAthlete(athlete.rosterId) : undefined;
  const reach = athlete?.reachId ? getMockAthleteSocialReach(athlete.reachId) : null;

  const [supported, setSupported] = React.useState(false);
  // Reset the local "supported" affordance whenever a new athlete opens.
  React.useEffect(() => {
    if (visible) setSupported(false);
  }, [visible, athlete?.id]);

  if (!athlete) return null;

  const name = roster?.name ?? athlete.name;
  const initials = roster?.initials ?? athlete.initials ?? name.slice(0, 2).toUpperCase();
  const accent = roster?.accent ?? athlete.accent ?? ACCENT;

  // sport · school · class line — prefer roster, fall back to caller-provided.
  const sportLabel = roster ? (SPORT_LABEL[roster.sport] ?? roster.sport) : athlete.sport;
  const schoolLabel = roster?.school ?? athlete.school;
  const numberLabel = roster && roster.number !== '—' ? `#${roster.number}` : undefined;
  const metaParts = [sportLabel, schoolLabel, numberLabel].filter(Boolean) as string[];

  // Key stats — followers + engagement from reach fixture when present.
  const followers = reach ? formatCount(reach.totalFollowers) : '—';
  const engagement = reach?.engagementRate7d
    ? `${(reach.engagementRate7d * 100).toFixed(1)}%`
    : '—';
  const platformCount = reach ? reach.platforms.length : 0;

  // Recent updates — synthesized fixture, athlete-flavored, no money claims.
  const updates: string[] = [
    `${name.split(' ')[0]} posted a new training clip`,
    'Replied to supporters in the group thread',
    'Dropped a behind-the-scenes story for Insiders',
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Pressable style={styles.sheetScrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Header */}
            <View style={styles.header}>
              <IdentityAvatar name={name} size={56} accent={accent} />
              <View style={styles.headerText}>
                <Text style={styles.name}>{name}</Text>
                {metaParts.length > 0 ? (
                  <Text style={styles.meta} numberOfLines={2}>
                    {metaParts.join(' · ')}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Key stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{followers}</Text>
                <Text style={styles.statLabel}>followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{engagement}</Text>
                <Text style={styles.statLabel}>engagement</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statValue}>{platformCount || '—'}</Text>
                <Text style={styles.statLabel}>platforms</Text>
              </View>
            </View>
            {reach ? (
              <Text style={styles.reachNote}>Cross-platform reach · {reach.sourceNote}</Text>
            ) : (
              <Text style={styles.reachNote}>Reach sync not connected for this athlete yet.</Text>
            )}

            {/* Recent updates */}
            <Text style={styles.sectionLabel}>RECENT</Text>
            <View style={styles.updatesCard}>
              {updates.map((u, i) => (
                <View key={u} style={[styles.updateRow, i > 0 && styles.updateRowBorder]}>
                  <View style={styles.updateDot} />
                  <Text style={styles.updateText}>{u}</Text>
                </View>
              ))}
            </View>

            {/* CTAs */}
            <Pressable
              style={[styles.supportBtn, supported && styles.supportBtnDone]}
              onPress={() => setSupported(true)}
              accessibilityRole="button"
              accessibilityLabel={supported ? 'Support requested' : `Support ${name}`}
            >
              <Ionicons
                name={supported ? 'checkmark-circle' : 'heart'}
                size={16}
                color={supported ? TEXT_PRIMARY : '#000'}
              />
              <Text style={[styles.supportBtnText, supported && styles.supportBtnTextDone]}>
                {supported ? 'Support queued' : 'Support'}
              </Text>
              <View style={styles.demoPill}>
                <Text style={styles.demoPillText}>DEMO</Text>
              </View>
            </Pressable>
            {supported ? (
              <Text style={styles.honestNote}>
                Payments aren’t enabled in the demo — backing an athlete starts from their real
                profile once the supporter flow is live.
              </Text>
            ) : null}

            <Pressable
              style={styles.secondaryBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close athlete detail"
            >
              <Text style={styles.secondaryBtnText}>Close</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: RADIUS_LG,
    borderTopRightRadius: RADIUS_LG,
    paddingTop: SP_SM,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: SP_SM,
  },
  scroll: { paddingHorizontal: SP_LG, paddingBottom: SP_SM },

  header: { flexDirection: 'row', alignItems: 'center', gap: SP_MD, marginBottom: SP_LG },
  headerText: { flex: 1 },
  name: { color: TEXT_PRIMARY, fontSize: TEXT.heading, fontWeight: WEIGHT.bold, letterSpacing: -0.3 },
  meta: { color: TEXT_SECONDARY, fontSize: TEXT.label, marginTop: SP_XS, lineHeight: 18 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    paddingVertical: SP_MD,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: {
    color: TEXT_PRIMARY,
    fontSize: TEXT.title,
    fontWeight: WEIGHT.bold,
    fontVariant: ['tabular-nums'],
  },
  statLabel: { color: TEXT_TERTIARY, fontSize: TEXT.caption, fontWeight: WEIGHT.semibold },
  statDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: HAIRLINE },
  reachNote: {
    color: TEXT_TERTIARY,
    fontSize: TEXT.caption,
    marginTop: SP_SM,
    lineHeight: 16,
  },

  sectionLabel: {
    color: TEXT_TERTIARY,
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    letterSpacing: 0.8,
    marginTop: SP_LG,
    marginBottom: SP_SM,
  },
  updatesCard: {
    backgroundColor: SURFACE,
    borderRadius: RADIUS_CARD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    paddingHorizontal: SP_MD,
  },
  updateRow: { flexDirection: 'row', alignItems: 'center', gap: SP_SM, paddingVertical: SP_MD },
  updateRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: HAIRLINE_SUBTLE },
  updateDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  updateText: { flex: 1, color: TEXT_SECONDARY, fontSize: TEXT.label, lineHeight: 18 },

  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SP_SM,
    marginTop: SP_LG,
    minHeight: 48,
    borderRadius: RADIUS_CARD,
    backgroundColor: ACCENT,
  },
  supportBtnDone: {
    backgroundColor: SURFACE_RAISED,
  },
  supportBtnText: { color: '#000', fontSize: TEXT.body, fontWeight: WEIGHT.bold },
  supportBtnTextDone: { color: TEXT_PRIMARY },
  demoPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  demoPillText: { color: '#000', fontSize: 9, fontWeight: WEIGHT.bold, letterSpacing: 0.6 },
  honestNote: {
    color: TEXT_TERTIARY,
    fontSize: TEXT.caption,
    marginTop: SP_SM,
    lineHeight: 16,
    textAlign: 'center',
  },

  secondaryBtn: {
    marginTop: SP_MD,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS_CARD,
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  secondaryBtnText: { color: TEXT_SECONDARY, fontSize: TEXT.body, fontWeight: WEIGHT.semibold },
});
