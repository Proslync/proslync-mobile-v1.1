import { View, Text, StyleSheet } from 'react-native';
import type { BarTabStatus } from '@/lib/types/bar-tab.types';

const STATUS_CONFIG: Record<BarTabStatus, { color: string; label: string }> = {
  open: { color: '#34d399', label: 'Open' },
  closed: { color: '#fbbf24', label: 'Closed' },
  paid: { color: '#3b82f6', label: 'Paid' },
  voided: { color: '#ef4444', label: 'Voided' },
};

interface TabStatusBadgeProps {
  status: BarTabStatus;
}

export function TabStatusBadge({ status }: TabStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.color }]}>
      <Text style={styles.label}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    color: '#1A1A1A',
    textTransform: 'uppercase',
  },
});
