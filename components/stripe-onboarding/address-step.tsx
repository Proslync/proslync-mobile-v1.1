import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassView } from 'expo-glass-effect';
import { useAppTheme } from '@/hooks/use-app-theme';
import { liquidGlass } from '@/constants/glass/liquid-glass';
import { GlassButton } from '@/components/glass/glass-button';
import type { StripeOnboardingFormData } from '@/lib/validation/stripe-onboarding';
import { addressFields } from '@/lib/validation/stripe-onboarding';

interface AddressStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function AddressStep({ onNext, onBack }: AddressStepProps) {
  const { colors, isDark } = useAppTheme();
  const { control, trigger, formState: { errors } } = useFormContext<StripeOnboardingFormData>();

  const handleNext = async () => {
    const valid = await trigger(addressFields);
    if (valid) onNext();
  };

  const inputStyle = [styles.input, {
    color: colors.text,
    borderColor: colors.borderStrong,
  }];
  const errorBorder = { borderColor: '#ef4444' };

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
            <View style={styles.inputWrapper}>
              {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={12} style={StyleSheet.absoluteFillObject} />}
              <TextInput
                style={[inputStyle, errors.line1 && errorBorder]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="123 Main St"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
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
            <View style={styles.inputWrapper}>
              {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={12} style={StyleSheet.absoluteFillObject} />}
              <TextInput
                style={inputStyle}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Apt 4B"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
              />
            </View>
          )}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(300).delay(160)}>
        <Text style={[styles.label, { color: colors.text }]}>City</Text>
        <Controller
          name="city"
          control={control}
          render={({ field: { onChange, value, onBlur } }) => (
            <View style={styles.inputWrapper}>
              {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={12} style={StyleSheet.absoluteFillObject} />}
              <TextInput
                style={[inputStyle, errors.city && errorBorder]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="San Francisco"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="words"
              />
            </View>
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
              <View style={styles.inputWrapper}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={12} style={StyleSheet.absoluteFillObject} />}
                <TextInput
                  style={[inputStyle, errors.state && errorBorder]}
                  value={value}
                  onChangeText={(t) => onChange(t.toUpperCase())}
                  onBlur={onBlur}
                  placeholder="CA"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
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
              <View style={styles.inputWrapper}>
                {isDark && <GlassView {...liquidGlass.fillFaint} borderRadius={12} style={StyleSheet.absoluteFillObject} />}
                <TextInput
                  style={[inputStyle, errors.postalCode && errorBorder]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="94105"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
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
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  inputWrapper: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
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
