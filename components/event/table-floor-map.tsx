import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { TableMapItem } from '@/lib/types/event-detail.types';

const MAP_HEIGHT = 300;

interface TableFloorMapProps {
  tables: TableMapItem[];
  selectedTableId?: string;
  onSelectTable: (table: TableMapItem) => void;
}

export function TableFloorMap({ tables, selectedTableId, onSelectTable }: TableFloorMapProps) {
  const { colors, isDark } = useAppTheme();
  const glassColor = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,';

  const getMarkerOpacity = (type: TableMapItem['type']) => {
    switch (type) {
      case 'vip': return 0.25;
      case 'booth': return 0.18;
      case 'standard': return 0.12;
    }
  };

  const getStatusColor = (status: TableMapItem['status']) => {
    if (status === 'available') return `${glassColor}0.8)`;
    if (status === 'reserved') return `${glassColor}0.4)`;
    return `${glassColor}0.2)`;
  };

  return (
    <View style={styles.container}>
      {/* Floor map area */}
      <View style={[styles.mapArea, { backgroundColor: `${glassColor}0.04)`, borderColor: `${glassColor}0.1)` }]}>
        {/* Stage */}
        <View style={[styles.stage, { backgroundColor: `${glassColor}0.08)`, borderColor: `${glassColor}0.15)` }]}>
          <Text style={[styles.stageText, { color: colors.textTertiary }]}>STAGE</Text>
        </View>

        {/* Dance floor */}
        <View style={[styles.danceFloor, { borderColor: `${glassColor}0.08)` }]}>
          <Text style={[styles.danceFloorText, { color: colors.textTertiary }]}>Dance Floor</Text>
        </View>

        {/* Table markers */}
        {tables.map((table) => {
          const isSelected = selectedTableId === table.id;
          const isAvailable = table.status === 'available';
          return (
            <TouchableOpacity
              key={table.id}
              onPress={() => isAvailable && onSelectTable(table)}
              disabled={!isAvailable}
              activeOpacity={0.7}
              style={[
                styles.marker,
                {
                  left: `${table.x}%`,
                  top: `${table.y}%`,
                  backgroundColor: `${glassColor}${getMarkerOpacity(table.type)})`,
                  borderColor: isSelected ? colors.text : `${glassColor}0.2)`,
                  borderWidth: isSelected ? 2 : 1,
                  opacity: isAvailable ? 1 : 0.4,
                },
              ]}
            >
              <Text style={[styles.markerLabel, { color: getStatusColor(table.status) }]}>
                {table.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {(['vip', 'booth', 'standard'] as const).map((type) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: `${glassColor}${getMarkerOpacity(type)})`, borderColor: `${glassColor}0.2)` }]} />
            <Text style={[styles.legendText, { color: colors.textTertiary }]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: `${glassColor}0.05)`, borderColor: `${glassColor}0.1)` }]} />
          <Text style={[styles.legendText, { color: colors.textTertiary }]}>Sold</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  mapArea: {
    height: MAP_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  stage: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 36,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageText: {
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    letterSpacing: 2,
  },
  danceFloor: {
    position: 'absolute',
    top: '35%',
    left: '30%',
    right: '30%',
    height: '20%',
    borderRadius: 40,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  danceFloorText: {
    fontSize: 10,
    fontFamily: 'Lato_400Regular',
  },
  marker: {
    position: 'absolute',
    width: 48,
    height: 48,
    marginLeft: -24,
    marginTop: -24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerLabel: {
    fontSize: 9,
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Lato_400Regular',
  },
});
