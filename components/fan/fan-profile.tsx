// components/fan/fan-profile.tsx
// ── FAN PROFILE — charter rebuild 2026-06-11 ─────────────────────────────
// Charter law: SUPPORTER IDENTITY CARD, not engagement stats.
// SECTIONS: Supporter Card (hero) · Segment chips · Roster Supported · Perks Redeemed
// Banner/avatar chrome + persistence PRESERVED (banner video pick/remove/AsyncStorage).
// footer prop PRESERVED (profile.tsx injects LinkedRolesPanel + Sign out).
// UNMOUNTED (not deleted): spend totals, ranks, picks record, teams, bio,
//   leaderboard, activity feed, claimed-perks points ledger.
//   Orphaned vars _ prefixed.
// No animations (charter). Tabular numerals on counts.

import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import * as React from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useVideoPlayer, VideoView } from 'expo-video';

import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import { PROFILE_MEDIA } from '@/lib/profile-media';
import { IdentityAvatar } from '@/components/shared/identity-avatar';
import { personaFor } from '@/lib/demo/personas';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FAN_FOLLOWING,
  FAN_PERKS as _FAN_PERKS,
  FAN_PROFILE,
} from '@/lib/data/mock-fan-data';
import { healLocalMediaUri } from '@/lib/media/local-media';

// Note: LinearGradient is now imported at the top of the file.
import Animated, { FadeInDown as _FadeInDown, useAnimatedStyle as _useAnimatedStyle, useSharedValue as _useSharedValue, withTiming as _withTiming } from 'react-native-reanimated';

// ── Charter constants ─────────────────────────────────────────────────────
const ACCENT = '#C79AA5'; // FAN_ACCENT (rose)
const CARD_BG = '#1C1C1E';
const CARD_BORDER = 'rgba(255,255,255,0.07)';
const MUTED = 'rgba(255,255,255,0.50)';
const GREEN = '#34C759';
const TAB_BAR_TOP_FROM_BOTTOM = 90;

// ── Fixture: supporter pass cards ────────────────────────────────────────
// In production these come from AsyncStorage via loadPasses().
// For profile demo we show a static fixture since the home tab owns the live data.
const FIXTURE_PASSES = [
  {
    athleteId: 'kiyan-anthony',
    athleteName: 'Kiyan A.',
    tier: 'insider' as const,
    startedAtISO: '2026-06-01T00:00:00Z',
    supporterNumber: 15,
  },
];

// ── Fixture: segment options ──────────────────────────────────────────────
const SEGMENTS = ['Student', 'Alum', 'Family', 'Local business'] as const;
type Segment = (typeof SEGMENTS)[number];

// ── Unmounted types (kept to suppress lint on unused import in the module) ─
type _TabKey = 'about' | 'following' | 'activity' | 'perks';

// ── Helpers ───────────────────────────────────────────────────────────────

function tierLabel(tier: 'fan' | 'insider' | 'courtside'): string {
  switch (tier) {
    case 'fan': return 'FAN';
    case 'insider': return 'INSIDER';
    case 'courtside': return 'COURTSIDE';
  }
}

// ── Section header ────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionBar} />
      <Text style={s.sectionLabel}>{label}</Text>
    </View>
  );
}

// ── SECTION 1: SUPPORTER CARD (hero) ─────────────────────────────────────

function SupporterCardSection() {
  return (
    <View style={s.card}>
      <SectionHeader label="SUPPORTER CARD" />
      {FIXTURE_PASSES.map((pass, idx) => {
        const sinceLabel = (() => {
          try {
            return new Date(pass.startedAtISO).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            });
          } catch {
            return '';
          }
        })();
        return (
          <View key={pass.athleteId} style={[s.passRow, idx > 0 && s.passRowBorder]}>
            <View style={s.passLeft}>
              <Text style={s.passAthleteName}>{pass.athleteName.toUpperCase()}</Text>
              <Text style={s.passSince}>since {sinceLabel}</Text>
            </View>
            <View style={s.passTierChip}>
              <Text style={s.passTierText}>{tierLabel(pass.tier)}</Text>
            </View>
          </View>
        );
      })}
      <View style={s.supporterNumRow}>
        <Text style={s.supporterNumLabel}>Supporter</Text>
        <Text style={s.supporterNum}>#15</Text>
      </View>
    </View>
  );
}

// ── SECTION 2: SEGMENT chips ──────────────────────────────────────────────

function SegmentSection() {
  const [selected, setSelected] = React.useState<Segment>('Local business');
  return (
    <View style={s.card}>
      <SectionHeader label="SEGMENT" />
      <View style={s.segmentRow}>
        {SEGMENTS.map((seg) => {
          const active = selected === seg;
          return (
            <Pressable
              key={seg}
              style={[s.segmentChip, active && s.segmentChipActive]}
              onPress={() => setSelected(seg)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={seg}
            >
              <Text style={[s.segmentChipText, active && s.segmentChipTextActive]}>
                {seg}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {selected === 'Local business' && (
        <View style={s.businessLeadRow}>
          <Ionicons name="storefront-outline" size={14} color={MUTED} />
          <Text style={s.businessLeadText}>
            Own a business? Run a real campaign with athletes — Brand account
          </Text>
        </View>
      )}
    </View>
  );
}

// ── SECTION 3: ROSTER SUPPORTED ──────────────────────────────────────────

function RosterSupportedSection() {
  // Use following list for chips — real integration would filter by supporter passes
  const roster = FAN_FOLLOWING.slice(0, 5);
  return (
    <View style={s.card}>
      <SectionHeader label="ROSTER SUPPORTED" />
      <View style={s.rosterRow}>
        {roster.map((a) => (
          <View key={a.id} style={s.rosterChip}>
            <View
              style={[
                s.rosterChipDot,
                { backgroundColor: `${a.avatarColor}44` },
              ]}
            />
            <Text style={s.rosterChipText}>{a.name.split(' ')[0]} {a.name.split(' ')[1]?.[0] ?? ''}.</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── SECTION 4: PERKS REDEEMED ────────────────────────────────────────────

function PerksRedeemedSection() {
  return (
    <View style={s.card}>
      <SectionHeader label="PERKS REDEEMED" />
      <View style={s.perksRedeemedRow}>
        <View style={s.perksRedeemedStat}>
          <Ionicons name="checkmark-circle" size={16} color={GREEN} />
          <Text style={s.perksRedeemedValue}>7</Text>
          <Text style={s.perksRedeemedLabel}>perks redeemed</Text>
        </View>
        <View style={s.perksRedeemedDivider} />
        <View style={s.perksRedeemedStat}>
          <Ionicons name="megaphone-outline" size={16} color={MUTED} />
          <Text style={s.perksRedeemedValue}>2</Text>
          <Text style={s.perksRedeemedLabel}>shoutouts delivered</Text>
        </View>
      </View>
    </View>
  );
}

// ── Root component ────────────────────────────────────────────────────────

export interface FanProfileProps {
  /** Injected footer (LinkedRolesPanel + sign-out from profile.tsx) */
  footer?: React.ReactNode;
}

export default function FanProfile({ footer }: FanProfileProps) {
  const insets = useSafeAreaInsets();
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);

  // ── Unmounted state (kept for future re-enable without re-archaeology) ──
  // const _tab = React.useState<_TabKey>('about');
  // const _expanded = React.useState<Set<string>>(new Set(['origin']));

  // ── Persistent custom banner video (PRESERVED) ────────────────────────
  const [bannerVideo, setBannerVideo] = React.useState<string | null>(null);
  const [bannerHydrated, setBannerHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem('proslync:fan-profile:bannerVideo:v1')
      .then(async (v) => {
        if (cancelled || !v) return;
        const healed = await healLocalMediaUri(v);
        if (!cancelled && healed) setBannerVideo(healed);
        else if (!healed) AsyncStorage.removeItem('proslync:fan-profile:bannerVideo:v1').catch(() => {});
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBannerHydrated(true); });
    return () => { cancelled = true; };
  }, []);
  React.useEffect(() => {
    if (!bannerHydrated) return;
    if (bannerVideo) {
      AsyncStorage.setItem('proslync:fan-profile:bannerVideo:v1', bannerVideo).catch(() => {});
    } else {
      AsyncStorage.removeItem('proslync:fan-profile:bannerVideo:v1').catch(() => {});
    }
  }, [bannerVideo, bannerHydrated]);

  const media = PROFILE_MEDIA.fan;
  const effectiveBannerVideo = bannerVideo ?? media.bannerVideo ?? null;

  const bannerPlayer = useVideoPlayer(effectiveBannerVideo, (p) => {
    if (!p) return;
    p.loop = true;
    p.muted = true;
    p.play();
  });

  React.useEffect(() => {
    if (!bannerPlayer || !effectiveBannerVideo) return;
    bannerPlayer.play();
    const sub = bannerPlayer.addListener('playingChange', (e: any) => {
      if (!e?.isPlaying) {
        try { bannerPlayer.play(); } catch {}
      }
    });
    return () => { try { sub.remove(); } catch {} };
  }, [bannerPlayer, effectiveBannerVideo]);

  const pickBannerVideo = React.useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access in Settings to pick a video.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const src = result.assets[0].uri;
      let persistedUri = src;
      try {
        const dir = `${FileSystem.documentDirectory}proslync-media/profile-banner/`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const ext = (src.split('?')[0].split('.').pop() || 'mp4').toLowerCase();
        const safeExt = /^[a-z0-9]{2,4}$/.test(ext) ? ext : 'mp4';
        const dest = `${dir}${Date.now()}.${safeExt}`;
        await FileSystem.copyAsync({ from: src, to: dest });
        persistedUri = dest;
      } catch {
        // Fall back to original URI if copy fails.
      }
      setBannerVideo(persistedUri);
    }
  }, []);

  const removeBannerVideo = React.useCallback(() => {
    setBannerVideo(null);
  }, []);

  // Suppress unused-import warnings for unmounted visual helpers
  void _FadeInDown;
  void Animated;
  void _useAnimatedStyle;
  void _useSharedValue;
  void _withTiming;
  void _FAN_PERKS;

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner — fan persona gradient or custom video */}
        {(() => {
          const persona = personaFor('fan');
          return (
            <View style={[s.bannerWrap, { height: insets.top + 290 }]} pointerEvents="none">
              {effectiveBannerVideo ? (
                <VideoView
                  player={bannerPlayer}
                  style={{ position: 'absolute', top: -15, left: -3, width: 420, height: 320 }}
                  contentFit="cover"
                  nativeControls={false}
                />
              ) : (
                <LinearGradient
                  colors={[persona.bannerColors[0], persona.bannerColors[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              )}
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.20)' }]}
                pointerEvents="none"
              />
            </View>
          );
        })()}

        {/* Identity header row — persona name + tagline (no score, no rank) */}
        {(() => {
          const persona = personaFor('fan');
          return (
            <View style={s.identityRow}>
              <Text style={s.identityName}>{persona.displayName}</Text>
              <View style={s.identityMeta}>
                <Text style={s.identityMetaText}>{persona.handle}</Text>
                <Text style={s.identityMetaText}>{persona.tagline}</Text>
              </View>
            </View>
          );
        })()}

        {/* Charter content sections */}
        <View style={s.sections}>
          <SupporterCardSection />
          <SegmentSection />
          <RosterSupportedSection />
          <PerksRedeemedSection />

          {/* Injected footer (LinkedRolesPanel + Sign out from profile.tsx) */}
          {footer}
        </View>
      </ScrollView>

      {/* Bottom fade */}
      <View
        style={[s.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 100 }]}
        pointerEvents="none"
      />

      {/* Top-left floating profile pill — avatar + hamburger (PRESERVED chrome) */}
      <Pressable
        style={[s.topLeftProfilePill, { top: insets.top + 8 }]}
        onPress={() => setRoleSheetVisible(true)}
        accessibilityLabel="Open menu"
        accessibilityRole="button"
      >
        <View style={s.topLeftProfilePillGlass} pointerEvents="none">
          <GlassView
            glassEffectStyle="regular"
            style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
          />
        </View>
        {media.avatar ? (
          <Image
            source={media.avatar}
            style={s.topLeftProfilePillAvatar}
          />
        ) : (
          <IdentityAvatar
            name={personaFor('fan').displayName}
            size={40}
            accent={personaFor('fan').accent}
          />
        )}
        <Ionicons name="menu" size={22} color="#FFF" style={{ marginLeft: 8 }} />
      </Pressable>

      <RoleSwitcherSheet
        visible={roleSheetVisible}
        onClose={() => setRoleSheetVisible(false)}
        onChangeBanner={pickBannerVideo}
        onRemoveBanner={removeBannerVideo}
        hasCustomBanner={!!bannerVideo}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#000' },

  // Identity header (below banner)
  identityRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 6,
  },
  identityName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.4,
  },
  identityMeta: {
    gap: 2,
  },
  identityMetaText: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 18,
  },

  // Section shell
  sections: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
    paddingBottom: 8,
  },

  // Card container
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },

  // Section header: accent bar + caps label
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionBar: {
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: ACCENT,
  },

  // Supporter card
  passRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 10,
  },
  passRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  passLeft: {
    flex: 1,
    gap: 3,
  },
  passAthleteName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  passSince: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
  },
  passTierChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: `${'#C79AA5'}18`,
    borderWidth: 1,
    borderColor: `${'#C79AA5'}44`,
  },
  passTierText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: ACCENT,
  },
  supporterNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
    paddingTop: 10,
  },
  supporterNumLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
  },
  supporterNum: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },

  // Segment chips
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  segmentChipActive: {
    borderColor: `${'#C79AA5'}66`,
    backgroundColor: `${'#C79AA5'}18`,
  },
  segmentChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
  },
  segmentChipTextActive: {
    color: ACCENT,
    fontWeight: '800',
  },
  businessLeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
    paddingTop: 10,
  },
  businessLeadText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
    lineHeight: 17,
  },

  // Roster supported
  rosterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rosterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  rosterChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rosterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.80)',
  },

  // Perks redeemed
  perksRedeemedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perksRedeemedStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perksRedeemedDivider: {
    width: 1,
    height: 24,
    backgroundColor: CARD_BORDER,
    marginHorizontal: 12,
  },
  perksRedeemedValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  perksRedeemedLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    flex: 1,
    lineHeight: 14,
  },

  // Bottom fade
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: 'transparent',
  },

  // Top-left floating profile pill (PRESERVED chrome)
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
