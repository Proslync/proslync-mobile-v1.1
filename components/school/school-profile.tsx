// components/school/school-profile.tsx
// ── SCHOOL PROFILE — VERIFIED INFRASTRUCTURE PROOF ───────────────────────
// Charter §B — wipe content to three blocks:
//   1. CLEAN PROGRAM glass/hero block — VERIFIED NIL INFRASTRUCTURE badge + tabular rows
//   2. TRUST STACK block — SPARTA agents, supporters, brand partners
//   3. FOR RECRUITS & PARENTS block — plain-language rows
// Banner/avatar chrome + persistence preserved verbatim from previous version.
// Old profile content unmounted (functions kept with _ prefix, not rendered).
// NO leaderboards vs other programs, NO individual athlete earnings, NO dollar promises.

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useVideoPlayer, VideoView } from 'expo-video';

import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import { PROFILE_MEDIA } from '@/lib/profile-media';
import { healLocalMediaUri } from '@/lib/media/local-media';

// ── Charter constants ──────────────────────────────────────────────────────
const COPPER = '#EB621A';
const SCHOOL_BLUE = '#3B82F6';
const CARD_BG = 'rgba(255,255,255,0.04)';
const CARD_BORDER = 'rgba(255,255,255,0.08)';
const MUTED = 'rgba(255,255,255,0.50)';
const GREEN = '#34C759';
const TAB_BAR_TOP_FROM_BOTTOM = 90;

// ── Old content kept but unmounted (prefixed _) ────────────────────────────
// Previous SCHOOL meta + about/highlights were here.
// DO NOT DELETE — kept for reference.
const _SCHOOL_META = {
  username: 'syracuse',
  name: 'Syracuse University',
  metaPrimary: 'Athletics Department',
  metaSecondary: 'Syracuse, NY · ACC',
};

const _OLD_ABOUT = [
  { key: 'mission',    title: 'Mission',    body: '...' },
  { key: 'history',    title: 'History',    body: '...' },
  { key: 'compliance', title: 'Compliance', body: '...' },
];

const _OLD_HIGHLIGHTS = [
  { key: 'rev',    label: 'Athletics revenue',  value: '$142M FY25' },
  { key: 'champs', label: 'Team championships', value: '40+'        },
  { key: 'enroll', label: 'Student-athletes',   value: '612'        },
  { key: 'sports', label: 'D-I programs',       value: '20'         },
];
// ── End kept ───────────────────────────────────────────────────────────────

// ── BLOCK 1: CLEAN PROGRAM ─────────────────────────────────────────────────

const PROGRAM_STATS = [
  { value: '96%', label: 'of program deals cleared through NIL Go' },
  { value: '2.1d', label: 'median days to cleared' },
  { value: '98%', label: 'on-time payment rate across program brands' },
];

function CleanProgramBlock() {
  return (
    <View style={s.glassCard}>
      {/* Badge row */}
      <View style={s.badgeRow}>
        <View style={s.verifiedBadge}>
          <MaterialCommunityIcons name="check-decagram" size={18} color={GREEN} />
          <Text style={s.verifiedBadgeText}>VERIFIED NIL INFRASTRUCTURE</Text>
        </View>
      </View>

      {/* Tabular stat rows */}
      {PROGRAM_STATS.map((stat, idx) => (
        <View
          key={stat.label}
          style={[s.statRow, idx !== PROGRAM_STATS.length - 1 && s.statRowDivider]}
        >
          <Text style={s.statValue}>{stat.value}</Text>
          <Text style={s.statLabel} numberOfLines={2}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── BLOCK 2: TRUST STACK ───────────────────────────────────────────────────

const TRUST_ROWS = [
  { value: '14', label: 'SPARTA-verified agents on file', suffix: '✓', color: GREEN },
  { value: '1,250', label: 'receipted supporters' },
  { value: '12', label: 'active brand partners' },
];

function TrustStackBlock() {
  return (
    <View style={s.card}>
      <View style={s.blockHeader}>
        <View style={s.blockBar} />
        <Text style={s.blockTitle}>TRUST STACK</Text>
      </View>
      {TRUST_ROWS.map((row, idx) => (
        <View
          key={row.label}
          style={[s.trustRow, idx !== TRUST_ROWS.length - 1 && s.trustRowDivider]}
        >
          <Text style={s.trustValue}>{row.value}</Text>
          <Text style={s.trustLabel}>{row.label}</Text>
          {row.suffix ? (
            <Text style={[s.trustSuffix, row.color ? { color: row.color } : {}]}>
              {row.suffix}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

// ── BLOCK 3: FOR RECRUITS & PARENTS ───────────────────────────────────────

const RECRUIT_ROWS = [
  {
    id: 'rr-1',
    icon: 'shield-checkmark-outline' as const,
    text: 'Every deal gets a clearance receipt',
  },
  {
    id: 'rr-2',
    icon: 'people-outline' as const,
    text: 'Payment truth is athlete-confirmed',
  },
  {
    id: 'rr-3',
    icon: 'ban-outline' as const,
    text: 'No earnings promises — infrastructure, not inducement.',
  },
];

function RecruitsBlock() {
  return (
    <View style={s.card}>
      <View style={s.blockHeader}>
        <View style={s.blockBar} />
        <Text style={s.blockTitle}>FOR RECRUITS & PARENTS</Text>
      </View>
      {RECRUIT_ROWS.map((row, idx) => (
        <View
          key={row.id}
          style={[s.recruitRow, idx !== RECRUIT_ROWS.length - 1 && s.recruitRowDivider]}
        >
          <Ionicons name={row.icon} size={16} color={COPPER} style={s.recruitIcon} />
          <Text style={s.recruitText}>{row.text}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export default function SchoolProfile() {
  const insets = useSafeAreaInsets();
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);

  // ── Tabs (kept for chrome parity with old profile — just one active tab now)
  const _tabIndex = 0;
  const tabPillWidth = useSharedValue(0);
  const animatedTabIndex = useSharedValue(0);
  React.useEffect(() => {
    animatedTabIndex.value = withTiming(0, { duration: 180 });
  }, [animatedTabIndex]);
  const tabKnobStyle = useAnimatedStyle(() => {
    const segW = tabPillWidth.value / 1;
    const inset = 4;
    return {
      width: Math.max(segW - inset * 2, 0),
      transform: [{ translateX: animatedTabIndex.value * segW + inset }],
    };
  });

  // ── Persistent custom banner video (chrome preserved verbatim) ────────────
  const [bannerVideo, setBannerVideo] = React.useState<string | null>(null);
  const [bannerHydrated, setBannerHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem('proslync:school-profile:bannerVideo:v1')
      .then(async (v) => {
        if (cancelled || !v) return;
        const healed = await healLocalMediaUri(v);
        if (!cancelled && healed) setBannerVideo(healed);
        else if (!healed) AsyncStorage.removeItem('proslync:school-profile:bannerVideo:v1').catch(() => {});
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBannerHydrated(true); });
    return () => { cancelled = true; };
  }, []);
  React.useEffect(() => {
    if (!bannerHydrated) return;
    if (bannerVideo) {
      AsyncStorage.setItem('proslync:school-profile:bannerVideo:v1', bannerVideo).catch(() => {});
    } else {
      AsyncStorage.removeItem('proslync:school-profile:bannerVideo:v1').catch(() => {});
    }
  }, [bannerVideo, bannerHydrated]);

  const media = PROFILE_MEDIA.school;
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

  // ── Persistent custom profile photo (avatar) ──────────────────────────────
  const [avatarUri, setAvatarUri] = React.useState<string | null>(null);
  const [avatarHydrated, setAvatarHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem('proslync:school-profile:avatar:v1')
      .then(async (v) => {
        if (cancelled || !v) return;
        const healed = await healLocalMediaUri(v);
        if (!cancelled && healed) setAvatarUri(healed);
        else if (!healed) AsyncStorage.removeItem('proslync:school-profile:avatar:v1').catch(() => {});
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAvatarHydrated(true); });
    return () => { cancelled = true; };
  }, []);
  React.useEffect(() => {
    if (!avatarHydrated) return;
    if (avatarUri) {
      AsyncStorage.setItem('proslync:school-profile:avatar:v1', avatarUri).catch(() => {});
    } else {
      AsyncStorage.removeItem('proslync:school-profile:avatar:v1').catch(() => {});
    }
  }, [avatarUri, avatarHydrated]);

  const pickProfilePic = React.useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access in Settings to pick a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const src = result.assets[0].uri;
      let persistedUri = src;
      try {
        const dir = `${FileSystem.documentDirectory}proslync-media/profile-avatar/`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const ext = (src.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
        const safeExt = /^[a-z0-9]{2,4}$/.test(ext) ? ext : 'jpg';
        const dest = `${dir}${Date.now()}.${safeExt}`;
        await FileSystem.copyAsync({ from: src, to: dest });
        persistedUri = dest;
      } catch {
        // Fall back to original URI if copy fails.
      }
      setAvatarUri(persistedUri);
    }
  }, []);

  const removeProfilePic = React.useCallback(() => {
    setAvatarUri(null);
  }, []);

  return (
    <View style={s.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner — cover video/image, scrolls with content (chrome preserved) */}
        <View style={[s.bannerWrap, { height: insets.top + 290 }]} pointerEvents="none">
          {effectiveBannerVideo ? (
            <VideoView
              player={bannerPlayer}
              style={{ position: 'absolute', top: -15, left: -3, width: 420, height: 320 }}
              contentFit="cover"
              nativeControls={false}
            />
          ) : (
            <Image
              source={media.banner}
              style={{ position: 'absolute', top: -15, left: -3, width: 420, height: 320 }}
              resizeMode="cover"
            />
          )}
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.28)' }]}
            pointerEvents="none"
          />
        </View>

        {/* Segmented pill — kept as single-segment chrome for visual parity */}
        <View style={s.tabsRow}>
          <View
            style={s.tabSegmentedPill}
            onLayout={(e) => { tabPillWidth.value = e.nativeEvent.layout.width; }}
          >
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 23 }]}
              pointerEvents="none"
            />
            <View style={s.tabsGlassLayer} pointerEvents="none">
              <GlassView
                glassEffectStyle="regular"
                style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
              />
              {isLiquidGlassSupported && (
                <LiquidGlassView
                  effect="regular"
                  tintColor="rgba(255,255,255,0.10)"
                  style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
                />
              )}
            </View>
            <Animated.View style={[s.tabKnob, tabKnobStyle]} pointerEvents="none">
              {isLiquidGlassSupported ? (
                <LiquidGlassView
                  effect="regular"
                  tintColor="rgba(255,255,255,0.20)"
                  style={[StyleSheet.absoluteFill, { borderRadius: 19 }]}
                />
              ) : null}
            </Animated.View>
            {/* Single tab — Program */}
            <View style={s.tabSegment}>
              <Text style={[s.tabPillText, s.tabPillTextActive]}>Program</Text>
            </View>
          </View>
        </View>

        {/* Content — identity + three charter blocks */}
        <View style={s.contentSection}>
          {/* Identity */}
          <View style={s.nameRow}>
            <Text style={s.name}>Syracuse University</Text>
            <MaterialCommunityIcons name="check-decagram" size={15} color={SCHOOL_BLUE} />
          </View>
          <Text style={[s.metaLine, s.metaLinePrimary]}>Athletics Department</Text>
          <Text style={s.metaLine}>Syracuse, NY · ACC</Text>

          {/* Charter blocks */}
          <CleanProgramBlock />
          <TrustStackBlock />
          <RecruitsBlock />
        </View>
      </ScrollView>

      {/* Bottom fade */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[s.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 100 }]}
        pointerEvents="none"
      />

      {/* Top-left floating profile pill — avatar + hamburger (chrome preserved) */}
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
        <Image
          source={avatarUri ? { uri: avatarUri } : media.avatar}
          style={s.topLeftProfilePillAvatar}
        />
        <Ionicons name="menu" size={22} color="#FFF" style={{ marginLeft: 8 }} />
      </Pressable>

      <RoleSwitcherSheet
        visible={roleSheetVisible}
        onClose={() => setRoleSheetVisible(false)}
        onChangeBanner={pickBannerVideo}
        onRemoveBanner={removeBannerVideo}
        hasCustomBanner={!!bannerVideo}
        onChangeAvatar={pickProfilePic}
        onRemoveAvatar={removeProfilePic}
        hasCustomAvatar={!!avatarUri}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#000' },

  // Tabs chrome (player parity)
  tabsRow: { flexDirection: 'row', marginTop: -34, marginBottom: 10, paddingHorizontal: 16 },
  tabSegmentedPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    position: 'relative',
  },
  tabsGlassLayer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 23,
    overflow: 'hidden',
  },
  tabKnob: {
    position: 'absolute',
    top: 4, bottom: 4, left: 0,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  tabSegment: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabPillText:       { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.65)', letterSpacing: -0.1 },
  tabPillTextActive: { color: '#FFF', fontWeight: '800' },

  // Identity
  contentSection: { paddingHorizontal: 16, paddingTop: 8, gap: 14, paddingBottom: 24 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name:     { fontSize: 22, fontWeight: '700', color: '#FFF', letterSpacing: -0.4 },
  metaLine: { fontSize: 13, fontWeight: '500', color: MUTED, marginTop: 2, letterSpacing: -0.1, lineHeight: 18 },
  metaLinePrimary: { color: '#FFF', fontWeight: '700' },

  // Flat solid card (Block 1) — matches athlete media-kit-card
  glassCard: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  glassLayer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 18,
    overflow: 'hidden',
  },
  badgeRow: {
    alignItems: 'flex-start',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: `${GREEN}18`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${GREEN}44`,
  },
  verifiedBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: GREEN,
    letterSpacing: 0.5,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    paddingVertical: 4,
  },
  statRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
    minWidth: 54,
  },
  statLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },

  // Plain card (Blocks 2 + 3)
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  blockBar: {
    width: 4,
    height: 13,
    borderRadius: 2,
    backgroundColor: COPPER,
  },
  blockTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COPPER,
  },

  // Trust Stack rows
  trustRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    paddingVertical: 2,
  },
  trustRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 8,
  },
  trustValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
    minWidth: 48,
  },
  trustLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
  },
  trustSuffix: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
  },

  // Recruits rows
  recruitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  recruitRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 10,
  },
  recruitIcon: {
    marginTop: 1,
    flexShrink: 0,
  },
  recruitText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },

  // Bottom fade
  bottomFade: { position: 'absolute', left: 0, right: 0, zIndex: 99 },

  // Top-left floating profile pill (player parity)
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
  topLeftProfilePillAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
