import * as React from 'react';
import {
  View,
  Text,
  TextInput,
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
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CountryPicker } from './country-picker';
import { authApi } from '@/lib/api/auth';
import { handleApiError } from '@/lib/api/errors';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassCard } from '@/components/glass/glass-card';
import { GlassButton } from '@/components/glass/glass-button';
import { fontFamily, spacing, radius as radiusTokens } from '@/constants/glass/tokens';

interface PhoneStepProps {
  onSuccess: (phoneNumber: string) => void;
  onBack?: () => void;
}

const PHONE_LENGTH_BY_COUNTRY: Record<string, number> = {
  '+1': 10,
  '+44': 10,
  '+380': 9,
  '+49': 10,
  '+33': 9,
  '+39': 10,
  '+34': 9,
  '+81': 10,
  '+82': 9,
  '+86': 11,
  '+91': 10,
  '+7': 10,
  '+972': 9,
  '+61': 9,
  '+55': 11,
};

const STRIP_LEADING_ZERO = ['+380', '+44', '+49', '+33', '+39', '+34', '+81', '+82', '+61', '+55', '+972'];

export function PhoneStep({ onSuccess, onBack }: PhoneStepProps) {
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [countryCode, setCountryCode] = React.useState('+1');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const minDigits = PHONE_LENGTH_BY_COUNTRY[countryCode] || 7;

  const isPhoneComplete = React.useMemo(() => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length >= minDigits;
  }, [phoneNumber, minDigits]);

  const handleSendOTP = async () => {
    let digits = phoneNumber.replace(/\D/g, '');

    if (digits.length < 6) {
      setError('Please enter a valid phone number');
      return;
    }

    if (STRIP_LEADING_ZERO.includes(countryCode) && digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    const fullPhone = `${countryCode}${digits}`;
    setIsLoading(true);
    setError(null);

    try {
      await authApi.requestOtp({ phoneNumber: fullPhone });
      onSuccess(fullPhone);
    } catch (err) {
      const message = err instanceof Error ? handleApiError(err) : 'Failed to send OTP';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
    if (error) setError(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
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
          Welcome Back
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeInUp.duration(500).delay(450)}
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          Enter your phone number to continue
        </Animated.Text>

        {/* Phone Input — Glass Card */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(500)}
        >
          <GlassCard
            fill="light"
            border="subtle"
            cornerRadius="lg"
            shadowLevel="lg"
            blurIntensity="medium"
            style={styles.glassInputCard}
          >
            <View style={styles.inputRow}>
              <CountryPicker
                selectedCode={countryCode}
                onSelect={setCountryCode}
              />
              <View style={[styles.inputDivider, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              }]} />
              <Text style={[styles.dialCode, { color: colors.text }]}>{countryCode}</Text>
              <TextInput
                style={[styles.phoneInput, { color: colors.text }]}
                placeholder="(555) 555-5555"
                placeholderTextColor={colors.placeholder}
                keyboardType="phone-pad"
                keyboardAppearance={isDark ? 'dark' : 'light'}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                maxLength={14}
                autoFocus
                selectionColor={colors.textTertiary}
                cursorColor={colors.textSecondary}
                textContentType="telephoneNumber"
                autoComplete="tel"
                importantForAutofill="yes"
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Error Message */}
        {error && (
          <Animated.Text
            entering={FadeInDown.duration(200)}
            style={styles.errorText}
          >
            {error}
          </Animated.Text>
        )}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Continue Button */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(600)}
          style={styles.buttonContainer}
        >
          <GlassButton
            label={isLoading ? '' : 'Continue'}
            variant="glass"
            size="lg"
            onPress={handleSendOTP}
            disabled={!isPhoneComplete || isLoading}
            loading={isLoading}
            fullWidth
          />
        </Animated.View>

        {/* Terms Text */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(700)}
          style={styles.termsContainer}
        >
          <Text style={[styles.termsText, { color: colors.textTertiary }]}>
            By continuing, you agree to our{' '}
            <Text style={[styles.termsLink, { color: colors.textSecondary }]}>Terms</Text> and{' '}
            <Text style={[styles.termsLink, { color: colors.textSecondary }]}>Privacy Policy</Text>
          </Text>
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
  topSpacer: {
    height: 60,
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
    fontFamily: 'Lato_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    marginBottom: 40,
  },
  glassInputCard: {
    width: '100%',
    paddingVertical: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
  },
  inputDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 4,
  },
  dialCode: {
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    paddingHorizontal: 8,
  },
  phoneInput: {
    flex: 1,
    height: 58,
    fontSize: 17,
    fontFamily: 'Lato_400Regular',
    paddingRight: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    marginTop: 16,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 16,
  },
  termsContainer: {
    marginBottom: 20,
  },
  termsText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
});
