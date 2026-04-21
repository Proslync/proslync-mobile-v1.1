import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { activeGradient } from '@/constants/glass/liquid-glass';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { PhoneStep } from '@/components/auth/phone-step';
import { OtpStep } from '@/components/auth/otp-step';
import { ProfileSetupStep } from '@/components/auth/profile-setup-step';
import { AppleMessagesStep } from '@/components/auth/apple-messages-step';
import { ContactsStep } from '@/components/auth/contacts-step';
import { WelcomeStep } from '@/components/auth/welcome-step';
import { FaceIdStep } from '@/components/auth/face-id-step';
import { IdFallbackStep } from '@/components/auth/id-fallback-step';
import { LegalConsentStep } from '@/components/auth/legal-consent-step';
import { AthleteProfileStep } from '@/components/auth/athlete-profile-step';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/lib/providers/auth-provider';
import { findSchool } from '@/lib/data/athlete-data';
import type { AthleteProfile } from '@/lib/types/auth.types';
import type { LegalConsentValues } from '@/lib/validation/athlete-registration';
import type { AthleteRegistrationValues } from '@/lib/validation/athlete-registration';

type Step =
  | 'welcome'
  | 'face-id'
  | 'id-fallback'
  | 'legal'
  | 'phone'
  | 'otp'
  | 'profile'
  | 'athlete-profile'
  | 'apple-messages'
  | 'contacts';

export default function SignInScreen() {
  const [step, setStep] = useState<Step>('welcome');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [requiresAppleMessagesLinking, setRequiresAppleMessagesLinking] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<
    'face-id' | 'id-upload' | null
  >(null);
  const [legalValues, setLegalValues] = useState<LegalConsentValues | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const redirectUrl = (params.redirect as string) || '/(tabs)';
  const { colors, isDark } = useAppTheme();
  const { completeAthleteRegistration } = useAuth();

  const handlePhoneSuccess = (phone: string) => {
    setPhoneNumber(phone);
    setStep('otp');
  };

  const handleBack = () => {
    if (step === 'profile' || step === 'athlete-profile') return;
    if (step === 'otp') {
      setStep('phone');
    } else if (step === 'phone') {
      setStep('legal');
    } else if (step === 'legal') {
      setStep(verificationMethod === 'id-upload' ? 'id-fallback' : 'face-id');
    } else if (step === 'id-fallback') {
      setStep('face-id');
    } else if (step === 'face-id') {
      setStep('welcome');
    } else {
      router.back();
    }
  };

  const handleAthleteRegistrationComplete = async (
    values: AthleteRegistrationValues
  ) => {
    const school = findSchool(values.schoolId);
    const profile: AthleteProfile = {
      ...values,
      conference: school?.conference || values.conference,
      verification: verificationMethod
        ? {
            method: verificationMethod,
            verifiedAt: new Date().toISOString(),
          }
        : undefined,
      legalConsent: legalValues
        ? {
            biometricDisclosure: legalValues.biometricDisclosure,
            ncaaCompliance: legalValues.ncaaCompliance,
            termsAccepted: legalValues.termsAccepted,
            acceptedAt: new Date().toISOString(),
          }
        : undefined,
    };
    await completeAthleteRegistration(profile);
    router.replace(redirectUrl as any);
  };

  const handleProfileSetupNeeded = () => {
    setStep('athlete-profile');
  };

  const handleAppleMessagesLinkingNeeded = (requires: boolean) => {
    setRequiresAppleMessagesLinking(requires);
  };

  const handleAppleMessagesSetupNeeded = () => {
    setStep('apple-messages');
  };

  const handleProfileComplete = () => {
    if (requiresAppleMessagesLinking) {
      setStep('apple-messages');
    } else {
      setStep('contacts');
    }
  };

  const handleAppleMessagesComplete = () => {
    setStep('contacts');
  };

  const handleContactsComplete = () => {
    router.replace(redirectUrl as any);
  };

  const gradientColors = ['#0a0a0f', '#0d1117', '#111827', '#0a0a0f'] as const;

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
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

      {step === 'welcome' && (
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={SlideOutLeft.duration(300)}
          style={styles.stepContainer}
        >
          <WelcomeStep onRegisterAthlete={() => setStep('face-id')} />
        </Animated.View>
      )}

      {step === 'face-id' && (
        <Animated.View
          entering={SlideInRight.duration(350)}
          exiting={SlideOutLeft.duration(300)}
          style={styles.stepContainer}
        >
          <FaceIdStep
            onSuccess={(method) => {
              setVerificationMethod(method);
              setStep('legal');
            }}
            onFallback={() => setStep('id-fallback')}
          />
        </Animated.View>
      )}

      {step === 'id-fallback' && (
        <Animated.View
          entering={SlideInRight.duration(350)}
          exiting={SlideOutLeft.duration(300)}
          style={styles.stepContainer}
        >
          <IdFallbackStep
            onSuccess={(method) => {
              setVerificationMethod(method);
              setStep('legal');
            }}
            onBack={() => setStep('face-id')}
          />
        </Animated.View>
      )}

      {step === 'legal' && (
        <Animated.View
          entering={SlideInRight.duration(350)}
          exiting={SlideOutLeft.duration(300)}
          style={styles.stepContainer}
        >
          <LegalConsentStep
            onContinue={(values) => {
              setLegalValues(values);
              setStep('phone');
            }}
            onBack={() =>
              setStep(verificationMethod === 'id-upload' ? 'id-fallback' : 'face-id')
            }
          />
        </Animated.View>
      )}

      {step === 'phone' && (
        <Animated.View
          entering={SlideInRight.duration(350)}
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
            onAppleMessagesLinkingNeeded={handleAppleMessagesLinkingNeeded}
            onAppleMessagesSetupNeeded={handleAppleMessagesSetupNeeded}
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

      {step === 'athlete-profile' && (
        <Animated.View
          entering={SlideInRight.duration(350)}
          exiting={SlideOutLeft.duration(300)}
          style={styles.stepContainer}
        >
          <AthleteProfileStep
            onComplete={handleAthleteRegistrationComplete}
            onBack={() => setStep('otp')}
          />
        </Animated.View>
      )}

      {step === 'apple-messages' && (
        <Animated.View
          entering={SlideInRight.duration(350)}
          exiting={SlideOutLeft.duration(300)}
          style={styles.stepContainer}
        >
          <AppleMessagesStep onSuccess={handleAppleMessagesComplete} />
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
