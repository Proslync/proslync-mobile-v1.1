// Channel settings screen — edit info, manage members, delete/leave
import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useToast } from '@/components/shared/toast';
import { useAuth } from '@/lib/providers/auth-provider';
import { useChannel, useChannelMembers } from '@/hooks/use-channels';
import {
  useUpdateChannel,
  useDeleteChannel,
  useLeaveChannel,
  useRemoveChannelMember,
  useUpdateChannelMemberRole,
  useAddChannelMember,
} from '@/hooks/use-channel-mutations';
import { searchApi } from '@/lib/api/search';
import { useDebounce } from '@/hooks';
import { useQuery } from '@tanstack/react-query';
import type { ChannelMemberResponse, ChannelVisibility } from '@/lib/api/channels';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

interface UserSearchResult {
  id: number;
  userName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

function InviteMemberModal({
  visible,
  onClose,
  onInvite,
  isInviting,
  existingMemberIds,
}: {
  visible: boolean;
  onClose: () => void;
  onInvite: (userId: number) => void;
  isInviting: boolean;
  existingMemberIds: Set<number>;
}) {
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebounce(query, 250);

  React.useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const { data: results = [], isLoading } = useQuery<UserSearchResult[]>({
    queryKey: ['user-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const response = await searchApi.search({
        query: debouncedQuery,
        peopleLimit: 20,
        eventsLimit: 0,
        venuesLimit: 0,
      });
      const people = (response.people ?? []) as UserSearchResult[];
      return people;
    },
    enabled: visible && debouncedQuery.trim().length > 0,
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Invite Member</Text>
          <View style={{ width: 36 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={18} color="rgba(0,0,0,0.4)" />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or username"
              placeholderTextColor="rgba(0,0,0,0.35)"
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color="rgba(0,0,0,0.3)" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const name = item.firstName
                ? `${item.firstName}${item.lastName ? ' ' + item.lastName : ''}`
                : item.userName || `User ${item.id}`;
              const isMember = existingMemberIds.has(item.id);
              return (
                <View style={styles.searchRow}>
                  <Image
                    source={item.avatarUrl ? { uri: item.avatarUrl } : DefaultAvatarImage}
                    style={styles.searchAvatar}
                  />
                  <View style={styles.searchInfo}>
                    <Text style={styles.searchName} numberOfLines={1}>
                      {name}
                    </Text>
                    {item.userName ? (
                      <Text style={styles.searchUsername} numberOfLines={1}>
                        @{item.userName}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={[styles.inviteButton, isMember && styles.inviteButtonDisabled]}
                    onPress={() => !isMember && onInvite(item.id)}
                    disabled={isMember || isInviting}
                    activeOpacity={0.8}
                  >
                    {isInviting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.inviteButtonText}>{isMember ? 'Added' : 'Add'}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              isLoading ? (
                <View style={styles.searchEmpty}>
                  <ActivityIndicator color="#000" />
                </View>
              ) : debouncedQuery.length > 0 ? (
                <View style={styles.searchEmpty}>
                  <Text style={styles.searchEmptyText}>No users found</Text>
                </View>
              ) : (
                <View style={styles.searchEmpty}>
                  <Text style={styles.searchEmptyText}>Search for someone to invite</Text>
                </View>
              )
            }
          />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function MemberRow({
  member,
  canManage,
  isCurrentUserOwner,
  onRemove,
  onPromote,
}: {
  member: ChannelMemberResponse;
  canManage: boolean;
  isCurrentUserOwner: boolean;
  onRemove: () => void;
  onPromote: () => void;
}) {
  const name = member.user?.firstName
    ? `${member.user.firstName}${member.user.lastName ? ' ' + member.user.lastName : ''}`
    : member.user?.userName || `User ${member.userId}`;

  const roleLabel =
    member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Member';

  const showActions = canManage && member.role !== 'owner';

  const handlePress = () => {
    if (!showActions) return;
    const options: { text: string; style?: 'destructive' | 'cancel'; onPress?: () => void }[] = [];
    if (isCurrentUserOwner && member.role === 'member') {
      options.push({ text: 'Promote to Admin', onPress: onPromote });
    }
    options.push({ text: 'Remove from Channel', style: 'destructive', onPress: onRemove });
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(name, undefined, options);
  };

  return (
    <TouchableOpacity
      style={styles.memberRow}
      onPress={handlePress}
      activeOpacity={showActions ? 0.7 : 1}
      disabled={!showActions}
    >
      <Image
        source={member.user?.avatarUrl ? { uri: member.user.avatarUrl } : DefaultAvatarImage}
        style={styles.memberAvatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.memberRole}>{roleLabel}</Text>
      </View>
      {showActions ? <Ionicons name="ellipsis-horizontal" size={18} color="rgba(0,0,0,0.3)" /> : null}
    </TouchableOpacity>
  );
}

export default function ChannelSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();
  const { user: authUser } = useAuth();

  const { data: channel, isLoading: isLoadingChannel } = useChannel(id);
  const { data: membersData, isLoading: isLoadingMembers } = useChannelMembers(id);
  const updateChannel = useUpdateChannel(id ?? '');
  const deleteChannel = useDeleteChannel();
  const leaveChannel = useLeaveChannel();
  const removeMember = useRemoveChannelMember(id ?? '');
  const updateRole = useUpdateChannelMemberRole(id ?? '');
  const addMember = useAddChannelMember(id ?? '');
  const [inviteModalVisible, setInviteModalVisible] = React.useState(false);

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [visibility, setVisibility] = React.useState<ChannelVisibility>('public');
  const [hasInitialized, setHasInitialized] = React.useState(false);

  React.useEffect(() => {
    if (channel && !hasInitialized) {
      setName(channel.name);
      setDescription(channel.description ?? '');
      setVisibility(channel.visibility);
      setHasInitialized(true);
    }
  }, [channel, hasInitialized]);

  const isOwner = channel?.userRole === 'owner';
  const isAdmin = channel?.userRole === 'admin';
  const canManage = isOwner || isAdmin;

  const isDirty =
    channel &&
    (name !== channel.name ||
      description !== (channel.description ?? '') ||
      visibility !== channel.visibility);

  const handleSave = () => {
    if (!isDirty) return;
    updateChannel.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
      },
      {
        onSuccess: () => {
          showSuccess('Channel updated');
        },
        onError: (error) => {
          showError(error.message || 'Failed to update channel');
        },
      },
    );
  };

  const handleLeave = () => {
    Alert.alert('Leave Channel', `Are you sure you want to leave ${channel?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          if (!id) return;
          leaveChannel.mutate(id, {
            onSuccess: () => {
              showSuccess('Left channel');
              router.replace('/(tabs)/explore' as any);
            },
            onError: (error) => {
              showError(error.message || 'Failed to leave channel');
            },
          });
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Channel',
      `This will permanently delete ${channel?.name} and all its posts. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (!id) return;
            deleteChannel.mutate(id, {
              onSuccess: () => {
                showSuccess('Channel deleted');
                router.replace('/(tabs)/explore' as any);
              },
              onError: (error) => {
                showError(error.message || 'Failed to delete channel');
              },
            });
          },
        },
      ],
    );
  };

  const handleRemoveMember = (userId: number) => {
    removeMember.mutate(userId, {
      onSuccess: () => showSuccess('Member removed'),
      onError: (error) => showError(error.message || 'Failed to remove member'),
    });
  };

  const handlePromoteMember = (userId: number) => {
    updateRole.mutate(
      { userId, role: 'admin' },
      {
        onSuccess: () => showSuccess('Member promoted to admin'),
        onError: (error) => showError(error.message || 'Failed to promote'),
      },
    );
  };

  const handleInviteMember = (userId: number) => {
    addMember.mutate(userId, {
      onSuccess: () => {
        showSuccess('Member added');
        setInviteModalVisible(false);
      },
      onError: (error) => showError(error.message || 'Failed to add member'),
    });
  };

  if (isLoadingChannel || !channel) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#000" />
        </View>
      </View>
    );
  }

  const members = membersData?.members ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Channel Settings</Text>
        {canManage && isDirty ? (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={updateChannel.isPending}
            activeOpacity={0.85}
          >
            {updateChannel.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Channel info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              editable={canManage}
              maxLength={100}
              placeholder="Channel name"
              placeholderTextColor="rgba(0,0,0,0.35)"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <View style={[styles.inputWrapper, styles.inputWrapperMultiline]}>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              editable={canManage}
              multiline
              maxLength={500}
              placeholder="What's this channel about?"
              placeholderTextColor="rgba(0,0,0,0.35)"
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Visibility</Text>
          <View style={styles.visibilityRow}>
            <TouchableOpacity
              style={[styles.visibilityCard, visibility === 'public' && styles.visibilityCardActive]}
              onPress={() => canManage && setVisibility('public')}
              disabled={!canManage}
              activeOpacity={0.7}
            >
              <Ionicons
                name="globe-outline"
                size={20}
                color={visibility === 'public' ? '#000' : 'rgba(0,0,0,0.5)'}
              />
              <Text style={[styles.visibilityTitle, visibility === 'public' && styles.visibilityTitleActive]}>
                Public
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.visibilityCard, visibility === 'private' && styles.visibilityCardActive]}
              onPress={() => canManage && setVisibility('private')}
              disabled={!canManage}
              activeOpacity={0.7}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={visibility === 'private' ? '#000' : 'rgba(0,0,0,0.5)'}
              />
              <Text style={[styles.visibilityTitle, visibility === 'private' && styles.visibilityTitleActive]}>
                Private
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.membersHeader}>
            <Text style={styles.sectionLabel}>Members ({channel.memberCount})</Text>
            {canManage && (
              <TouchableOpacity
                style={styles.inviteHeaderButton}
                onPress={() => setInviteModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="person-add-outline" size={16} color="#000" />
                <Text style={styles.inviteHeaderButtonText}>Invite</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.memberCard}>
            {isLoadingMembers ? (
              <View style={styles.memberLoading}>
                <ActivityIndicator color="#000" />
              </View>
            ) : (
              members.map((member, index) => (
                <View key={member.id}>
                  <MemberRow
                    member={member}
                    canManage={canManage}
                    isCurrentUserOwner={isOwner}
                    onRemove={() => handleRemoveMember(member.userId)}
                    onPromote={() => handlePromoteMember(member.userId)}
                  />
                  {index < members.length - 1 && <View style={styles.memberDivider} />}
                </View>
              ))
            )}
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          {!isOwner ? (
            <TouchableOpacity style={styles.dangerButton} onPress={handleLeave} activeOpacity={0.7}>
              <Ionicons name="exit-outline" size={20} color="#ef4444" />
              <Text style={styles.dangerButtonText}>Leave Channel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.dangerButton} onPress={handleDelete} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={styles.dangerButtonText}>Delete Channel</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <InviteMemberModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        onInvite={handleInviteMember}
        isInviting={addMember.isPending}
        existingMemberIds={new Set(members.map((m) => m.userId))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  saveButton: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  saveButtonText: {
    fontSize: 14,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 14,
    height: 50,
    justifyContent: 'center',
  },
  inputWrapperMultiline: {
    height: 100,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
    color: '#000',
  },
  inputMultiline: {
    height: '100%',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  visibilityCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: 14,
    gap: 6,
  },
  visibilityCardActive: {
    borderColor: '#000',
    borderWidth: 2,
  },
  visibilityTitle: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.5)',
  },
  visibilityTitleActive: {
    color: '#000',
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    color: '#000',
  },
  memberRole: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 1,
  },
  memberDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginLeft: 66,
  },
  memberLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    height: 50,
  },
  dangerButtonText: {
    fontSize: 15,
    color: '#ef4444',
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inviteHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  inviteHeaderButtonText: {
    fontSize: 13,
    color: '#000',
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    color: '#000',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  searchInfo: {
    flex: 1,
  },
  searchName: {
    fontSize: 15,
    color: '#000',
  },
  searchUsername: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 2,
  },
  inviteButton: {
    paddingHorizontal: 18,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  inviteButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  inviteButtonText: {
    fontSize: 13,
    color: '#fff',
  },
  searchEmpty: {
    paddingTop: 60,
    alignItems: 'center',
  },
  searchEmptyText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
});
