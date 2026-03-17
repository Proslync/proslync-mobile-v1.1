import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { PhoneStep } from '@/components/auth/phone-step';
import { OtpStep } from '@/components/auth/otp-step';
import { ProfileSetupStep } from '@/components/auth/profile-setup-step';
import { ContactsStep } from '@/components/auth/contacts-step';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function SignInScreen() {
  const [step, setStep] = useState<'phone' | 'otp' | 'profile' | 'contacts'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams();
  const redirectUrl = (params.redirect as string) || '/(tabs)';
  const { colors, isDark } = useAppTheme();

  const handlePhoneSuccess = (phone: string) => {
    setPhoneNumber(phone);
    setStep('otp');
  };

  const handleBack = () => {
    if (step === 'profile') return;
    if (step === 'otp') {
      setStep('phone');
    } else {
      router.back();
    }
  };

  const handleProfileSetupNeeded = () => {
    setStep('profile');
  };

  const handleProfileComplete = () => {
    setStep('contacts');
  };

  const handleContactsComplete = () => {
    router.replace(redirectUrl as any);
  };

  const gradientColors = isDark
    ? ['#0a0a0f', '#0d1117', '#111827', '#0a0a0f'] as const
    : ['#f0f4ff', '#e8edf5', '#f5f0ff', '#f0f4ff'] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Ambient glow accent */}
      {isDark && (
        <LinearGradient
          colors={[
            'rgba(56, 151, 240, 0.08)',
            'rgba(139, 92, 246, 0.04)',
            'transparent',
          ]}
          style={styles.ambientGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
        />
      )}

      {step === 'phone' && (
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={SlideOutLeft.duration(300)}
          style={styles.stepContainer}
        >
          <PhoneStep onSuccess={handlePhoneSuccess} onBack={handleBack} />
        </Animated.View>
      )}

      {step === 'otp' && (
        <Animated.View
          entering={SlideInRight.duration(350)}
          exiting={SlideOutLeft.duration(300)}
          style={styles.stepContainer}
        >
          <OtpStep
            phoneNumber={phoneNumber}
            redirectUrl={redirectUrl}
            onBack={handleBack}
            onProfileSetupNeeded={handleProfileSetupNeeded}
          />
        </Animated.View>
      )}

      {step === 'profile' && (
        <Animated.View
          entering={SlideInRight.duration(350)}
          exiting={SlideOutLeft.duration(300)}
          style={styles.stepContainer}
        >
          <ProfileSetupStep onSuccess={handleProfileComplete} />
        </Animated.View>
      )}

      {step === 'contacts' && (
        <Animated.View
          entering={SlideInRight.duration(350)}
          exiting={FadeOut.duration(300)}
          style={styles.stepContainer}
        >
          <ContactsStep onSuccess={handleContactsComplete} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ambientGlow: {
    ...StyleSheet.absoluteFillObject,
    height: '60%',
  },
  stepContainer: {
    width: '100%',
    height: '100%',
  },
});
