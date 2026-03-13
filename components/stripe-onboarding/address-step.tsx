import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassButton } from '@/components/glass/glass-button';
import type { StripeOnboardingFormData } from '@/lib/validation/stripe-onboarding';
import { addressFields } from '@/lib/validation/stripe-onboarding';

interface AddressStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function AddressStep({ onNext, onBack }: AddressStepProps) {
  const { colors } = useAppTheme();
  const { control, trigger, formState: { errors } } = useFormContext<StripeOnboardingFormData>();

  const handleNext = async () => {
    const valid = await trigger(addressFields);
    if (valid) onNext();
  };

  return (
    <View style={styles.container}>
      <Animated.Text
        entering={FadeInDown.duration(300)}
        style={[styles.stepTitle, { color: colors.text }]}
      >
        Address
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.duration(300).delay(50)}
        style={[styles.stepDescription, { color: colors.textSecondary }]}
      >
        Your legal residential address for identity verification.
      </Animated.Text>

      <Animated.View entering={FadeInDown.duration(300).delay(100)}>
        <Text style={[styles.label, { color: colors.text }]}>Street Address</Text>
        <Controller
          name="line1"
          control={control}
          render={({ field: { onChange, value, onBlur } }) => (
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: errors.line1 ? '#ef4444' : 'rgba(255,255,255,0.2)' }]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="123 Main St"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoCapitalize="words"
              autoCorrect={false}
            />
          )}
        />
        {errors.line1 && <Text style={styles.error}>{errors.line1.message}</Text>}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(300).delay(130)}>
        <Text style={[styles.label, { color: colors.text }]}>Apt, Suite, etc. (optional)</Text>
        <Controller
          name="line2"
          control={control}
          render={({ field: { onChange, value, onBlur } }) => (
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: 'rgba(255,255,255,0.2)' }]}
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Apt 4B"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoCapitalize="words"
            />
          )}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(300).delay(160)}>
        <Text style={[styles.label, { color: colors.text }]}>City</Text>
        <Controller
          name="city"
          control={control}
          render={({ field: { onChange, value, onBlur } }) => (
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: errors.city ? '#ef4444' : 'rgba(255,255,255,0.2)' }]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="San Francisco"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoCapitalize="words"
            />
          )}
        />
        {errors.city && <Text style={styles.error}>{errors.city.message}</Text>}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(300).delay(190)} style={styles.row}>
        <View style={styles.halfField}>
          <Text style={[styles.label, { color: colors.text }]}>State</Text>
          <Controller
            name="state"
            control={control}
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: errors.state ? '#ef4444' : 'rgba(255,255,255,0.2)' }]}
                value={value}
                onChangeText={(t) => onChange(t.toUpperCase())}
                onBlur={onBlur}
                placeholder="CA"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="characters"
                maxLength={2}
              />
            )}
          />
          {errors.state && <Text style={styles.error}>{errors.state.message}</Text>}
        </View>
        <View style={styles.halfField}>
          <Text style={[styles.label, { color: colors.text }]}>ZIP Code</Text>
          <Controller
            name="postalCode"
            control={control}
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: errors.postalCode ? '#ef4444' : 'rgba(255,255,255,0.2)' }]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="94105"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="number-pad"
                maxLength={5}
              />
            )}
          />
          {errors.postalCode && <Text style={styles.error}>{errors.postalCode.message}</Text>}
        </View>
      </Animated.View>

      <View style={styles.buttonRow}>
        <GlassButton label="Back" onPress={onBack} size="lg" style={styles.backButton} />
        <View style={styles.nextButtonWrapper}>
          <GlassButton label="Next" onPress={handleNext} fullWidth size="lg" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Lato_700Bold',
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    lineHeight: 20,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  error: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: '#ef4444',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    minWidth: 80,
  },
  nextButtonWrapper: {
    flex: 1,
  },
});
