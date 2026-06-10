// ── AD HOME APPROVAL QUEUE SUMMARY TILE ──────────────────
// Sprint 3.9 surfacing companion to `rev-share-summary-tile.tsx`
// and `risk-report-summary-tile.tsx`. Compact rollup of the
// approval queue — pending count + worst-priority headline +
// tap-through to the full `/school/approval-queue` screen. The
// row a buyer should see first: "X things are waiting on you."
//
// PLAN anchor: §4 step 3 — AD walk requires the approval queue
// to be reachable from Home, not only from the Compliance sub-tab.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CARD_BG,
  CARD_BORDER,
  RADIUS_MD,
  StatusPill,
  TONE_COLOR,
} from '@/components/shared/ui-kit';
import { useSchoolApprovalQueue } from '@/hooks/use-approval-queue';
import type { ApprovalQueueItemPriority } from '@/lib/types/approval-queue.types';

const ACCENT = TONE_COLOR.accent;

const PRIORITY_RANK: Record<ApprovalQueueItemPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
};

export interface ApprovalQueueSummaryTileProps {
  schoolId?: string;
}

export function ApprovalQueueSummaryTile({
  schoolId = 'school:syracuse',
}: ApprovalQueueSummaryTileProps) {
  const router = useRouter();
  const { data: queue } = useSchoolApprovalQueue(schoolId);

  if (__DEV__ && queue) {
    console.log(
      '[approval-tile] render schoolId=' + schoolId,
      'pending=' + queue.counts.pending,
      'items=' + queue.items.length,
    );
  }

  const handlePress = React.useCallback(() => {
    router.push('/school/approval-queue?focus=pending');
  }, [router]);

  if (!queue) return null;

  const pendingItems = queue.items.filter((i) => i.state === 'pending');
  const worstPending = [...pendingItems].sort(
    (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority],
  )[0];
  const urgentCount = pendingItems.filter(
    (i) => i.priority === 'urgent' || i.priority === 'high',
  ).length;

  return (
    <Pressable
      style={styles.tile}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Open approval queue"
    >
      <View style={styles.head}>
        <View style={styles.iconBubble}>
          <Ionicons name="checkmark-done" size={13} color={ACCENT} />
        </View>
        <Text style={styles.eyebrow}>APPROVAL QUEUE</Text>
        <Ionicons
          name="chevron-forward"
          size={14}
          color="rgba(255,255,255,0.45)"
        />
      </View>

      <Text style={styles.bigNumber}>
        {queue.counts.pending}{' '}
        <Text style={styles.bigNumberSuffix}>pending</Text>
      </Text>
      <Text style={styles.sub} numberOfLines={2}>
        {worstPending
          ? worstPending.title
          : 'Queue is clear. No reviewer decisions outstanding.'}
      </Text>

      {urgentCount > 0 ? (
        <View style={styles.pillRow}>
          <StatusPill
            label={`${urgentCount} need attention`}
            tone="warning"
            icon="flash-outline"
          />
        </View>
      ) : null}
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
    marginTop: 8,
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
  bigNumberSuffix: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
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
