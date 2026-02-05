// Status Card Menu Sheet - Enlarged card preview with QR, perks, actions
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from './bottom-sheet';
import { MembershipCard } from './membership-card';
import { generateAppleWalletToken } from '../../lib/api/wallet';
import { WalletUser, TIER_PERKS } from '../../lib/types/wallet.types';

interface StatusCardMenuSheetProps {
  visible: boolean;
  onClose: () => void;
  user: WalletUser;
}

export function StatusCardMenuSheet({
  visible,
  onClose,
  user,
}: StatusCardMenuSheetProps) {
  const [isAddingToWallet, setIsAddingToWallet] = useState(false);
  const perks = TIER_PERKS[user.statusTier] || [];
  const displayPerks = perks.slice(0, 3);

  const handleAddToWallet = async () => {
    setIsAddingToWallet(true);
    try {
      const response = await generateAppleWalletToken();

      if (response.success && response.data?.downloadUrl) {
        const canOpen = await Linking.canOpenURL(response.data.downloadUrl);
        if (canOpen) {
          await Linking.openURL(response.data.downloadUrl);
        } else {
          Alert.alert('Error', 'Unable to open Apple Wallet');
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to add to Apple Wallet');
      }
    } catch (error: any) {
      console.error('Apple Wallet error:', error);
      Alert.alert('Error', error.message || 'Failed to add to Apple Wallet');
    } finally {
      setIsAddingToWallet(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="85%">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Enlarged Card */}
        <View style={styles.cardContainer}>
          <MembershipCard user={user} enlarged />
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <View style={styles.qrContainer}>
            {/* Mock QR Code */}
            <View style={styles.qrCode}>
              <View style={styles.qrRow}>
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={styles.qrBlock} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={styles.qrBlock} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
              </View>
              <View style={styles.qrRow}>
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={styles.qrBlock} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={styles.qrBlock} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
              </View>
              <View style={styles.qrRow}>
                <View style={styles.qrBlock} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={styles.qrBlock} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={styles.qrBlock} />
              </View>
              <View style={styles.qrRow}>
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={styles.qrBlock} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={styles.qrBlock} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
              </View>
              <View style={styles.qrRow}>
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={styles.qrBlock} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={styles.qrBlock} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
              </View>
              <View style={styles.qrRow}>
                <View style={styles.qrBlock} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={styles.qrBlock} />
                <View style={styles.qrBlock} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
              </View>
              <View style={styles.qrRow}>
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={styles.qrBlock} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={[styles.qrBlock, styles.qrBlockFilled]} />
                <View style={styles.qrBlock} />
              </View>
            </View>
          </View>
          <Text style={styles.qrHint}>Show this at check-in</Text>
        </View>

        {/* Tier Perks */}
        <View style={styles.perksSection}>
          <Text style={styles.perksTitle}>{user.statusTier} Perks</Text>
          {displayPerks.map((perk, index) => (
            <View key={index} style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={18} color="#34c759" />
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        {/* Add to Wallet Button */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddToWallet}
            disabled={isAddingToWallet}
          >
            {isAddingToWallet ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Add to Apple Wallet</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  qrCode: {
    width: 112,
    height: 112,
  },
  qrRow: {
    flexDirection: 'row',
    height: 16,
  },
  qrBlock: {
    width: 16,
    height: 16,
    backgroundColor: '#fff',
  },
  qrBlockFilled: {
    backgroundColor: '#000',
  },
  qrHint: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 12,
  },
  perksSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  perksTitle: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  perkText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  actionsSection: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
  },
});
