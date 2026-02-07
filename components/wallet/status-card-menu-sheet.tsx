// Status Card Menu Sheet — Liquid glass design
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Linking,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MembershipCard } from './membership-card';
import { generateAppleWalletToken } from '../../lib/api/wallet';
import { WalletUser, TIER_PERKS } from '../../lib/types/wallet.types';
import { GlassCard } from '../glass/glass-card';
import { GlassText } from '../glass/glass-text';
import {
  spacing,
  radius,
  glassBorder,
} from '../../constants/glass/tokens';

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
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const [isAddingToWallet, setIsAddingToWallet] = useState(false);
  const perks = TIER_PERKS[user.statusTier] || [];
  const displayPerks = perks.slice(0, 3);

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleViewOnWallet = () => {
    Linking.openURL('shoebox://');
  };

  const handleAddToWallet = async () => {
    setIsAddingToWallet(true);
    try {
      const response = await generateAppleWalletToken();
      if (response.success && response.data?.downloadUrl) {
        Linking.openURL(response.data.downloadUrl);
      } else {
        Alert.alert('Error', response.error || 'Failed to add to Apple Wallet');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add to Apple Wallet');
    } finally {
      setIsAddingToWallet(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      enablePanDownToClose
      enableDynamicSizing
      onClose={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetIndicator}
    >
      <BottomSheetView style={[styles.container, { paddingBottom: insets.bottom || 8 }]}>
        {/* Enlarged Card */}
        <View style={styles.cardContainer}>
          <MembershipCard user={user} enlarged />
        </View>

        {/* Tier Perks */}
        <GlassCard
          fill="light"
          border="subtle"
          cornerRadius="2xl"
          shadowLevel="md"
          blurIntensity="medium"
          style={styles.perksCard}
        >
          {/* Inner highlight */}
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.02)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={styles.innerHighlight}
          />

          <View style={styles.perksTitleRow}>
            <View style={styles.perksIcon}>
              <Ionicons name="star-outline" size={14} color="#FFD700" />
            </View>
            <GlassText weight="bold" size={15}>{user.statusTier} Perks</GlassText>
          </View>

          {displayPerks.map((perk, index) => (
            <React.Fragment key={index}>
              {index > 0 && <View style={styles.perkSeparator} />}
              <View style={styles.perkRow}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
                <GlassText hierarchy="secondary" size={14} style={styles.perkText}>
                  {perk}
                </GlassText>
              </View>
            </React.Fragment>
          ))}
        </GlassCard>

        {/* Wallet Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.walletButton}
            onPress={handleViewOnWallet}
            activeOpacity={0.7}
          >
            <View style={styles.walletButtonFill} />
            <Ionicons name="wallet-outline" size={18} color="#1a1a1a" />
            <Text style={styles.walletButtonText}>View on Apple Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.walletButton}
            onPress={handleAddToWallet}
            activeOpacity={0.7}
            disabled={isAddingToWallet}
          >
            <View style={styles.walletButtonFill} />
            {isAddingToWallet ? (
              <ActivityIndicator size="small" color="#1a1a1a" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={18} color="#1a1a1a" />
                <Text style={styles.walletButtonText}>Add to Apple Wallet</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: `rgba(0, 0, 0, ${glassBorder.medium.opacity * 0.3})`,
  },
  sheetIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  container: {
    paddingHorizontal: spacing.lg,
  },
  cardContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },

  // Perks
  perksCard: {
    marginBottom: 15,
    overflow: 'hidden',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
  },
  perksTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  perksIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  perkSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginLeft: spacing.lg + 22 + spacing.md,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#34c759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  perkText: {
    flex: 1,
  },

  // Actions
  actionsSection: {
    gap: 15,
    marginBottom: 0,
  },
  walletButton: {
    height: 48,
    borderRadius: radius.md,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  walletButtonFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#D3D3D3',
  },
  walletButtonText: {
    fontSize: 16,
    fontFamily: 'Lato_700Bold',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
});
