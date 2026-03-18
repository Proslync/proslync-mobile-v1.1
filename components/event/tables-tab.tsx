import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';
import { TableFloorMap } from './table-floor-map';
import { TableDetailCard } from './table-detail-card';
import { PublicTablesSection } from './public-tables-section';
import { BottleMenu } from './bottle-menu';
import type { FloorData, TableMapItem, PublicTableItem, BottleMenuCategory } from '@/lib/types/event-detail.types';
import type { EventTableItem } from '@/lib/types/tables.types';

interface TablesTabProps {
  floors: FloorData[];
  mapTables: TableMapItem[];
  publicTables: PublicTableItem[];
  bottleCategories: BottleMenuCategory[];
  /** Real API tables from useEventTables */
  apiTables?: EventTableItem[];
  onSelectApiTable?: (table: EventTableItem) => void;
}

export function TablesTab({
  floors,
  mapTables,
  publicTables,
  bottleCategories,
  apiTables,
  onSelectApiTable,
}: TablesTabProps) {
  const { colors, isDark } = useAppTheme();
  const glassColor = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,';
  const [selectedFloorId, setSelectedFloorId] = React.useState(floors[0]?.id);
  const [selectedMapTable, setSelectedMapTable] = React.useState<TableMapItem | null>(null);

  const floorTables = mapTables.filter((t) => t.floorId === selectedFloorId);

  return (
    <View style={styles.container}>
      {/* Floor selector */}
      {floors.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.floorScroll}>
          {floors.map((floor) => {
            const isActive = selectedFloorId === floor.id;
            return (
              <TouchableOpacity
                key={floor.id}
                onPress={() => { setSelectedFloorId(floor.id); setSelectedMapTable(null); }}
                activeOpacity={0.7}
                style={[
                  styles.floorTab,
                  {
                    backgroundColor: isActive ? `${glassColor}0.15)` : 'transparent',
                    borderColor: `${glassColor}0.15)`,
                  },
                ]}
              >
                <Text style={[styles.floorText, { color: isActive ? colors.text : colors.textTertiary }]}>
                  {floor.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Floor map */}
      <TableFloorMap
        tables={floorTables}
        selectedTableId={selectedMapTable?.id}
        onSelectTable={setSelectedMapTable}
      />

      {/* Selected table detail */}
      {selectedMapTable && (
        <TableDetailCard
          table={selectedMapTable}
          onClose={() => setSelectedMapTable(null)}
        />
      )}

      {/* Real API tables (existing purchase flow) */}
      {apiTables && apiTables.length > 0 && (
        <View style={styles.apiTablesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Tables</Text>
          {apiTables.map((table) => {
            const unavailable = table.status !== 'available';
            return (
              <TouchableOpacity
                key={table.id}
                onPress={() => !unavailable && onSelectApiTable?.(table)}
                disabled={unavailable}
                activeOpacity={0.7}
                style={[styles.apiTableCard, { overflow: 'hidden', borderColor: `${glassColor}0.1)`, opacity: unavailable ? 0.5 : 1 }]}
              >
                <GlassView {...liquidGlass.surface} borderRadius={12} style={StyleSheet.absoluteFillObject} />
                <View style={styles.apiTableInfo}>
                  <Text style={[styles.apiTableLabel, { color: colors.text }]}>{table.label}</Text>
                  <Text style={[styles.apiTableSeats, { color: colors.textTertiary }]}>{table.seatCount} seats - {table.sectionName}</Text>
                </View>
                <Text style={[styles.apiTablePrice, { color: unavailable ? colors.textTertiary : colors.text }]}>
                  {unavailable ? (table.status === 'sold' ? 'Sold' : 'Reserved') : `$${Number(table.price).toLocaleString()}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Public tables */}
      <PublicTablesSection tables={publicTables} />

      {/* Bottle menu */}
      <BottleMenu categories={bottleCategories} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingTop: 8,
  },
  floorScroll: {
    flexGrow: 0,
    marginHorizontal: -4,
  },
  floorTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  floorText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  apiTablesSection: {
    gap: 10,
  },
  apiTableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  apiTableInfo: {
    flex: 1,
    gap: 2,
  },
  apiTableLabel: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  apiTableSeats: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  apiTablePrice: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    marginLeft: 12,
  },
});
