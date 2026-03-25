// Add to Wallet Buttons - Platform-specific Apple/Google Wallet buttons
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Linking, ActivityIndicator, Platform } from 'react-native';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { addToGoogleWallet, generateAppleWalletToken } from '../../lib/api/wallet';

interface AddToWalletButtonsProps {
  membershipCardId?: number;
}

export function AddToWalletButtons({ membershipCardId }: AddToWalletButtonsProps) {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingApple, setIsLoadingApple] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  const handleAppleWallet = async () => {
    setIsLoadingApple(true);
    try {
      const response = await generateAppleWalletToken();

      if (response.success && response.data?.downloadUrl) {
        const canOpen = await Linking.canOpenURL(response.data.downloadUrl);
        if (canOpen) {
          await Linking.openURL(response.data.downloadUrl);
        } else {
          setErrorMessage('Unable to open Apple Wallet');
        }
      } else {
        setErrorMessage(response.error || 'Failed to add to Apple Wallet');
      }
    } catch (error: any) {
      console.error('Apple Wallet error:', error);
      setErrorMessage(error.message || 'Failed to add to Apple Wallet');
    } finally {
      setIsLoadingApple(false);
    }
  };

  const handleGoogleWallet = async () => {
    if (!membershipCardId) {
      setErrorMessage('Membership card not available');
      return;
    }

    setIsLoadingGoogle(true);
    try {
      const response = await addToGoogleWallet(membershipCardId);

      if (response.success && response.data?.saveUrl) {
        const canOpen = await Linking.canOpenURL(response.data.saveUrl);
        if (canOpen) {
          await Linking.openURL(response.data.saveUrl);
        } else {
          setErrorMessage('Unable to open Google Wallet');
        }
      } else if (response.success && response.data?.jwt) {
        const saveUrl = `https://pay.google.com/gp/v/save/${response.data.jwt}`;
        await Linking.openURL(saveUrl);
      } else {
        setErrorMessage(response.error || 'Failed to add to Google Wallet');
      }
    } catch (error: any) {
      console.error('Google Wallet error:', error);
      setErrorMessage(error.message || 'Failed to add to Google Wallet');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  // Show only the relevant button based on platform
  return (
    <View style={styles.container}>
      <ConfirmSheet
        visible={!!errorMessage}
        onClose={() => setErrorMessage(null)}
        title="Error"
        message={errorMessage || ''}
        alertOnly
        icon="alert-circle-outline"
      />
      {isIOS && (
        <TouchableOpacity
          style={[styles.button, isLoadingApple && styles.buttonDisabled]}
          onPress={handleAppleWallet}
          activeOpacity={0.8}
          disabled={isLoadingApple}
          accessibilityLabel="Add to Apple Wallet"
          accessibilityRole="button"
        >
          {isLoadingApple ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <Image
              source={require('../../assets/images/apple-wallet-button.png')}
              style={styles.buttonImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      )}

      {isAndroid && (
        <TouchableOpacity
          style={[styles.button, isLoadingGoogle && styles.buttonDisabled]}
          onPress={handleGoogleWallet}
          activeOpacity={0.8}
          disabled={isLoadingGoogle || !membershipCardId}
          accessibilityLabel="Add to Google Wallet"
          accessibilityRole="button"
        >
          {isLoadingGoogle ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color="#000" />
            </View>
          ) : (
            <Image
              source={require('../../assets/images/google-wallet-button.png')}
              style={styles.buttonImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    maxWidth: 200,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonImage: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 8,
  },
});
