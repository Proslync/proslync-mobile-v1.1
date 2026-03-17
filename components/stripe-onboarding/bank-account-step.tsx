import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { CardField, createToken } from '@stripe/stripe-react-native';
import { useMemo, useState } from 'react';
import { useAppTheme } from '@/hooks/use-app-theme';
import { GlassButton } from '@/components/glass/glass-button';
import type { StripeOnboardingFormData } from '@/lib/validation/stripe-onboarding';

interface BankAccountStepProps {
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function BankAccountStep({ onSubmit, onBack, isSubmitting }: BankAccountStepProps) {
  const { colors, isDark } = useAppTheme();
  const { control, trigger, formState: { errors }, setValue, watch } = useFormContext<StripeOnboardingFormData>();
  const tosAccepted = watch('tosAccepted');
  const payoutMethodType = watch('payoutMethodType');
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const isBank = payoutMethodType === 'bank';

  const switchMethod = (method: 'bank' | 'card') => {
    setValue('payoutMethodType', method, { shouldValidate: false });
    setCardError(null);
  };

  // CardField is a native Stripe component — needs explicit color values per theme
  const cardStyle = useMemo(() => ({
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F5F5',
    textColor: isDark ? '#ffffff' : '#1A1A1A',
    placeholderColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: cardError
      ? '#ef4444'
      : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    fontSize: 16,
    cursorColor: isDark ? '#ffffff' : '#1A1A1A',
  }), [isDark, cardError]);

  const handleSubmit = async () => {
    if (payoutMethodType === 'card') {
      try {
        const { token, error } = await createToken({ type: 'Card', currency: 'usd' });
        if (error) {
          const msg = error.message || 'Invalid card details';
          if (msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('not a debit')) {
            setCardError('Only debit cards are accepted for payouts');
          } else {
            setCardError(msg);
          }
          return;
        }
        if (!token?.id) {
          setCardError('Failed to tokenize card. Please try again.');
          return;
        }
        setValue('cardToken', token.id);
      } catch (e: any) {
        setCardError(e?.message || 'Failed to process card');
        return;
      }
    }

    const fieldsToValidate: (keyof StripeOnboardingFormData)[] = ['tosAccepted'];
    if (isBank) {
      fieldsToValidate.push('routingNumber', 'accountNumber', 'accountHolderName');
    }
    const valid = await trigger(fieldsToValidate);
    if (valid) onSubmit();
  };

  const inputStyle = [styles.input, {
    color: colors.text,
    backgroundColor: colors.input,
    borderColor: colors.borderStrong,
  }];
  const errorBorder = { borderColor: '#ef4444' };

  return (
    <View style={styles.container}>
      <Animated.Text
        entering={FadeInDown.duration(300)}
        style={[styles.stepTitle, { color: colors.text }]}
      >
        Payout Method
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.duration(300).delay(50)}
        style={[styles.stepDescription, { color: colors.textSecondary }]}
      >
        Where your earnings will be deposited.
      </Animated.Text>

      {/* Method Toggle */}
      <Animated.View entering={FadeInDown.duration(300).delay(75)} style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { borderColor: colors.border, backgroundColor: colors.input },
            isBank && { borderColor: colors.borderStrong, backgroundColor: colors.cardElevated },
          ]}
          activeOpacity={0.7}
          onPress={() => switchMethod('bank')}
        >
          <Ionicons name="business-outline" size={18} color={colors.text} style={styles.toggleIcon} />
          <Text style={[styles.toggleText, { color: colors.textTertiary }, isBank && { color: colors.text, fontFamily: 'Lato_700Bold' }]}>
            Bank Account
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { borderColor: colors.border, backgroundColor: colors.input },
            !isBank && { borderColor: colors.borderStrong, backgroundColor: colors.cardElevated },
          ]}
          activeOpacity={0.7}
          onPress={() => switchMethod('card')}
        >
          <Ionicons name="card-outline" size={18} color={colors.text} style={styles.toggleIcon} />
          <Text style={[styles.toggleText, { color: colors.textTertiary }, !isBank && { color: colors.text, fontFamily: 'Lato_700Bold' }]}>
            Debit Card
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {isBank ? (
        <>
          <Animated.View entering={FadeInDown.duration(300).delay(100)}>
            <Text style={[styles.label, { color: colors.text }]}>Account Holder Name</Text>
            <Controller
              name="accountHolderName"
              control={control}
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[inputStyle, errors.accountHolderName && errorBorder]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="John Doe"
                  placeholderTextColor={colors.placeholder}
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
                  style={[inputStyle, errors.routingNumber && errorBorder]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="110000000"
                  placeholderTextColor={colors.placeholder}
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
                  style={[inputStyle, errors.accountNumber && errorBorder]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="000123456789"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  maxLength={17}
                  secureTextEntry
                />
              )}
            />
            {errors.accountNumber && <Text style={styles.error}>{errors.accountNumber.message}</Text>}
          </Animated.View>
        </>
      ) : (
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <Text style={[styles.label, { color: colors.text }]}>Debit Card</Text>
          <Text style={[styles.cardNote, { color: colors.textSecondary }]}>
            Only debit cards are accepted for payouts. Credit cards will be declined.
          </Text>
          <View style={styles.cardFieldWrapper}>
            <CardField
              postalCodeEnabled={false}
              placeholders={{ number: '4242 4242 4242 4242' }}
              cardStyle={cardStyle}
              style={styles.cardField}
              onCardChange={(details) => {
                setCardComplete(details.complete);
                if (details.complete) setCardError(null);
              }}
            />
          </View>
          {cardError && <Text style={styles.error}>{cardError}</Text>}
          {errors.cardToken && !cardError && <Text style={styles.error}>{errors.cardToken.message}</Text>}
        </Animated.View>
      )}

      {/* TOS Checkbox */}
      <Animated.View entering={FadeInDown.duration(300).delay(250)}>
        <TouchableOpacity
          style={styles.tosRow}
          activeOpacity={0.7}
          onPress={() => setValue('tosAccepted', !tosAccepted as true, { shouldValidate: true })}
        >
          <View style={[
            styles.checkbox,
            { borderColor: colors.borderStrong, backgroundColor: colors.input },
            tosAccepted && { backgroundColor: colors.cardElevated, borderColor: colors.textSecondary },
          ]}>
            {tosAccepted && <Ionicons name="checkmark" size={14} color={colors.text} />}
          </View>
          <Text style={[styles.tosText, { color: colors.textSecondary }]}>
            I agree to the{' '}
            <Text
              style={[styles.tosLink, { color: colors.text }]}
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
            disabled={isSubmitting || (payoutMethodType === 'card' && !cardComplete)}
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
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleIcon: {
    marginRight: 6,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
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
  },
  cardNote: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFieldWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardField: {
    width: '100%',
    height: 50,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  tosText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Lato_400Regular',
    lineHeight: 20,
  },
  tosLink: {
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
