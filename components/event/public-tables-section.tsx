import * as React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassSurface } from '@/components/glass';
import { GlassButton } from '@/components/glass';
import type { PublicTableItem } from '@/lib/types/event-detail.types';

interface PublicTablesSectionProps {
  tables: PublicTableItem[];
}

export function PublicTablesSection({ tables }: PublicTablesSectionProps) {
  const { colors, isDark } = useAppTheme();
  const glassColor = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,';

  if (tables.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Open Tables</Text>
      <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
        Join a table and split the cost
      </Text>
      {tables.map((table) => {
        const spotsLeft = table.totalSeats - table.filledSeats;
        const fillPct = (table.filledSeats / table.totalSeats) * 100;
        return (
          <GlassSurface key={table.id} fill="subtle" border="subtle" cornerRadius="md" style={styles.card}>
            <View style={styles.cardHeader}>
              {table.hostAvatar ? (
                <Image source={{ uri: table.hostAvatar }} style={styles.hostAvatar} />
              ) : (
                <View style={[styles.hostAvatarPlaceholder, { backgroundColor: `${glassColor}0.1)` }]}>
                  <Ionicons name="person" size={14} color={colors.textTertiary} />
                </View>
              )}
              <View style={styles.cardInfo}>
                <Text style={[styles.cardLabel, { color: colors.text }]}>{table.label}</Text>
                <Text style={[styles.hostName, { color: colors.textTertiary }]}>
                  Hosted by {table.hostName}
                </Text>
              </View>
              <Text style={[styles.price, { color: colors.text }]}>
                ${table.pricePerSeat}/seat
              </Text>
            </View>

            {/* Capacity bar */}
            <View style={styles.capacityRow}>
              <View style={[styles.capacityTrack, { backgroundColor: `${glassColor}0.08)` }]}>
                <View style={[styles.capacityFill, { width: `${fillPct}%`, backgroundColor: `${glassColor}0.25)` }]} />
              </View>
              <Text style={[styles.spotsText, { color: colors.textSecondary }]}>
                {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
              </Text>
            </View>

            <GlassButton
              label="Request to Join"
              onPress={() => {}}
              size="sm"
              fullWidth
            />
          </GlassSurface>
        );
      })}
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
  subtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: -4,
  },
  card: {
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  hostAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  hostName: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  price: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  capacityTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 3,
  },
  spotsText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
});
