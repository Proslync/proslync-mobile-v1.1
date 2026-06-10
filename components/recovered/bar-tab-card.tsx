// Recovered from proslync-mobile-app-v1 (2026-05-07).
// Original path: components/bar/bar-tab-card.tsx
// Inlined: BarTab + BarOrderItem types and formatCents / formatTimeAgo helpers
// since `@/lib/types/bar-tab.types` and `@/lib/utils` didn't migrate.

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import { TabStatusBadge, type BarTabStatus } from './tab-status-badge';

type BarOrderItemStatus = 'pending' | 'served' | 'voided';

export interface BarOrderItem {
  id: number;
  name: string;
  price: number; // cents
  quantity: number;
  status: BarOrderItemStatus;
}

export interface BarTab {
  id: number;
  guestName?: string;
  status: BarTabStatus;
  orderItems: BarOrderItem[];
  subtotal: number; // cents
  openedAt: string;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatTimeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

interface BarTabCardProps {
  tab: BarTab;
  onPress: () => void;
}

export function BarTabCard({ tab, onPress }: BarTabCardProps) {
  const items = tab.orderItems ?? [];
  const activeItemCount = items.filter((i) => i.status !== 'voided').length;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
      <View style={[styles.card, { overflow: 'hidden' }]}>
        <GlassView {...liquidGlass.fill} borderRadius={14} style={StyleSheet.absoluteFill} />
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.nameRow}>
              <View style={[styles.avatar, { overflow: 'hidden' }]}>
                <GlassView {...liquidGlass.fillMedium} borderRadius={16} style={StyleSheet.absoluteFill} />
                <Ionicons name="person" size={16} color="rgba(0,0,0,0.6)" />
              </View>
              <View style={styles.nameCol}>
                <Text style={styles.guestName} numberOfLines={1}>
                  {tab.guestName || 'Guest'}
                </Text>
                <Text style={styles.meta}>
                  {activeItemCount} item{activeItemCount !== 1 ? 's' : ''} · {formatTimeAgo(tab.openedAt)}
                </Text>
              </View>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.total}>{formatCents(tab.subtotal)}</Text>
              <TabStatusBadge status={tab.status} />
            </View>
          </View>
        </View>
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
  },
  content: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameCol: { flex: 1 },
  guestName: { fontSize: 15, color: '#FFFFFF' },
  meta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  total: { fontSize: 16, color: '#FFFFFF', fontWeight: '700' },
  chevron: { marginLeft: 8 },
});
