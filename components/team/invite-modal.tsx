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
  KeyboardAvoidingView,
  Platform,
  Keyboard,
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

export interface InviteRole {
  id: number | string;
  name: string;
}

interface InviteModalBaseProps {
  visible: boolean;
  onClose: () => void;
  roles: InviteRole[];
  /** Title shown at the top. Default: "Invite Team Member" */
  title?: string;
  /** Success message prefix. Default: "Invite Sent!" */
  successTitle?: string;
}

interface EventInviteModalProps extends InviteModalBaseProps {
  mode?: 'event';
  eventId: number;
  onInvite?: never;
  isInviting?: never;
}

interface CustomInviteModalProps extends InviteModalBaseProps {
  mode: 'custom';
  eventId?: never;
  /** Custom invite handler — receives userId and roleId/string */
  onInvite: (userId: number, roleId: number | string) => Promise<void>;
  isInviting?: boolean;
}

interface SelectedUser {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  avatarUrl?: string | null;
}

type InviteModalProps = EventInviteModalProps | CustomInviteModalProps;

export function InviteModal(props: InviteModalProps) {
  const {
    visible,
    onClose,
    roles,
    title = 'Invite Team Member',
    successTitle = 'Invite Sent!',
  } = props;

  const isCustomMode = props.mode === 'custom';
  const eventId = isCustomMode ? 0 : props.eventId;

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
  const [selectedRoleId, setSelectedRoleId] = useState<number | string | null>(null);
  const [sent, setSent] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [customInviting, setCustomInviting] = useState(false);

  const isPending = isCustomMode ? customInviting : inviteMutation.isPending;
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

  const handleSendInvite = useCallback(async () => {
    if (!selectedUser || !selectedRoleId) return;

    if (isCustomMode && props.onInvite) {
      setCustomInviting(true);
      try {
        await props.onInvite(selectedUser.id, selectedRoleId);
        setSent(true);
      } catch (err: any) {
        setInviteError(err?.message || 'Failed to add member');
      } finally {
        setCustomInviting(false);
      }
    } else {
      inviteMutation.mutate(
        { userId: selectedUser.id, roleId: selectedRoleId as number },
        {
          onSuccess: () => setSent(true),
          onError: (err: any) => {
            const msg = err?.message || 'Failed to send invite';
            setInviteError(msg);
          },
        },
      );
    }
  }, [selectedUser, selectedRoleId, inviteMutation, isCustomMode, props]);

  const handleClose = () => {
    Keyboard.dismiss();
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
        <View style={[styles.selectCircle, isSelected && styles.selectCircleSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
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
        <View style={[styles.selectCircle, isSelected && styles.selectCircleSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
      <ConfirmSheet
        visible={!!inviteError}
        onClose={() => setInviteError(null)}
        title="Invite Error"
        message={inviteError || ''}
        alertOnly
        icon="alert-circle-outline"
      />
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#000000' }]}>
        {/* X button — top right */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {sent ? (
          /* Success state */
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={56} color="#22c55e" />
            <Text style={styles.successTitle}>{successTitle}</Text>
            <Text style={styles.successSubtitle}>
              {selectedUser
                ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()
                : 'User'}{' '}
              {isCustomMode
                ? 'has been added to the team.'
                : 'will see the invitation in their notifications.'}
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
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Results / Suggestions */}
            <View style={styles.resultsContainer}>
              {hasQuery ? (
                // Active search
                isSearching && peopleResults.length === 0 ? (
                  <ActivityIndicator
                    color="rgba(0,0,0,0.45)"
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
                    <Ionicons name="search-outline" size={32} color="rgba(0,0,0,0.1)" />
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
                      <Ionicons name="person-add-outline" size={32} color="rgba(0,0,0,0.1)" />
                      <Text style={styles.emptyText}>Search for a user to invite</Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>

            {/* Role Selection + Send — glass card above search */}
            {selectedUser && (
              <View style={styles.roleCard}>
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
                    (!selectedRoleId || isPending) && styles.sendDisabled,
                  ]}
                  onPress={handleSendInvite}
                  disabled={!selectedRoleId || isPending}
                  activeOpacity={0.7}
                >
                  <GlassView
                    {...liquidGlass.fillMedium}
                    borderRadius={12}
                    style={StyleSheet.absoluteFill}
                  />
                  {isPending ? (
                    <ActivityIndicator color="#1A1A1A" size="small" />
                  ) : (
                    <Text style={styles.sendText}>
                      {isCustomMode ? 'Add Member' : 'Send Invite'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Search Input — bottom, above keyboard */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color="rgba(0,0,0,0.35)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name or username..."
                  placeholderTextColor="rgba(0,0,0,0.25)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="rgba(0,0,0,0.35)" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
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
    color: 'rgba(0,0,0,0.25)',
  },
  sectionLabel: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  userRowSelected: {
    borderColor: 'rgba(0,0,0,0.15)',
  },
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
    color: '#1A1A1A',
    flexShrink: 1,
  },
  userHandle: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.45)',
    marginTop: 1,
  },
  mutualText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.3)',
    marginTop: 2,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  roleCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  selectCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectCircleSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  label: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
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
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  roleChipSelected: {
    borderColor: 'rgba(0,0,0,0.25)',
  },
  roleChipText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.45)',
  },
  roleChipTextSelected: {
    color: '#1A1A1A',
  },
  sendButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { fontSize: 16, color: '#1A1A1A' },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  successTitle: {
    fontSize: 22,
    color: '#1A1A1A',
  },
  successSubtitle: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.45)',
    textAlign: 'center',
    lineHeight: 22,
  },
  doneButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    overflow: 'hidden',
  },
  doneButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
});
