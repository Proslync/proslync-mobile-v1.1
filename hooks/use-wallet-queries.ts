import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import {
  stripeConnectApi,
  type StripeAccountStatus,
  type BalanceResponse,
  type ExternalAccountsResponse,
  type EarningsListResponse,
  type GetEarningsParams,
  type PayoutsListResponse,
  type GetPayoutsParams,
  type CreatePayoutResponse,
  type CreatePayoutDto,
} from '@/lib/api/wallet';


export const STRIPE_ACCOUNT_STATUS_KEY = 'stripe-account-status';
export const STRIPE_BALANCE_KEY = 'stripe-balance';
export const STRIPE_EXTERNAL_ACCOUNTS_KEY = 'stripe-external-accounts';
export const STRIPE_EARNINGS_KEY = 'stripe-earnings';
export const STRIPE_PAYOUTS_KEY = 'stripe-payouts';


export function useStripeAccountStatus() {
  return useQuery<StripeAccountStatus>({
    queryKey: [STRIPE_ACCOUNT_STATUS_KEY],
    queryFn: () => stripeConnectApi.getAccountStatus(),
    staleTime: 30 * 1000,
  });
}

export function useStripeBalance() {
  return useQuery<BalanceResponse>({
    queryKey: [STRIPE_BALANCE_KEY],
    queryFn: () => stripeConnectApi.getBalance(),
    staleTime: 30 * 1000,
  });
}

export function useExternalAccounts() {
  return useQuery<ExternalAccountsResponse>({
    queryKey: [STRIPE_EXTERNAL_ACCOUNTS_KEY],
    queryFn: () => stripeConnectApi.getExternalAccounts(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEarnings(params?: GetEarningsParams) {
  return useQuery<EarningsListResponse>({
    queryKey: [STRIPE_EARNINGS_KEY, params],
    queryFn: () => stripeConnectApi.getEarnings(params),
    staleTime: 60 * 1000,
  });
}

export function usePayouts(params?: GetPayoutsParams) {
  return useQuery<PayoutsListResponse>({
    queryKey: [STRIPE_PAYOUTS_KEY, params],
    queryFn: () => stripeConnectApi.getPayouts(params),
    staleTime: 60 * 1000,
  });
}


export function useCreatePayout() {
  const queryClient = useQueryClient();
  return useMutation<CreatePayoutResponse, Error, CreatePayoutDto>({
    mutationFn: (data) => stripeConnectApi.createPayout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STRIPE_BALANCE_KEY] });
      queryClient.invalidateQueries({ queryKey: [STRIPE_PAYOUTS_KEY] });
    },
  });
}

export function useSetupStripeAccount() {
  const queryClient = useQueryClient();
  return useMutation<void, Error>({
    mutationFn: async () => {
      const status = await stripeConnectApi.getAccountStatus();

      if (!status.hasAccount) {
        // Create new account and open onboarding
        const response = await stripeConnectApi.createAccount();
        if (response.onboardingUrl) {
          await Linking.openURL(response.onboardingUrl);
        }
      } else if (!status.chargesEnabled || !status.payoutsEnabled) {
        // Account exists but not fully active — get fresh onboarding link
        // This handles both incomplete details AND pending requirements
        const response = await stripeConnectApi.getOnboardingLink();
        await Linking.openURL(response.url);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STRIPE_ACCOUNT_STATUS_KEY] });
    },
  });
}
