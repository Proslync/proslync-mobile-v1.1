// ── Fan Signup — Handle Picker Step ────────────────────────
// Phase 2 — final step of the `fan_signup` flow. Collects a handle
// + display name and calls `fanAuthedApi.verifyOtp` with
// `purpose='fan_signup'` to mint the account. Handle availability
// is debounced-checked against `/api/fan/users/check-handle/:handle`.

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

const BG = '#0a0a0f';
const ACCENT = '#EB621A';
const SUCCESS = '#22c55e';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = 'rgba(255,255,255,0.6)';
const TEXT_TERTIARY = 'rgba(255,255,255,0.4)';
const BORDER = 'rgba(255,255,255,0.10)';

const HANDLE_REGEX = /^[a-z0-9_]{3,20}$/;

export default function FanSignupHandleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useFanAuth();
  const params = useLocalSearchParams<{ phoneNumber?: string; code?: string }>();
  const phoneNumber = params.phoneNumber ?? '';
  const code = params.code ?? '';

  const [handle, setHandle] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [checking, setChecking] = React.useState(false);
  const [available, setAvailable] = React.useState<boolean | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const normalizedHandle = handle.trim().toLowerCase();
  const handleFormatValid = HANDLE_REGEX.test(normalizedHandle);

  // Debounced availability check.
  React.useEffect(() => {
    if (!handleFormatValid) {
      setAvailable(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await fanAuthedApi.checkHandleAvailable(normalizedHandle);
      if (cancelled) return;
      setAvailable(res.available);
      setChecking(false);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedHandle, handleFormatValid]);

  const canSubmit =
    handleFormatValid &&
    available === true &&
    displayName.trim().length >= 1 &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const res = await fanAuthedApi.verifyOtp({
      phoneNumber,
      code,
      purpose: 'fan_signup',
      proposedHandle: normalizedHandle,
      displayName: displayName.trim(),
    });
    setSubmitting(false);
    if (!res) {
      setError('Could not create your account. Please try again.');
      return;
    }
    await signIn(
      { accessToken: res.accessToken, refreshToken: res.refreshToken },
      res.fanUser,
      res.identityLink,
    );
    router.replace('/(fan-tabs)');
  };

  const helperText = !normalizedHandle
    ? 'Letters, numbers, and underscores. 3–20 characters.'
    : !handleFormatValid
      ? 'Use only letters, numbers, and underscores (3–20 chars).'
      : checking
        ? 'Checking…'
        : available === false
          ? `@${normalizedHandle} is taken.`
          : available === true
            ? `@${normalizedHandle} is available.`
            : '';

  const helperColor = !handleFormatValid
    ? TEXT_TERTIARY
    : available === false
      ? '#ef4444'
      : available === true
        ? SUCCESS
        : TEXT_TERTIARY;

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
          <Text style={styles.title}>Pick your handle</Text>
          <Text style={styles.subtitle}>
            This is how other fans will find you on Proslync.
          </Text>

          <Text style={styles.label}>Handle</Text>
          <View style={styles.handleRow}>
            <Text style={styles.handlePrefix}>@</Text>
            <TextInput
              style={styles.handleInput}
              value={handle}
              onChangeText={(v) => setHandle(v.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="yourname"
              placeholderTextColor={TEXT_TERTIARY}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              maxLength={20}
              editable={!submitting}
            />
            {checking ? (
              <ActivityIndicator size="small" color={TEXT_TERTIARY} />
            ) : available === true ? (
              <Ionicons name="checkmark-circle" size={18} color={SUCCESS} />
            ) : available === false ? (
              <Ionicons name="close-circle" size={18} color="#ef4444" />
            ) : null}
          </View>
          {helperText ? (
            <Text style={[styles.helper, { color: helperColor }]}>
              {helperText}
            </Text>
          ) : null}

          <Text style={[styles.label, { marginTop: 18 }]}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={TEXT_TERTIARY}
            maxLength={48}
            editable={!submitting}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.cta, !canSubmit && styles.ctaDisabled]}
            disabled={!canSubmit}
            onPress={handleSubmit}
            accessibilityRole="button"
          >
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.ctaText}>Done</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
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
  label: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    gap: 4,
  },
  handlePrefix: {
    color: TEXT_TERTIARY,
    fontSize: 16,
    fontWeight: '700',
  },
  handleInput: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 16,
    height: '100%',
  },
  helper: {
    marginTop: 6,
    fontSize: 12,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: TEXT_PRIMARY,
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 12,
    fontSize: 13,
  },
  cta: {
    marginTop: 24,
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
});
