// AccountStatusCard - Collapsible account status display (matches web app)

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
import type { StripeAccountStatus } from '@/lib/api/wallet';

interface AccountStatusCardProps {
  accountStatus: StripeAccountStatus;
  onContinueSetup?: () => void;
  isSettingUp?: boolean;
}

function getStatusInfo(status: StripeAccountStatus) {
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
              <Text style={styles.title}>Account Status</Text>
              <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.5)" />
          </Animated.View>
        </TouchableOpacity>

        {/* Expandable Content */}
        <Animated.View style={contentStyle}>
          <View style={styles.details}>
            {/* Charges Enabled */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Charges Enabled</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: accountStatus.chargesEnabled ? '#22c55e' : '#ef4444' },
                ]}
              >
                {accountStatus.chargesEnabled ? 'Yes' : 'No'}
              </Text>
            </View>

            {/* Payouts Enabled */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payouts Enabled</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: accountStatus.payoutsEnabled ? '#22c55e' : '#ef4444' },
                ]}
              >
                {accountStatus.payoutsEnabled ? 'Yes' : 'No'}
              </Text>
            </View>

            {/* Details Submitted */}
            {accountStatus.hasAccount && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Details Submitted</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: accountStatus.detailsSubmitted ? '#22c55e' : '#f59e0b' },
                  ]}
                >
                  {accountStatus.detailsSubmitted ? 'Yes' : 'No'}
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
    color: '#fff',
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
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
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
    color: 'rgba(255, 255, 255, 0.6)',
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'Lato_600SemiBold',
  },
  setupButton: {
    flexDirection: 'row',
    marginTop: 4,
  },
});
