import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { OTPInput } from './otp-input';
import { otpSchema } from '@/lib/schemas/auth';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/providers/auth-provider';
import { handleApiError } from '@/lib/api/errors';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassCard } from '@/components/glass/glass-card';
import { GlassSurface } from '@/components/glass/glass-surface';
import { fontFamily } from '@/constants/glass/tokens';

interface OtpStepProps {
  phoneNumber: string;
  redirectUrl?: string;
  onBack?: () => void;
  onProfileSetupNeeded?: () => void;
  onAppleMessagesLinkingNeeded?: (requires: boolean) => void;
  onAppleMessagesSetupNeeded?: () => void;
}

export function OtpStep({ phoneNumber, redirectUrl, onBack, onProfileSetupNeeded, onAppleMessagesLinkingNeeded, onAppleMessagesSetupNeeded }: OtpStepProps) {
  const [otpValue, setOtpValue] = React.useState('');
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = React.useState(30);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { colors, isDark } = useAppTheme();

  // Shake animation for error
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  // Resend countdown timer
  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleOtpChange = (value: string) => {
    setOtpValue(value);
    if (error) setError(null);
  };

  const handleOtpComplete = async (code: string) => {
    const result = otpSchema.safeParse(code);

    if (!result.success) {
      setError('Please enter a valid 6-digit code');
      triggerShake();
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await authApi.verifyOtp({
        phoneNumber,
        code,
        deviceInfo: { platform: Platform.OS, deviceType: 'phone', userAgent: '' },
      });

      await login(response.user, response.accessToken, response.refreshToken);
      setIsSuccess(true);

      const needsAppleLinking = !response.user.isAppleMessagesLinked;

      // Capture Apple Messages linking requirement for later steps
      if (needsAppleLinking && onAppleMessagesLinkingNeeded) {
        onAppleMessagesLinkingNeeded(true);
      }

      if (!response.user.isProfileComplete && onProfileSetupNeeded) {
        // Profile setup will transition to apple-messages step after if needed
        onProfileSetupNeeded();
        return;
      }

      // Profile is complete — if Apple Messages linking needed, go there directly
      if (needsAppleLinking && onAppleMessagesSetupNeeded) {
        onAppleMessagesSetupNeeded();
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? handleApiError(err) : 'Invalid verification code';
      setError(message);
      triggerShake();
      setOtpValue('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError(null);

    try {
      await authApi.requestOtp({ phoneNumber });
      setOtpValue('');
      setResendCountdown(30);
    } catch (err) {
      const message = err instanceof Error ? handleApiError(err) : 'Failed to resend code';
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  // Format phone for display (mask middle digits)
  const maskedPhone = React.useMemo(() => {
    if (phoneNumber.length <= 6) return phoneNumber;
    const last4 = phoneNumber.slice(-4);
    const prefix = phoneNumber.slice(0, phoneNumber.length - 4);
    const masked = prefix.slice(0, Math.min(prefix.length, 4)) + '****';
    return `${masked}${last4}`;
  }, [phoneNumber]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {/* Back Button */}
        {onBack && (
          <Animated.View
            entering={FadeIn.duration(300).delay(200)}
            style={styles.backButtonContainer}
          >
            <GlassSurface
              fill="light"
              border="subtle"
              cornerRadius="3xl"
              style={styles.backButtonSurface}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
              </TouchableOpacity>
            </GlassSurface>
          </Animated.View>
        )}

        <View style={styles.topSpacer} />

        {/* Logo */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(300)}
          style={styles.logoContainer}
        >
          <Image
            source={require('@/assets/images/status_logo.png')}
            style={[styles.logo, { tintColor: colors.text }]}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={FadeInUp.duration(500).delay(400)}
          style={[styles.title, { color: colors.text }]}
        >
          Verification Code
        </Animated.Text>

        {/* Subtitle with phone */}
        <Animated.Text
          entering={FadeInUp.duration(500).delay(450)}
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          We sent a 6-digit code to{'\n'}
          <Text style={{ color: colors.text, }}>{maskedPhone}</Text>
        </Animated.Text>

        {/* OTP Input */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(500)}
          style={[styles.otpContainer, shakeStyle]}
        >
          <OTPInput
            value={otpValue}
            onChange={handleOtpChange}
            onComplete={handleOtpComplete}
            maxLength={6}
            disabled={isVerifying || isSuccess}
            error={!!error}
            success={isSuccess}
          />
        </Animated.View>

        {/* Status Messages */}
        <View style={styles.statusContainer}>
          {isSuccess && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={styles.successBadge}
            >
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>Verified successfully</Text>
            </Animated.View>
          )}

          {isVerifying && !isSuccess && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={styles.loadingContainer}
            >
              <ActivityIndicator color={colors.textSecondary} size="small" />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Verifying...</Text>
            </Animated.View>
          )}

          {error && (
            <Animated.Text
              entering={FadeInDown.duration(200)}
              style={styles.errorText}
            >
              {error}
            </Animated.Text>
          )}
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Resend Link */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(850)}
          style={styles.resendContainer}
        >
          {resendCountdown > 0 ? (
            <Text style={[styles.resendText, { color: colors.textTertiary }]}>
              Resend code in {resendCountdown}s
            </Text>
          ) : (
            <View style={styles.resendRow}>
              <Text style={[styles.resendText, { color: colors.textSecondary }]}>Didn't receive a code? </Text>
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={isResending}
                activeOpacity={0.7}
              >
                {isResending ? (
                  <ActivityIndicator color={colors.textSecondary} size="small" />
                ) : (
                  <Text style={[styles.resendLink, { color: colors.text }]}>Resend</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButtonContainer: {
    alignSelf: 'flex-start',
  },
  backButtonSurface: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
  },
  topSpacer: {
    height: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 48,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  otpContainer: {
    width: '100%',
    alignItems: 'center',
  },
  statusContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  successIcon: {
    color: '#34C759',
    fontSize: 16,
  },
  successText: {
    color: '#34C759',
    fontSize: 15,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 15,
  },
  resendLink: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
