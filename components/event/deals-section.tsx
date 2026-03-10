import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { EventDeal } from '@/lib/types/deals.types';

interface DealsSectionProps {
  deals: EventDeal[];
}

export function DealsSection({ deals }: DealsSectionProps) {
  const { colors, isDark } = useAppTheme();
  const glassColor = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,';

  if (deals.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Specials & Deals</Text>
      {deals.map((deal) => (
        <View key={deal.id} style={[styles.dealRow, { borderColor: `${glassColor}0.1)` }]}>
          <View style={[styles.badge, { backgroundColor: `${glassColor}0.12)` }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>{deal.badge}</Text>
          </View>
          <View style={styles.dealInfo}>
            <Text style={[styles.dealTitle, { color: colors.text }]}>{deal.title}</Text>
            <Text style={[styles.dealDesc, { color: colors.textTertiary }]}>{deal.description}</Text>
            {deal.timeRange && (
              <Text style={[styles.dealTime, { color: colors.textSecondary }]}>{deal.timeRange}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  dealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dealInfo: {
    flex: 1,
    gap: 2,
  },
  dealTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  dealDesc: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  dealTime: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
});
