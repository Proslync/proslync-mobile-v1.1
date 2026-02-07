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
  Alert,
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

interface PhoneStepProps {
  onSuccess: (phoneNumber: string) => void;
  onBack?: () => void;
}

// Minimum digits required per country code (without leading zero)
const PHONE_LENGTH_BY_COUNTRY: Record<string, number> = {
  '+1': 10,    // US, Canada
  '+44': 10,   // UK
  '+380': 9,   // Ukraine
  '+49': 10,   // Germany
  '+33': 9,    // France
  '+39': 10,   // Italy
  '+34': 9,    // Spain
  '+81': 10,   // Japan
  '+82': 9,    // South Korea
  '+86': 11,   // China
  '+91': 10,   // India
  '+7': 10,    // Russia
  '+972': 9,   // Israel
  '+61': 9,    // Australia
  '+55': 11,   // Brazil
};

// Countries where local numbers typically start with 0 (should be stripped)
const STRIP_LEADING_ZERO = ['+380', '+44', '+49', '+33', '+39', '+34', '+81', '+82', '+61', '+55', '+972'];

export function PhoneStep({ onSuccess, onBack }: PhoneStepProps) {
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [countryCode, setCountryCode] = React.useState('+1');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Get minimum digits required for current country
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

    // Strip leading zero for countries where national format starts with 0
    // e.g., Ukraine: 093 -> 93 (user pastes 0930566527, we send +380930566527)
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
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={FadeInUp.duration(500).delay(400)}
          style={styles.title}
        >
          Login/Signup
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={FadeInUp.duration(500).delay(450)}
          style={styles.subtitle}
        >
          We'll send you a verification code.
        </Animated.Text>

        {/* Phone Input */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(500)}
          style={styles.inputContainer}
        >
          <CountryPicker
            selectedCode={countryCode}
            onSelect={setCountryCode}
          />
          <Text style={styles.dialCode}>{countryCode}</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="(555) 555-5555"
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            maxLength={14}
            autoFocus
            selectionColor="rgba(255, 255, 255, 0.5)"
            cursorColor="rgba(255, 255, 255, 0.7)"
            // Autofill support
            textContentType="telephoneNumber"
            autoComplete="tel"
            importantForAutofill="yes"
          />
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
          <TouchableOpacity
            style={[styles.button, (!isPhoneComplete || isLoading) && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={!isPhoneComplete || isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Terms Text */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(700)}
          style={styles.termsContainer}
        >
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    // Subtle glow
    shadowColor: 'rgba(255, 255, 255, 0.15)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  dialCode: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  phoneInput: {
    flex: 1,
    height: 56,
    fontSize: 17,
    color: '#fff',
    paddingRight: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
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
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  termsContainer: {
    marginBottom: 20,
  },
  termsText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: 'rgba(255, 255, 255, 0.6)',
    textDecorationLine: 'underline',
  },
});
