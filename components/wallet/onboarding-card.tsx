// OnboardingCard - Stripe Connect setup CTA

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassSurface } from '@/components/glass/glass-surface';
import { GlassButton } from '@/components/glass/glass-button';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  needsDocumentUpload,
  getDisabledReasonMessage,
  getRequiredRemediationFields,
  type StripeAccountStatus,
  type RemediationItem,
} from '@/lib/api/wallet';

interface OnboardingCardProps {
  onSetup: () => Promise<void>;
  onCheckStatus?: () => void;
  onDeleteAccount?: () => void;
  onRemediationPress?: (item: RemediationItem) => void;
  isSettingUp: boolean;
  isDeletingAccount?: boolean;
  accountStatus: StripeAccountStatus | null | undefined;
}

export function OnboardingCard({ onSetup, onCheckStatus, onDeleteAccount, onRemediationPress, isSettingUp, isDeletingAccount, accountStatus }: OnboardingCardProps) {
  const { colors } = useAppTheme();
  const hasAccount = accountStatus?.hasAccount;
  const detailsSubmitted = accountStatus?.detailsSubmitted && hasAccount;
  const hasRequirements = (accountStatus?.requirements?.currentlyDue?.length ?? 0) > 0 ||
    (accountStatus?.requirements?.pastDue?.length ?? 0) > 0;
  const isRejected = accountStatus?.onboardingStatus === 'rejected';
  const isRestricted = accountStatus?.onboardingStatus === 'restricted';
  const isInProgress = accountStatus?.onboardingStatus === 'in_progress';
  const needsDocUpload = needsDocumentUpload(accountStatus?.requirements, accountStatus?.futureRequirements);

  // Details submitted and no outstanding requirements — Stripe is reviewing
  const isPendingReview = (detailsSubmitted && !hasRequirements) || isInProgress;

  const reasonInfo = getDisabledReasonMessage(accountStatus?.disabledReason);
  const remediationItems = getRequiredRemediationFields(accountStatus?.requirements);

  // Rejected account — show decline message with delete option
  if (isRejected) {
    return (
      <Animated.View entering={FadeInDown.duration(400)} style={styles.wrapper}>
        <GlassSurface fill="subtle" border="subtle" cornerRadius="xl" style={styles.container}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="close-circle" size={56} color="#ef4444" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{reasonInfo.title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{reasonInfo.description}</Text>

          <View style={styles.buttonContainer}>
            {onDeleteAccount && (
              <GlassButton
                label={isDeletingAccount ? 'Deleting...' : 'Delete Account & Start Over'}
                icon={<Ionicons name="trash-outline" size={20} color={colors.text} />}
                variant="glass"
                size="lg"
                onPress={onDeleteAccount}
                disabled={isDeletingAccount}
                fullWidth
              />
            )}
          </View>
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            Need help? Contact support@status.social
          </Text>
        </GlassSurface>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.wrapper}>
      <GlassSurface fill="subtle" border="subtle" cornerRadius="xl" style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: colors.cardElevated }]}>
          <Ionicons
            name={isPendingReview ? 'time-outline' : needsDocUpload ? 'document-text-outline' : isRestricted ? 'alert-circle-outline' : 'wallet-outline'}
            size={56}
            color={isRestricted || needsDocUpload ? '#f59e0b' : colors.text}
          />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {isPendingReview ? 'Under Review' : needsDocUpload ? 'Document Required' : isRestricted ? 'Action Required' : 'Set Up Payouts'}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {isPendingReview
            ? 'Your application has been submitted and is being reviewed by Stripe. This usually takes a few minutes.'
            : needsDocUpload
            ? 'Stripe needs a document to verify your account. Upload a bank statement or ID to continue.'
            : isRestricted
            ? 'Stripe needs additional information to verify your account.'
            : 'Connect your bank account or debit card to receive earnings from ticket sales and tips.'}
        </Text>

        {/* Remediation items for restricted accounts */}
        {isRestricted && remediationItems.length > 0 && onRemediationPress && (
          <View style={[styles.remediationList, { backgroundColor: colors.cardElevated }]}>
            {remediationItems.map((item) => (
              <TouchableOpacity
                key={item.requirement}
                style={[styles.remediationItem, { borderBottomColor: colors.border }]}
                onPress={() => onRemediationPress(item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.target === 'document' ? 'document-text-outline' : item.target === 'bank_account' ? 'card-outline' : item.target === 'address' ? 'location-outline' : item.target === 'personal_info' ? 'person-outline' : 'help-circle-outline'}
                  size={20}
                  color="#f59e0b"
                />
                <Text style={[styles.remediationText, { color: colors.textSecondary }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!isPendingReview && !isRestricted && (
          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>Secure payments via Stripe</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="flash" size={20} color="#f59e0b" />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>Instant payouts to debit cards</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="calendar" size={20} color="#3b82f6" />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>1-3 day bank transfers</Text>
            </View>
          </View>
        )}

        {!isRestricted && (
          <View style={styles.buttonContainer}>
            {isSettingUp ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.text} />
              </View>
            ) : (
              <GlassButton
                label={isPendingReview ? 'Check Status' : needsDocUpload ? 'Upload Document' : hasRequirements ? 'Continue Setup' : 'Connect Payout Account'}
                icon={<Ionicons name={isPendingReview ? 'refresh' : needsDocUpload ? 'cloud-upload-outline' : 'link'} size={20} color={colors.text} />}
                variant="glass"
                size="lg"
                onPress={isPendingReview && onCheckStatus ? onCheckStatus : onSetup}
                fullWidth
              />
            )}
          </View>
        )}

        {accountStatus?.hasAccount && !accountStatus?.detailsSubmitted && (
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Lato_700Bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
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
    marginTop: 16,
    textAlign: 'center',
  },
  remediationList: {
    alignSelf: 'stretch',
    gap: 2,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  remediationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  remediationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
  },
});
