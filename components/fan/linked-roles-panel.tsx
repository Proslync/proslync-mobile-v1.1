// ── PROSLYNC PHASE 5: <LinkedRolesPanel /> ─────────────────
// Rendered inside the fan Account tab. Two states:
//
//   1. No linked pro role → "Add a pro role" CTA → /fan/link-pro
//   2. Linked pro role    → "Switch to pro mode" CTA → flips
//      RoleProvider mode + replaces the route to the pro shell.
//
// The aesthetic matches the rest of fan-profile.tsx (translucent
// glass-card on a black surface, FF6F3C accent for primary CTAs).

import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IdentityLink } from '@/lib/types/fan.types';

const ACCENT = '#EB621A';

export interface LinkedRolesPanelProps {
  identityLink: IdentityLink;
  onAddProRole: () => void;
  onSwitchToProMode: () => void;
}

function hasLinkedProUser(link: IdentityLink): boolean {
  if (link.hasLinkedProUser === true) return true;
  return link.proUserId != null && link.proUserId !== '' && link.proUserId !== 0;
}

export function LinkedRolesPanel(props: LinkedRolesPanelProps): React.JSX.Element {
  const { identityLink, onAddProRole, onSwitchToProMode } = props;
  const linked = hasLinkedProUser(identityLink);
  const handle = identityLink.handle ? `@${identityLink.handle}` : null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <Ionicons
            name={linked ? 'shield-checkmark-outline' : 'add-circle-outline'}
            size={16}
            color={linked ? '#34C759' : ACCENT}
          />
        </View>
        <Text style={styles.title}>Linked accounts</Text>
      </View>

      <Text style={styles.body}>
        {linked
          ? `Linked to a pro account${handle ? ` · ${handle}` : ''}.`
          : 'No pro role linked yet.'}
      </Text>

      {linked ? (
        <Pressable
          style={styles.primaryCta}
          onPress={onSwitchToProMode}
          accessibilityRole="button"
          accessibilityLabel="Switch to pro mode"
        >
          <Ionicons name="swap-horizontal" size={16} color="#000" />
          <Text style={styles.primaryCtaText}>Switch to pro mode</Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.secondaryCta}
          onPress={onAddProRole}
          accessibilityRole="button"
          accessibilityLabel="Add a pro role"
        >
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={styles.secondaryCtaText}>Add a pro role</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  body: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12.5,
    lineHeight: 17,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 12,
    backgroundColor: ACCENT,
    marginTop: 4,
  },
  primaryCtaText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginTop: 4,
  },
  secondaryCtaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default LinkedRolesPanel;
