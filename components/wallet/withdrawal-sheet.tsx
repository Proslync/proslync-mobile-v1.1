// Withdrawal Sheet - Comprehensive withdraw flow with integrated payout management
import { useToast } from "@/components/shared/toast";
import { NativeSheet } from "@/components/ui/native-sheet";
import { liquidGlass } from "@/constants/glass/liquid-glass";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  useAddBankAccount,
  useAddDebitCard,
  useRemoveExternalAccount,
  useSetDefaultExternalAccount,
  useStripeAccountStatus,
} from "@/hooks/use-wallet-queries";
import { config } from "@/lib/config";
import {
  addBankAccountSchema,
  type AddBankAccountFormData,
} from "@/lib/validation/stripe-onboarding";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CardFieldInput } from "@stripe/stripe-react-native";
import {
  CardField,
  StripeProvider,
  createToken,
} from "@stripe/stripe-react-native";
import { GlassView } from "expo-glass-effect";
import React, { useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { PayoutMethod, WalletBalances } from "../../lib/types/wallet.types";
import { formatCents } from "@/lib/utils";

interface WithdrawalSheetProps {
  visible: boolean;
  onClose: () => void;
  balances: WalletBalances;
  payoutMethods: PayoutMethod[];
  onWithdraw: (amountCents: number, methodId: string) => void | Promise<void>;
}

type SheetView =
  | "withdraw"
  | "confirm"
  | "select-method"
  | "add-method-choice"
  | "add-bank"
  | "add-card";

const QUICK_AMOUNTS = [
  { label: "25%", multiplier: 0.25 },
  { label: "50%", multiplier: 0.5 },
  { label: "Max", multiplier: 1 },
];

export function WithdrawalSheet({
  visible,
  onClose,
  balances,
  payoutMethods,
  onWithdraw,
}: WithdrawalSheetProps) {
  const { colors, isDark } = useAppTheme();
  const toast = useToast();
  const [view, setView] = useState<SheetView>("withdraw");
  const [amountInput, setAmountInput] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(
    payoutMethods.find((m) => m.isDefault)?.id || payoutMethods[0]?.id || null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const { data: stripeStatus } = useStripeAccountStatus();
  const addBankMutation = useAddBankAccount();
  const addCardMutation = useAddDebitCard();
  const removeMutation = useRemoveExternalAccount();
  const setDefaultMutation = useSetDefaultExternalAccount();

  const bankForm = useForm<AddBankAccountFormData>({
    resolver: zodResolver(addBankAccountSchema),
    defaultValues: {
      routingNumber: "",
      accountNumber: "",
      accountHolderName: "",
    },
  });

  const amountCents = useMemo(() => {
    const parsed = parseFloat(amountInput);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100);
  }, [amountInput]);

  const canWithdraw =
    amountCents >= balances.minimumCashOutCents &&
    amountCents <= balances.availableCents &&
    selectedMethodId !== null;

  const selectedMethod = payoutMethods.find((m) => m.id === selectedMethodId);

  const handleClose = () => {
    setView("withdraw");
    setAmountInput("");
    bankForm.reset();
    setCardComplete(false);
    onClose();
  };

  const handleQuickAmount = (multiplier: number) => {
    const amount = Math.floor(balances.availableCents * multiplier) / 100;
    setAmountInput(amount.toFixed(2));
  };

  const handleWithdraw = () => {
    if (!canWithdraw || !selectedMethodId || isProcessing) return;
    setView("confirm");
  };

  const handleConfirmWithdraw = async () => {
    if (!selectedMethodId || isProcessing) return;
    try {
      setIsProcessing(true);
      await onWithdraw(amountCents, selectedMethodId);
      handleClose();
    } catch (error: any) {
      toast.showError(error?.message || "Failed to process withdrawal");
      setView("withdraw");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectMethod = (methodId: string) => {
    setSelectedMethodId(methodId);
    setView("withdraw");
  };

  const handleAddBank = useCallback(
    async (data: AddBankAccountFormData) => {
      try {
        await addBankMutation.mutateAsync(data);
        toast.showSuccess("Bank account added");
        bankForm.reset();
        setView("select-method");
      } catch (error: any) {
        toast.showError(error?.message || "Failed to add bank account");
      }
    },
    [addBankMutation, bankForm, toast],
  );

  const handleAddCard = useCallback(async () => {
    if (!cardComplete) return;
    try {
      setIsProcessing(true);
      const { token, error } = await createToken({ type: "Card" });
      if (error) {
        toast.showError(error.message);
        return;
      }
      if (!token) {
        toast.showError("Failed to create card token");
        return;
      }
      await addCardMutation.mutateAsync({ token: token.id });
      toast.showSuccess("Debit card added");
      setCardComplete(false);
      setView("select-method");
    } catch (error: any) {
      toast.showError(error?.message || "Failed to add debit card");
    } finally {
      setIsProcessing(false);
    }
  }, [cardComplete, addCardMutation, toast]);

  const handleRemoveMethod = useCallback(
    (methodId: string, label: string) => {
      if (payoutMethods.length <= 1) {
        toast.showError("Cannot remove the last payout method");
        return;
      }
      Alert.alert("Remove Payout Method", `Remove ${label}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMutation.mutateAsync(methodId);
              toast.showSuccess("Payout method removed");
              if (selectedMethodId === methodId) {
                const remaining = payoutMethods.filter(
                  (m) => m.id !== methodId,
                );
                setSelectedMethodId(remaining[0]?.id || null);
              }
            } catch (error: any) {
              toast.showError(
                error?.message || "Failed to remove payout method",
              );
            }
          },
        },
      ]);
    },
    [payoutMethods, removeMutation, selectedMethodId, toast],
  );

  const handleSetDefault = useCallback(
    async (methodId: string) => {
      try {
        await setDefaultMutation.mutateAsync(methodId);
        toast.showSuccess("Default payout method updated");
      } catch (error: any) {
        toast.showError(error?.message || "Failed to set default");
      }
    },
    [setDefaultMutation, toast],
  );

  // Render different views
  const renderWithdrawView = () => (
    <>
      <Text style={[styles.title, { color: colors.text }]}>Withdraw</Text>

      {/* Available Balance */}
      <View style={styles.balanceSection}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
          Available balance
        </Text>
        <Text style={styles.balanceAmount}>
          {formatCents(balances.availableCents)}
        </Text>
      </View>

      {/* Amount Input */}
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>
          Amount
        </Text>
        <View
          style={[
            styles.inputContainer,
            {
              overflow: "hidden" as const,
              backgroundColor: isDark ? undefined : "rgba(0, 0, 0, 0.05)",
            },
          ]}
        >
          {isDark && (
            <GlassView
              {...liquidGlass.fillFaint}
              borderRadius={12}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <Text style={[styles.currencySymbol, { color: colors.textTertiary }]}>
            $
          </Text>
          <TextInput
            style={[styles.amountInput, { color: colors.text }]}
            value={amountInput}
            onChangeText={setAmountInput}
            placeholder="0.00"
            placeholderTextColor={colors.placeholder}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickAmounts}>
          {QUICK_AMOUNTS.map((qa) => (
            <TouchableOpacity
              key={qa.label}
              style={[
                styles.quickAmountButton,
                {
                  overflow: "hidden" as const,
                  backgroundColor: isDark ? undefined : "rgba(0, 0, 0, 0.04)",
                },
              ]}
              onPress={() => handleQuickAmount(qa.multiplier)}
            >
              {isDark && (
                <GlassView
                  {...liquidGlass.fillFaint}
                  borderRadius={8}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <Text style={styles.quickAmountText}>{qa.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Payout Method Selector */}
      <View style={styles.methodSection}>
        <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>
          Payout method
        </Text>
        <TouchableOpacity
          style={[
            styles.methodSelector,
            {
              overflow: "hidden" as const,
              backgroundColor: isDark ? undefined : "rgba(0, 0, 0, 0.05)",
            },
          ]}
          onPress={() => setView("select-method")}
        >
          {isDark && (
            <GlassView
              {...liquidGlass.fillFaint}
              borderRadius={12}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          {selectedMethod ? (
            <View style={styles.selectedMethodContent}>
              <Ionicons
                name={
                  selectedMethod.type === "bank"
                    ? "business-outline"
                    : "card-outline"
                }
                size={20}
                color={colors.text}
              />
              <View style={styles.selectedMethodInfo}>
                <Text
                  style={[styles.selectedMethodLabel, { color: colors.text }]}
                >
                  {selectedMethod.label}
                </Text>
                <Text
                  style={[
                    styles.selectedMethodLast4,
                    { color: colors.textTertiary },
                  ]}
                >
                  ••••{selectedMethod.last4}
                </Text>
              </View>
            </View>
          ) : (
            <Text
              style={[styles.addMethodText, { color: colors.textTertiary }]}
            >
              Select payout method
            </Text>
          )}
          <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Estimated Arrival */}
      {selectedMethod && (
        <View style={styles.arrivalSection}>
          <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.arrivalText, { color: colors.textTertiary }]}>
            {selectedMethod.type === "debit" ? "Instant" : "1-3 business days"}
          </Text>
        </View>
      )}

      {/* Withdraw Button */}
      <TouchableOpacity
        style={[
          styles.withdrawButton,
          (!canWithdraw || isProcessing) && { opacity: 0.5 },
        ]}
        onPress={handleWithdraw}
        disabled={!canWithdraw || isProcessing}
      >
        <GlassView
          {...liquidGlass.fillMedium}
          borderRadius={12}
          style={StyleSheet.absoluteFill}
        />
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.withdrawButtonText}>
            {amountCents < balances.minimumCashOutCents && amountCents > 0
              ? `Min. ${formatCents(balances.minimumCashOutCents)}`
              : "Confirm Withdrawal"}
          </Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderSelectMethodView = () => (
    <>
      <View style={styles.viewHeader}>
        <TouchableOpacity
          onPress={() => setView("withdraw")}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.viewTitle, { color: colors.text }]}>
          Payout Methods
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.methodList}>
        {payoutMethods.map((method) => (
          <View
            key={method.id}
            style={[
              styles.methodOption,
              { backgroundColor: isDark ? undefined : "rgba(0, 0, 0, 0.04)" },
              selectedMethodId === method.id && styles.methodOptionSelected,
            ]}
          >
            {isDark && (
              <GlassView
                {...liquidGlass.fillFaint}
                borderRadius={12}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <TouchableOpacity
              style={styles.methodOptionTap}
              onPress={() => handleSelectMethod(method.id)}
            >
              <Ionicons
                name={
                  method.type === "bank" ? "business-outline" : "card-outline"
                }
                size={22}
                color={
                  selectedMethodId === method.id ? "#fff" : colors.textSecondary
                }
              />
              <View style={styles.methodOptionInfo}>
                <View style={styles.methodLabelRow}>
                  <Text
                    style={[styles.methodOptionLabel, { color: colors.text }]}
                  >
                    {method.label}
                  </Text>
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.methodOptionLast4,
                    { color: colors.textTertiary },
                  ]}
                >
                  ••••{method.last4}
                </Text>
              </View>
              {selectedMethodId === method.id && (
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
              )}
            </TouchableOpacity>

            {/* Method actions */}
            <View style={styles.methodActions}>
              {!method.isDefault && (
                <TouchableOpacity
                  style={styles.methodActionBtn}
                  onPress={() => handleSetDefault(method.id)}
                  disabled={setDefaultMutation.isPending}
                >
                  <Text style={styles.methodActionText}>Set Default</Text>
                </TouchableOpacity>
              )}
              {payoutMethods.length > 1 && (
                <TouchableOpacity
                  style={styles.methodActionBtn}
                  onPress={() =>
                    handleRemoveMethod(
                      method.id,
                      `${method.label} ••••${method.last4}`,
                    )
                  }
                  disabled={removeMutation.isPending}
                >
                  <Text style={[styles.methodActionText, { color: "#ef4444" }]}>
                    Remove
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Add Payout Method Option */}
        <TouchableOpacity
          style={styles.addMethodOption}
          onPress={() => setView("add-method-choice")}
        >
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={styles.addMethodOptionText}>Add payout method</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );

  const renderConfirmView = () => (
    <>
      <View style={styles.confirmContainer}>
        <View style={styles.confirmIconWrapper}>
          <Ionicons name="arrow-down-circle" size={48} color="#22c55e" />
        </View>
        <Text style={[styles.confirmTitle, { color: colors.text }]}>
          Confirm Withdrawal
        </Text>
        <Text style={[styles.confirmAmount, { color: colors.text }]}>
          {formatCents(amountCents)}
        </Text>
        {selectedMethod && (
          <View style={styles.confirmDestination}>
            <Ionicons
              name={
                selectedMethod.type === "bank"
                  ? "business-outline"
                  : "card-outline"
              }
              size={18}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.confirmDestText, { color: colors.textSecondary }]}
            >
              {selectedMethod.label} ••••{selectedMethod.last4}
            </Text>
          </View>
        )}
        <Text style={[styles.confirmArrival, { color: colors.textTertiary }]}>
          Estimated arrival:{" "}
          {selectedMethod?.type === "debit" ? "Instant" : "1-3 business days"}
        </Text>
      </View>

      <View style={styles.confirmButtons}>
        <TouchableOpacity
          style={styles.confirmCancelButton}
          onPress={() => setView("withdraw")}
          disabled={isProcessing}
        >
          <GlassView
            {...liquidGlass.fill}
            borderRadius={12}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.confirmCancelText, { color: colors.text }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.confirmWithdrawButton,
            isProcessing && { opacity: 0.6 },
          ]}
          onPress={handleConfirmWithdraw}
          disabled={isProcessing}
        >
          <GlassView
            {...liquidGlass.fillMedium}
            borderRadius={12}
            style={StyleSheet.absoluteFill}
          />
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.confirmWithdrawText}>Withdraw</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderAddMethodChoiceView = () => (
    <>
      <View style={styles.viewHeader}>
        <TouchableOpacity
          onPress={() => setView("select-method")}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.viewTitle, { color: colors.text }]}>
          Add Payout Method
        </Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.methodChoices}>
        <TouchableOpacity
          style={[
            styles.choiceOption,
            {
              overflow: "hidden" as const,
              backgroundColor: isDark ? undefined : "rgba(0, 0, 0, 0.05)",
            },
          ]}
          onPress={() => setView("add-bank")}
        >
          {isDark && (
            <GlassView
              {...liquidGlass.fillFaint}
              borderRadius={12}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <View
            style={[
              styles.choiceIconWrap,
              {
                backgroundColor: isDark ? undefined : "rgba(0,0,0,0.06)",
                overflow: "hidden",
              },
            ]}
          >
            {isDark && (
              <GlassView
                {...liquidGlass.fillFaint}
                borderRadius={22}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <Ionicons name="business-outline" size={24} color={colors.text} />
          </View>
          <View style={styles.choiceInfo}>
            <Text style={[styles.choiceTitle, { color: colors.text }]}>
              Bank Account
            </Text>
            <Text
              style={[styles.choiceSubtitle, { color: colors.textTertiary }]}
            >
              1-3 business days
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.choiceOption,
            {
              overflow: "hidden" as const,
              backgroundColor: isDark ? undefined : "rgba(0, 0, 0, 0.05)",
            },
          ]}
          onPress={() => setView("add-card")}
        >
          {isDark && (
            <GlassView
              {...liquidGlass.fillFaint}
              borderRadius={12}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <View
            style={[
              styles.choiceIconWrap,
              {
                backgroundColor: isDark ? undefined : "rgba(0,0,0,0.06)",
                overflow: "hidden",
              },
            ]}
          >
            {isDark && (
              <GlassView
                {...liquidGlass.fillFaint}
                borderRadius={22}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <Ionicons name="card-outline" size={24} color={colors.text} />
          </View>
          <View style={styles.choiceInfo}>
            <Text style={[styles.choiceTitle, { color: colors.text }]}>
              Debit Card
            </Text>
            <Text
              style={[styles.choiceSubtitle, { color: colors.textTertiary }]}
            >
              Instant payouts
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </>
  );

  const renderAddBankView = () => (
    <>
      <View style={styles.viewHeader}>
        <TouchableOpacity
          onPress={() => {
            bankForm.reset();
            setView("add-method-choice");
          }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.viewTitle, { color: colors.text }]}>
          Add Bank Account
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.formContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>
          Routing Number
        </Text>
        <Controller
          control={bankForm.control}
          name="routingNumber"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <View
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: isDark ? undefined : "rgba(0, 0, 0, 0.05)",
                }}
              >
                {isDark && (
                  <GlassView
                    {...liquidGlass.fillFaint}
                    borderRadius={12}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <TextInput
                  style={[styles.formInput, { color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="9-digit routing number"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  maxLength={9}
                />
              </View>
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </>
          )}
        />

        <Text
          style={[
            styles.inputLabel,
            { color: colors.textTertiary, marginTop: 16 },
          ]}
        >
          Account Number
        </Text>
        <Controller
          control={bankForm.control}
          name="accountNumber"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <View
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: isDark ? undefined : "rgba(0, 0, 0, 0.05)",
                }}
              >
                {isDark && (
                  <GlassView
                    {...liquidGlass.fillFaint}
                    borderRadius={12}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <TextInput
                  style={[styles.formInput, { color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Account number"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  maxLength={17}
                  secureTextEntry
                />
              </View>
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </>
          )}
        />

        <Text
          style={[
            styles.inputLabel,
            { color: colors.textTertiary, marginTop: 16 },
          ]}
        >
          Account Holder Name
        </Text>
        <Controller
          control={bankForm.control}
          name="accountHolderName"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <View
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: isDark ? undefined : "rgba(0, 0, 0, 0.05)",
                }}
              >
                {isDark && (
                  <GlassView
                    {...liquidGlass.fillFaint}
                    borderRadius={12}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <TextInput
                  style={[styles.formInput, { color: colors.text }]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Full name on account"
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="words"
                />
              </View>
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </>
          )}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            addBankMutation.isPending && { opacity: 0.6 },
          ]}
          onPress={bankForm.handleSubmit(handleAddBank)}
          disabled={addBankMutation.isPending}
        >
          <GlassView
            {...liquidGlass.fillMedium}
            borderRadius={12}
            style={StyleSheet.absoluteFill}
          />
          {addBankMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[styles.submitButtonText, { color: colors.text }]}>
              Add Bank Account
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );

  const renderAddCardView = () => (
    <>
      <View style={styles.viewHeader}>
        <TouchableOpacity
          onPress={() => {
            setCardComplete(false);
            setView("add-method-choice");
          }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.viewTitle, { color: colors.text }]}>
          Add Debit Card
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Nest a StripeProvider scoped to the connected account so createToken
          produces a token usable on the Custom account */}
      <StripeProvider
        publishableKey={config.stripe.publishableKey}
        stripeAccountId={stripeStatus?.accountId}
      >
        <View style={styles.formContainer}>
          <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>
            Card Details
          </Text>
          <View
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(0,0,0,0.2)"
                : "rgba(0,0,0,0.15)",
              backgroundColor: isDark ? undefined : "#f5f5f5",
              overflow: "hidden",
            }}
          >
            {isDark && (
              <GlassView
                {...liquidGlass.fillFaint}
                borderRadius={12}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <CardField
              postalCodeEnabled={false}
              cardStyle={{
                backgroundColor: isDark ? "#1c1c1e" : "#f5f5f5",
                textColor: isDark ? "#ffffff" : "#000000",
                placeholderColor: isDark ? "#999999" : "rgba(0,0,0,0.35)",
                fontSize: 16,
              }}
              style={styles.cardField}
              onCardChange={(details: CardFieldInput.Details) => {
                setCardComplete(details.complete);
              }}
            />
          </View>

          <Text style={[styles.cardNote, { color: colors.textTertiary }]}>
            Only debit cards are accepted for instant payouts. Credit cards
            cannot receive payouts.
          </Text>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!cardComplete || isProcessing) && { opacity: 0.6 },
            ]}
            onPress={handleAddCard}
            disabled={!cardComplete || isProcessing}
          >
            <GlassView
              {...liquidGlass.fillMedium}
              borderRadius={12}
              style={StyleSheet.absoluteFill}
            />
            {isProcessing || addCardMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.submitButtonText, { color: colors.text }]}>
                Add Debit Card
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </StripeProvider>
    </>
  );

  return (
    <NativeSheet
      isPresented={visible}
      onDismiss={handleClose}
      detents={[{ fraction: 0.7 }, "large"]}
      rnContent
      scrollable
    >
      {view === "withdraw" && renderWithdrawView()}
      {view === "confirm" && renderConfirmView()}
      {view === "select-method" && renderSelectMethodView()}
      {view === "add-method-choice" && renderAddMethodChoiceView()}
      {view === "add-bank" && renderAddBankView()}
      {view === "add-card" && renderAddCardView()}
    </NativeSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontFamily: "Lato_700Bold",
    textAlign: "center",
    marginBottom: 20,
  },
  balanceSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: "Lato_700Bold",
    color: "#34c759",
    marginTop: 4,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontFamily: "Lato_400Regular",
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontFamily: "Lato_700Bold",
    paddingVertical: 16,
  },
  quickAmounts: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  quickAmountText: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
  },
  methodSection: {
    marginBottom: 16,
  },
  methodSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 14,
    minHeight: 56,
  },
  selectedMethodContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedMethodInfo: {
    marginLeft: 12,
  },
  selectedMethodLabel: {
    fontSize: 14,
    fontFamily: "Lato_700Bold",
  },
  selectedMethodLast4: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
  },
  addMethodText: {
    fontSize: 14,
    fontFamily: "Lato_400Regular",
  },
  arrivalSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  arrivalText: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
  },
  withdrawButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
    overflow: "hidden",
  },
  withdrawButtonText: {
    fontSize: 17,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
  },
  // View header
  viewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  viewTitle: {
    fontSize: 18,
    fontFamily: "Lato_700Bold",
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  // Method list
  methodList: {
    maxHeight: 400,
  },
  methodOption: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  methodOptionSelected: {
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  methodOptionTap: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  methodOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  methodOptionLabel: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
  },
  defaultBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
  },
  methodOptionLast4: {
    fontSize: 12,
    fontFamily: "Lato_400Regular",
  },
  methodActions: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 16,
  },
  methodActionBtn: {
    paddingVertical: 4,
  },
  methodActionText: {
    fontSize: 13,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
  },
  addMethodOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderStyle: "dashed",
    gap: 10,
  },
  addMethodOptionText: {
    fontSize: 15,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
  },
  // Method choices
  methodChoices: {
    gap: 12,
  },
  choiceOption: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
  },
  choiceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  choiceInfo: {
    flex: 1,
    marginLeft: 14,
  },
  choiceTitle: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
  },
  choiceSubtitle: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    marginTop: 2,
  },
  // Forms
  formContainer: {
    paddingBottom: 8,
  },
  formInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Lato_400Regular",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    fontFamily: "Lato_400Regular",
    marginTop: 4,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    overflow: "hidden",
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
  },
  cardField: {
    height: 50,
    marginBottom: 8,
  },
  cardNote: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    lineHeight: 18,
    marginTop: 8,
  },
  // Confirm view
  confirmContainer: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
  },
  confirmIconWrapper: {
    marginBottom: 4,
  },
  confirmTitle: {
    fontSize: 20,
    fontFamily: "Lato_700Bold",
  },
  confirmAmount: {
    fontSize: 36,
    fontFamily: "Lato_700Bold",
    color: "#22c55e",
    marginVertical: 4,
  },
  confirmDestination: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  confirmDestText: {
    fontSize: 15,
    fontFamily: "Lato_400Regular",
  },
  confirmArrival: {
    fontSize: 13,
    fontFamily: "Lato_400Regular",
    marginTop: 4,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  confirmCancelText: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
  },
  confirmWithdrawButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  confirmWithdrawText: {
    fontSize: 16,
    fontFamily: "Lato_700Bold",
    color: "#1A1A1A",
  },
});
