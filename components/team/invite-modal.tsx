import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass, glassTint } from '@/constants/glass/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useUnifiedSearch } from '@/hooks/use-unified-search';
import { useInviteByUserId } from '@/hooks';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import type { RoleResponseDto } from '@/lib/types/team.types';
import type { UnifiedSearchItem, SearchSuggestion } from '@/lib/types/search.types';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  roles: RoleResponseDto[];
  eventId: number;
}

interface SelectedUser {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  avatarUrl?: string | null;
}

export function InviteModal({
  visible,
  onClose,
  roles,
  eventId,
}: InviteModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const inviteMutation = useInviteByUserId(eventId);

  const {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    results,
    isSearching,
    suggestions,
  } = useUnifiedSearch();

  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const assignableRoles = roles.filter((r) => r.name !== 'Owner');

  // Filter to people only
  const peopleResults = results.filter((r) => r.type === 'person');

  const hasQuery = debouncedQuery.length > 0;
  const frequentFriends = suggestions?.frequentFriends ?? [];
  const mutualSuggestions = suggestions?.mutualFollowSuggestions ?? [];

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setSelectedUser(null);
      setSent(false);
      setInviteError(null);
      const defaultRole = assignableRoles[0];
      setSelectedRoleId(defaultRole?.id ?? null);
    }
  }, [visible]);

  const handleSelectPerson = useCallback((item: UnifiedSearchItem) => {
    setSelectedUser({
      id: item.id,
      firstName: item.firstName,
      lastName: item.lastName,
      userName: item.userName,
      avatarUrl: item.avatar?.url,
    });
  }, []);

  const handleSelectSuggestion = useCallback((item: SearchSuggestion) => {
    setSelectedUser({
      id: item.selectedId ?? item.id,
      firstName: item.firstName,
      lastName: item.lastName,
      userName: item.userName,
      avatarUrl: item.avatar?.url ?? item.displayImage,
    });
  }, []);

  const handleSendInvite = useCallback(() => {
    if (!selectedUser || !selectedRoleId) return;
    inviteMutation.mutate(
      { userId: selectedUser.id, roleId: selectedRoleId },
      {
        onSuccess: () => setSent(true),
        onError: (err: any) => {
          const msg = err?.message || 'Failed to send invite';
          setInviteError(msg);
        },
      },
    );
  }, [selectedUser, selectedRoleId, inviteMutation]);

  const handleClose = () => {
    onClose();
  };

  const renderPersonRow = ({ item }: { item: UnifiedSearchItem }) => {
    const isSelected = selectedUser?.id === item.id;
    const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim();

    return (
      <TouchableOpacity
        style={[styles.userRow, isSelected && styles.userRowSelected]}
        onPress={() => handleSelectPerson(item)}
        activeOpacity={0.7}
      >
        {isSelected && (
          <GlassView
            {...liquidGlass.fill}
            tintColor={glassTint.fillMedium}
            borderRadius={0}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={[styles.avatar, { overflow: 'hidden', backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.06)' }]}>
          {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={22} style={StyleSheet.absoluteFillObject} />}
          {item.avatar?.url ? (
            <Image source={{ uri: item.avatar.url }} style={StyleSheet.absoluteFillObject} />
          ) : (
            <Image source={DefaultAvatarImage} style={StyleSheet.absoluteFillObject} />
          )}
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>{fullName || 'User'}</Text>
            {item.isVerified && (
              <MaterialCommunityIcons name="check-decagram" size={14} color={colors.verified} style={{ marginLeft: 4 }} />
            )}
          </View>
          {item.userName && (
            <Text style={styles.userHandle} numberOfLines={1}>@{item.userName}</Text>
          )}
          {(item.mutualCount ?? 0) > 0 && (
            <Text style={styles.mutualText}>
              {item.mutualCount} mutual {item.mutualCount === 1 ? 'friend' : 'friends'}
            </Text>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
        )}
      </TouchableOpacity>
    );
  };

  const renderSuggestionRow = (item: SearchSuggestion) => {
    const userId = item.selectedId ?? item.id;
    const isSelected = selectedUser?.id === userId;
    const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim();

    return (
      <TouchableOpacity
        key={userId}
        style={[styles.userRow, isSelected && styles.userRowSelected]}
        onPress={() => handleSelectSuggestion(item)}
        activeOpacity={0.7}
      >
        {isSelected && (
          <GlassView
            {...liquidGlass.fill}
            tintColor={glassTint.fillMedium}
            borderRadius={0}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={[styles.avatar, { overflow: 'hidden', backgroundColor: isDark ? undefined : 'rgba(0,0,0,0.06)' }]}>
          {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={22} style={StyleSheet.absoluteFillObject} />}
          {item.avatar?.url ? (
            <Image source={{ uri: item.avatar.url }} style={StyleSheet.absoluteFillObject} />
          ) : (
            <Image source={DefaultAvatarImage} style={StyleSheet.absoluteFillObject} />
          )}
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>{fullName || item.displayName || 'User'}</Text>
            {item.isVerified && (
              <MaterialCommunityIcons name="check-decagram" size={14} color={colors.verified} style={{ marginLeft: 4 }} />
            )}
          </View>
          {item.userName && (
            <Text style={styles.userHandle} numberOfLines={1}>@{item.userName}</Text>
          )}
          {(item.mutualCount ?? 0) > 0 && (
            <Text style={styles.mutualText}>
              {item.mutualCount} mutual {item.mutualCount === 1 ? 'friend' : 'friends'}
            </Text>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <ConfirmSheet
        visible={!!inviteError}
        onClose={() => setInviteError(null)}
        title="Invite Error"
        message={inviteError || ''}
        alertOnly
        icon="alert-circle-outline"
      />
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Invite Team Member</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <GlassView
              {...liquidGlass.fillMedium}
              borderRadius={16}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.closeText}>{'\u2715'}</Text>
          </TouchableOpacity>
        </View>

        {sent ? (
          /* Success state */
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={56} color="#22c55e" />
            <Text style={styles.successTitle}>Invite Sent!</Text>
            <Text style={styles.successSubtitle}>
              {selectedUser
                ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()
                : 'User'}{' '}
              will see the invitation in their notifications.
            </Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <GlassView
                {...liquidGlass.fillMedium}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <GlassView
                {...liquidGlass.fill}
                borderRadius={12}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or username..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              )}
            </View>

            {/* Results / Suggestions */}
            <View style={styles.resultsContainer}>
              {hasQuery ? (
                // Active search
                isSearching && peopleResults.length === 0 ? (
                  <ActivityIndicator
                    color="rgba(255,255,255,0.5)"
                    style={styles.loadingIndicator}
                  />
                ) : peopleResults.length > 0 ? (
                  <FlatList
                    data={peopleResults}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderPersonRow}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={32} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyText}>No users found</Text>
                  </View>
                )
              ) : (
                // Suggestions (no query)
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {frequentFriends.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>Frequently searched</Text>
                      {frequentFriends.map((item) => renderSuggestionRow(item))}
                    </>
                  )}

                  {mutualSuggestions.length > 0 && (
                    <>
                      <Text style={[styles.sectionLabel, frequentFriends.length > 0 && { marginTop: 16 }]}>
                        Suggested for you
                      </Text>
                      {mutualSuggestions.map((item) => renderSuggestionRow(item))}
                    </>
                  )}

                  {frequentFriends.length === 0 && mutualSuggestions.length === 0 && (
                    <View style={styles.emptyState}>
                      <Ionicons name="person-add-outline" size={32} color="rgba(255,255,255,0.2)" />
                      <Text style={styles.emptyText}>Search for a user to invite</Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>

            {/* Role Selection + Send */}
            {selectedUser && (
              <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <Text style={styles.label}>Role</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.rolesRow}
                >
                  {assignableRoles.map((role) => {
                    const isSelected = selectedRoleId === role.id;
                    return (
                      <TouchableOpacity
                        key={role.id}
                        onPress={() => setSelectedRoleId(role.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.roleChip,
                            isSelected && styles.roleChipSelected,
                          ]}
                        >
                          <GlassView
                            {...liquidGlass.fill}
                            tintColor={isSelected ? glassTint.fillStrong : glassTint.fill}
                            borderRadius={16}
                            style={StyleSheet.absoluteFill}
                          />
                          <Text style={[styles.roleChipText, isSelected && styles.roleChipTextSelected]}>
                            {role.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!selectedRoleId || inviteMutation.isPending) && styles.sendDisabled,
                  ]}
                  onPress={handleSendInvite}
                  disabled={!selectedRoleId || inviteMutation.isPending}
                  activeOpacity={0.7}
                >
                  <GlassView
                    {...liquidGlass.fillMedium}
                    borderRadius={12}
                    style={StyleSheet.absoluteFill}
                  />
                  {inviteMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.sendText}>Send Invite</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: { fontSize: 18, fontFamily: 'Lato_700Bold', color: '#fff' },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 16, color: '#fff' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#fff',
    padding: 0,
  },
  resultsContainer: {
    flex: 1,
  },
  loadingIndicator: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.3)',
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    overflow: 'hidden',
  },
  userRowSelected: {},
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    flexShrink: 1,
  },
  userHandle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  mutualText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  rolesRow: {
    gap: 8,
    paddingBottom: 4,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  roleChipSelected: {
    borderColor: 'rgba(255,255,255,0.3)',
  },
  roleChipText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.6)',
  },
  roleChipTextSelected: {
    color: '#fff',
  },
  sendButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { fontSize: 16, fontFamily: 'Lato_700Bold', color: '#fff' },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  successSubtitle: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
  doneButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    overflow: 'hidden',
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
