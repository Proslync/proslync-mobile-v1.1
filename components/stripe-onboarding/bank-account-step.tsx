import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassButton } from '@/components/glass/glass-button';
import type { StripeOnboardingFormData } from '@/lib/validation/stripe-onboarding';
import { bankAccountFields } from '@/lib/validation/stripe-onboarding';

interface BankAccountStepProps {
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function BankAccountStep({ onSubmit, onBack, isSubmitting }: BankAccountStepProps) {
  const { colors } = useAppTheme();
  const { control, trigger, formState: { errors }, setValue, watch } = useFormContext<StripeOnboardingFormData>();
  const tosAccepted = watch('tosAccepted');

  const handleSubmit = async () => {
    const valid = await trigger(bankAccountFields);
    if (valid) onSubmit();
  };

  return (
    <View style={styles.container}>
      <Animated.Text
        entering={FadeInDown.duration(300)}
        style={[styles.stepTitle, { color: colors.text }]}
      >
        Bank Account
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.duration(300).delay(50)}
        style={[styles.stepDescription, { color: colors.textSecondary }]}
      >
        Where your earnings will be deposited.
      </Animated.Text>

      <Animated.View entering={FadeInDown.duration(300).delay(100)}>
        <Text style={[styles.label, { color: colors.text }]}>Account Holder Name</Text>
        <Controller
          name="accountHolderName"
          control={control}
          render={({ field: { onChange, value, onBlur } }) => (
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: errors.accountHolderName ? '#ef4444' : 'rgba(255,255,255,0.2)' }]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="John Doe"
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoCapitalize="words"
              autoCorrect={false}
            />
          )}
        />
        {errors.accountHolderName && <Text style={styles.error}>{errors.accountHolderName.message}</Text>}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(300).delay(150)}>
        <Text style={[styles.label, { color: colors.text }]}>Routing Number</Text>
        <Controller
          name="routingNumber"
          control={control}
          render={({ field: { onChange, value, onBlur } }) => (
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: errors.routingNumber ? '#ef4444' : 'rgba(255,255,255,0.2)' }]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="110000000"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="number-pad"
              maxLength={9}
            />
          )}
        />
        {errors.routingNumber && <Text style={styles.error}>{errors.routingNumber.message}</Text>}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(300).delay(200)}>
        <Text style={[styles.label, { color: colors.text }]}>Account Number</Text>
        <Controller
          name="accountNumber"
          control={control}
          render={({ field: { onChange, value, onBlur } }) => (
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: errors.accountNumber ? '#ef4444' : 'rgba(255,255,255,0.2)' }]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="000123456789"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="number-pad"
              maxLength={17}
              secureTextEntry
            />
          )}
        />
        {errors.accountNumber && <Text style={styles.error}>{errors.accountNumber.message}</Text>}
      </Animated.View>

      {/* TOS Checkbox */}
      <Animated.View entering={FadeInDown.duration(300).delay(250)}>
        <TouchableOpacity
          style={styles.tosRow}
          activeOpacity={0.7}
          onPress={() => setValue('tosAccepted', !tosAccepted as true, { shouldValidate: true })}
        >
          <View style={[styles.checkbox, tosAccepted ? styles.checkboxChecked : undefined]}>
            {tosAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={[styles.tosText, { color: colors.textSecondary }]}>
            I agree to the{' '}
            <Text
              style={styles.tosLink}
              onPress={() => Linking.openURL('https://stripe.com/connect-account/legal/full')}
            >
              Stripe Connected Account Agreement
            </Text>
          </Text>
        </TouchableOpacity>
        {errors.tosAccepted && <Text style={styles.error}>{errors.tosAccepted.message}</Text>}
      </Animated.View>

      <View style={styles.buttonRow}>
        <GlassButton label="Back" onPress={onBack} size="lg" style={styles.backButton} disabled={isSubmitting} />
        <View style={styles.submitButtonWrapper}>
          <GlassButton
            label="Submit"
            onPress={handleSubmit}
            fullWidth
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting}
          />
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
  error: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: '#ef4444',
    marginTop: 4,
  },
  tosRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  tosText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    lineHeight: 20,
  },
  tosLink: {
    color: '#fff',
    textDecorationLine: 'underline',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    minWidth: 80,
  },
  submitButtonWrapper: {
    flex: 1,
  },
});
