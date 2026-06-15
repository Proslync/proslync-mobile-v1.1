// components/collective/collective-profile.tsx
// ── COLLECTIVE PROFILE — TRUST CARD ───────────────────────────────────────
// Charter §E — trust card (mirror brand-profile structure: GlassBlock +
// banner/avatar chrome). Four sections:
//   1. AE-HONEST BADGE BLOCK (amber-toned, not hidden)
//   2. PAYMENT RELIABILITY (athlete-confirmed truth)
//   3. FAN COMMERCE (receipted supporters + perk fulfillment)
//   Muted footer: athlete ledger note.
// Banner/avatar chrome: video-free (same pattern as nilManager in
// PROFILE_MEDIA — KIYAN_BANNER fallback, kiyan-avatar).

import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import { PROFILE_MEDIA } from '@/lib/profile-media';
import { IdentityAvatar } from '@/components/shared/identity-avatar';
import { personaFor } from '@/lib/demo/personas';

const TAB_BAR_TOP_FROM_BOTTOM = 90;
const GREEN = '#34C759';
const AMBER = '#FFD60A';
const MUTED = 'rgba(255,255,255,0.50)';
const HAIRLINE = 'rgba(255,255,255,0.08)';

// ── GlassBlock — flat solid card (matches athlete media-kit-card) ─────────

function GlassBlock({ children }: { children: React.ReactNode }) {
  return (
    <View style={gb.block}>{children}</View>
  );
}

const gb = StyleSheet.create({
  block: {
    gap: 10,
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  blockGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
});

// ── Trust card content ────────────────────────────────────────────────────

function TrustCard() {
  return (
    <View style={tc.wrapper}>

      {/* 1. AE-HONEST BADGE BLOCK */}
      <GlassBlock>
        <View style={tc.blockLabelRow}>
          <Text style={tc.blockLabel}>ASSOCIATED ENTITY STATUS</Text>
        </View>

        {/* AE badge — amber, not hidden */}
        <View style={tc.aeBadgeRow}>
          <View style={tc.aeBadge}>
            <Ionicons name="alert-circle" size={16} color={AMBER} />
            <Text style={tc.aeBadgeText}>ASSOCIATED ENTITY — DOCUMENTED</Text>
          </View>
        </View>

        <View style={tc.tabularBlock}>
          <View style={tc.tabularRow}>
            <Text style={tc.tabularLabel}>Business purpose documented</Text>
            <Text style={[tc.tabularValue, { color: GREEN }]}>34 / 34 ✓</Text>
          </View>
          <View style={[tc.tabularRow, tc.tabularRowBorder]}>
            <Text style={tc.tabularLabel}>First-pass clearance</Text>
            <Text style={tc.tabularValue}>91%</Text>
          </View>
          <View style={[tc.tabularRow, tc.tabularRowBorder]}>
            <Text style={tc.tabularLabel}>Arbitrations involving us</Text>
            <Text style={[tc.tabularValue, { color: GREEN }]}>0 / 21</Text>
          </View>
        </View>
      </GlassBlock>

      {/* 2. PAYMENT RELIABILITY */}
      <GlassBlock>
        <View style={tc.blockLabelRow}>
          <Text style={tc.blockLabel}>PAYMENT RELIABILITY</Text>
        </View>

        <View style={tc.reliabilityBadgeRow}>
          <Ionicons name="checkmark-circle" size={20} color={GREEN} />
          <Text style={tc.reliabilityBadge}>RELIABLE PAYER ✓</Text>
        </View>

        <View style={tc.tabularBlock}>
          <View style={tc.tabularRow}>
            <Text style={tc.tabularLabel}>Athletes fully paid</Text>
            <Text style={tc.tabularValue}>34 / 34</Text>
          </View>
          <View style={[tc.tabularRow, tc.tabularRowBorder]}>
            <Text style={tc.tabularLabel}>Median days to pay</Text>
            <Text style={tc.tabularValue}>4 days</Text>
          </View>
          <View style={[tc.tabularRow, tc.tabularRowBorder]}>
            <Text style={tc.tabularLabel}>Escrow-funded before work</Text>
            <Text style={tc.tabularValue}>100%</Text>
          </View>
        </View>

        <Text style={tc.athleteTruthNote}>
          Athlete-confirmed payment truth — sourced from individual ledgers.
        </Text>
      </GlassBlock>

      {/* 3. FAN COMMERCE */}
      <GlassBlock>
        <View style={tc.blockLabelRow}>
          <Text style={tc.blockLabel}>FAN COMMERCE</Text>
        </View>

        <View style={tc.tabularBlock}>
          <View style={tc.tabularRow}>
            <Text style={tc.tabularLabel}>Receipted supporters</Text>
            <Text style={tc.tabularValue}>1,250</Text>
          </View>
          <View style={[tc.tabularRow, tc.tabularRowBorder]}>
            <Text style={tc.tabularLabel}>Monthly receipted revenue</Text>
            <Text style={tc.tabularValue}>$14,800/mo</Text>
          </View>
          <View style={[tc.tabularRow, tc.tabularRowBorder]}>
            <Text style={tc.tabularLabel}>Perk fulfillment median</Text>
            <Text style={tc.tabularValue}>2.1d</Text>
          </View>
        </View>
      </GlassBlock>

      {/* Muted footer */}
      <View style={tc.footerRow}>
        <Ionicons name="lock-closed" size={13} color={MUTED} />
        <Text style={tc.footerText}>
          Athlete deals route through their own ledger — we fund, they own the record.
        </Text>
      </View>

    </View>
  );
}

const tc = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },

  blockLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
  },

  // AE badge — amber, prominent
  aeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: `${AMBER}12`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${AMBER}44`,
  },
  aeBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: AMBER,
    letterSpacing: 0.2,
  },

  // Tabular block
  tabularBlock: {
    gap: 0,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  tabularRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  tabularRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
  tabularLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
  },
  tabularValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },

  // Payment reliability
  reliabilityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  reliabilityBadge: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  athleteTruthNote: {
    fontSize: 10,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 14,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 15,
  },
});

// ── Root component ────────────────────────────────────────────────────────

export default function CollectiveProfile() {
  const insets = useSafeAreaInsets();
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);

  const media = PROFILE_MEDIA['collective'] ?? PROFILE_MEDIA['nilManager'] ?? PROFILE_MEDIA['player'];
  const persona = personaFor('collective');

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner — collective persona gradient (no video for collective) */}
        <View
          style={[styles.bannerWrap, { height: insets.top + 290 }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[persona.bannerColors[0], persona.bannerColors[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0,0,0,0.20)' },
            ]}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)', '#000']}
            locations={[0.55, 0.82, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>

        {/* Trust card content */}
        <TrustCard />
      </ScrollView>

      {/* Bottom fade */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[
          styles.bottomFade,
          { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 100 },
        ]}
        pointerEvents="none"
      />

      {/* Top-left floating profile pill */}
      <Pressable
        style={[styles.topLeftProfilePill, { top: insets.top + 8 }]}
        onPress={() => setRoleSheetVisible(true)}
        accessibilityLabel="Open menu"
        accessibilityRole="button"
      >
        <View style={styles.topLeftProfilePillGlass} pointerEvents="none">
          <GlassView
            glassEffectStyle="regular"
            style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
          />
        </View>
        {media.avatar ? (
          <Image source={media.avatar} style={styles.topLeftProfilePillAvatar} />
        ) : (
          <IdentityAvatar
            name={persona.displayName}
            size={40}
            accent={persona.accent}
          />
        )}
        <Ionicons name="menu" size={22} color="#FFF" style={{ marginLeft: 8 }} />
      </Pressable>

      <RoleSwitcherSheet
        visible={roleSheetVisible}
        onClose={() => setRoleSheetVisible(false)}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#000' },
  bottomFade: { position: 'absolute', left: 0, right: 0, zIndex: 99 },

  topLeftProfilePill: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingLeft: 3,
    paddingRight: 12,
    borderRadius: 23,
    overflow: 'hidden',
    zIndex: 100,
  },
  topLeftProfilePillGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 23,
    overflow: 'hidden',
  },
  topLeftProfilePillAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
