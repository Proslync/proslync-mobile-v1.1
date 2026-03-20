import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVenueMenu } from '@/hooks';
import type { VenueMenuCategory, VenueMenuItem } from '@/lib/types/menu.types';

const TAB_BAR_HEIGHT = 49;
const TAB_BAR_RADIUS = 24;

interface SelectedItem {
  menuItemId: number;
  name: string;
  priceCents: number;
  quantity: number;
  notes?: string;
}

interface AddItemsSheetProps {
  visible: boolean;
  venueId: number;
  onClose: () => void;
  onConfirm: (items: Array<{ menuItemId: number; quantity: number; notes?: string }>) => void;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function AddItemsSheet({ visible, venueId, onClose, onConfirm }: AddItemsSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { data: categories } = useVenueMenu(venueId);
  const [selectedItems, setSelectedItems] = React.useState<Map<number, SelectedItem>>(new Map());

  React.useEffect(() => {
    if (visible) {
      setSelectedItems(new Map());
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const updateQuantity = React.useCallback((item: VenueMenuItem, delta: number) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(item.id);
      const newQty = (existing?.quantity ?? 0) + delta;
      if (newQty <= 0) {
        next.delete(item.id);
      } else {
        next.set(item.id, {
          menuItemId: item.id,
          name: item.name,
          priceCents: item.price,
          quantity: newQty,
          notes: existing?.notes,
        });
      }
      return next;
    });
  }, []);

  const totalItems = React.useMemo(() => {
    let count = 0;
    let cents = 0;
    for (const item of selectedItems.values()) {
      count += item.quantity;
      cents += item.priceCents * item.quantity;
    }
    return { count, cents };
  }, [selectedItems]);

  const handleConfirm = React.useCallback(() => {
    const items = Array.from(selectedItems.values()).map((s) => ({
      menuItemId: s.menuItemId,
      quantity: s.quantity,
      notes: s.notes,
    }));
    bottomSheetRef.current?.close();
    setTimeout(() => onConfirm(items), 150);
  }, [selectedItems, onConfirm]);

  const activeCategories = React.useMemo(
    () => (categories ?? []).filter((c) => c.isActive && c.items.some((i) => i.isActive)),
    [categories],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['75%']}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: 'transparent', borderRadius: TAB_BAR_RADIUS }}
      handleIndicatorStyle={{
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
      }}
      style={{ marginHorizontal: 12 }}
      bottomInset={TAB_BAR_HEIGHT + insets.bottom + 12}
      detached
    >
      <BottomSheetView style={styles.header}>
        <GlassView {...liquidGlass.surface} borderRadius={TAB_BAR_RADIUS} style={StyleSheet.absoluteFill} />
        <Text style={styles.title}>Add Items</Text>
      </BottomSheetView>

      <BottomSheetScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlassView {...liquidGlass.surface} borderRadius={0} style={StyleSheet.absoluteFill} />
        {activeCategories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            selectedItems={selectedItems}
            onUpdateQuantity={updateQuantity}
          />
        ))}

        {activeCategories.length === 0 && (
          <Text style={styles.emptyText}>No menu items available</Text>
        )}
      </BottomSheetScrollView>

      {totalItems.count > 0 && (
        <BottomSheetView style={styles.footer}>
          <GlassView {...liquidGlass.surface} borderRadius={0} style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} activeOpacity={0.7}>
            <GlassView {...liquidGlass.fillMedium} borderRadius={14} style={StyleSheet.absoluteFill} />
            <Text style={styles.confirmText}>
              Add {totalItems.count} item{totalItems.count !== 1 ? 's' : ''} · {formatCents(totalItems.cents)}
            </Text>
          </TouchableOpacity>
        </BottomSheetView>
      )}
    </BottomSheet>
  );
}

function CategorySection({
  category,
  selectedItems,
  onUpdateQuantity,
}: {
  category: VenueMenuCategory;
  selectedItems: Map<number, SelectedItem>;
  onUpdateQuantity: (item: VenueMenuItem, delta: number) => void;
}) {
  const activeItems = category.items.filter((i) => i.isActive);
  if (activeItems.length === 0) return null;

  return (
    <View style={styles.category}>
      <Text style={styles.categoryName}>{category.name}</Text>
      {activeItems.map((item) => (
        <MenuItemRow
          key={item.id}
          item={item}
          quantity={selectedItems.get(item.id)?.quantity ?? 0}
          onIncrement={() => onUpdateQuantity(item, 1)}
          onDecrement={() => onUpdateQuantity(item, -1)}
        />
      ))}
    </View>
  );
}

function MenuItemRow({
  item,
  quantity,
  onIncrement,
  onDecrement,
}: {
  item: VenueMenuItem;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        {item.description && (
          <Text style={styles.itemDescription} numberOfLines={1}>{item.description}</Text>
        )}
        <Text style={styles.itemPrice}>{formatCents(item.price)}</Text>
      </View>
      <View style={styles.quantityControls}>
        {quantity > 0 && (
          <>
            <TouchableOpacity onPress={onDecrement} style={styles.qtyButton} activeOpacity={0.7}>
              <GlassView {...liquidGlass.fillMedium} borderRadius={14} style={StyleSheet.absoluteFill} />
              <Ionicons name="remove" size={18} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
          </>
        )}
        <TouchableOpacity onPress={onIncrement} style={styles.qtyButton} activeOpacity={0.7}>
          <GlassView {...liquidGlass.fillMedium} borderRadius={14} style={StyleSheet.absoluteFill} />
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: 'hidden',
    borderTopLeftRadius: TAB_BAR_RADIUS,
    borderTopRightRadius: TAB_BAR_RADIUS,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    paddingVertical: 32,
  },
  category: {
    marginTop: 16,
  },
  categoryName: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  itemDescription: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  qtyText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    minWidth: 20,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  confirmButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  confirmText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
