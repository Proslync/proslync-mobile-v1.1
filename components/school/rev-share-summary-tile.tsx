// ── AD HOME REV-SHARE SUMMARY TILE ───────────────────────
// Sprint 3.1 surfacing: a compact preview tile rendered at the top
// of the AD Home tab so an athletic director sees the platform-fee
// position immediately on landing — without having to drill into the
// Compliance tab or the full /school/rev-share screen.
//
// Reuses `useSchoolRevShareLedger` + the canonical money formatter
// from `rev-share-card.tsx` so totals here always match the deeper
// surface. Cap-utilization tone follows the same thresholds as
// `RevShareCard.capUtilizationTone` (clear < 80% / watch 80-95% /
// flagged ≥ 95%).
//
// PLAN anchors:
//   - §3.1   AD revenue-share preview on Home tab (Sprint 3.1)
//   - P3     Differentiate on rev-share with the AD
//   - P4     Keep platform rev-share separate from school↔athlete cap

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMoney } from '@/components/school/rev-share-card';
import {
  CARD_BG,
  CARD_BORDER,
  RADIUS_MD,
  StatusPill,
  TONE_COLOR,
  type Tone,
} from '@/components/shared/ui-kit';
import { useSchoolRevShareLedger } from '@/hooks/use-rev-share';

const ACCENT = TONE_COLOR.accent;

// Mirror of the threshold function in rev-share-card.tsx so the home
// tile and the deeper card never disagree on tone.
function capTone(usedCents: number, capCents: number): Tone {
  if (capCents <= 0) return 'muted';
  const pct = usedCents / capCents;
  if (pct >= 0.95) return 'danger';
  if (pct >= 0.8) return 'warning';
  return 'success';
}

function capLabel(usedCents: number, capCents: number): string {
  if (capCents <= 0) return 'No cap';
  const pct = Math.round((usedCents / capCents) * 100);
  if (pct >= 95) return `${pct}% · FLAGGED`;
  if (pct >= 80) return `${pct}% · WATCH`;
  return `${pct}% · CLEAR`;
}

export interface RevShareSummaryTileProps {
  schoolId?: string;
}

export function RevShareSummaryTile({
  schoolId = 'school:syracuse',
}: RevShareSummaryTileProps) {
  const router = useRouter();
  const { data: ledger } = useSchoolRevShareLedger(schoolId);

  const handlePress = React.useCallback(() => {
    router.push('/school/rev-share');
  }, [router]);

  if (!ledger) return null;

  const platformFee = formatMoney(ledger.totals.platformFeeCents.cents);
  const athletePayout = formatMoney(ledger.totals.athletePayoutCents.cents);
  const tone = capTone(
    ledger.capContext.capUsed.cents,
    ledger.capContext.annualCap.cents,
  );
  const label = capLabel(
    ledger.capContext.capUsed.cents,
    ledger.capContext.annualCap.cents,
  );

  return (
    <Pressable
      style={styles.tile}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Open revenue-share ledger"
    >
      <View style={styles.head}>
        <View style={styles.iconBubble}>
          <Ionicons name="cash-outline" size={13} color={ACCENT} />
        </View>
        <Text style={styles.eyebrow}>REVENUE SHARE</Text>
        <Ionicons
          name="chevron-forward"
          size={14}
          color="rgba(255,255,255,0.45)"
        />
      </View>

      <Text style={styles.bigNumber}>{platformFee}</Text>
      <Text style={styles.sub}>
        vs {athletePayout} school↔athlete payout (separate, House-cap-bound)
      </Text>

      <View style={styles.pillRow}>
        <StatusPill label={label} tone={tone} icon="trending-up-outline" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    gap: 6,
    borderRadius: RADIUS_MD,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBubble: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.30)',
  },
  eyebrow: {
    flex: 1,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  bigNumber: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: 2,
  },
  sub: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
    lineHeight: 15,
  },
  pillRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
});
