import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
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
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassView, GlassContainer } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { BarTabCard } from '@/components/bar/bar-tab-card';
import { BarSummaryCard } from '@/components/bar/bar-summary-card';
import { useStableRouter } from '@/hooks/use-stable-router';
import { useBarTabs, useBarSummary, useOpenTab } from '@/hooks';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useToast } from '@/components/shared/toast';
import { OpenTabFab } from '@/components/bar/open-tab-fab';
import { canUseNativeSheet } from '@/components/ui/native-sheet';
import type { BarTab } from '@/lib/types/bar-tab.types';

const TAB_BAR_HEIGHT = 49;
const RADIUS = 24;
const SPRING_CONFIG = { damping: 20, stiffness: 300, mass: 0.8 };

const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
);

export default function BarDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const { showError } = useToast();
  const eventId = id ? Number(id) : undefined;

  const { data: tabsData, isLoading, refetch } = useBarTabs(eventId);
  const { data: summary } = useBarSummary(eventId);
  const openTab = useOpenTab(eventId ?? 0);

  const [customerName, setCustomerName] = React.useState('');
  const newTabSheetRef = React.useRef<BottomSheet>(null);
  const sheetScale = useSharedValue(0.85);
  const sheetOpacity = useSharedValue(0);

  const { refreshControl } = useRefreshControl({
    onRefresh: async () => { await refetch(); },
  });

  const openSheet = React.useCallback(() => {
    setCustomerName('');
    newTabSheetRef.current?.expand();
    sheetScale.value = withSpring(1, SPRING_CONFIG);
    sheetOpacity.value = withTiming(1, { duration: 200 });
  }, [sheetScale, sheetOpacity]);

  const closeSheet = React.useCallback(() => {
    sheetScale.value = withTiming(0.85, { duration: 150 });
    sheetOpacity.value = withTiming(0, { duration: 150 });
    newTabSheetRef.current?.close();
  }, [sheetScale, sheetOpacity]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sheetScale.value }],
    opacity: sheetOpacity.value,
  }));

  const handleTabPress = React.useCallback(
    (tab: BarTab) => {
      router.push({
        pathname: '/manage-event/[id]/bar-tab-detail',
        params: { id: id!, tabId: String(tab.id) },
      });
    },
    [router, id],
  );

  const handleConfirmOpenTab = React.useCallback(async () => {
    const name = customerName.trim();
    if (!name || !eventId) return;
    try {
      const { tab } = await openTab.mutateAsync({ customerName: name });
      closeSheet();
      router.push({
        pathname: '/manage-event/[id]/bar-tab-detail',
        params: { id: id!, tabId: String(tab.id) },
      });
    } catch {
      showError('Failed to open tab. Please try again.');
    }
  }, [customerName, eventId, openTab, router, id, closeSheet, showError]);

  const openTabs = React.useMemo(
    () => (tabsData?.tabs ?? []).filter((t) => t.status === 'open'),
    [tabsData],
  );

  const renderItem = React.useCallback(
    ({ item }: { item: BarTab }) => (
      <BarTabCard tab={item} onPress={() => handleTabPress(item)} />
    ),
    [handleTabPress],
  );

  const listHeader = React.useMemo(
    () => (
      <Animated.View entering={FadeInDown.duration(400)}>
        {summary && <BarSummaryCard summary={summary} />}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Open Tabs ({openTabs.length})
          </Text>
        </View>
      </Animated.View>
    ),
    [summary, openTabs.length],
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
        <Text style={styles.headerTitle}>Bar</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={openTabs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={refreshControl}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No open tabs</Text>
          }
        />
      )}

      {/* Open New Tab — native SwiftUI on iOS 26+, fallback to gorhom */}
      {canUseNativeSheet() ? (
        <OpenTabFab
          onOpenTab={async (name) => {
            if (!eventId) return;
            const { tab } = await openTab.mutateAsync({ customerName: name });
            router.push({
              pathname: '/manage-event/[id]/bar-tab-detail',
              params: { id: id!, tabId: String(tab.id) },
            });
          }}
          isPending={openTab.isPending}
        />
      ) : (
        <>
          <View style={[styles.fabContainer, { bottom: insets.bottom + 24 }]}>
            <TouchableOpacity
              style={[styles.fab, { overflow: 'hidden' }]}
              onPress={openSheet}
              activeOpacity={0.7}
            >
              <GlassView {...liquidGlass.fillMedium} borderRadius={28} style={StyleSheet.absoluteFill} />
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.fabText}>Open New Tab</Text>
            </TouchableOpacity>
          </View>

          <BottomSheet
            ref={newTabSheetRef}
            index={-1}
            enableDynamicSizing
            enablePanDownToClose
            onClose={closeSheet}
            backgroundStyle={{ backgroundColor: 'transparent', borderRadius: RADIUS }}
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
            backdropComponent={renderBackdrop}
          >
            <BottomSheetView style={styles.sheetContent}>
              <Animated.View style={sheetAnimatedStyle}>
                <GlassContainer spacing={8} style={{ gap: 8 }}>
                  <GlassView {...liquidGlass.surface} borderRadius={RADIUS} style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Open New Tab</Text>
                    <View style={styles.inputContainer}>
                      <GlassView {...liquidGlass.fillMedium} borderRadius={12} style={StyleSheet.absoluteFill} />
                      <TextInput
                        style={styles.input}
                        placeholder="Customer name"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={customerName}
                        onChangeText={setCustomerName}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleConfirmOpenTab}
                      />
                    </View>
                  </GlassView>
                  <GlassView {...liquidGlass.surface} borderRadius={RADIUS} style={styles.sheetActions}>
                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        (!customerName.trim() || openTab.isPending) && styles.disabled,
                      ]}
                      onPress={handleConfirmOpenTab}
                      disabled={!customerName.trim() || openTab.isPending}
                      activeOpacity={0.7}
                    >
                      <GlassView {...liquidGlass.fillStrong} borderRadius={14} style={StyleSheet.absoluteFill} isInteractive />
                      <Text style={styles.confirmText}>
                        {openTab.isPending ? 'Opening...' : 'Open Tab'}
                      </Text>
                    </TouchableOpacity>
                  </GlassView>
                </GlassContainer>
              </Animated.View>
            </BottomSheetView>
          </BottomSheet>
        </>
      )}
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    paddingVertical: 32,
  },
  fabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  fabText: {
    fontSize: 15,
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
    gap: 12,
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
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
  },
  confirmButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
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
