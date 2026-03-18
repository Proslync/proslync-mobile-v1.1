import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';
import { DRESS_CODE_LABELS } from '@/lib/constants/dress-codes';
import type { EventDetailExtended } from '@/lib/types/event-detail.types';

interface QuickDetailsGridProps {
  event: EventDetailExtended;
}

export function QuickDetailsGrid({ event }: QuickDetailsGridProps) {
  const { colors, isDark } = useAppTheme();

  const dressCodeLabel = event.dressCode
    ? DRESS_CODE_LABELS[event.dressCode] || event.dressCode
    : undefined;

  const items = [
    { icon: 'shirt-outline' as const, label: 'Dress Code', value: dressCodeLabel || 'None' },
    { icon: 'person-outline' as const, label: 'Age', value: event.ageRequirement || (event.minimumAge ? `${event.minimumAge}+` : '21+') },
    { icon: 'cash-outline' as const, label: 'Cover', value: event.coverCharge || (event.doorCoverPriceCents ? `$${(event.doorCoverPriceCents / 100).toFixed(0)}` : 'Free') },
    { icon: 'time-outline' as const, label: 'Doors', value: event.doorTime || 'TBA' },
  ];

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.label} style={[styles.cell, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
          <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
          <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
          <Text style={[styles.cellLabel, { color: colors.textTertiary }]}>{item.label}</Text>
          <Text style={[styles.cellValue, { color: colors.text }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: '48%' as any,
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  cellLabel: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cellValue: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
});
