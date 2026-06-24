// coach-profile.tsx
// ── COACH PROFILE — RECRUITING STOREFRONT ────────────────────────────────
// Charter §B — wiped to compliant recruiting storefront.
// Banner/avatar/identity chrome + Share button PRESERVED.
// Old tab content (bio essays, watchlist, staff, commits, results)
//   is UNMOUNTED — functions/data kept below with _ prefix.
// NO: individual athlete earnings, "you'll earn $X" claims, donation widgets,
//     direct-DM, dollar figures of any kind.
// SECTIONS: identity chips · program results · camps & clinics · contact

import { Ionicons, MaterialCommunityIcons as _MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVideoPlayer, VideoView } from 'expo-video';
import { persistLocalMedia, healLocalMediaUri, type LocalMedia } from '@/lib/media/local-media';
import { resolveSlotMedia } from '@/lib/media/resolve-media';
import Animated, {
  FadeIn as _FadeIn,
  FadeInDown as _FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Extrapolation,
} from 'react-native-reanimated';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStableRouter as _useStableRouter } from '@/hooks/use-stable-router';
import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import { PROFILE_MEDIA } from '@/lib/profile-media';
import { IdentityAvatar } from '@/components/shared/identity-avatar';
import { personaFor } from '@/lib/demo/personas';

const BANNER_KEY = 'proslync:coachprofile:banner:v2';
const BANNER_KEY_LEGACY = 'proslync:coachprofile:bannerVideo:v1';

const COPPER = '#EB621A';
const ACCENT = '#FF6F3C';        // kept for GlassView tints that use the old orange
const MUTED = 'rgba(255,255,255,0.50)';
const HAIRLINE = 'rgba(255,255,255,0.08)';
const CARD_BG_GLASS = 'rgba(0,0,0,0.55)';
const TAB_BAR_TOP_FROM_BOTTOM = 90;

// ── Identity data (charter: record, years, school — no earnings) ──────────
const COACH = {
  firstName: 'Glenn',
  lastName: 'Farello',
  username: 'coachfarello',
  metaPrimary: 'Head Coach · Paul VI Catholic',
  metaSecondary: 'Fairfax, VA · WCAC',
  record: '18–4',
  championships: '2x Conf. Champs',
  yearsCoaching: 14,
  school: 'Paul VI Catholic',
};

// ── Old profile data kept but UNMOUNTED (bio essays / watchlist / etc) ─────
const _OLD_BIO = [
  {
    key: 'philosophy',
    title: 'Coaching Philosophy',
    body: "Defense wins. Pace controls. Culture compounds.",
  },
  {
    key: 'career',
    title: 'Career Highlights',
    body: '318–82 career record over 14 seasons.',
  },
];

const _OLD_FOCUS = [
  { key: 'recruiting', title: 'Recruiting', body: "Class of '26 ranked top-5 nationally." },
  { key: 'devo', title: 'Player Development', body: 'Individual film sessions 2× a week per starter.' },
];

const _OLD_WATCHLIST = [
  { id: 'rec-1', name: 'Tre Johnson', position: 'PG', classYear: "HS '26" },
  { id: 'rec-2', name: 'Marcus Reyes', position: 'SF', classYear: "HS '26" },
];

const _OLD_STAFF = [
  { name: 'Ray Diggs', role: 'Associate Head Coach · Defense' },
  { name: 'Travis Smith', role: 'Assistant · Analytics' },
];

const _OLD_COMMITS = [
  { name: 'Jordan Miles', year: "'26", to: 'Duke', pos: 'SG' },
  { name: 'Marcus Reid', year: "'26", to: 'Villanova', pos: 'PG' },
];

const _OLD_RESULTS = [
  { date: 'Apr 19', opponent: 'DeMatha Catholic', result: 'W 74-68', note: 'WCAC semifinal' },
];

// ── Charter §B: no tabs — single scrollable storefront ───────────────────

// ── GlassBlock — flat solid card (matches athlete media-kit-card) ─────────
function GlassBlock({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.glassBlock}>{children}</View>
  );
}

export default function CoachProfile() {
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = React.useState(false);
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);

  // Persistent banner (image or video) — chrome preserved per charter.
  const [banner, setBanner] = React.useState<LocalMedia | null>(null);
  const [bannerHydrated, setBannerHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let next: LocalMedia | null = null;
        const v2 = await AsyncStorage.getItem(BANNER_KEY);
        if (v2) {
          next = JSON.parse(v2);
        } else {
          const v1 = await AsyncStorage.getItem(BANNER_KEY_LEGACY);
          if (v1) next = { uri: v1, type: 'video' };
        }
        if (next) {
          const healed = await healLocalMediaUri(next.uri);
          if (!healed) { next = null; }
          else if (healed !== next.uri) { next = { ...next, uri: healed }; }
        }
        if (!cancelled && next) setBanner(next);
      } catch { /* ignore */ } finally {
        if (!cancelled) setBannerHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  React.useEffect(() => {
    if (!bannerHydrated) return;
    if (banner) {
      AsyncStorage.setItem(BANNER_KEY, JSON.stringify(banner))
        .then(() => AsyncStorage.removeItem(BANNER_KEY_LEGACY)).catch(() => {});
    } else {
      AsyncStorage.removeItem(BANNER_KEY).catch(() => {});
      AsyncStorage.removeItem(BANNER_KEY_LEGACY).catch(() => {});
    }
  }, [banner, bannerHydrated]);

  const bannerMedia = React.useMemo(() => resolveSlotMedia('coach-banner', banner), [banner]);
  const bannerVideoUri = bannerMedia.kind !== 'none' && bannerMedia.type === 'video' ? bannerMedia.uri : null;

  const bannerPlayer = useVideoPlayer(bannerVideoUri, (p) => {
    if (!p) return;
    p.loop = true; p.muted = true; p.play();
  });
  React.useEffect(() => {
    if (!bannerPlayer || !bannerVideoUri) return;
    bannerPlayer.play();
    const sub = bannerPlayer.addListener('playingChange', (e: any) => {
      if (!e?.isPlaying) { try { bannerPlayer.play(); } catch {} }
    });
    return () => { try { sub.remove(); } catch {} };
  }, [bannerPlayer, bannerVideoUri]);

  const pickBanner = React.useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access in Settings to pick media.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const type: 'image' | 'video' = asset.type === 'video' ? 'video' : 'image';
      const persistedUri = await persistLocalMedia(asset.uri, 'coach-banner', type);
      setBanner({ uri: persistedUri, type });
    }
  }, []);
  const removeBanner = React.useCallback(() => { setBanner(null); }, []);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });
  const _dimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Banner — chrome preserved */}
        <View style={[styles.bannerWrap, { height: insets.top + 290, backgroundColor: '#000' }]} pointerEvents="none">
          {bannerVideoUri ? (
            <VideoView
              player={bannerPlayer}
              style={{ position: 'absolute', top: -15, left: -3, width: 420, height: 320 }}
              contentFit="cover"
              nativeControls={false}
            />
          ) : (
            <Image
              source={
                bannerMedia.kind === 'local'
                  ? { uri: bannerMedia.uri }
                  : bannerMedia.kind === 'curated-image'
                    ? bannerMedia.source
                    : require('@/assets/images/coach-banner.png')
              }
              style={{ position: 'absolute', top: -15, left: -3, width: 420, height: 320 }}
              resizeMode="cover"
            />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.28)' }]} pointerEvents="none" />
        </View>

        {/* Charter §B profile content — recruiting storefront, no tabs */}
        <View style={styles.storefrontContent}>

          {/* 1. Identity chips */}
          <View style={styles.identityChipsRow}>
            <View style={styles.identityChip}>
              <Ionicons name="trophy-outline" size={12} color={COPPER} />
              <Text style={styles.identityChipText}>{COACH.record} · {COACH.championships}</Text>
            </View>
            <View style={styles.identityChip}>
              <Ionicons name="calendar-outline" size={12} color={MUTED} />
              <Text style={[styles.identityChipText, { color: MUTED }]}>{COACH.yearsCoaching} yrs</Text>
            </View>
            <View style={styles.identityChip}>
              <Ionicons name="school-outline" size={12} color={MUTED} />
              <Text style={[styles.identityChipText, { color: MUTED }]} numberOfLines={1}>{COACH.school}</Text>
            </View>
          </View>

          {/* 2. PROGRAM RESULTS glass block */}
          <GlassBlock>
            <View style={styles.blockLabelRow}>
              <Text style={styles.blockLabel}>PROGRAM RESULTS</Text>
              <View style={styles.verifiedPill}>
                <Ionicons name="checkmark-circle" size={11} color={COPPER} />
                <Text style={styles.verifiedPillText}>VERIFIED</Text>
              </View>
            </View>

            <View style={[styles.blockRow, styles.blockRowFirst]}>
              <Text style={styles.bigStat}>47</Text>
              <Text style={styles.bigStatLabel}>deals completed by our roster this season</Text>
            </View>

            <View style={styles.blockRow}>
              <Text style={styles.brandRowLabel}>Brand partners · 12 active</Text>
              <Text style={styles.brandLogos}>Nike · Gatorade · JMA Wireless · Legacy +8 more</Text>
            </View>

            <View style={styles.blockRow}>
              <Text style={styles.bigStat}>1,250</Text>
              <Text style={styles.bigStatLabel}>paying supporters on roster</Text>
            </View>
          </GlassBlock>

          {/* 3. CAMPS & CLINICS glass block */}
          <GlassBlock>
            <View style={styles.blockLabelRow}>
              <Text style={styles.blockLabel}>CAMPS &amp; CLINICS</Text>
            </View>

            {/* Coach-facing surface is dollar-blind (Charter §B) — no prices;
                CTA requests a spot/info rather than quoting a fee. */}
            {[
              { name: 'Summer Skills Camp', dates: 'Jun 24–27', spots: 'Limited spots' },
              { name: 'Coaches Clinic',      dates: 'Aug 2',    spots: 'Open enrollment' },
            ].map((camp, idx) => (
              <View key={camp.name} style={[styles.campRow, idx > 0 && styles.campRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.campName}>{camp.name}</Text>
                  <Text style={styles.campMeta}>{camp.dates} · {camp.spots}</Text>
                </View>
                <TouchableOpacity
                  style={styles.bookBtn}
                  activeOpacity={0.7}
                  onPress={() => Alert.alert('Request sent', 'The camp will confirm your spot by email.')}
                  accessibilityRole="button"
                  accessibilityLabel={`Reserve a spot at ${camp.name}`}
                >
                  <Text style={styles.bookBtnText}>RESERVE</Text>
                </TouchableOpacity>
              </View>
            ))}
          </GlassBlock>

          {/* 4. CONTACT PROGRAM — copper CTA */}
          <Pressable
            style={({ pressed }) => [styles.contactBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() =>
              Alert.alert(
                'Message Routed',
                'Routed to program staff & compliance — time-stamped.',
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Contact program"
          >
            <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
            <Text style={styles.contactBtnText}>CONTACT PROGRAM</Text>
          </Pressable>
          <Text style={styles.contactDisclaimer}>
            Routes to program staff &amp; compliance — time-stamped.
          </Text>

        </View>
      </Animated.ScrollView>

      {/* Bottom fade */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 100 }]}
        pointerEvents="none"
      />

      {/* Top-left floating profile pill — avatar + hamburger (chrome preserved) */}
      <Pressable
        style={[styles.topLeftProfilePill, { top: insets.top + 8 }]}
        onPress={() => setRoleSheetVisible(true)}
        accessibilityLabel="Open menu"
        accessibilityRole="button"
      >
        <View style={styles.topLeftProfilePillGlass} pointerEvents="none">
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
        </View>
        {PROFILE_MEDIA.coach.avatar ? (
          <Image source={PROFILE_MEDIA.coach.avatar} style={styles.topLeftProfilePillAvatar} />
        ) : (
          <IdentityAvatar
            name={personaFor('coach').displayName}
            size={40}
            accent={personaFor('coach').accent}
          />
        )}
        <Ionicons name="menu" size={22} color="#FFF" style={{ marginLeft: 8 }} />
      </Pressable>

      <RoleSwitcherSheet
        visible={roleSheetVisible}
        onClose={() => setRoleSheetVisible(false)}
        onEditProfile={() => setIsEditing((v) => !v)}
        isEditing={isEditing}
        onChangeBanner={pickBanner}
        onRemoveBanner={removeBanner}
        hasCustomBanner={!!banner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#000' },

  // Storefront content area
  storefrontContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
    marginTop: -20,
  },

  // Identity chips row
  identityChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  identityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  identityChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COPPER,
    letterSpacing: -0.1,
  },

  // GlassBlock internal layout — flat solid fill (matches athlete media-kit-card)
  glassBlock: {
    gap: 10,
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  glassBlockInner: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  blockLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: ACCENT,
    textTransform: 'uppercase',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: `${COPPER}18`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COPPER}44`,
  },
  verifiedPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: COPPER,
    letterSpacing: 0.5,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
  blockRowFirst: {
    borderTopWidth: 0,
    paddingTop: 2,
  },
  bigStat: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.8,
    flexShrink: 0,
  },
  bigStatLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 17,
  },
  brandRowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  brandLogos: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Camps & Clinics rows
  campRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 10,
  },
  campRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
  campName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  campMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  bookBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bookBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },

  // Contact button
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COPPER,
  },
  contactBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  contactDisclaimer: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    marginTop: -6,
  },

  // Preserved chrome styles
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
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 23,
    overflow: 'hidden',
  },
  topLeftProfilePillAvatar: { width: 40, height: 40, borderRadius: 20 },
  bottomFade: { position: 'absolute', left: 0, right: 0, zIndex: 99 },

  // Old tab styles kept as dead entries (tab content unmounted; files not deleted per charter)
  _bioItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
    paddingBottom: 2,
    gap: 8,
  },

  // Recruiting watchlist
  watchlistContainerHeader: {
    paddingBottom: 10,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  watchlistTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.2,
  },
  watchlistSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
    fontWeight: '500',
  },
  watchlistRow: {
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  watchlistExpanded: {
    gap: 6,
    marginTop: 8,
  },
  watchlistFollowingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  watchlistRowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  watchlistAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchlistAvatarText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  watchlistNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  watchlistName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  watchlistMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    marginTop: 1,
  },
  watchlistFollowingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,111,60,0.18)',
    borderColor: 'rgba(255,111,60,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  watchlistFollowingText: {
    color: '#FF6F3C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  watchlistRank: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  watchlistStats: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '500',
  },
  watchlistUpdateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
  watchlistUpdateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6F3C',
    marginTop: 6,
  },
  watchlistUpdate: {
    color: '#FFF',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  watchlistTime: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  watchlistAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.45)',
    backgroundColor: 'rgba(255,111,60,0.06)',
    marginTop: 4,
  },
  watchlistAddText: {
    color: '#FF6F3C',
    fontSize: 14,
    fontWeight: '700',
  },
});
