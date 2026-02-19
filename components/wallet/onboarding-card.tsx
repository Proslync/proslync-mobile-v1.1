// OnboardingCard - Stripe Connect setup CTA

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassSurface } from '@/components/glass/glass-surface';
import { GlassButton } from '@/components/glass/glass-button';
import type { StripeAccountStatus } from '@/lib/api/wallet';

interface OnboardingCardProps {
  onSetup: () => Promise<void>;
  isSettingUp: boolean;
  accountStatus: StripeAccountStatus | null | undefined;
}

export function OnboardingCard({ onSetup, isSettingUp, accountStatus }: OnboardingCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.wrapper}>
      <GlassSurface fill="subtle" border="subtle" cornerRadius="xl" style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet-outline" size={56} color="#fff" />
        </View>
        <Text style={styles.title}>Set Up Payouts</Text>
        <Text style={styles.description}>
          Connect your bank account or debit card to receive earnings from ticket sales and tips.
        </Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
            <Text style={styles.featureText}>Secure payments via Stripe</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="flash" size={20} color="#f59e0b" />
            <Text style={styles.featureText}>Instant payouts to debit cards</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="calendar" size={20} color="#3b82f6" />
            <Text style={styles.featureText}>1-3 day bank transfers</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {isSettingUp ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <GlassButton
              label="Connect Payout Account"
              icon={<Ionicons name="link" size={20} color="#fff" />}
              variant="glass"
              size="lg"
              onPress={onSetup}
              fullWidth
            />
          )}
        </View>

        {accountStatus?.hasAccount && !accountStatus?.detailsSubmitted && (
          <Text style={styles.hint}>
            You have a pending setup. Tap above to complete it.
          </Text>
        )}
      </GlassSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  container: {
    padding: 28,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  features: {
    alignSelf: 'stretch',
    gap: 12,
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  buttonContainer: {
    alignSelf: 'stretch',
  },
  loadingContainer: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 16,
    textAlign: 'center',
  },
});
