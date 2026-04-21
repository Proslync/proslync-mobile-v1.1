import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { FormSwitch } from "@/components/forms";
import {
  legalConsentSchema,
  type LegalConsentValues,
} from "@/lib/validation/athlete-registration";

interface LegalConsentStepProps {
  onContinue: (values: LegalConsentValues) => void;
  onBack: () => void;
}

export function LegalConsentStep({ onContinue, onBack }: LegalConsentStepProps) {
  const insets = useSafeAreaInsets();

  const methods = useForm<LegalConsentValues>({
    resolver: zodResolver(legalConsentSchema),
    defaultValues: {
      biometricDisclosure: false,
      ncaaCompliance: false,
      termsAccepted: false,
    },
    mode: "onChange",
  });

  const values = methods.watch();
  const allChecked =
    values.biometricDisclosure && values.ncaaCompliance && values.termsAccepted;

  const submit = methods.handleSubmit((v) => onContinue(v));

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consent</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Proslync processes identity and profile data to match you with brands and
          verify your eligibility. Review and accept each item to continue.
        </Text>

        <FormProvider {...methods}>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Biometric data disclosure</Text>
            <Text style={styles.blockBody}>
              Face ID / liveness data is processed locally on your device and
              used only to confirm that you're the person registering. We do
              not upload raw biometric templates.
            </Text>
            <FormSwitch<LegalConsentValues>
              name="biometricDisclosure"
              label="I understand and agree."
            />
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>NCAA compliance acknowledgment</Text>
            <Text style={styles.blockBody}>
              I certify that my participation on Proslync complies with
              applicable NCAA, school, and conference NIL rules. I am
              responsible for my own reporting obligations.
            </Text>
            <FormSwitch<LegalConsentValues>
              name="ncaaCompliance"
              label="I acknowledge and agree."
            />
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Terms and Privacy</Text>
            <Text style={styles.blockBody}>
              I have read and agree to the Proslync Terms of Service and
              Privacy Policy.
            </Text>
            <FormSwitch<LegalConsentValues>
              name="termsAccepted"
              label="I accept the Terms and Privacy Policy."
            />
          </View>
        </FormProvider>

        <Text style={styles.footerText}>
          You can review and export your consent record at any time from
          Settings → Privacy.
        </Text>
      </ScrollView>

      <TouchableOpacity
        style={[styles.primaryBtn, !allChecked && styles.primaryBtnDisabled]}
        onPress={submit}
        disabled={!allChecked}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  scroll: { paddingBottom: 24 },
  intro: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  block: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  blockTitle: { color: "#FFF", fontSize: 15, fontWeight: "700", marginBottom: 6 },
  blockBody: { color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 19 },
  footerText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: "#FF6F3C",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
});
