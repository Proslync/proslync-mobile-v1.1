import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BottomSheet } from './bottom-sheet';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ticketsApi } from '@/lib/api/tickets';
import { eventsApi } from '@/lib/api/events';
import type { WalletEventCard } from '@/lib/types/wallet.types';

type SheetMode = 'actions' | 'transfer' | 'success';

interface TicketActionSheetProps {
  visible: boolean;
  onClose: () => void;
  event: WalletEventCard | null;
  onActionComplete?: () => void;
}

export function TicketActionSheet({ visible, onClose, event, onActionComplete }: TicketActionSheetProps) {
  const { colors, isDark } = useAppTheme();
  const [mode, setMode] = React.useState<SheetMode>('actions');
  const [isLoading, setIsLoading] = React.useState(false);
  const [transferUsername, setTransferUsername] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  React.useEffect(() => {
    if (visible) {
      setMode('actions');
      setTransferUsername('');
      setSuccessMessage('');
    }
  }, [visible]);

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
        onActionComplete?.();
      } else {
        Alert.alert('Error', res.message || 'Something went wrong.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = () => {
    if (!event?.ticketId || !transferUsername.trim()) return;
    runAction(
      () => ticketsApi.transferTicket(event.ticketId!, { recipientUsername: transferUsername.trim() }),
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
    setMode('actions');
    onClose();
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
          <TouchableOpacity style={[styles.actionBtn, glassBtn]} onPress={handleClose} activeOpacity={0.8}>
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Close</Text>
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
            Enter the recipient's username to transfer this ticket.
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
            <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Username"
              placeholderTextColor={colors.placeholder}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              value={transferUsername}
              onChangeText={setTransferUsername}
              autoFocus
            />
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, glassBtn, isLoading && { opacity: 0.6 }]}
            onPress={handleTransfer}
            activeOpacity={0.8}
            disabled={isLoading || !transferUsername.trim()}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={[styles.actionBtnText, { color: colors.text }]}>Transfer</Text>
            )}
          </TouchableOpacity>
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
});
