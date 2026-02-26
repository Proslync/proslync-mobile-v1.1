import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BottomSheet } from './bottom-sheet';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDebounce } from '@/hooks/use-debounce';
import { ticketsApi } from '@/lib/api/tickets';
import { eventsApi } from '@/lib/api/events';
import { searchApi } from '@/lib/api/search';
import type { SearchPerson } from '@/lib/types/search.types';
import { useToast } from '@/components/shared/toast';
import type { WalletEventCard } from '@/lib/types/wallet.types';

type SheetMode = 'actions' | 'transfer' | 'confirm' | 'success';

interface TicketActionSheetProps {
  visible: boolean;
  onClose: () => void;
  event: WalletEventCard | null;
  onActionComplete?: () => void;
}

export function TicketActionSheet({ visible, onClose, event, onActionComplete }: TicketActionSheetProps) {
  const { colors, isDark } = useAppTheme();
  const { showError } = useToast();
  const [mode, setMode] = React.useState<SheetMode>('actions');
  const [isLoading, setIsLoading] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');

  // Search state
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchPerson[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<SearchPerson | null>(null);
  const debouncedQuery = useDebounce(query, 400);

  React.useEffect(() => {
    if (visible) {
      setMode('actions');
      setQuery('');
      setSearchResults([]);
      setSearching(false);
      setSelectedUser(null);
      setSuccessMessage('');
      actionDidComplete.current = false;
    }
  }, [visible]);

  // Search as user types (same pattern as InviteModal)
  React.useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    setSearching(true);

    searchApi
      .search({ query: debouncedQuery, peopleLimit: 10, eventsLimit: 0, venuesLimit: 0 })
      .then((res) => {
        if (!cancelled) setSearchResults(res.people);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Track whether an action completed so we refresh wallet on close
  const actionDidComplete = React.useRef(false);

  // Shared action runner: haptic, call API, show success or error
  const runAction = async (fn: () => Promise<{ success: boolean; message?: string }>, msg: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await fn();
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessMessage(res.message || msg);
        setMode('success');
        actionDidComplete.current = true;
      } else {
        showError(res.message || 'Something went wrong.');
      }
    } catch (err: any) {
      showError(err?.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user: SearchPerson) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedUser(user);
    setMode('confirm');
  };

  const handleConfirmTransfer = () => {
    if (!event?.ticketId || !selectedUser) return;
    runAction(
      () => ticketsApi.transferTicket(event.ticketId!, { recipientUserId: selectedUser.id }),
      'Ticket transferred successfully!',
    );
  };

  const handleCancelRsvp = () => {
    if (!event?.id) return;
    runAction(
      () => eventsApi.cancelRegistration(parseInt(event.id, 10)),
      'Your RSVP has been cancelled.',
    );
  };

  const handleClose = () => {
    const didComplete = actionDidComplete.current;
    setMode('actions');
    onClose();
    if (didComplete) {
      onActionComplete?.();
    }
  };

  const glassBtn = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
    borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)',
  };
  const redBtn = {
    backgroundColor: isDark ? 'rgba(255,59,48,0.12)' : 'rgba(255,59,48,0.08)',
    borderColor: isDark ? 'rgba(255,59,48,0.25)' : 'rgba(255,59,48,0.15)',
  };
  const iconBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const redIconBg = isDark ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.1)';

  if (!event) return null;

  const hasTicket = !!event.ticketId;

  const renderOptionRow = (
    opts: { icon: string; title: string; desc: string; onPress: () => void; red?: boolean },
  ) => (
    <TouchableOpacity
      style={[styles.optionRow, opts.red ? redBtn : glassBtn, isLoading && { opacity: 0.6 }]}
      onPress={opts.onPress}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      <View style={[styles.optionIcon, { backgroundColor: opts.red ? redIconBg : iconBg }]}>
        {isLoading && opts.red ? (
          <ActivityIndicator size="small" color="#ff3b30" />
        ) : (
          <Ionicons name={opts.icon as any} size={20} color={opts.red ? '#ff3b30' : colors.text} />
        )}
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, { color: opts.red ? '#ff3b30' : colors.text }]}>{opts.title}</Text>
        <Text style={[styles.optionDesc, { color: colors.textTertiary }]}>{opts.desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <BottomSheet visible={visible} onClose={handleClose} maxHeight="65%">
      {mode === 'success' ? (
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Done!</Text>
          <Text style={[styles.successSub, { color: colors.textSecondary }]}>{successMessage}</Text>
          <TouchableOpacity style={[styles.actionBtn, styles.successCloseBtn, glassBtn]} onPress={handleClose} activeOpacity={0.8}>
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Close</Text>
          </TouchableOpacity>
        </View>
      ) : mode === 'confirm' && selectedUser ? (
        <View style={styles.formContainer}>
          <TouchableOpacity onPress={() => setMode('transfer')} style={styles.backRow} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.formTitle, { color: colors.text }]}>Confirm Transfer</Text>

          {/* Selected user card */}
          <View style={[styles.confirmUserCard, glassBtn]}>
            {selectedUser.avatar?.url ? (
              <Image source={{ uri: selectedUser.avatar.url }} style={styles.confirmAvatar} />
            ) : (
              <View style={[styles.confirmAvatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={24} color="rgba(255,255,255,0.4)" />
              </View>
            )}
            <Text style={[styles.confirmName, { color: colors.text }]} numberOfLines={1}>
              {`${selectedUser.firstName} ${selectedUser.lastName}`.trim()}
            </Text>
            {selectedUser.userName && (
              <Text style={[styles.confirmHandle, { color: colors.textSecondary }]}>
                @{selectedUser.userName}
              </Text>
            )}
          </View>

          {/* Event info */}
          <View style={[styles.confirmEventRow, { borderColor: colors.separator }]}>
            {event.flyerUrl ? (
              <Image source={{ uri: event.flyerUrl }} style={[styles.confirmEventThumb, { borderColor: colors.border }]} />
            ) : null}
            <View style={styles.eventInfo}>
              <Text style={[styles.confirmEventTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
              <Text style={[styles.confirmEventDate, { color: colors.textSecondary }]}>{event.dateTimeLabel}</Text>
            </View>
          </View>

          {/* Warning */}
          <View style={styles.warningRow}>
            <Ionicons name="warning-outline" size={16} color="rgba(255,180,0,0.8)" />
            <Text style={styles.warningText}>
              This action cannot be undone. The ticket will be transferred to this user.
            </Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.actionBtn, glassBtn, isLoading && { opacity: 0.6 }]}
            onPress={handleConfirmTransfer}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={[styles.actionBtnText, { color: colors.text }]}>Confirm Transfer</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelTextBtn}
            onPress={() => setMode('transfer')}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Text style={[styles.cancelTextBtnLabel, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : mode === 'transfer' ? (
        <View style={styles.formContainer}>
          <TouchableOpacity onPress={() => setMode('actions')} style={styles.backRow} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.formTitle, { color: colors.text }]}>Transfer Ticket</Text>
          <Text style={[styles.formDesc, { color: colors.textSecondary }]}>
            Search for the person you'd like to transfer this ticket to.
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
            <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Search by name or username..."
              placeholderTextColor={colors.placeholder}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search results */}
          <View style={styles.searchResultsContainer}>
            {searching ? (
              <ActivityIndicator color={colors.textSecondary} style={styles.searchLoading} />
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => String(item.id)}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const fullName = `${item.firstName} ${item.lastName}`.trim();
                  return (
                    <TouchableOpacity
                      style={styles.userRow}
                      onPress={() => handleSelectUser(item)}
                      activeOpacity={0.7}
                    >
                      {item.avatar?.url ? (
                        <Image source={{ uri: item.avatar.url }} style={styles.userAvatar} />
                      ) : (
                        <View style={[styles.userAvatar, styles.avatarPlaceholder]}>
                          <Ionicons name="person" size={18} color="rgba(255,255,255,0.4)" />
                        </View>
                      )}
                      <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>{fullName}</Text>
                        {item.userName && (
                          <Text style={[styles.userHandle, { color: colors.textTertiary }]} numberOfLines={1}>
                            @{item.userName}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  );
                }}
              />
            ) : debouncedQuery.trim().length > 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={28} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No users found</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="person-add-outline" size={28} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Search for a user</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.actionsContainer}>
          {/* Event header */}
          <View style={styles.eventRow}>
            {event.flyerUrl ? (
              <Image source={{ uri: event.flyerUrl }} style={[styles.eventThumb, { borderColor: colors.border }]} />
            ) : null}
            <View style={styles.eventInfo}>
              <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>{event.title}</Text>
              <Text style={[styles.eventDate, { color: colors.textSecondary }]}>{event.dateTimeLabel}</Text>
              <Text style={[styles.eventVenue, { color: colors.textTertiary }]}>{event.venueName}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          {/* Action buttons */}
          {hasTicket && renderOptionRow({
            icon: 'send-outline', title: 'Transfer Ticket', desc: 'Send to a friend',
            onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode('transfer'); },
          })}
          {!event.isPaid && renderOptionRow({
            icon: 'close-circle-outline', title: 'Cancel RSVP', desc: 'Remove your registration',
            onPress: handleCancelRsvp, red: true,
          })}
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    paddingHorizontal: 4,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  eventThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    lineHeight: 20,
  },
  eventDate: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  eventVenue: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
  formContainer: {
    paddingHorizontal: 4,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 2,
  },
  backText: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
  formTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
    marginBottom: 6,
  },
  formDesc: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Lato_400Regular',
  },
  actionBtn: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Lato_700Bold',
    marginBottom: 4,
  },
  successSub: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  successCloseBtn: {
    alignSelf: 'stretch',
  },
  // Search results
  searchResultsContainer: {
    maxHeight: 240,
  },
  searchLoading: {
    marginTop: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  userHandle: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
  // Confirm screen
  confirmUserCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  confirmAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 10,
  },
  confirmName: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
  },
  confirmHandle: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
  confirmEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  confirmEventThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmEventTitle: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
  },
  confirmEventDate: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255,180,0,0.8)',
    lineHeight: 18,
  },
  cancelTextBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelTextBtnLabel: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
  },
});
