import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassButton } from '@/components/glass/glass-button';
import { liquidGlass, glassBorder, glassText, glassSurfaceTint } from '@/constants/glass/liquid-glass';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useBlockedUsers, useUnblockUser } from '@/hooks';
import type { BlockedUserItem } from '@/lib/api/users';

const DefaultAvatar = require('@/assets/images/default-avatar.png');

function BlockedUserRow({
  user,
  onUnblock,
  isUnblocking,
  border,
  t,
  surfaceTint,
  isDark,
}: {
  user: BlockedUserItem;
  onUnblock: (userId: number) => void;
  isUnblocking: boolean;
  border: string;
  t: { primary: string; muted: string; tertiary: string };
  surfaceTint: string;
  isDark: boolean;
}) {
  const displayName =
    user.userName ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    'User';

  return (
    <View style={[styles.userCard, { borderColor: border }]}>
      <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={14} style={StyleSheet.absoluteFillObject} />
      <View style={styles.userRow}>
        <Image
          source={user.avatarUrl ? { uri: user.avatarUrl } : DefaultAvatar}
          style={[styles.avatar, { borderColor: border }]}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: t.primary }]} numberOfLines={1}>
            {displayName}
          </Text>
          {user.userName && (user.firstName || user.lastName) && (
            <Text style={[styles.userHandle, { color: t.muted }]} numberOfLines={1}>
              @{user.userName}
            </Text>
          )}
        </View>
        <GlassButton
          label={isUnblocking ? '' : 'Unblock'}
          variant="glass"
          size="sm"
          onPress={() => onUnblock(user.id)}
          disabled={isUnblocking}
          icon={isUnblocking ? <ActivityIndicator size="small" color="#fff" /> : undefined}
        />
      </View>
    </View>
  );
}

export default function BlockedUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const theme = isDark ? 'dark' : 'light';
  const t = glassText[theme];
  const border = glassBorder[theme];
  const surfaceTint = glassSurfaceTint[theme];

  const { blockedUsers, isLoading, error, refetch } = useBlockedUsers();
  const { unblock } = useUnblockUser();
  const [unblockingId, setUnblockingId] = React.useState<number | null>(null);


  const handleUnblock = (userId: number) => {
    const user = blockedUsers.find((u) => u.id === userId);
    const name = user?.userName || user?.firstName || 'this user';

    Alert.alert('Unblock User', `Are you sure you want to unblock ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          setUnblockingId(userId);
          try {
            await unblock(userId);
          } finally {
            setUnblockingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <DarkGradientBg />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { borderColor: border }]}
        >
          <GlassView {...liquidGlass.surface} tintColor={surfaceTint} borderRadius={18} style={StyleSheet.absoluteFill} />
          <Ionicons name="chevron-back" size={20} color={t.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.primary }]}>Blocked Users</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={t.muted} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={48} color="#ff3b30" />
          <Text style={[styles.emptyText, { color: '#ff3b30' }]}>Failed to load</Text>
          <Text style={[styles.emptySubtext, { color: t.tertiary }]}>
            {(error as any)?.message || String(error)}
          </Text>
        </View>
      ) : blockedUsers.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="shield-checkmark-outline" size={48} color={t.muted} />
          <Text style={[styles.emptyText, { color: t.muted }]}>No blocked users</Text>
          <Text style={[styles.emptySubtext, { color: t.tertiary }]}>
            Users you block won't be able to see your profile or interact with you.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BlockedUserRow
              user={item}
              onUnblock={handleUnblock}
              isUnblocking={unblockingId === item.id}
              border={border}
              t={t}
              surfaceTint={surfaceTint}
              isDark={isDark}
            />
          )}
        />
      )}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  headerRight: {
    width: 36,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 17,
    fontFamily: 'Lato_600SemiBold',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  userCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontFamily: 'Lato_600SemiBold',
  },
  userHandle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
});
