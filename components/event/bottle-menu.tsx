import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassSurface } from '@/components/glass';
import { GlassButton } from '@/components/glass';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import type { BottleMenuCategory, BottleMenuItem } from '@/lib/types/event-detail.types';

interface BottleMenuProps {
  categories: BottleMenuCategory[];
}

export function BottleMenu({ categories }: BottleMenuProps) {
  const { colors, isDark } = useAppTheme();
  const glassColor = isDark ? 'rgba(255,255,255,' : 'rgba(0,0,0,';
  const [activeCategory, setActiveCategory] = React.useState(categories[0]?.id);
  const [cart, setCart] = React.useState<Record<string, number>>({});

  const currentCategory = categories.find((c) => c.id === activeCategory);
  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = categories
    .flatMap((c) => c.items)
    .reduce((sum, item) => sum + (cart[item.id] || 0) * (item.dealPrice ?? item.price), 0);

  const updateQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      const newQty = Math.max(0, (prev[itemId] || 0) + delta);
      if (newQty === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQty };
    });
  };

  if (categories.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Bottle Menu</Text>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.7}
              style={[
                styles.categoryTab,
                {
                  borderColor: `${glassColor}0.15)`,
                  overflow: 'hidden',
                },
              ]}
            >
              {isActive && (
                <GlassView {...liquidGlass.fill} borderRadius={8} style={StyleSheet.absoluteFillObject} />
              )}
              <Text style={[styles.categoryText, { color: isActive ? colors.text : colors.textTertiary }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Items */}
      {currentCategory?.items.map((item) => {
        const qty = cart[item.id] || 0;
        return (
          <View key={item.id} style={[styles.itemRow, { borderColor: `${glassColor}0.08)` }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
              {item.description && (
                <Text style={[styles.itemDesc, { color: colors.textTertiary }]}>{item.description}</Text>
              )}
              <View style={styles.priceRow}>
                {item.dealPrice ? (
                  <>
                    <Text style={[styles.dealPrice, { color: colors.text }]}>${item.dealPrice}</Text>
                    <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>${item.price}</Text>
                  </>
                ) : (
                  <Text style={[styles.itemPrice, { color: colors.text }]}>${item.price}</Text>
                )}
              </View>
            </View>
            <View style={styles.qtyControls}>
              {qty > 0 && (
                <>
                  <TouchableOpacity
                    onPress={() => updateQty(item.id, -1)}
                    style={[styles.qtyButton, { backgroundColor: `${glassColor}0.1)` }]}
                  >
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: colors.text }]}>{qty}</Text>
                </>
              )}
              <TouchableOpacity
                onPress={() => updateQty(item.id, 1)}
                style={[styles.qtyButton, { backgroundColor: `${glassColor}0.1)` }]}
              >
                <Ionicons name="add" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {/* Checkout */}
      {totalItems > 0 && (
        <GlassButton
          label={`Checkout (${totalItems}) - $${totalPrice.toLocaleString()}`}
          onPress={() => {}}
          fullWidth
          size="lg"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  categoryScroll: {
    flexGrow: 0,
    marginHorizontal: -4,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  itemDesc: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  dealPrice: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  originalPrice: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    textDecorationLine: 'line-through',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    minWidth: 16,
    textAlign: 'center',
  },
});
