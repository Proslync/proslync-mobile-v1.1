// AccountStatusCard - Collapsible account status display (matches web app)

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { GlassSurface } from '@/components/glass/glass-surface';
import { GlassButton } from '@/components/glass/glass-button';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getDisabledReasonMessage, type StripeAccountStatus } from '@/lib/api/wallet';

interface AccountStatusCardProps {
  accountStatus: StripeAccountStatus;
  onContinueSetup?: () => void;
  isSettingUp?: boolean;
}

function getStatusInfo(status: StripeAccountStatus) {
  if (status.onboardingStatus === 'rejected') {
    return {
      icon: 'close-circle' as const,
      iconColor: '#ef4444',
      text: 'Declined',
      textColor: '#ef4444',
    };
  }
  if (status.chargesEnabled && status.payoutsEnabled) {
    return {
      icon: 'checkmark-circle' as const,
      iconColor: '#22c55e',
      text: 'Active',
      textColor: '#22c55e',
    };
  }
  if (status.requirements?.pastDue && status.requirements.pastDue.length > 0) {
    return {
      icon: 'close-circle' as const,
      iconColor: '#ef4444',
      text: 'Action Required',
      textColor: '#ef4444',
    };
  }
  if (status.detailsSubmitted) {
    return {
      icon: 'time' as const,
      iconColor: '#f59e0b',
      text: 'In Progress',
      textColor: '#f59e0b',
    };
  }
  return {
    icon: 'time' as const,
    iconColor: '#f59e0b',
    text: 'Not Set Up',
    textColor: '#f59e0b',
  };
}

export function AccountStatusCard({
  accountStatus,
  onContinueSetup,
  isSettingUp,
}: AccountStatusCardProps) {
  const { colors } = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);
  const chevronRotation = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  const statusInfo = getStatusInfo(accountStatus);
  const isAccountActive = accountStatus.chargesEnabled && accountStatus.payoutsEnabled;

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    chevronRotation.value = withSpring(next ? 180 : 0, { damping: 15 });
    contentHeight.value = withTiming(next ? 1 : 0, { duration: 250 });
    contentOpacity.value = withTiming(next ? 1 : 0, { duration: 200 });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    maxHeight: contentHeight.value * 200,
    opacity: contentOpacity.value,
    overflow: 'hidden' as const,
  }));

  return (
    <Animated.View entering={FadeIn.duration(400).delay(100)}>
      <GlassSurface fill="subtle" cornerRadius="lg" style={styles.container}>
        {/* Trigger */}
        <TouchableOpacity
          style={styles.trigger}
          onPress={toggle}
          activeOpacity={0.7}
        >
          <View style={styles.triggerLeft}>
            <Ionicons name={statusInfo.icon} size={20} color={statusInfo.iconColor} />
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Account Status</Text>
              <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
          </Animated.View>
        </TouchableOpacity>

        {/* Expandable Content */}
        <Animated.View style={contentStyle}>
          <View style={[styles.details, { borderTopColor: colors.border }]}>
            {/* Payments capability */}
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Payments</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: accountStatus.chargesEnabled ? '#22c55e' : '#ef4444' },
                ]}
              >
                {accountStatus.chargesEnabled ? 'Active' : 'Inactive'}
              </Text>
            </View>

            {/* Payouts capability */}
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Payouts</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: accountStatus.payoutsEnabled ? '#22c55e' : '#ef4444' },
                ]}
              >
                {accountStatus.payoutsEnabled
                  ? 'Active'
                  : accountStatus.detailsSubmitted
                    ? 'Pending verification'
                    : 'Inactive'}
              </Text>
            </View>

            {/* Disabled reason message */}
            {accountStatus.disabledReason && (
              <View style={styles.reasonRow}>
                <GlassView
                  {...liquidGlass.surface}
                  borderRadius={8}
                  style={StyleSheet.absoluteFillObject}
                />
                <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
                <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
                  {getDisabledReasonMessage(accountStatus.disabledReason).description}
                </Text>
              </View>
            )}

            {/* Continue Setup */}
            {!isAccountActive && onContinueSetup && (
              <View style={styles.setupButton}>
                <GlassButton
                  label={isSettingUp ? 'Loading...' : 'Continue Setup'}
                  variant="glass"
                  size="md"
                  onPress={onContinueSetup}
                  disabled={isSettingUp}
                  fullWidth
                />
              </View>
            )}
          </View>
        </Animated.View>
      </GlassSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    overflow: 'hidden',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Lato_600SemiBold',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    marginTop: 1,
  },
  details: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'Lato_600SemiBold',
  },
  setupButton: {
    flexDirection: 'row',
    marginTop: 4,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Lato_400Regular',
    lineHeight: 17,
  },
});
