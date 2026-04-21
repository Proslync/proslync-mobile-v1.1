import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStableRouter } from '@/hooks/use-stable-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDebounce } from '@/hooks';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { LinearGradient } from 'expo-linear-gradient';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import {
  useAdminUsers,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUpdateUserVerified,
} from '@/hooks/use-admin';

import { ActionSheet, type ActionSheetOption } from '@/components/ui/action-sheet';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import type { AdminUser } from '@/lib/api/admin';

const ROLE_OPTIONS = ['user', 'host', 'bouncer', 'owner', 'admin'];
const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'pending', label: 'Pending' },
];

function UserRow({
  user,
  onPress,
  colors,
}: {
  user: AdminUser;
  onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.userName ||
    'No name';

  return (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder, { overflow: 'hidden' as const }]}>
          <GlassView {...liquidGlass.fillFaint} borderRadius={20} style={StyleSheet.absoluteFillObject} />
          <Ionicons name="person" size={18} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.rowContent}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          {user.isVerified && (
            <Ionicons name="checkmark-circle" size={14} color="#4FC3F7" />
          )}
        </View>
        <Text style={[styles.username, { color: colors.textSecondary }]}>
          @{user.userName || user.id}
        </Text>
      </View>
      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: user.status === 'blocked' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)' }]}>
          <Text style={[styles.badgeText, { color: user.status === 'blocked' ? '#ef4444' : colors.textSecondary }]}>
            {user.role}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const { colors } = useAppTheme();
  const [search, setSearch] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useAdminUsers({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: 30,
  });

  const { refreshControl } = useRefreshControl({ onRefresh: async () => { await refetch(); } });

  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const updateVerified = useUpdateUserVerified();

  const [actionUser, setActionUser] = useState<AdminUser | null>(null);
  const [roleUser, setRoleUser] = useState<AdminUser | null>(null);
  const [banConfirmUser, setBanConfirmUser] = useState<AdminUser | null>(null);

  const showActions = useCallback(
    (user: AdminUser) => {
      setActionUser(user);
    },
    [],
  );

  const getActionItems = (u: AdminUser): ActionSheetOption[] => [
    {
      label: 'Change Role',
      icon: 'shield-outline',
      onPress: () => { setActionUser(null); setRoleUser(u); },
    },
    {
      label: u.status === 'blocked' ? 'Unblock User' : 'Ban User',
      icon: u.status === 'blocked' ? 'lock-open-outline' : 'ban',
      destructive: u.status !== 'blocked',
      onPress: () => { setActionUser(null); setBanConfirmUser(u); },
    },
    {
      label: u.isVerified ? 'Remove Verified' : 'Give Verified Badge',
      icon: u.isVerified ? 'close-circle-outline' : 'checkmark-circle-outline',
      onPress: () => { setActionUser(null); updateVerified.mutate({ userId: u.id, isVerified: !u.isVerified }); },
    },
  ];

  const getRoleItems = (u: AdminUser): ActionSheetOption[] =>
    ROLE_OPTIONS.filter((r) => r !== u.role).map((role) => ({
      label: role.charAt(0).toUpperCase() + role.slice(1),
      onPress: () => { setRoleUser(null); updateRole.mutate({ userId: u.id, role }); },
    }));

  const users = data?.users ?? [];

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>

      {/* Top row — back, search, filter pills (fixed) */}
      {isSearchActive ? (
        <View style={[styles.pillRow, styles.pillRowFixed, { paddingTop: insets.top + 16 }]}>
          <View style={styles.searchBarInline}>
            <Ionicons name="search" size={18} color="rgba(0,0,0,0.4)" />
            <TextInput
              style={styles.searchInputInline}
              value={search}
              onChangeText={(t) => { setSearch(t); setPage(1); }}
              placeholder="Search users..."
              placeholderTextColor="rgba(0,0,0,0.35)"
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="rgba(0,0,0,0.3)" />
              </TouchableOpacity>
            )}
          </View>
          <Pressable style={styles.pillIcon} onPress={() => { setIsSearchActive(false); setSearch(''); }}>
            <Ionicons name="close" size={20} color="#000" />
          </Pressable>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.pillRow, { paddingTop: insets.top + 16 }]}
          style={[styles.pillScroll, styles.pillRowFixed]}
        >
          <Pressable style={styles.pillIcon} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#000" />
          </Pressable>
          <Pressable style={styles.pillIcon} onPress={() => setIsSearchActive(true)}>
            <Ionicons name="search" size={18} color="#000" />
          </Pressable>
          {STATUS_FILTERS.map((f) => {
            const isActive = statusFilter === f.key;
            return (
              <Pressable
                key={f.key}
                style={styles.filterPill}
                onPress={() => { setStatusFilter(f.key); setPage(1); }}
              >
                {isLiquidGlassSupported ? (
                  <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
                ) : (
                  <View style={styles.filterPillGlass} pointerEvents="none">
                    <GlassView {...liquidGlass.surface} tintColor={isActive ? 'rgba(0,0,0,0.12)' : 'transparent'} borderRadius={19} style={StyleSheet.absoluteFill} />
                  </View>
                )}
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Top fade */}
      <LinearGradient colors={['#000000', 'rgba(0,0,0,0)']} style={styles.topFade} pointerEvents="none" />

      {/* User List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <UserRow user={item} onPress={() => showActions(item)} colors={colors} />
          )}
          refreshControl={refreshControl}
          contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: insets.bottom + 40 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No users found</Text>
            </View>
          }
          ListFooterComponent={
            data && data.totalPages > page ? (
              <TouchableOpacity style={styles.loadMore} onPress={() => setPage((p) => p + 1)}>
                <Text style={[styles.loadMoreText, { color: colors.text }]}>Load More</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      <ActionSheet
        visible={!!actionUser}
        onClose={() => setActionUser(null)}
        options={actionUser ? getActionItems(actionUser) : []}
      />

      <ActionSheet
        visible={!!roleUser}
        onClose={() => setRoleUser(null)}
        options={roleUser ? getRoleItems(roleUser) : []}
      />

      <ConfirmSheet
        visible={!!banConfirmUser}
        onClose={() => setBanConfirmUser(null)}
        onConfirm={() => {
          if (banConfirmUser) {
            const newStatus = banConfirmUser.status === 'blocked' ? 'active' : 'blocked';
            updateStatus.mutate({ userId: banConfirmUser.id, status: newStatus });
            setBanConfirmUser(null);
          }
        }}
        title="Confirm"
        message={`${banConfirmUser?.status === 'blocked' ? 'Unblock' : 'Ban'} ${banConfirmUser?.userName || 'this user'}?`}
        confirmLabel="Confirm"
        destructive={banConfirmUser?.status !== 'blocked'}
        icon={banConfirmUser?.status === 'blocked' ? 'lock-open-outline' : 'ban'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  pillRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, alignItems: 'center', paddingBottom: 8 },
  pillRowFixed: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 9 },
  pillScroll: { flexGrow: 0 },
  pillIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  filterPill: { height: 38, borderRadius: 19, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  filterPillGlass: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: 19 },
  filterPillText: { fontSize: 14, fontWeight: '500', color: 'rgba(0,0,0,0.5)' },
  filterPillTextActive: { color: 'rgba(0,0,0,0.8)' },
  searchBarInline: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 38, borderRadius: 19, backgroundColor: '#fff', paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  searchInputInline: { flex: 1, fontSize: 15, color: '#000', padding: 0 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, },
  filterRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  filterChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  filterText: { fontSize: 14, color: '#1a1a1a' },
  filterTextActive: { color: '#ffffff' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  rowContent: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 14, flexShrink: 1 },
  username: { fontSize: 12, marginTop: 1 },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, textTransform: 'capitalize' },
  emptyText: { fontSize: 14, },
  loadMore: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, },
});
