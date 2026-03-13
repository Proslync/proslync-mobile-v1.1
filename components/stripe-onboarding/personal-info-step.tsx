import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassButton } from '@/components/glass/glass-button';
import type { StripeOnboardingFormData } from '@/lib/validation/stripe-onboarding';
import { personalInfoFields } from '@/lib/validation/stripe-onboarding';

interface PersonalInfoStepProps {
  onNext: () => void;
}

export function PersonalInfoStep({ onNext }: PersonalInfoStepProps) {
  const { colors } = useAppTheme();
  const { control, trigger, formState: { errors } } = useFormContext<StripeOnboardingFormData>();

  const handleNext = async () => {
    const valid = await trigger(personalInfoFields);
    if (valid) onNext();
  };

  return (
    <View style={styles.container}>
      <Animated.Text
        entering={FadeInDown.duration(300)}
        style={[styles.stepTitle, { color: colors.text }]}
      >
        Personal Information
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.duration(300).delay(50)}
        style={[styles.stepDescription, { color: colors.textSecondary }]}
      >
        Legal name and identity details for Stripe verification.
      </Animated.Text>

      <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.row}>
        <View style={styles.halfField}>
          <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
          <Controller
            name="firstName"
            control={control}
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: errors.firstName ? '#ef4444' : 'rgba(255,255,255,0.2)' }]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="John"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="words"
                autoCorrect={false}
              />
            )}
          />
          {errors.firstName && <Text style={styles.error}>{errors.firstName.message}</Text>}
        </View>
        <View style={styles.halfField}>
          <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
          <Controller
            name="lastName"
            control={control}
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: errors.lastName ? '#ef4444' : 'rgba(255,255,255,0.2)' }]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Doe"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="words"
                autoCorrect={false}
              />
            )}
          />
          {errors.lastName && <Text style={styles.error}>{errors.lastName.message}</Text>}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(300).delay(150)}>
        <Text style={[styles.label, { color: colors.text }]}>Date of Birth</Text>
        <View style={styles.row}>
          <View style={styles.thirdField}>
            <Controller
              name="dobMonth"
              control={control}
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: errors.dobMonth ? '#ef4444' : 'rgba(255,255,255,0.2)' }]}
                  value={value ? String(value) : ''}
                  onChangeText={(t) => {
                    const n = parseInt(t, 10);
                    onChange(isNaN(n) ? '' : n);
                  }}
                  onBlur={onBlur}
                  placeholder="MM"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              )}
            />
          </View>
          <View style={styles.thirdField}>
            <Controller
              name="dobDay"
              control={control}
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: errors.dobDay ? '#ef4444' : 'rgba(255,255,255,0.2)' }]}
                  value={value ? String(value) : ''}
                  onChangeText={(t) => {
                    const n = parseInt(t, 10);
                    onChange(isNaN(n) ? '' : n);
                  }}
                  onBlur={onBlur}
                  placeholder="DD"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              )}
            />
          </View>
          <View style={styles.thirdField}>
            <Controller
              name="dobYear"
              control={control}
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: errors.dobYear ? '#ef4444' : 'rgba(255,255,255,0.2)' }]}
                  value={value ? String(value) : ''}
                  onChangeText={(t) => {
                    const n = parseInt(t, 10);
                    onChange(isNaN(n) ? '' : n);
                  }}
                  onBlur={onBlur}
                  placeholder="YYYY"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              )}
            />
          </View>
        </View>
        {(errors.dobMonth || errors.dobDay || errors.dobYear) && (
          <Text style={styles.error}>
            {errors.dobMonth?.message || errors.dobDay?.message || errors.dobYear?.message}
          </Text>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(300).delay(200)}>
        <Text style={[styles.label, { color: colors.text }]}>SSN Last 4 Digits</Text>
        <Controller
          name="ssnLast4"
          control={control}
          render={({ field: { onChange, value, onBlur } }) => (
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: errors.ssnLast4 ? '#ef4444' : 'rgba(255,255,255,0.2)' }]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="1234"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          )}
        />
        {errors.ssnLast4 && <Text style={styles.error}>{errors.ssnLast4.message}</Text>}
      </Animated.View>

      <View style={styles.buttonContainer}>
        <GlassButton label="Next" onPress={handleNext} fullWidth size="lg" />
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
  thirdField: {
    flex: 1,
  },
  error: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: '#ef4444',
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 8,
  },
});
