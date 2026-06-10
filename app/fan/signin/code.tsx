// ── Fan Signin — OTP Code Step ─────────────────────────────
// Phase 2 — collects the 6-digit OTP code and verifies via
// `fanAuthedApi.verifyOtp`. Auto-submits when the 6th digit
// lands. On success for `fan_signin` we finish auth here. On
// `fan_signup` we route to the handle picker before verifying.
//
// If verify returns 409 ("phone not registered") on signin we
// bounce back to phone with `?bounce=signup`.
//
// Backend dev mode echoes the actual code back as `debugCode` so
// QA can shortcut the SMS round-trip — surfaced inline as "Dev
// code: ######".

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fanAuthedApi } from '@/lib/api/fan/authed';
import { useFanAuth } from '@/lib/providers/fan-auth-provider';
import type { FanOtpPurpose } from '@/lib/types/fan.types';

const BG = '#0a0a0f';
const ACCENT = '#EB621A';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = 'rgba(255,255,255,0.6)';
const TEXT_TERTIARY = 'rgba(255,255,255,0.4)';
const BORDER = 'rgba(255,255,255,0.10)';

export default function FanSignInCodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useFanAuth();
  const params = useLocalSearchParams<{
    phoneNumber?: string;
    purpose?: string;
    debugCode?: string;
  }>();
  const phoneNumber = params.phoneNumber ?? '';
  const purpose = (params.purpose as FanOtpPurpose | undefined) ?? 'fan_signin';
  const initialDebugCode = params.debugCode ?? '';

  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resending, setResending] = React.useState(false);
  const [debugCode, setDebugCode] = React.useState<string>(initialDebugCode);

  const handleVerify = React.useCallback(
    async (codeToUse: string) => {
      if (codeToUse.length !== 6 || loading) return;
      setLoading(true);
      setError(null);

      if (purpose === 'fan_signup') {
        // Defer the verify until the handle/displayName picker.
        setLoading(false);
        router.push({
          pathname: '/fan/signin/handle',
          params: { phoneNumber, code: codeToUse },
        });
        return;
      }

      const res = await fanAuthedApi.verifyOtp({
        phoneNumber,
        code: codeToUse,
        purpose: 'fan_signin',
      });
      setLoading(false);
      if (!res) {
        // Could be wrong code or unknown number. Offer the signup bounce.
        setError('Code invalid or phone not registered.');
        return;
      }
      await signIn(
        { accessToken: res.accessToken, refreshToken: res.refreshToken },
        res.fanUser,
        res.identityLink,
      );
      router.replace('/(fan-tabs)');
    },
    [loading, phoneNumber, purpose, router, signIn],
  );

  const handleChangeCode = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) {
      void handleVerify(digits);
    }
  };

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setError(null);
    const res = await fanAuthedApi.requestOtp({ phoneNumber, purpose });
    setResending(false);
    if (!res) {
      setError('Could not resend. Please try again.');
      return;
    }
    if (res.debugCode) setDebugCode(res.debugCode);
  };

  const handleBounceToSignup = () => {
    router.replace({
      pathname: '/fan/signin/phone',
      params: { bounce: 'signup' },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityLabel="Back"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={26} color={TEXT_PRIMARY} />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Enter the code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to {phoneNumber || 'your phone'}.
          </Text>

          {__DEV__ && debugCode ? (
            <Text style={styles.devCode}>Dev code: {debugCode}</Text>
          ) : null}

          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={handleChangeCode}
            placeholder="123456"
            placeholderTextColor={TEXT_TERTIARY}
            keyboardType="number-pad"
            autoFocus
            maxLength={6}
            editable={!loading}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {error && purpose === 'fan_signin' ? (
            <Pressable
              onPress={handleBounceToSignup}
              style={styles.bounceCta}
              accessibilityRole="button"
            >
              <Text style={styles.bounceCtaText}>First time? Sign up instead</Text>
            </Pressable>
          ) : null}

          <Pressable
            style={[
              styles.cta,
              (code.length !== 6 || loading) && styles.ctaDisabled,
            ]}
            disabled={code.length !== 6 || loading}
            onPress={() => handleVerify(code)}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.ctaText}>
                {purpose === 'fan_signup' ? 'Continue' : 'Sign in'}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleResend}
            style={styles.resendLink}
            disabled={resending}
            accessibilityRole="button"
          >
            <Text style={styles.resendText}>
              {resending ? 'Sending…' : 'Resend code'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    color: TEXT_PRIMARY,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  devCode: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  codeInput: {
    height: 60,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: TEXT_PRIMARY,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  errorText: {
    color: '#ef4444',
    marginTop: 10,
    fontSize: 13,
  },
  bounceCta: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  bounceCtaText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: '700',
  },
  cta: {
    marginTop: 20,
    height: 52,
    backgroundColor: ACCENT,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
  resendLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
  },
});
