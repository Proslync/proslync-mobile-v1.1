import * as React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassSurface } from '@/components/glass';
import { GlassButton } from '@/components/glass';
import type { TableMapItem } from '@/lib/types/event-detail.types';

interface TableDetailCardProps {
  table: TableMapItem;
  onClose: () => void;
}

export function TableDetailCard({ table, onClose }: TableDetailCardProps) {
  const { colors, isDark } = useAppTheme();
  const [guestCount, setGuestCount] = React.useState(table.seats);
  const pricePerPerson = Math.ceil(table.price / guestCount);

  return (
    <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.label, { color: colors.text }]}>{table.label}</Text>
          <Text style={[styles.type, { color: colors.textSecondary }]}>
            {table.type.charAt(0).toUpperCase() + table.type.slice(1)} - {table.seats} seats
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={24} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Image */}
      {table.imageUrl && (
        <Image source={{ uri: table.imageUrl }} style={styles.image} />
      )}

      {/* Price */}
      <View style={[styles.priceRow, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
        <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Table Price</Text>
        <Text style={[styles.price, { color: colors.text }]}>${table.price.toLocaleString()}</Text>
      </View>

      {/* Perks */}
      {table.perks && table.perks.length > 0 && (
        <View style={styles.perksSection}>
          {table.perks.map((perk) => (
            <View key={perk} style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.textSecondary} />
              <Text style={[styles.perkText, { color: colors.textSecondary }]}>{perk}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Guest split calculator */}
      <View style={styles.splitSection}>
        <Text style={[styles.splitTitle, { color: colors.text }]}>Split Cost</Text>
        <View style={styles.splitRow}>
          <TouchableOpacity
            onPress={() => setGuestCount(Math.max(1, guestCount - 1))}
            style={[styles.splitButton, { overflow: 'hidden' }]}
          >
            <GlassView {...liquidGlass.fillFaint} borderRadius={16} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="remove" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.guestCount, { color: colors.text }]}>
            {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
          </Text>
          <TouchableOpacity
            onPress={() => setGuestCount(Math.min(table.seats, guestCount + 1))}
            style={[styles.splitButton, { overflow: 'hidden' }]}
          >
            <GlassView {...liquidGlass.fillFaint} borderRadius={16} style={StyleSheet.absoluteFillObject} />
            <Ionicons name="add" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.splitPrice, { color: colors.text }]}>
          ${pricePerPerson.toLocaleString()} / person
        </Text>
      </View>

      {/* Reserve button — disabled for mock data */}
      <GlassButton
        label="Reserve Table"
        onPress={() => {}}
        disabled
        fullWidth
        size="lg"
      />
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
  },
  type: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  price: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
  },
  perksSection: {
    gap: 6,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perkText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  splitSection: {
    alignItems: 'center',
    gap: 8,
  },
  splitTitle: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  splitButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestCount: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    minWidth: 80,
    textAlign: 'center',
  },
  splitPrice: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
});
