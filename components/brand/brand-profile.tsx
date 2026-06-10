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
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
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
import {
  BRAND_ATHLETES,
  BRAND_CAMPAIGNS,
  BRAND_PROFILE,
} from '@/lib/data/mock-brand-data';

const ACCENT = '#FF6F3C';
const TEAL = '#00C6B0';
const TAB_BAR_TOP_FROM_BOTTOM = 90;

type TabKey = 'about' | 'roster' | 'campaigns' | 'team';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'roster', label: 'Roster' },
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'team', label: 'Team' },
];

const BRAND_TEAM = [
  { name: 'Tosan Evbuomwan', role: 'VP · NIL & Grassroots', initials: 'TE' },
  { name: 'Maya Lindgren', role: 'Sr. Manager · Athlete Partnerships', initials: 'ML' },
  { name: 'Darnell Price', role: 'Manager · Creative & Content', initials: 'DP' },
  { name: 'Priya Raman', role: 'Analyst · NIL Insights', initials: 'PR' },
  { name: 'Greg Sato', role: 'Counsel · Reed Smith (outside)', initials: 'GS' },
  { name: 'Nia Castillo', role: 'Coordinator · Athlete Ops', initials: 'NC' },
];

export default function BrandProfile() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = React.useState<TabKey>('about');
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['mission']));
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);

  // Animated sliding knob — same segmented glass pill as the player profile.
  const tabIndex = Math.max(0, TABS.findIndex((t) => t.key === tab));
  const tabPillWidth = useSharedValue(0);
  const animatedTabIndex = useSharedValue(tabIndex);
  React.useEffect(() => {
    animatedTabIndex.value = withTiming(tabIndex, { duration: 180 });
  }, [tabIndex, animatedTabIndex]);
  const tabKnobStyle = useAnimatedStyle(() => {
    const segW = tabPillWidth.value / Math.max(TABS.length, 1);
    const inset = 4;
    return {
      width: Math.max(segW - inset * 2, 0),
      transform: [{ translateX: animatedTabIndex.value * segW + inset }],
    };
  });

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Persistent custom banner video.
  const [bannerVideo, setBannerVideo] = React.useState<string | null>(null);
  const [bannerHydrated, setBannerHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem('proslync:brand-profile:bannerVideo:v1')
      .then((v) => { if (!cancelled && v) setBannerVideo(v); })
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

  // Bundled defaults (ship to TestFlight); picked media overrides at runtime.
  const media = PROFILE_MEDIA.brand;
  const effectiveBannerVideo = bannerVideo ?? media.bannerVideo ?? null;

  const bannerPlayer = useVideoPlayer(effectiveBannerVideo, (p) => {
    if (!p) return;
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Keep banner video playing through re-renders / focus changes / hot reloads.
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
      // Copy into persistent documentDirectory so the URI survives app restarts.
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

  // Persistent custom profile photo (avatar).
  const [avatarUri, setAvatarUri] = React.useState<string | null>(null);
  const [avatarHydrated, setAvatarHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem('proslync:brand-profile:avatar:v1')
      .then((v) => { if (!cancelled && v) setAvatarUri(v); })
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

  const signed = BRAND_ATHLETES.filter((a) => a.signed);
  const live = BRAND_CAMPAIGNS.filter((c) => c.status === 'live');
  const upcoming = BRAND_CAMPAIGNS.filter((c) => c.status === 'upcoming');

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner — cover video/image that fades into the page bg, scrolls with content */}
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
        </View>

        {/* Profile section tabs — segmented glass pill with sliding knob */}
        <View style={styles.tabsRow}>
          <View
            style={styles.tabSegmentedPill}
            onLayout={(e) => {
              tabPillWidth.value = e.nativeEvent.layout.width;
            }}
          >
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 23 }]}
              pointerEvents="none"
            />
            <View style={styles.tabsGlassLayer} pointerEvents="none">
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
            <Animated.View style={[styles.tabKnob, tabKnobStyle]} pointerEvents="none">
              {isLiquidGlassSupported ? (
                <LiquidGlassView
                  effect="regular"
                  tintColor="rgba(255,255,255,0.20)"
                  style={[StyleSheet.absoluteFill, { borderRadius: 19 }]}
                />
              ) : null}
            </Animated.View>
            {TABS.map((t) => {
              const isActive = tab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={styles.tabSegment}
                  onPress={() => setTab(t.key)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[styles.tabPillText, isActive && styles.tabPillTextActive]}
                    numberOfLines={1}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tab content */}
        <View style={styles.igGridSection}>
          {tab === 'about' && (
            <View style={styles.aboutSection}>
              {/* Identity — folded into About since the shell has no header row */}
              <View style={styles.nameRow}>
                <Text style={styles.name}>{BRAND_PROFILE.name}</Text>
                <Ionicons name="shield-checkmark" size={15} color={TEAL} />
              </View>
              <Text style={[styles.metaLine, styles.metaLinePrimary]} numberOfLines={1}>
                {BRAND_PROFILE.metaPrimary}
              </Text>
              <Text style={styles.metaLine} numberOfLines={1}>
                {BRAND_PROFILE.metaSecondary}
              </Text>
              <Text style={styles.tagline}>{BRAND_PROFILE.tagline}</Text>

              <View style={styles.statRow}>
                {BRAND_PROFILE.stats.map((stat) => (
                  <View key={stat.label} style={styles.statTile}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              {/* Bio — player-style glass block */}
              <View style={styles.aboutBlockBare}>
                <View
                  style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16 }]}
                  pointerEvents="none"
                />
                <View style={styles.aboutBlockGlass} pointerEvents="none">
                  <GlassView
                    glassEffectStyle="regular"
                    style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                  />
                  {isLiquidGlassSupported && (
                    <LiquidGlassView
                      effect="regular"
                      tintColor="rgba(255,255,255,0.10)"
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  )}
                </View>
                {BRAND_PROFILE.bio.map((section, idx) => {
                  const isOpen = expanded.has(section.key);
                  return (
                    <View
                      key={section.key}
                      style={[styles.bioItem, idx === 0 && { borderTopWidth: 0, paddingTop: 0 }]}
                    >
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggle(section.key)}
                        style={styles.bioHeader}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: isOpen }}
                      >
                        <Text style={styles.bioTitle}>{section.title}</Text>
                        <Ionicons
                          name={isOpen ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color="rgba(255,255,255,0.6)"
                        />
                      </TouchableOpacity>
                      {isOpen && <Text style={styles.bioBody}>{section.body}</Text>}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {tab !== 'about' && <View style={{ height: 15 }} />}

          {tab === 'roster' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SIGNED ATHLETES · {signed.length}</Text>
              <View style={styles.card}>
                {signed.map((a, i) => (
                  <Animated.View
                    key={a.id}
                    entering={FadeInDown.delay(i * 50).duration(380)}
                    style={[
                      styles.rosterRow,
                      i !== signed.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.rosterAvatar}>
                      <Text style={styles.rosterAvatarText}>{a.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rosterName}>{a.name}</Text>
                      <Text style={styles.rosterMeta}>{a.school} · {a.position}</Text>
                      {a.contract && <Text style={styles.rosterContract}>{a.contract}</Text>}
                    </View>
                    <View style={styles.ridgePill}>
                      <Text style={styles.ridgePillText}>{a.rank}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}

          {tab === 'campaigns' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LIVE · {live.length}</Text>
              <View style={styles.card}>
                {live.map((c, i) => (
                  <View
                    key={c.id}
                    style={[
                      styles.campaignRow,
                      i !== live.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={[styles.campaignDot, { backgroundColor: TEAL }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.campaignName}>{c.name}</Text>
                      <Text style={styles.campaignMeta}>{c.athlete} · {c.reach} reach</Text>
                    </View>
                    <Text style={styles.campaignBudget}>{c.budget}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.sectionLabel}>UPCOMING · {upcoming.length}</Text>
              <View style={styles.card}>
                {upcoming.map((c, i) => (
                  <View
                    key={c.id}
                    style={[
                      styles.campaignRow,
                      i !== upcoming.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={[styles.campaignDot, { backgroundColor: ACCENT }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.campaignName}>{c.name}</Text>
                      <Text style={styles.campaignMeta}>{c.athlete} · {c.startDate}</Text>
                    </View>
                    <Text style={styles.campaignBudget}>{c.budget}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {tab === 'team' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>BRAND TEAM</Text>
              <View style={styles.card}>
                {BRAND_TEAM.map((m, i) => (
                  <Animated.View
                    key={m.name}
                    entering={FadeInDown.delay(i * 50).duration(380)}
                    style={[
                      styles.teamRow,
                      i !== BRAND_TEAM.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.teamAvatar}>
                      <Text style={styles.teamInitial}>{m.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teamName}>{m.name}</Text>
                      <Text style={styles.teamRole}>{m.role}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom fade — gives the floating tab bar glass something to refract */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 100 }]}
        pointerEvents="none"
      />

      {/* Top-left floating profile pill — avatar + hamburger (matches player) */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#000' },

  // Tabs — segmented glass pill (player parity)
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 23,
    overflow: 'hidden',
  },
  tabKnob: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
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
  tabPillText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.65)', letterSpacing: -0.1 },
  tabPillTextActive: { color: '#FFF', fontWeight: '800' },

  // Identity (folded into About)
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 22, fontWeight: '700', color: '#FFF', letterSpacing: -0.4 },
  metaLine: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.55)', marginTop: 4, letterSpacing: -0.1, lineHeight: 18 },
  metaLinePrimary: { color: '#FFF', fontWeight: '700' },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 8,
  },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statTile: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statValue: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '600', textAlign: 'center' },

  // Content shell (player parity)
  igGridSection: { marginTop: -20 },
  aboutSection: { paddingHorizontal: 16, paddingVertical: 20, gap: 12 },
  aboutBlockBare: {
    gap: 10,
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  aboutBlockGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Section (roster / campaigns / team)
  section: { paddingHorizontal: 16, gap: 10, paddingTop: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  // Bio
  bioItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
    paddingBottom: 2,
    gap: 8,
  },
  bioHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bioTitle: { fontSize: 15, color: '#FFF', fontWeight: '600', letterSpacing: -0.1 },
  bioBody: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20, letterSpacing: -0.1 },

  // Roster
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },
  rosterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  rosterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0,198,176,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,198,176,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rosterAvatarText: { color: TEAL, fontSize: 12, fontWeight: '800' },
  rosterName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  rosterMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 },
  rosterContract: { color: TEAL, fontSize: 11, marginTop: 3, fontWeight: '600' },
  ridgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ridgePillText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },

  // Campaigns
  campaignRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  campaignDot: { width: 8, height: 8, borderRadius: 4 },
  campaignName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  campaignMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3 },
  campaignBudget: { color: ACCENT, fontSize: 13, fontWeight: '800' },

  // Team
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  teamAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInitial: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  teamName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  teamRole: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 },

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
