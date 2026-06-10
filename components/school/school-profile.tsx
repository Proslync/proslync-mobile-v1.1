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
import { healLocalMediaUri } from '@/lib/media/local-media';

const SCHOOL_BLUE = '#3B82F6';
const TAB_BAR_TOP_FROM_BOTTOM = 90;

const SCHOOL = {
  username: 'syracuse',
  name: 'Syracuse University',
  metaPrimary: 'Athletics Department',
  metaSecondary: 'Syracuse, NY · ACC',
  about: [
    {
      key: 'mission',
      title: 'Mission',
      body: 'Develop student-athletes who win on the court and in the classroom. 20 NCAA Division I programs, 612 athletes, 40+ team championships.',
    },
    {
      key: 'history',
      title: 'History',
      body: 'Founded 1870. Big East charter member; ACC since 2013. Home of the JMA Wireless Dome — 49,000 capacity, the largest on-campus structure in the world for college basketball.',
    },
    {
      key: 'compliance',
      title: 'Compliance',
      body: 'NCAA Division I · Title IX score 92%. NIL Office reviews every deal. Full eligibility, travel, and academic monitoring across all 20 sports.',
    },
  ],
  highlights: [
    { key: 'rev', label: 'Athletics revenue', value: '$142M FY25' },
    { key: 'champs', label: 'Team championships', value: '40+' },
    { key: 'enroll', label: 'Student-athletes', value: '612' },
    { key: 'sports', label: 'D-I programs', value: '20' },
  ],
};

type TabKey = 'about' | 'highlights';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'highlights', label: 'Highlights' },
];

export default function SchoolProfile() {
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

  // Bundled defaults (ship to TestFlight); picked media overrides at runtime.
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

  // Persistent custom profile photo (avatar).
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
                <Text style={styles.name}>{SCHOOL.name}</Text>
                <MaterialCommunityIcons name="check-decagram" size={15} color={SCHOOL_BLUE} />
              </View>
              <Text style={[styles.metaLine, styles.metaLinePrimary]} numberOfLines={1}>
                {SCHOOL.metaPrimary}
              </Text>
              <Text style={styles.metaLine} numberOfLines={1}>
                {SCHOOL.metaSecondary}
              </Text>

              {/* About — player-style glass block */}
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
                {SCHOOL.about.map((section, idx) => {
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

          {tab === 'highlights' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PROGRAM HIGHLIGHTS</Text>
              <View style={styles.card}>
                {SCHOOL.highlights.map((h, i) => (
                  <Animated.View
                    key={h.key}
                    entering={FadeInDown.delay(i * 60).duration(400)}
                    style={[styles.row, i !== SCHOOL.highlights.length - 1 && styles.rowDivider]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{h.label}</Text>
                    </View>
                    <Text style={styles.rowValue}>{h.value}</Text>
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 22, fontWeight: '700', color: '#FFF', letterSpacing: -0.4 },
  metaLine: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.55)', marginTop: 4, letterSpacing: -0.1, lineHeight: 18 },
  metaLinePrimary: { color: '#FFF', fontWeight: '700' },

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

  // Section (highlights)
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

  // Highlights
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14 },
  rowTitle: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  rowValue: { color: SCHOOL_BLUE, fontSize: 14, fontWeight: '700' },

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
