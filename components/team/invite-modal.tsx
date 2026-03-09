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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDebounce } from '@/hooks/use-debounce';
import { useInviteByUserId } from '@/hooks';
import { searchApi } from '@/lib/api/search';
import type { SearchPerson } from '@/lib/types/search.types';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import type { RoleResponseDto } from '@/lib/types/team.types';

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  roles: RoleResponseDto[];
  eventId: number;
}

export function InviteModal({
  visible,
  onClose,
  roles,
  eventId,
}: InviteModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const inviteMutation = useInviteByUserId(eventId);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchPerson[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchPerson | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 400);

  const assignableRoles = roles.filter((r) => r.name !== 'Owner');

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setQuery('');
      setResults([]);
      setSelectedUser(null);
      setSent(false);
      const defaultRole = assignableRoles[0];
      setSelectedRoleId(defaultRole?.id ?? null);
    }
  }, [visible]);

  // Search as user types
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setSearching(true);

    searchApi
      .search({ query: debouncedQuery, peopleLimit: 10, eventsLimit: 0, venuesLimit: 0 })
      .then((res) => {
        if (!cancelled) setResults(res.people);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

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

  const renderUserRow = ({ item }: { item: SearchPerson }) => {
    const isSelected = selectedUser?.id === item.id;
    const fullName = `${item.firstName} ${item.lastName}`.trim();

    return (
      <TouchableOpacity
        style={[styles.userRow, isSelected && styles.userRowSelected]}
        onPress={() => setSelectedUser(item)}
        activeOpacity={0.7}
      >
        {item.avatar?.url ? (
          <Image source={{ uri: item.avatar.url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={18} color="rgba(255,255,255,0.4)" />
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{fullName}</Text>
          {item.userName && (
            <Text style={styles.userHandle} numberOfLines={1}>@{item.userName}</Text>
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
      <ConfirmModal
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
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {sent ? (
          /* Success state */
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={56} color="#22c55e" />
            <Text style={styles.successTitle}>Invite Sent!</Text>
            <Text style={styles.successSubtitle}>
              {selectedUser
                ? `${selectedUser.firstName} ${selectedUser.lastName}`.trim()
                : 'User'}{' '}
              will see the invitation in their notifications.
            </Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or username..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results */}
            <View style={styles.resultsContainer}>
              {searching ? (
                <ActivityIndicator
                  color="rgba(255,255,255,0.5)"
                  style={styles.loadingIndicator}
                />
              ) : results.length > 0 ? (
                <FlatList
                  data={results}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={renderUserRow}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                />
              ) : debouncedQuery.trim().length > 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={32} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.emptyText}>No users found</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="person-add-outline" size={32} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.emptyText}>Search for a user to invite</Text>
                </View>
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
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  userRowSelected: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
  userHandle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
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
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  roleChipSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
