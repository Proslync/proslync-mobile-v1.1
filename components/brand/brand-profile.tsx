// components/brand/brand-profile.tsx
// ── BRAND PROFILE — TRUST CARD (athlete/agent view) ─────────────────────
// Charter §B — wiped to the trust card athletes and agents see.
// Four glass blocks: PAYMENT RELIABILITY (hero) · TRACK RECORD ·
//   COMPLIANCE · TYPICAL BRIEF.
// No open contact CTA — muted funded-brief-only line at the footer.
// Banner/avatar chrome + persistence kept verbatim.
// Old profile content (About/Roster/Campaigns/Team tabs) unmounted, not deleted.
// _ prefix applied to unused vars per charter.

import { Ionicons } from '@expo/vector-icons';
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
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useVideoPlayer, VideoView } from 'expo-video';

import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import { PROFILE_MEDIA } from '@/lib/profile-media';
import { healLocalMediaUri } from '@/lib/media/local-media';

// Unmounted old data imports — kept for lineage reference (not used).
// import { BRAND_ATHLETES, BRAND_CAMPAIGNS, BRAND_PROFILE } from '@/lib/data/mock-brand-data';

const _COPPER = '#EB621A'; void _COPPER;
const TAB_BAR_TOP_FROM_BOTTOM = 90;
const GREEN = '#34C759';
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

      {/* 1. PAYMENT RELIABILITY — hero glass block */}
      <GlassBlock>
        <View style={tc.blockLabelRow}>
          <Text style={tc.blockLabel}>PAYMENT RELIABILITY</Text>
        </View>

        {/* Big badge */}
        <View style={tc.reliabilityBadgeRow}>
          <Ionicons name="checkmark-circle" size={20} color={GREEN} />
          <Text style={tc.reliabilityBadge}>RELIABLE PAYER ✓</Text>
        </View>

        {/* Tabular rows */}
        <View style={tc.tabularBlock}>
          <View style={tc.tabularRow}>
            <Text style={tc.tabularLabel}>Deals fully paid</Text>
            <Text style={tc.tabularValue}>14 / 14</Text>
          </View>
          <View style={[tc.tabularRow, tc.tabularRowBorder]}>
            <Text style={tc.tabularLabel}>Median days to pay</Text>
            <Text style={tc.tabularValue}>6 days</Text>
          </View>
          <View style={[tc.tabularRow, tc.tabularRowBorder]}>
            <Text style={tc.tabularLabel}>Escrow-funded before work</Text>
            <Text style={tc.tabularValue}>100%</Text>
          </View>
        </View>
      </GlassBlock>

      {/* 2. TRACK RECORD */}
      <GlassBlock>
        <View style={tc.blockLabelRow}>
          <Text style={tc.blockLabel}>TRACK RECORD</Text>
        </View>

        <View style={tc.trackSummaryRow}>
          <Text style={tc.trackStat}>14 campaigns</Text>
          <View style={tc.trackDot} />
          <Text style={tc.trackStat}>71% repeat-athlete rate</Text>
        </View>

        {/* Consented sample activation rows */}
        {[
          { athlete: 'Kiyan A.', activation: '3 posts + code', status: 'delivered ✓' },
          { athlete: 'JJ S.', activation: 'Local appearance', status: 'delivered ✓' },
        ].map((row, idx) => (
          <View key={row.athlete} style={[tc.activationRow, idx > 0 && tc.activationRowBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={tc.activationAthlete}>{row.athlete}</Text>
              <Text style={tc.activationMeta}>{row.activation}</Text>
            </View>
            <View style={tc.deliveredPill}>
              <Ionicons name="checkmark" size={11} color={GREEN} />
              <Text style={tc.deliveredText}>{row.status}</Text>
            </View>
          </View>
        ))}
      </GlassBlock>

      {/* 3. COMPLIANCE */}
      <GlassBlock>
        <View style={tc.blockLabelRow}>
          <Text style={tc.blockLabel}>COMPLIANCE</Text>
        </View>

        <View style={tc.complianceRow}>
          <Ionicons name="checkmark-circle" size={14} color={GREEN} />
          <Text style={tc.complianceText}>Business identity verified ✓</Text>
        </View>

        {/* Associated Entity flag — the one athletes price risk on */}
        <View style={[tc.complianceRow, tc.complianceAERow]}>
          <Ionicons name="checkmark-circle" size={14} color={GREEN} />
          <View style={{ flex: 1 }}>
            <Text style={tc.complianceAELabel}>Associated Entity: NO</Text>
            <Text style={tc.complianceAENote}>
              Independent local business — no university, booster, or third-party AE affiliation
            </Text>
          </View>
        </View>

        <View style={tc.complianceRow}>
          <Ionicons name="checkmark-circle" size={14} color={GREEN} />
          <Text style={tc.complianceText}>CSC clearance rate 100% (11 reviewed)</Text>
        </View>

        <View style={tc.complianceRow}>
          <Ionicons name="checkmark-circle" size={14} color={GREEN} />
          <Text style={tc.complianceText}>FTC guidelines on file ✓</Text>
        </View>
      </GlassBlock>

      {/* 4. TYPICAL BRIEF */}
      <GlassBlock>
        <View style={tc.blockLabelRow}>
          <Text style={tc.blockLabel}>TYPICAL BRIEF</Text>
        </View>

        <View style={tc.typicalGrid}>
          <View style={tc.typicalItem}>
            <Text style={tc.typicalValue}>Social posts + appearances</Text>
            <Text style={tc.typicalItemLabel}>Type</Text>
          </View>
          <View style={[tc.typicalItem, tc.typicalItemBorder]}>
            <Text style={tc.typicalValue}>$300–2,400</Text>
            <Text style={tc.typicalItemLabel}>Band</Text>
          </View>
          <View style={[tc.typicalItem, tc.typicalItemBorder]}>
            <Text style={tc.typicalValue}>Syracuse metro</Text>
            <Text style={tc.typicalItemLabel}>Geo</Text>
          </View>
        </View>
      </GlassBlock>

      {/* Footer — no open contact CTA */}
      <Pressable
        onPress={() => Alert.alert('Funded briefs only', 'Offers arrive with escrow attached — contact only through a funded brief. (DEMO)')}
        style={tc.footerRow}
        accessibilityRole="button"
        accessibilityLabel="How contact works"
      >
        <Ionicons name="lock-closed" size={13} color={MUTED} />
        <Text style={tc.footerText}>
          Offers arrive with escrow attached — athletes see funded briefs first.
        </Text>
      </Pressable>

    </View>
  );
}

const tc = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },

  // Block label — mirrors media-kit-card.tsx label style
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

  // 1. Payment Reliability
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

  // 2. Track Record
  trackSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  trackStat: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  trackDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: MUTED,
  },
  activationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  activationRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
  activationAthlete: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  activationMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    marginTop: 2,
  },
  deliveredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${GREEN}44`,
    backgroundColor: `${GREEN}12`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  deliveredText: {
    color: GREEN,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // 3. Compliance
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 3,
  },
  complianceText: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
    flex: 1,
    lineHeight: 17,
  },
  // AE flag — prominent because athletes price risk on it
  complianceAERow: {
    backgroundColor: `${GREEN}0D`,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${GREEN}28`,
  },
  complianceAELabel: {
    fontSize: 13,
    fontWeight: '800',
    color: GREEN,
    letterSpacing: -0.1,
  },
  complianceAENote: {
    fontSize: 11,
    fontWeight: '500',
    color: `${GREEN}BB`,
    marginTop: 2,
    lineHeight: 15,
  },

  // 4. Typical Brief
  typicalGrid: {
    gap: 0,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  typicalItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typicalItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
  typicalValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  typicalItemLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MUTED,
    marginTop: 2,
    letterSpacing: 0.4,
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

export default function BrandProfile() {
  const insets = useSafeAreaInsets();
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);

  // Unmounted old state:
  // const [_tab, _setTab] = React.useState<TabKey>('about');
  // const [_expanded, _setExpanded] = React.useState<Set<string>>(new Set(['mission']));

  // Persistent custom banner video — kept verbatim from prior version.
  const [bannerVideo, setBannerVideo] = React.useState<string | null>(null);
  const [bannerHydrated, setBannerHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem('proslync:brand-profile:bannerVideo:v1')
      .then(async (v) => {
        if (cancelled || !v) return;
        const healed = await healLocalMediaUri(v);
        if (!cancelled && healed) setBannerVideo(healed);
        else if (!healed) AsyncStorage.removeItem('proslync:brand-profile:bannerVideo:v1').catch(() => {});
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBannerHydrated(true); });
    return () => { cancelled = true; };
  }, []);
  React.useEffect(() => {
    if (!bannerHydrated) return;
    if (bannerVideo) {
      AsyncStorage.setItem('proslync:brand-profile:bannerVideo:v1', bannerVideo).catch(() => {});
    } else {
      AsyncStorage.removeItem('proslync:brand-profile:bannerVideo:v1').catch(() => {});
    }
  }, [bannerVideo, bannerHydrated]);

  const media = PROFILE_MEDIA.brand;
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

  // Persistent custom profile photo (avatar) — kept verbatim.
  const [avatarUri, setAvatarUri] = React.useState<string | null>(null);
  const [avatarHydrated, setAvatarHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem('proslync:brand-profile:avatar:v1')
      .then(async (v) => {
        if (cancelled || !v) return;
        const healed = await healLocalMediaUri(v);
        if (!cancelled && healed) setAvatarUri(healed);
        else if (!healed) AsyncStorage.removeItem('proslync:brand-profile:avatar:v1').catch(() => {});
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAvatarHydrated(true); });
    return () => { cancelled = true; };
  }, []);
  React.useEffect(() => {
    if (!avatarHydrated) return;
    if (avatarUri) {
      AsyncStorage.setItem('proslync:brand-profile:avatar:v1', avatarUri).catch(() => {});
    } else {
      AsyncStorage.removeItem('proslync:brand-profile:avatar:v1').catch(() => {});
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
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner — cover video/image that fades into the page bg */}
        <View style={[styles.bannerWrap, { height: insets.top + 290 }]} pointerEvents="none">
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
          {/* Gradient fade into content below banner */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)', '#000']}
            locations={[0.55, 0.82, 1]}
            style={[StyleSheet.absoluteFill]}
            pointerEvents="none"
          />
        </View>

        {/* Trust card content — full-width, directly below banner */}
        <TrustCard />
      </ScrollView>

      {/* Bottom fade */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 100 }]}
        pointerEvents="none"
      />

      {/* Top-left floating profile pill — avatar + hamburger */}
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
        <Image
          source={avatarUri ? { uri: avatarUri } : media.avatar}
          style={styles.topLeftProfilePillAvatar}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#000' },

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

// ── Unmounted old content — preserved in comments per charter ─────────────
// The following were live in the previous version and are kept for lineage:
// - TABS: about | roster | campaigns | team
// - BRAND_TEAM constant (6 team members)
// - toggle(key) accordion logic
// - tab segmented pill with sliding knob (tabIndex, tabPillWidth, tabKnobStyle)
// - AboutTab: nameRow, tagline, statRow, bio glass block with accordion
// - RosterTab: signed athletes list
// - CampaignsTab: live + upcoming campaign rows
// - TeamTab: brand team member rows
// All data fixtures unchanged in lib/data/mock-brand-data.ts.
