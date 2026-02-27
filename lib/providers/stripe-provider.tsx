// Stripe Provider for React Native
import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { StripeProvider as StripeProviderNative } from '@stripe/stripe-react-native';
import { config } from '@/lib/config';

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const publishableKey = config.stripe.publishableKey;

  if (!publishableKey) {
    console.warn('Publishable key is not configured');
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  return (
    <StripeProviderNative
      publishableKey={publishableKey}
      merchantIdentifier="merchant.statusdigitalinc.status" // Required for Apple Pay
      urlScheme="status" // For redirect-based payment methods
    >
      <View style={{ flex: 1 }}>{children}</View>
    </StripeProviderNative>
  );
}
