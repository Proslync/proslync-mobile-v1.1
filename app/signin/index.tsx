import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { PhoneStep } from '@/components/auth/phone-step';
import { OtpStep } from '@/components/auth/otp-step';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function SignInScreen() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
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
    if (step === 'otp') {
      setStep('phone');
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DarkGradientBg />
      {step === 'phone' && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={styles.stepContainer}
        >
          <PhoneStep onSuccess={handlePhoneSuccess} onBack={handleBack} />
        </Animated.View>
      )}

      {step === 'otp' && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={styles.stepContainer}
        >
          <OtpStep
            phoneNumber={phoneNumber}
            redirectUrl={redirectUrl}
            onBack={handleBack}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContainer: {
    width: '100%',
    height: '100%',
  },
});
