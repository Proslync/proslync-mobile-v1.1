// ── Fan Signin — Phone Step ────────────────────────────────
// Phase 2 — collects an E.164 phone number, requests an OTP via
// `fanAuthedApi.requestOtp`, and routes to the code step. If the
// user is bounced here from the code step with `?bounce=signup`,
// we show a "First time? Sign up" banner offering to switch the
// OTP purpose to `fan_signup`.

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
import type { FanOtpPurpose } from '@/lib/types/fan.types';

const BG = '#0a0a0f';
const ACCENT = '#EB621A';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = 'rgba(255,255,255,0.6)';
const TEXT_TERTIARY = 'rgba(255,255,255,0.4)';
const BORDER = 'rgba(255,255,255,0.10)';

export default function FanSignInPhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ bounce?: string; mode?: string }>();
  const showSignupBanner = params.bounce === 'signup';

  const [countryCode] = React.useState('+1');
  const [digits, setDigits] = React.useState('');
  const [mode, setMode] = React.useState<FanOtpPurpose>(
    params.mode === 'signup' ? 'fan_signup' : 'fan_signin',
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const cleanDigits = digits.replace(/\D/g, '');
  const canSubmit = cleanDigits.length >= 7;

  const handleContinue = async () => {
    if (!canSubmit || loading) return;
    const phoneNumber = `${countryCode}${cleanDigits}`;
    setLoading(true);
    setError(null);
    const res = await fanAuthedApi.requestOtp({
      phoneNumber,
      purpose: mode,
    });
    setLoading(false);
    if (!res) {
      setError('Could not send code. Check your number and try again.');
      return;
    }
    router.push({
      pathname: '/fan/signin/code',
      params: {
        phoneNumber,
        purpose: mode,
        debugCode: res.debugCode ?? '',
      },
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
          <Text style={styles.title}>
            {mode === 'fan_signup' ? 'Sign up' : 'Sign in'}
          </Text>
          <Text style={styles.subtitle}>
            Enter your phone number to get a verification code.
          </Text>

          {showSignupBanner ? (
            <View style={styles.banner}>
              <Ionicons name="information-circle-outline" size={18} color={ACCENT} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>First time on Proslync?</Text>
                <Text style={styles.bannerBody}>
                  This number isn't registered yet.
                </Text>
              </View>
              <Pressable
                onPress={() => setMode('fan_signup')}
                style={styles.bannerCta}
                accessibilityRole="button"
              >
                <Text style={styles.bannerCtaText}>Sign up</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <View style={styles.countryPill}>
              <Text style={styles.countryText}>{countryCode}</Text>
            </View>
            <TextInput
              style={styles.input}
              value={digits}
              onChangeText={setDigits}
              placeholder="555 123 4567"
              placeholderTextColor={TEXT_TERTIARY}
              keyboardType="phone-pad"
              autoFocus
              maxLength={15}
              editable={!loading}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[
              styles.cta,
              (!canSubmit || loading) && styles.ctaDisabled,
            ]}
            onPress={handleContinue}
            disabled={!canSubmit || loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.ctaText}>Continue</Text>
            )}
          </Pressable>

          {mode === 'fan_signin' && !showSignupBanner ? (
            <Pressable
              onPress={() => setMode('fan_signup')}
              style={styles.toggleLink}
              accessibilityRole="button"
            >
              <Text style={styles.toggleLinkText}>
                Don't have an account?{' '}
                <Text style={{ color: ACCENT, fontWeight: '700' }}>Sign up</Text>
              </Text>
            </Pressable>
          ) : null}

          {mode === 'fan_signup' ? (
            <Pressable
              onPress={() => setMode('fan_signin')}
              style={styles.toggleLink}
              accessibilityRole="button"
            >
              <Text style={styles.toggleLinkText}>
                Already have an account?{' '}
                <Text style={{ color: ACCENT, fontWeight: '700' }}>Sign in</Text>
              </Text>
            </Pressable>
          ) : null}
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(255,111,60,0.10)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.35)',
    marginBottom: 20,
  },
  bannerTitle: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '700',
  },
  bannerBody: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    marginTop: 1,
  },
  bannerCta: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: ACCENT,
    borderRadius: 12,
  },
  bannerCtaText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  countryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
  },
  countryText: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 14,
  },
  input: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 16,
    height: '100%',
  },
  errorText: {
    color: '#ef4444',
    marginTop: 10,
    fontSize: 13,
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
  toggleLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleLinkText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
  },
});
