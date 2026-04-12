import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { useQuery } from '@tanstack/react-query';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRefreshControl } from '@/hooks/use-refresh-control';

import { adminApi, type ModerationLogEntry } from '@/lib/api/admin';

type FilterTab = 'all' | 'removed' | 'approved';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} at ${h}:${m < 10 ? '0' : ''}${m} ${ampm}`;
}

function LogRow({ item }: { item: ModerationLogEntry }) {
  const isRemoved = item.action === 'removed';

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.logRow}>
      <GlassView
        {...liquidGlass.fillFaint}
        borderRadius={12}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.actionBadge, isRemoved ? styles.removedBadge : styles.approvedBadge]}>
        <Ionicons
          name={isRemoved ? 'close-circle' : 'checkmark-circle'}
          size={16}
          color={isRemoved ? '#f87171' : '#34d399'}
        />
      </View>
      <View style={styles.logContent}>
        <Text style={styles.logEventName} numberOfLines={1}>{item.eventName}</Text>
        <Text style={styles.logDate}>{formatDate(item.reviewedAt)}</Text>
        {isRemoved && item.reason && (
          <Text style={styles.logReason} numberOfLines={2}>{item.reason}</Text>
        )}
        {isRemoved && item.violations && item.violations.length > 0 && (
          <View style={styles.violationsRow}>
            {item.violations.map((v, i) => (
              <View key={i} style={styles.violationTag}>
                <Text style={styles.violationText}>{v}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <Text style={styles.reviewedBy}>{item.reviewedBy === 'ai' ? 'AI' : 'Admin'}</Text>
    </Animated.View>
  );
}

export default function ModerationScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [page] = useState(1);

  const { data: allLogs, isLoading: allLoading, refetch: refetchAll } = useQuery({
    queryKey: ['admin-moderation-log', page],
    queryFn: () => adminApi.getModerationLog(page, 50),
    staleTime: 60_000,
  });

  const { data: removedLogs, isLoading: removedLoading, refetch: refetchRemoved } = useQuery({
    queryKey: ['admin-moderation-removed', page],
    queryFn: () => adminApi.getRemovedEvents(page, 50),
    staleTime: 60_000,
  });

  const { refreshControl } = useRefreshControl({ onRefresh: async () => { await refetchAll(); await refetchRemoved(); } });

  const isLoading = activeFilter === 'all' ? allLoading : removedLoading;

  const displayData = React.useMemo(() => {
    if (activeFilter === 'all') return allLogs?.logs ?? [];
    if (activeFilter === 'removed') return removedLogs?.logs ?? [];
    return (allLogs?.logs ?? []).filter((l) => l.action === 'approved');
  }, [activeFilter, allLogs, removedLogs]);

  const renderItem = useCallback(
    ({ item }: { item: ModerationLogEntry }) => <LogRow item={item} />,
    [],
  );

  return (
    <View style={[styles.container, { backgroundColor: '#f2f2f2' }]}>

      {/* Pill row — back + filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.pillRow, { paddingTop: insets.top + 16 }]}
        style={styles.pillScroll}
      >
        <Pressable style={styles.pillIcon} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </Pressable>
        {(['all', 'removed', 'approved'] as const).map((tab) => {
          const isActive = activeFilter === tab;
          return (
            <Pressable
              key={tab}
              style={styles.filterPill}
              onPress={() => setActiveFilter(tab)}
            >
              <View style={styles.filterPillGlass} pointerEvents="none">
                <GlassView
                  {...liquidGlass.surface}
                  tintColor={isActive ? 'rgba(0,0,0,0.12)' : 'transparent'}
                  borderRadius={19}
                  style={StyleSheet.absoluteFill}
                />
              </View>
              <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{allLogs?.total ?? 0}</Text>
          <Text style={styles.statLabel}>Total Reviewed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#f87171' }]}>{removedLogs?.total ?? 0}</Text>
          <Text style={styles.statLabel}>Removed</Text>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="rgba(0,0,0,0.4)" />
        </View>
      ) : displayData.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="shield-checkmark-outline" size={48} color="rgba(0,0,0,0.2)" />
          <Text style={styles.emptyText}>No moderation logs yet</Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          refreshControl={refreshControl}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pillRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingBottom: 8 },
  pillScroll: { flexGrow: 0 },
  pillIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  filterPill: { height: 38, borderRadius: 19, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  filterPillGlass: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: 19 },
  filterPillText: { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.5)' },
  filterPillTextActive: { color: 'rgba(0,0,0,0.8)' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(0,0,0,0.8)',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.5)',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  filterTabActive: {
    borderColor: 'rgba(0,0,0,0.25)',
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Lato_600SemiBold',
    color: 'rgba(0,0,0,0.5)',
  },
  filterTextActive: {
    color: 'rgba(0,0,0,0.8)',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.35)',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  actionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  removedBadge: {
    backgroundColor: 'rgba(248,113,113,0.15)',
  },
  approvedBadge: {
    backgroundColor: 'rgba(52,211,153,0.15)',
  },
  logContent: {
    flex: 1,
  },
  logEventName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(0,0,0,0.8)',
  },
  logDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.35)',
    marginTop: 2,
  },
  logReason: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(0,0,0,0.6)',
    marginTop: 6,
  },
  violationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  violationTag: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  violationText: {
    fontSize: 11,
    fontFamily: 'Lato_600SemiBold',
    color: '#f87171',
  },
  reviewedBy: {
    fontSize: 11,
    fontFamily: 'Lato_600SemiBold',
    color: 'rgba(0,0,0,0.3)',
    marginTop: 2,
  },
});
