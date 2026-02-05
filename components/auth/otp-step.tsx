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

interface OtpStepProps {
  phoneNumber: string;
  redirectUrl?: string;
  onBack?: () => void;
}

export function OtpStep({ phoneNumber, redirectUrl, onBack }: OtpStepProps) {
  const [otpValue, setOtpValue] = React.useState('');
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

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
      });

      // Login with the response data (verify-otp returns partial user, login will fetch full profile)
      await login(response.user, response.accessToken, response.refreshToken);

      setIsSuccess(true);

      // Navigation is handled by AuthProvider
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
    } catch (err) {
      const message = err instanceof Error ? handleApiError(err) : 'Failed to resend code';
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

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
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
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
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={FadeInUp.duration(500).delay(400)}
          style={styles.title}
        >
          Enter Verification Code
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeInUp.duration(500).delay(450)}
          style={styles.subtitle}
        >
          We sent a 6-digit code to {phoneNumber}
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
            <Animated.Text
              entering={FadeInDown.duration(200)}
              style={styles.successText}
            >
              ✓ Verified successfully!
            </Animated.Text>
          )}

          {isVerifying && !isSuccess && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={styles.loadingContainer}
            >
              <ActivityIndicator color="rgba(255, 255, 255, 0.5)" size="small" />
              <Text style={styles.loadingText}>Verifying...</Text>
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
          <Text style={styles.resendText}>Didn't receive a code? </Text>
          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={isResending}
            activeOpacity={0.7}
          >
            {isResending ? (
              <ActivityIndicator color="rgba(255, 255, 255, 0.7)" size="small" />
            ) : (
              <Text style={styles.resendLink}>Resend</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButtonContainer: {
    alignSelf: 'flex-start',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: '#fff',
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
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 40,
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
  successText: {
    color: '#4ade80',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resendText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
  },
  resendLink: {
    color: '#fff',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
