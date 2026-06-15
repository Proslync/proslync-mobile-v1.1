// ── PROSLYNC PHASE 5: /fan/link-pro ────────────────────────
// Fan-mode entry point for "Add a pro role". Lists the six pro-role
// proposals as cards. Tap → confirm → POST /api/auth/link/pro-role
// (with the FAN bearer) → on success, hydrate pro keychain + flip
// RoleProvider into pro mode + replace to /(tabs).
//
// Notes
// - The endpoint is gated by `requireFanAuth`, so we don't need a pro
//   session here; we DO need an authenticated fan session.
// - `proposedHandle` defaults to the fan's existing identity-link
//   handle so the pro account inherits the same display handle. A
//   future slice could let the user pick a different one.

import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFanAuth } from '@/lib/providers/fan-auth-provider';
import { useMode, useRole } from '@/lib/providers/role-provider';
import { fanAuthedApi, type ProRoleProposal } from '@/lib/api/fan/authed';

const ACCENT = '#EB621A';

interface RoleCardSpec {
  role: ProRoleProposal;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  blurb: string;
}

const ROLE_CARDS: RoleCardSpec[] = [
  {
    role: 'player',
    label: 'Player',
    icon: 'basketball-outline',
    blurb: 'Athletes — manage your profile, deals, and direct-to-fan posts.',
  },
  {
    role: 'brand',
    label: 'Brand',
    icon: 'storefront-outline',
    blurb: 'Brands and agencies — discover athletes, originate NIL deals, and sponsor activations.',
  },
  {
    role: 'agent',
    label: 'Agent',
    icon: 'briefcase-outline',
    blurb: 'Agents — represent rosters of athletes and broker deals on their behalf.',
  },
  {
    role: 'school',
    label: 'School',
    icon: 'school-outline',
    blurb: 'Athletic departments — oversight of school-affiliated athletes and NIL compliance.',
  },
  {
    role: 'coach',
    label: 'Coach',
    icon: 'clipboard-outline',
    blurb: 'Coaches — staff workflows and team-level signals.',
  },
];

export default function LinkProRoleScreen(): React.JSX.Element {
  const router = useRouter();
  const { state } = useFanAuth();
  const { setMode } = useMode();
  const { setRole } = useRole();
  const [busy, setBusy] = React.useState<ProRoleProposal | null>(null);

  // Guard: this screen only makes sense for an authenticated fan. If the
  // session is loading or dropped, bounce the user back. We don't redirect
  // to signin here because the parent (fan-tabs)/profile already does that
  // gating; this is the safe fallback.
  if (state.status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="rgba(255,255,255,0.6)" />
      </View>
    );
  }
  if (state.status === 'unauthenticated') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>You need a fan account first.</Text>
        <Pressable
          style={styles.primaryCta}
          onPress={() => router.replace('/(fan-tabs)/profile')}
          accessibilityRole="button"
          accessibilityLabel="Back to profile"
        >
          <Text style={styles.primaryCtaText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const proposedHandle = state.identityLink.handle || state.fanUser.handle;

  const onConfirm = (role: ProRoleProposal, label: string) => {
    if (busy) return;
    Alert.alert(
      `Add ${label} role?`,
      `You'll be able to switch between fan mode and ${label.toLowerCase()} mode from the Account tab.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: () => {
            void linkRole(role);
          },
        },
      ],
    );
  };

  const linkRole = async (role: ProRoleProposal) => {
    setBusy(role);
    try {
      const result = await fanAuthedApi.linkProRole({
        proposedRole: role,
        proposedHandle,
      });
      if (!result) {
        Alert.alert(
          'Could not add role',
          'The link request failed. Check your connection and try again.',
        );
        return;
      }
      // Flip provider state: choose a sensible default role for the pro
      // shell, then mode='pro'. Mode is set last because setRole on a
      // non-fan role already nudges mode='pro', and we want our explicit
      // setMode to win in case the provider drifts.
      // `nilManager` is a backend-only proposal value with no selectable
      // in-app profile role, so it never maps onto the role provider.
      if (role !== 'nilManager') setRole(role);
      setMode('pro');
      router.replace('/(tabs)');
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[link-pro] unexpected error', error);
      }
      Alert.alert(
        'Could not add role',
        'Something went wrong. Please try again.',
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Add a pro role',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#FFF',
          headerTitleStyle: { color: '#FFF', fontWeight: '700' },
        }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Pick the pro role you want to add to{' '}
          <Text style={styles.handleText}>@{proposedHandle}</Text>. You stay
          signed in as a fan; mode switching becomes available from your
          Account tab once linked.
        </Text>

        {ROLE_CARDS.map((card) => {
          const isBusy = busy === card.role;
          return (
            <Pressable
              key={card.role}
              style={[styles.roleCard, isBusy && styles.roleCardBusy]}
              onPress={() => onConfirm(card.role, card.label)}
              disabled={busy !== null}
              accessibilityRole="button"
              accessibilityLabel={`Add ${card.label} role`}
            >
              <View style={styles.roleIcon}>
                <Ionicons name={card.icon} size={20} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleLabel}>{card.label}</Text>
                <Text style={styles.roleBlurb}>{card.blurb}</Text>
              </View>
              {isBusy ? (
                <ActivityIndicator color="rgba(255,255,255,0.7)" />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="rgba(255,255,255,0.4)"
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  errorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 10,
  },
  intro: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 8,
  },
  handleText: {
    color: '#FFF',
    fontWeight: '700',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  roleCardBusy: {
    opacity: 0.6,
  },
  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,111,60,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: {
    color: '#FFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  roleBlurb: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  primaryCta: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: ACCENT,
  },
  primaryCtaText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
});
