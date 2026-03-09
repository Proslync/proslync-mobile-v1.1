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
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStableRouter } from '@/hooks/use-stable-router';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDebounce } from '@/hooks';
import {
  useAdminUsers,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUpdateUserVerified,
} from '@/hooks/use-admin';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { ActionMenu, type ActionMenuItem } from '@/components/shared/action-menu';
import { ConfirmModal } from '@/components/shared/confirm-modal';
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
        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.cardElevated }]}>
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
  const { colors, isDark } = useAppTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useAdminUsers({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: 30,
  });

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

  const getActionItems = (u: AdminUser): ActionMenuItem[] => [
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

  const getRoleItems = (u: AdminUser): ActionMenuItem[] =>
    ROLE_OPTIONS.filter((r) => r !== u.role).map((role) => ({
      label: role.charAt(0).toUpperCase() + role.slice(1),
      onPress: () => { setRoleUser(null); updateRole.mutate({ userId: u.id, role }); },
    }));

  const users = data?.users ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Users</Text>
        <View style={styles.backBtn}>
          {data && (
            <Text style={[styles.countBadge, { color: colors.textSecondary }]}>{data.total}</Text>
          )}
        </View>
      </Animated.View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search users..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={(t) => { setSearch(t); setPage(1); }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, statusFilter === f.key && styles.filterChipActive]}
            onPress={() => { setStatusFilter(f.key); setPage(1); }}
          >
            <Text style={[styles.filterText, statusFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
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

      <ActionMenu
        visible={!!actionUser}
        onClose={() => setActionUser(null)}
        items={actionUser ? getActionItems(actionUser) : []}
      />

      <ActionMenu
        visible={!!roleUser}
        onClose={() => setRoleUser(null)}
        items={roleUser ? getRoleItems(roleUser) : []}
      />

      <ConfirmModal
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Lato_700Bold' },
  countBadge: { fontSize: 13, fontFamily: 'Lato_400Regular' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Lato_400Regular' },
  filterRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  filterText: { fontSize: 13, fontFamily: 'Lato_400Regular', color: 'rgba(255,255,255,0.6)' },
  filterTextActive: { color: '#fff', fontFamily: 'Lato_700Bold' },
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
  name: { fontSize: 14, fontFamily: 'Lato_700Bold', flexShrink: 1 },
  username: { fontSize: 12, fontFamily: 'Lato_400Regular', marginTop: 1 },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: 'Lato_700Bold', textTransform: 'capitalize' },
  emptyText: { fontSize: 14, fontFamily: 'Lato_400Regular' },
  loadMore: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, fontFamily: 'Lato_700Bold' },
});
