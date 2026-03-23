import React from 'react';
import {
  View,
  Text,
  TextInput,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassView, GlassContainer } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useVenueMenu, useMyBarTab, useOpenTab, BAR_TABS_KEY, BAR_TAB_KEY, MY_BAR_TAB_KEY } from '@/hooks';
import { barTabsApi } from '@/lib/api/bar-tabs';
import { useQueryClient } from '@tanstack/react-query';
import { Toast } from '@/components/shared/toast';
import type { VenueMenuItem } from '@/lib/types/menu.types';

const TAB_BAR_HEIGHT = 49;
const TAB_BAR_RADIUS = 24;

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface SelectedItem {
  menuItemId: number;
  name: string;
  priceCents: number;
  quantity: number;
}

export default function BarMenuScreen() {
  const { eventId: eventIdParam, venueId: venueIdParam } = useLocalSearchParams<{
    eventId: string;
    venueId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const eventId = eventIdParam ? Number(eventIdParam) : undefined;
  const venueId = venueIdParam ? Number(venueIdParam) : undefined;

  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useVenueMenu(venueId);
  const { data: myTab } = useMyBarTab(eventId);
  const openTab = useOpenTab(eventId!);
  const [isAddingItems, setIsAddingItems] = React.useState(false);

  const [selectedItems, setSelectedItems] = React.useState<Map<number, SelectedItem>>(new Map());
  const [nameSheetVisible, setNameSheetVisible] = React.useState(false);
  const [customerName, setCustomerName] = React.useState('');
  const nameSheetRef = React.useRef<BottomSheet>(null);
  const sheetScale = useSharedValue(0.85);
  const sheetOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (nameSheetVisible) {
      nameSheetRef.current?.expand();
      sheetScale.value = withSpring(1, { damping: 20, stiffness: 300, mass: 0.8 });
      sheetOpacity.value = withTiming(1, { duration: 200 });
    } else {
      nameSheetRef.current?.close();
      sheetScale.value = withTiming(0.85, { duration: 150 });
      sheetOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [nameSheetVisible, sheetScale, sheetOpacity]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sheetScale.value }],
    opacity: sheetOpacity.value,
  }));

  const updateQuantity = React.useCallback((item: VenueMenuItem, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        });
      }
      return next;
    });
  }, []);

  const totals = React.useMemo(() => {
    let count = 0;
    let cents = 0;
    for (const item of selectedItems.values()) {
      count += item.quantity;
      cents += item.priceCents * item.quantity;
    }
    return { count, cents };
  }, [selectedItems]);

  const handleAddToTab = React.useCallback(async () => {
    if (totals.count === 0 || !eventId) return;

    const items = Array.from(selectedItems.values()).map((s) => ({
      menuItemId: s.menuItemId,
      quantity: s.quantity,
    }));

    // If user has no open tab, prompt for name
    if (!myTab) {
      setNameSheetVisible(true);
      return;
    }

    setIsAddingItems(true);
    try {
      await barTabsApi.addItems(eventId, myTab.id, { items });
      queryClient.invalidateQueries({ queryKey: [BAR_TAB_KEY, eventId, myTab.id] });
      queryClient.invalidateQueries({ queryKey: [BAR_TABS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [MY_BAR_TAB_KEY, eventId] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedItems(new Map());
    } catch {
      Toast.show('Failed to add items. Please try again.', 'error');
    } finally {
      setIsAddingItems(false);
    }
  }, [totals, selectedItems, myTab, eventId, queryClient]);

  const handleOpenTabAndAdd = React.useCallback(async () => {
    const name = customerName.trim();
    if (!name || !eventId) return;

    try {
      const { tab } = await openTab.mutateAsync({ customerName: name });
      setNameSheetVisible(false);

      const items = Array.from(selectedItems.values()).map((s) => ({
        menuItemId: s.menuItemId,
        quantity: s.quantity,
      }));

      await barTabsApi.addItems(eventId, tab.id, { items });
      queryClient.invalidateQueries({ queryKey: [BAR_TAB_KEY, eventId, tab.id] });
      queryClient.invalidateQueries({ queryKey: [BAR_TABS_KEY, eventId] });
      queryClient.invalidateQueries({ queryKey: [MY_BAR_TAB_KEY, eventId] });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedItems(new Map());
      setCustomerName('');
    } catch {
      Toast.show('Failed to open tab. Please try again.', 'error');
    }
  }, [customerName, eventId, openTab, selectedItems, queryClient]);

  const sections = React.useMemo(() => {
    return (categories ?? [])
      .filter((c) => c.isActive && c.items.some((i) => i.isActive))
      .map((category) => ({
        title: category.name,
        data: category.items.filter((i) => i.isActive),
      }));
  }, [categories]);

  const renderItem = React.useCallback(
    ({ item }: { item: VenueMenuItem }) => {
      const qty = selectedItems.get(item.id)?.quantity ?? 0;
      return (
        <View style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            {item.description && (
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={styles.itemPrice}>{formatCents(item.price)}</Text>
          </View>
          <View style={styles.quantityControls}>
            {qty > 0 && (
              <>
                <TouchableOpacity
                  onPress={() => updateQuantity(item, -1)}
                  style={[styles.qtyButton, { overflow: 'hidden' }]}
                  activeOpacity={0.7}
                >
                  <GlassView {...liquidGlass.fillMedium} borderRadius={14} style={StyleSheet.absoluteFill} />
                  <Ionicons name="remove" size={18} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
              </>
            )}
            <TouchableOpacity
              onPress={() => updateQuantity(item, 1)}
              style={[styles.qtyButton, { overflow: 'hidden' }]}
              activeOpacity={0.7}
            >
              <GlassView {...liquidGlass.fillMedium} borderRadius={14} style={StyleSheet.absoluteFill} />
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [selectedItems, updateQuantity],
  );

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bar Menu</Text>
        {myTab && (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() =>
              router.push({
                pathname: '/event/my-tab',
                params: { eventId: String(eventId) },
              })
            }
          >
            <Ionicons name="receipt-outline" size={22} color="#fff" />
          </TouchableOpacity>
        )}
        {!myTab && <View style={styles.headerButton} />}
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + (totals.count > 0 ? 100 : 24) },
          ]}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No menu items available</Text>
          }
        />
      )}

      {/* Floating Add to Tab button */}
      {totals.count > 0 && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.floatingFooter, { bottom: insets.bottom + 16 }]}
        >
          <TouchableOpacity
            style={[styles.addToTabButton, { overflow: 'hidden' }]}
            onPress={handleAddToTab}
            activeOpacity={0.7}
            disabled={isAddingItems}
          >
            <GlassView {...liquidGlass.fillMedium} borderRadius={14} style={StyleSheet.absoluteFill} />
            <Text style={styles.addToTabText}>
              {isAddingItems
                ? 'Adding...'
                : `Add ${totals.count} item${totals.count !== 1 ? 's' : ''} · ${formatCents(totals.cents)}`}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Name Entry Sheet (for opening new tab) */}
      <BottomSheet
        ref={nameSheetRef}
        index={-1}
        enableDynamicSizing
        enablePanDownToClose
        onClose={() => setNameSheetVisible(false)}
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
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <BottomSheetView style={styles.sheetContent}>
          <Animated.View style={sheetAnimatedStyle}>
            <GlassContainer spacing={8} style={{ gap: 8 }}>
              <GlassView {...liquidGlass.surface} borderRadius={TAB_BAR_RADIUS} style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Open a Tab</Text>
                <Text style={styles.sheetSubtitle}>Enter your name to start a tab</Text>
                <View style={[styles.inputContainer, { overflow: 'hidden' }]}>
                  <GlassView {...liquidGlass.fill} borderRadius={12} style={StyleSheet.absoluteFill} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={customerName}
                    onChangeText={setCustomerName}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleOpenTabAndAdd}
                  />
                </View>
              </GlassView>
              <GlassView {...liquidGlass.surface} borderRadius={TAB_BAR_RADIUS} style={styles.sheetActions}>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { overflow: 'hidden' },
                    (!customerName.trim() || openTab.isPending) && styles.disabled,
                  ]}
                  onPress={handleOpenTabAndAdd}
                  disabled={!customerName.trim() || openTab.isPending}
                  activeOpacity={0.7}
                >
                  <GlassView {...liquidGlass.fillMedium} borderRadius={14} style={StyleSheet.absoluteFill} />
                  <Text style={styles.confirmText}>
                    {openTab.isPending ? 'Opening...' : 'Open Tab & Add Items'}
                  </Text>
                </TouchableOpacity>
              </GlassView>
            </GlassContainer>
          </Animated.View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  itemDescription: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    minWidth: 24,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    paddingVertical: 48,
  },
  floatingFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  addToTabButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addToTabText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  sheetContent: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 8,
  },
  sheetActions: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    textAlign: 'center',
    paddingTop: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  inputContainer: {
    borderRadius: 12,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  confirmButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  disabled: {
    opacity: 0.4,
  },
});
