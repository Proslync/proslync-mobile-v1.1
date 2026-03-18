import { useState } from 'react';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassSurface } from '@/components/glass/glass-surface';
import { GlassButton } from '@/components/glass/glass-button';
import { BottomSheet } from '@/components/wallet/bottom-sheet';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useStableRouter } from '@/hooks/use-stable-router';
import {
  useVenueMenu,
  useCreateMenuCategory,
  useDeleteMenuCategory,
  useCreateMenuItem,
  useDeleteMenuItem,
} from '@/hooks/use-venue-menu';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function VenueMenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const venueId = id ? Number(id) : undefined;

  const { data: categories = [], isLoading, refetch } = useVenueMenu(venueId);
  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await refetch();
    },
  });
  const createCategory = useCreateMenuCategory(venueId!);
  const deleteCategory = useDeleteMenuCategory(venueId!);
  const createItem = useCreateMenuItem(venueId!);
  const deleteItem = useDeleteMenuItem(venueId!);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState<{ visible: boolean; categoryId: number | null }>({
    visible: false,
    categoryId: null,
  });

  const [categoryName, setCategoryName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<{ id: number; name: string } | null>(null);

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;
    try {
      await createCategory.mutateAsync({ name: categoryName.trim() });
      setShowAddCategory(false);
      setCategoryName('');
    } catch (err: any) {
      setErrorAlert(err?.message || 'Failed to create category.');
    }
  };

  const handleCreateItem = async () => {
    if (!itemName.trim() || !itemPrice.trim() || !showAddItem.categoryId) return;
    try {
      const priceInCents = Math.round(parseFloat(itemPrice) * 100);
      if (isNaN(priceInCents) || priceInCents < 0) {
        setErrorAlert('Please enter a valid price.');
        return;
      }
      await createItem.mutateAsync({
        categoryId: showAddItem.categoryId,
        name: itemName.trim(),
        description: itemDescription.trim() || undefined,
        price: priceInCents,
      });
      setShowAddItem({ visible: false, categoryId: null });
      setItemName('');
      setItemPrice('');
      setItemDescription('');
    } catch (err: any) {
      setErrorAlert(err?.message || 'Failed to create item.');
    }
  };

  const resetItemForm = () => {
    setShowAddItem({ visible: false, categoryId: null });
    setItemName('');
    setItemPrice('');
    setItemDescription('');
  };

  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
    },
  ];

  const inputPlaceholderColor = colors.textTertiary;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isDark && <DarkGradientBg />}
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Menu</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Menu</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {/* Empty state */}
        {categories.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No menu categories yet</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Add a category to start building your menu.
            </Text>
          </Animated.View>
        ) : (
          categories.map((category, index) => (
            <Animated.View
              key={category.id}
              entering={FadeInDown.delay(index * 60).duration(300)}
              style={styles.categoryWrapper}
            >
              <GlassSurface fill="subtle" border="subtle" cornerRadius="lg" style={styles.categoryCard}>
                {/* Category header */}
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryHeaderLeft}>
                    <View style={[styles.categoryIconBg, { backgroundColor: isDark ? undefined : colors.backgroundSecondary, overflow: 'hidden' as const }]}>
                      {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={8} style={StyleSheet.absoluteFillObject} />}
                      <Ionicons name="restaurant-outline" size={16} color={colors.text} />
                    </View>
                    <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => setDeleteCategoryTarget({ id: category.id, name: category.name })}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]} />

                {/* Items list */}
                {category.items.length === 0 ? (
                  <View style={styles.noItemsRow}>
                    <Text style={[styles.noItemsText, { color: colors.textTertiary }]}>
                      No items in this category
                    </Text>
                  </View>
                ) : (
                  category.items.map((item, iIndex) => (
                    <View key={item.id}>
                      {iIndex > 0 && (
                        <View style={[styles.itemDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]} />
                      )}
                      <View style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                          <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                          {item.description ? (
                            <Text style={[styles.itemDesc, { color: colors.textTertiary }]} numberOfLines={1}>
                              {item.description}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={[styles.itemPrice, { color: colors.text }]}>
                          {formatPrice(item.price)}
                        </Text>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => setDeleteItemTarget({ id: item.id, name: item.name })}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle-outline" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}

                {/* Add Item button */}
                <View style={[styles.addItemRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
                  <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={() => setShowAddItem({ visible: true, categoryId: category.id })}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.addItemText, { color: colors.textSecondary }]}>Add Item</Text>
                  </TouchableOpacity>
                </View>
              </GlassSurface>
            </Animated.View>
          ))
        )}

        {/* Add Category button */}
        <Animated.View entering={FadeInDown.delay(categories.length * 60).duration(300)} style={styles.addCategoryRow}>
          <GlassButton
            label="Add Category"
            icon={<Ionicons name="add" size={18} color={isDark ? '#ffffff' : '#1a1a1a'} />}
            variant="glass"
            size="md"
            fullWidth
            onPress={() => setShowAddCategory(true)}
          />
        </Animated.View>
      </ScrollView>

      {/* Add Category Bottom Sheet */}
      <BottomSheet
        visible={showAddCategory}
        onClose={() => {
          setShowAddCategory(false);
          setCategoryName('');
        }}
      >
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Category</Text>
            <Text style={[styles.sheetSubtitle, { color: colors.textTertiary }]}>
              Categories group menu items (e.g. Cocktails, Beer, Shots)
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category Name</Text>
            <View style={styles.inputWrapper}>
              {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
              <TextInput
                style={inputStyle}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="e.g. Cocktails"
                placeholderTextColor={inputPlaceholderColor}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                  handleCreateCategory();
                }}
              />
            </View>

            <View style={styles.sheetActions}>
              <GlassButton
                label="Create Category"
                variant="glass"
                size="md"
                fullWidth
                loading={createCategory.isPending}
                disabled={!categoryName.trim() || createCategory.isPending}
                onPress={handleCreateCategory}
              />
            </View>
          </View>
        </ScrollView>
      </BottomSheet>

      {/* Add Item Bottom Sheet */}
      <BottomSheet visible={showAddItem.visible} onClose={resetItemForm}>
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Add Item</Text>
            <Text style={[styles.sheetSubtitle, { color: colors.textTertiary }]}>
              Add a menu item with name and price
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Item Name</Text>
            <View style={styles.inputWrapper}>
              {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
              <TextInput
                style={inputStyle}
                value={itemName}
                onChangeText={setItemName}
                placeholder="e.g. Old Fashioned"
                placeholderTextColor={inputPlaceholderColor}
                autoFocus
                returnKeyType="next"
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Price ($)</Text>
            <View style={styles.inputWrapper}>
              {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
              <TextInput
                style={inputStyle}
                value={itemPrice}
                onChangeText={setItemPrice}
                placeholder="e.g. 14.00"
                placeholderTextColor={inputPlaceholderColor}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Description{' '}
              <Text style={[styles.fieldLabelOptional, { color: colors.textTertiary }]}>(optional)</Text>
            </Text>
            <View style={styles.inputWrapper}>
              {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={10} style={StyleSheet.absoluteFillObject} />}
              <TextInput
                style={inputStyle}
                value={itemDescription}
                onChangeText={setItemDescription}
                placeholder="e.g. Bourbon, sugar, bitters, orange peel"
                placeholderTextColor={inputPlaceholderColor}
                returnKeyType="done"
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                  handleCreateItem();
                }}
              />
            </View>

            <View style={styles.sheetActions}>
              <GlassButton
                label="Add Item"
                variant="glass"
                size="md"
                fullWidth
                loading={createItem.isPending}
                disabled={!itemName.trim() || !itemPrice.trim() || createItem.isPending}
                onPress={handleCreateItem}
              />
            </View>
          </View>
        </ScrollView>
      </BottomSheet>

      <ConfirmModal
        visible={!!errorAlert}
        onClose={() => setErrorAlert(null)}
        title="Error"
        message={errorAlert || ''}
        alertOnly
        icon="alert-circle-outline"
      />

      <ConfirmModal
        visible={!!deleteCategoryTarget}
        onClose={() => setDeleteCategoryTarget(null)}
        onConfirm={() => {
          if (deleteCategoryTarget) {
            deleteCategory.mutateAsync(deleteCategoryTarget.id);
            setDeleteCategoryTarget(null);
          }
        }}
        title="Delete Category"
        message={`Delete "${deleteCategoryTarget?.name}"? All items in this category will also be removed.`}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
      />

      <ConfirmModal
        visible={!!deleteItemTarget}
        onClose={() => setDeleteItemTarget(null)}
        onConfirm={() => {
          if (deleteItemTarget) {
            deleteItem.mutateAsync(deleteItemTarget.id);
            setDeleteItemTarget(null);
          }
        }}
        title="Delete Item"
        message={`Delete "${deleteItemTarget?.name}"?`}
        confirmLabel="Delete"
        destructive
        icon="trash-outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
  },
  categoryWrapper: {},
  categoryCard: {
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    flex: 1,
  },
  deleteButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  noItemsRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noItemsText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  itemDivider: {
    height: 1,
    marginHorizontal: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  itemDesc: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    marginRight: 4,
  },
  addItemRow: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  addItemText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  addCategoryRow: {
    marginTop: 4,
  },
  sheetContent: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginBottom: 20,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Lato_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldLabelOptional: {
    fontFamily: 'Lato_400Regular',
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 12,
  },
  inputWrapper: {
    overflow: 'hidden',
    borderRadius: 10,
    marginBottom: 16,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
  sheetActions: {
    marginTop: 4,
  },
});
