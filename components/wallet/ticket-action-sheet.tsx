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
import type { WalletEventCard } from '@/lib/types/wallet.types';

type SheetMode = 'actions' | 'sell' | 'transfer' | 'success';

interface TicketActionSheetProps {
  visible: boolean;
  onClose: () => void;
  event: WalletEventCard | null;
}

export function TicketActionSheet({ visible, onClose, event }: TicketActionSheetProps) {
  const { colors, isDark } = useAppTheme();
  const [mode, setMode] = React.useState<SheetMode>('actions');
  const [isLoading, setIsLoading] = React.useState(false);
  const [sellPrice, setSellPrice] = React.useState('');
  const [transferPhone, setTransferPhone] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  React.useEffect(() => {
    if (visible) {
      setMode('actions');
      setSellPrice('');
      setTransferPhone('');
      setSuccessMessage('');
    }
  }, [visible]);

  const handleSell = async () => {
    if (!event || !sellPrice || isLoading) return;
    const price = parseFloat(sellPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid price', 'Please enter a valid price.');
      return;
    }
    setIsLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await ticketsApi.listTicketForSale(event.id, { price });
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessMessage('Your ticket has been listed for sale!');
        setMode('success');
      } else {
        Alert.alert('Error', res.message || 'Could not list ticket.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!event || !transferPhone.trim() || isLoading) return;
    setIsLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await ticketsApi.transferTicket(event.id, { recipientPhone: transferPhone.trim() });
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccessMessage('Ticket transferred successfully!');
        setMode('success');
      } else {
        Alert.alert('Error', res.message || 'Could not transfer ticket.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMode('actions');
    onClose();
  };

  const glassBtn = {
    backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
    borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)',
  };

  if (!event) return null;

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
      ) : mode === 'sell' ? (
        <View style={styles.formContainer}>
          <TouchableOpacity onPress={() => setMode('actions')} style={styles.backRow} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.formTitle, { color: colors.text }]}>Sell Ticket</Text>
          <Text style={[styles.formDesc, { color: colors.textSecondary }]}>
            Set your asking price. The ticket will be listed on the marketplace.
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
            <Text style={[styles.inputPrefix, { color: colors.textSecondary }]}>$</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              value={sellPrice}
              onChangeText={setSellPrice}
              autoFocus
            />
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, glassBtn, isLoading && { opacity: 0.6 }]}
            onPress={handleSell}
            activeOpacity={0.8}
            disabled={isLoading || !sellPrice}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={[styles.actionBtnText, { color: colors.text }]}>List for Sale</Text>
            )}
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
            Enter the recipient's phone number to transfer this ticket.
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
            <Ionicons name="call-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Phone number"
              placeholderTextColor={colors.placeholder}
              keyboardType="phone-pad"
              value={transferPhone}
              onChangeText={setTransferPhone}
              autoFocus
            />
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, glassBtn, isLoading && { opacity: 0.6 }]}
            onPress={handleTransfer}
            activeOpacity={0.8}
            disabled={isLoading || !transferPhone.trim()}
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
          <TouchableOpacity
            style={[styles.optionRow, glassBtn]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode('sell'); }}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
              <Ionicons name="pricetag-outline" size={20} color={colors.text} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Sell Ticket</Text>
              <Text style={[styles.optionDesc, { color: colors.textTertiary }]}>List on the marketplace</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionRow, glassBtn]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode('transfer'); }}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
              <Ionicons name="send-outline" size={20} color={colors.text} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Transfer Ticket</Text>
              <Text style={[styles.optionDesc, { color: colors.textTertiary }]}>Send to a friend</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
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
  // Forms
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
    marginBottom: 20,
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
  inputPrefix: {
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    marginRight: 4,
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
  // Success
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
