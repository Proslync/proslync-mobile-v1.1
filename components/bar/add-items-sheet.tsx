import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVenueMenu } from '@/hooks';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { VenueMenuCategory, VenueMenuItem } from '@/lib/types/menu.types';

const RADIUS = 20;
const SPRING_CONFIG = { damping: 20, stiffness: 300, mass: 0.8 };

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
  if (!Number.isFinite(cents)) return '$0.00';
  return `$${(cents / 100).toFixed(2)}`;
}

const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
);

export function AddItemsSheet({ visible, venueId, onClose, onConfirm }: AddItemsSheetProps) {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { data: categories } = useVenueMenu(venueId);
  const [selectedItems, setSelectedItems] = React.useState<Map<number, SelectedItem>>(new Map());
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      setSelectedItems(new Map());
      bottomSheetRef.current?.expand();
      scale.value = withSpring(1, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      bottomSheetRef.current?.close();
      scale.value = withTiming(0.92, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

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
      snapPoints={['80%']}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: 'rgba(10,10,10,0.85)', borderRadius: RADIUS }}
      handleIndicatorStyle={{
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
      }}
      backdropComponent={renderBackdrop}
    >
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Items</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>

        {/* Scrollable menu */}
        <BottomSheetScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: totalItems.count > 0 ? 90 : 24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
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

        {/* Sticky footer */}
        {totalItems.count > 0 && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <GlassView {...liquidGlass.fillStrong} borderRadius={14} style={StyleSheet.absoluteFill} />
              <Text style={styles.confirmText}>
                Add {totalItems.count} item{totalItems.count !== 1 ? 's' : ''} · {formatCents(totalItems.cents)}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    paddingVertical: 32,
  },
  category: {
    marginTop: 20,
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
    paddingVertical: 12,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(10,10,10,0.9)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  confirmButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  confirmText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
