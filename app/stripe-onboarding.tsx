import { GlassButton } from "@/components/glass/glass-button";
import { DarkGradientBg } from "@/components/shared/dark-gradient-bg";
import { useToast } from "@/components/shared/toast";
import { AddressStep } from "@/components/stripe-onboarding/address-step";
import { BankAccountStep } from "@/components/stripe-onboarding/bank-account-step";
import { PersonalInfoStep } from "@/components/stripe-onboarding/personal-info-step";
import { StepIndicator } from "@/components/stripe-onboarding/step-indicator";
import {
  STRIPE_ACCOUNT_STATUS_KEY,
  useCreateCustomAccount,
  useUpdateCustomAccount,
} from "@/hooks";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { UpdateCustomAccountRequest } from "@/lib/api/wallet";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  stripeOnboardingSchema,
  type StripeOnboardingFormData,
} from "@/lib/validation/stripe-onboarding";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TOTAL_STEPS = 3;

export default function StripeOnboardingScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { from, mode, step } = useLocalSearchParams<{
    from?: string;
    mode?: string;
    step?: string;
  }>();
  const isUpdateMode = mode === "update";

  const [stepIndex, setStepIndex] = useState(() => {
    const parsed = step ? parseInt(step, 10) : NaN;
    return !isNaN(parsed) && parsed >= 0 && parsed < TOTAL_STEPS ? parsed : 0;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const createAccount = useCreateCustomAccount();
  const updateAccount = useUpdateCustomAccount();

  const methods = useForm<StripeOnboardingFormData>({
    resolver: zodResolver(stripeOnboardingSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      dobDay: undefined,
      dobMonth: undefined,
      dobYear: undefined,
      ssnLast4: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      payoutMethodType: "bank" as const,
      routingNumber: "",
      accountNumber: "",
      accountHolderName:
        user?.firstName && user?.lastName
          ? `${user.firstName} ${user.lastName}`
          : "",
      cardToken: "",
      tosAccepted: false as unknown as true,
    },
    mode: "onBlur",
  });

  const goNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStepIndex((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const goBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    const valid = await methods.trigger();
    if (!valid) return;

    setIsSubmitting(true);
    try {
      const data = methods.getValues();

      const personalInfo = {
        firstName: data.firstName,
        lastName: data.lastName,
        dobDay: data.dobDay,
        dobMonth: data.dobMonth,
        dobYear: data.dobYear,
        ssnLast4: data.ssnLast4,
      };
      const address = {
        line1: data.line1,
        line2: data.line2 || undefined,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
      };

      const payoutMethod =
        data.payoutMethodType === "card"
          ? { cardToken: data.cardToken }
          : {
              bankAccount: {
                routingNumber: data.routingNumber,
                accountNumber: data.accountNumber,
                accountHolderName: data.accountHolderName,
              },
            };

      if (isUpdateMode) {
        await updateAccount.mutateAsync({
          personalInfo,
          address,
          ...payoutMethod,
        } as UpdateCustomAccountRequest);
      } else {
        await createAccount.mutateAsync({
          personalInfo,
          address,
          ...payoutMethod,
        });
      }
      await queryClient.invalidateQueries({
        queryKey: [STRIPE_ACCOUNT_STATUS_KEY],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsComplete(true);
    } catch (error: any) {
      toast.showError(
        error?.message || "Failed to create account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [methods, createAccount, queryClient, toast]);

  const handleDone = useCallback(() => {
    if (from === "signup") {
      router.replace("/(tabs)");
    } else {
      router.replace("/dashboard/payments?setup=success");
    }
  }, [from, router]);

  // Success state
  if (isComplete) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {isDark && <DarkGradientBg />}
        <View style={[styles.successContent, { paddingTop: insets.top + 60 }]}>
          <Animated.View
            entering={FadeIn.duration(400)}
            style={styles.successIcon}
          >
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={40} color={colors.text} />
            </View>
          </Animated.View>
          <Animated.Text
            entering={FadeInDown.duration(400).delay(200)}
            style={[styles.successTitle, { color: colors.text }]}
          >
            Account Created
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.duration(400).delay(300)}
            style={[styles.successDescription, { color: colors.textSecondary }]}
          >
            Your payout account is being verified by Stripe. This usually takes
            a few minutes. You'll be able to receive payments once verified.
          </Animated.Text>
        </View>

        <Animated.View
          entering={FadeIn.duration(400).delay(400)}
          style={[styles.successButton, { paddingBottom: insets.bottom + 24 }]}
        >
          <GlassButton
            label="Continue"
            onPress={handleDone}
            fullWidth
            size="lg"
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDark && <DarkGradientBg />}

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Set Up Payouts</Text>
        <View style={styles.headerButton} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.stepIndicatorWrapper}>
            <StepIndicator currentStep={stepIndex} totalSteps={TOTAL_STEPS} />
          </View>

          <FormProvider {...methods}>
            {stepIndex === 0 && <PersonalInfoStep onNext={goNext} />}
            {stepIndex === 1 && <AddressStep onNext={goNext} onBack={goBack} />}
            {stepIndex === 2 && (
              <BankAccountStep
                onSubmit={handleSubmit}
                onBack={goBack}
                isSubmitting={isSubmitting}
              />
            )}
          </FormProvider>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  stepIndicatorWrapper: {
    paddingBottom: 8,
  },
  // Success state
  successContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  successIcon: {
    marginBottom: 24,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "Lato_700Bold",
    marginBottom: 12,
    textAlign: "center",
  },
  successDescription: {
    fontSize: 15,
    fontFamily: "Lato_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  successButton: {
    width: "100%",
    paddingHorizontal: 32,
  },
});
