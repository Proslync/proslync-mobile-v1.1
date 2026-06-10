// ── ACTIVITY STREAM ───────────────────────────────────────
// Vertical list of recent events. Each row: tinted icon dot + title (+
// optional subtitle) + right-aligned mono time. Quiet, no card chrome —
// belongs directly on the page surface.
//
// Tone goes on the icon dot only, never on the whole row. That keeps the
// stream scannable; the eye reads the dot color to triage and the title
// to identify, in that order.
//
// Spec: atlas/design/2026-04-15/copy-editorial-pass-2026-04-15.md
//       arshia demo-ready-2026-04-15: AthleteHomeScreen activity feed

import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import {
  MONO_FAMILY,
  Spacing,
  StatsColors,
  StatusColors,
} from '@/components/stats/tokens';

export type ActivityStreamItemTone =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger';

export interface ActivityStreamItem {
  id: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  tone?: ActivityStreamItemTone;
}

export interface ActivityStreamProps {
  items: ActivityStreamItem[];
  onPressItem?: (item: ActivityStreamItem) => void;
  emptyLabel?: string;
}

function toneToColor(tone: ActivityStreamItemTone | undefined): string {
  switch (tone) {
    case 'accent':
      return StatsColors.accent;
    case 'success':
      return StatusColors.success;
    case 'warning':
      return StatusColors.warning;
    case 'danger':
      return StatusColors.danger;
    default:
      return 'rgba(255,255,255,0.55)';
  }
}

export function ActivityStream({
  items,
  onPressItem,
  emptyLabel = 'No recent activity',
}: ActivityStreamProps) {
  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyRow}>
        <Text style={styles.empty}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.column}>
      {items.map((it) => {
        const c = toneToColor(it.tone);
        const RowWrap: React.ElementType = onPressItem ? Pressable : View;
        return (
          <RowWrap
            key={it.id}
            onPress={onPressItem ? () => onPressItem(it) : undefined}
            style={({ pressed }: { pressed?: boolean }) => [
              styles.row,
              pressed && { opacity: 0.88 },
            ]}
            accessibilityRole={onPressItem ? 'button' : 'none'}
            accessibilityLabel={`${it.title}${it.subtitle ? `, ${it.subtitle}` : ''}, ${it.time}`}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: `${c}1F`, borderColor: c },
              ]}
            >
              <Ionicons name={it.icon} size={12} color={c} />
            </View>
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={1}>
                {it.title}
              </Text>
              {it.subtitle ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {it.subtitle}
                </Text>
              ) : null}
            </View>
            <Text style={styles.time}>{it.time}</Text>
          </RowWrap>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: Spacing.md / 2 },
  emptyRow: { paddingVertical: Spacing.lg, alignItems: 'center' },
  empty: {
    fontFamily: Brand.fonts.body,
    color: 'rgba(255,255,255,0.32)',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  body: { flex: 1, gap: 2 },
  title: {
    fontFamily: Brand.fonts.body,
    fontSize: 14,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.86)',
  },
  subtitle: {
    fontFamily: Brand.fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.50)',
  },
  time: {
    fontFamily: MONO_FAMILY,
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.40)',
    fontVariant: ['tabular-nums'],
  },
});
