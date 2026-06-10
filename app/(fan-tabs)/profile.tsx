import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import FanProfile from '@/components/fan/fan-profile';
import { LinkedRolesPanel } from '@/components/fan/linked-roles-panel';
import { useModeSwitch } from '@/hooks/fan/use-mode-switch';
import { useFanAuth } from '@/lib/providers/fan-auth-provider';

// Phase 2 — fan-mode Account tab.
// State branches:
//   • loading        → centered spinner while we validate the stored token
//   • unauthenticated→ "Sign in / Sign up" card routing to /fan/signin/phone
//   • authenticated  → wrap the existing <FanProfile />, add a "Sign out"
//                      button, plus the mode-switcher seed (disabled until
//                      identity_links.pro_user_id is set).
export default function FanProfileTab() {
  const router = useRouter();
  const { state, signOut } = useFanAuth();
  const { switchToProMode } = useModeSwitch();

  if (state.status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="rgba(255,255,255,0.4)" />
      </View>
    );
  }

  if (state.status === 'unauthenticated') {
    return (
      <UnauthenticatedView
        onSignIn={() => router.push('/fan/signin/phone')}
        onSignUp={() => router.push('/fan/signin/phone?mode=signup')}
      />
    );
  }

  // Phase 5 — render LinkedRolesPanel + Sign out inside FanProfile's scroll
  // content (via `footer`) so they live below existing sections instead of
  // floating over them. P2 (Argent QA iter1) — the prior `position: absolute`
  // overlay sat on top of the Pick'em Record / Favorite Teams rows.
  const footer = (
    <>
      <LinkedRolesPanel
        identityLink={state.identityLink}
        onAddProRole={() => router.push('/fan/link-pro')}
        onSwitchToProMode={switchToProMode}
      />

      <Pressable
        style={[styles.switcher, styles.signOut]}
        onPress={() => {
          void signOut();
        }}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <View style={styles.switcherIcon}>
          <Ionicons name="log-out-outline" size={16} color="rgba(255,255,255,0.65)" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.signOutTitle}>Sign out</Text>
          <Text style={styles.switcherSub}>
            @{state.fanUser.handle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.35)" />
      </Pressable>
    </>
  );

  return (
    <View style={styles.container}>
      <FanProfile footer={footer} />
    </View>
  );
}

function UnauthenticatedView({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  return (
    <View style={styles.unauthBg}>
      <View style={styles.unauthCard}>
        <View style={styles.unauthBadge}>
          <Ionicons name="person-circle-outline" size={28} color="#FFF" />
        </View>
        <Text style={styles.unauthTitle}>Join the conversation</Text>
        <Text style={styles.unauthBody}>
          Sign in or create a fan account to post, follow, and join the home feed.
        </Text>
        <Pressable
          style={styles.primaryCta}
          onPress={onSignIn}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          <Text style={styles.primaryCtaText}>Sign in</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryCta}
          onPress={onSignUp}
          accessibilityRole="button"
          accessibilityLabel="Sign up"
        >
          <Text style={styles.secondaryCtaText}>Create account</Text>
        </Pressable>
      </View>
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
  },
  unauthBg: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  unauthCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
  },
  unauthBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  unauthTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  unauthBody: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryCta: {
    width: '100%',
    backgroundColor: '#EB621A',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryCtaText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryCta: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  secondaryCtaText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Authed-view floating CTA stack.
  switcherWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 220,
    zIndex: 80,
    gap: 8,
  },
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    opacity: 0.95,
  },
  signOut: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  switcherIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switcherTitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '700',
  },
  signOutTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  switcherSub: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 11,
    marginTop: 2,
  },
});
