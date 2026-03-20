import { StyleSheet, Text, View } from 'react-native';
import { GlassSurface } from '@/components/glass/glass-surface';
import { Ionicons } from '@expo/vector-icons';
import type { BarTabSummary } from '@/lib/types/bar-tab.types';

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface BarSummaryCardProps {
  summary: BarTabSummary;
}

export function BarSummaryCard({ summary }: BarSummaryCardProps) {
  return (
    <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.card}>
      <View style={styles.row}>
        <StatItem
          icon="receipt-outline"
          label="Open Tabs"
          value={String(summary.totalOpenTabs)}
          color="#34d399"
        />
        <StatItem
          icon="checkmark-circle-outline"
          label="Closed"
          value={String(summary.totalPaidTabs)}
          color="#3b82f6"
        />
        <StatItem
          icon="cash-outline"
          label="Revenue"
          value={formatCents(summary.totalRevenueCents)}
          color="#fbbf24"
        />
        <StatItem
          icon="trending-up-outline"
          label="Avg Tab"
          value={formatCents(summary.averageTabCents)}
          color="rgba(255,255,255,0.6)"
        />
      </View>
    </GlassSurface>
  );
}

function StatItem({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.45)',
  },
});
