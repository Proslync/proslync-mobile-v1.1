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
  FAN_FOLLOWING,
  FAN_PERKS,
  FAN_PROFILE,
} from '@/lib/data/mock-fan-data';
import { healLocalMediaUri } from '@/lib/media/local-media';

const ACCENT = '#FF6F3C';
const PURPLE = '#A855F7';
const TAB_BAR_TOP_FROM_BOTTOM = 90;

type TabKey = 'about' | 'following' | 'activity' | 'perks';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'following', label: 'Following' },
  { key: 'activity', label: 'Activity' },
  { key: 'perks', label: 'Perks' },
];

const RECENT_ACTIVITY = [
  { id: 'a-1', icon: 'trophy' as const, text: 'Won pick · Syracuse vs Miami margin', points: '+300', time: '2h ago' },
  { id: 'a-2', icon: 'ticket' as const, text: 'Claimed KA7 hoodie (pre-release)', points: '-3,200', time: 'Yesterday' },
  { id: 'a-3', icon: 'heart' as const, text: 'Followed Donnie Freeman', points: '+10', time: 'Yesterday' },
  { id: 'a-4', icon: 'eye' as const, text: 'Watched Syracuse vs Duke (live)', points: '+150', time: '2 days ago' },
  { id: 'a-5', icon: 'trophy' as const, text: 'Won pick · Cooper Flagg ACC POW', points: '+250', time: '3 days ago' },
  { id: 'a-6', icon: 'chatbubble' as const, text: 'Dropped a top comment on Jordan Miles reel', points: '+25', time: '4 days ago' },
  { id: 'a-7', icon: 'flame' as const, text: '7-day streak · daily check-in bonus', points: '+100', time: '5 days ago' },
];

const FAVORITE_TEAMS = [
  { name: 'Syracuse Orange', league: 'NCAA · ACC', color: '#F76900' },
  { name: 'Brooklyn Nets', league: 'NBA · East', color: '#000000' },
  { name: 'Paul VI Panthers', league: 'HS · WCAC', color: '#003087' },
];

export default function FanProfile() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = React.useState<TabKey>('about');
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['origin']));
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

  // Bundled defaults (ship to TestFlight); picked media overrides at runtime.
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

  const claimedPerks = FAN_PERKS.filter((p) => p.claimed);

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
                <Text style={styles.name}>
                  {FAN_PROFILE.firstName} {FAN_PROFILE.lastName}
                </Text>
                <View style={styles.tierChip}>
                  <Ionicons name="diamond" size={9} color={PURPLE} />
                  <Text style={styles.tierChipText}>{FAN_PROFILE.superfanTier}</Text>
                </View>
              </View>
              <Text style={[styles.metaLine, styles.metaLinePrimary]} numberOfLines={1}>
                {FAN_PROFILE.metaPrimary}
              </Text>
              <Text style={styles.metaLine} numberOfLines={1}>
                {FAN_PROFILE.metaSecondary}
              </Text>
              <Text style={styles.tagline}>"{FAN_PROFILE.tagline}"</Text>

              <View style={styles.statRow}>
                {FAN_PROFILE.stats.map((stat) => (
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
                {FAN_PROFILE.bio.map((section, idx) => {
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

              <Text style={styles.sectionLabel}>FAVORITE TEAMS</Text>
              <View style={styles.card}>
                {FAVORITE_TEAMS.map((t, i) => (
                  <View
                    key={t.name}
                    style={[
                      styles.teamRow,
                      i !== FAVORITE_TEAMS.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={[styles.teamSwatch, { backgroundColor: t.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teamName}>{t.name}</Text>
                      <Text style={styles.teamLeague}>{t.league}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {tab !== 'about' && <View style={{ height: 15 }} />}

          {tab === 'following' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>FOLLOWING · {FAN_FOLLOWING.length}</Text>
              <View style={styles.card}>
                {FAN_FOLLOWING.map((a, i) => (
                  <Animated.View
                    key={a.id}
                    entering={FadeInDown.delay(i * 50).duration(380)}
                    style={[
                      styles.followRow,
                      i !== FAN_FOLLOWING.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View
                      style={[
                        styles.followAvatar,
                        { backgroundColor: `${a.avatarColor}20`, borderColor: `${a.avatarColor}50` },
                      ]}
                    >
                      <Text style={[styles.followInitials, { color: a.avatarColor }]}>
                        {a.initials}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.followName}>{a.name}</Text>
                      <Text style={styles.followSchool}>{a.school}</Text>
                      <Text
                        style={[
                          styles.followUpdate,
                          a.isLive && { color: '#FF4444', fontWeight: '700' },
                        ]}
                      >
                        {a.lastUpdate}
                      </Text>
                    </View>
                    {a.isLive && (
                      <View style={styles.liveSmallPill}>
                        <View style={styles.liveSmallDot} />
                        <Text style={styles.liveSmallText}>LIVE</Text>
                      </View>
                    )}
                  </Animated.View>
                ))}
              </View>
            </View>
          )}

          {tab === 'activity' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>RECENT ACTIVITY</Text>
              <View style={styles.card}>
                {RECENT_ACTIVITY.map((a, i) => (
                  <Animated.View
                    key={a.id}
                    entering={FadeInDown.delay(i * 50).duration(380)}
                    style={[
                      styles.activityRow,
                      i !== RECENT_ACTIVITY.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.activityIcon}>
                      <Ionicons name={a.icon} size={16} color={PURPLE} />
                    </View>
                    <Text style={styles.activityText}>{a.text}</Text>
                    <View style={styles.activityEnd}>
                      <Text
                        style={[
                          styles.activityPoints,
                          { color: a.points.startsWith('+') ? '#34C759' : '#FF4444' },
                        ]}
                      >
                        {a.points}
                      </Text>
                      <Text style={styles.activityTime}>{a.time}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}

          {tab === 'perks' && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CLAIMED · {claimedPerks.length}</Text>
              <View style={styles.card}>
                {claimedPerks.map((p, i) => (
                  <View
                    key={p.id}
                    style={[
                      styles.claimedRow,
                      i !== claimedPerks.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.claimedIcon}>
                      <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.claimedTitle}>{p.title}</Text>
                      <Text style={styles.claimedAthlete}>{p.athlete}</Text>
                    </View>
                    <Text style={styles.claimedCost}>{p.cost.toLocaleString()} pts</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionLabel}>AVAILABLE BALANCE</Text>
              <View style={styles.balanceCard}>
                <Ionicons name="diamond" size={24} color={PURPLE} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.balanceValue}>
                    {FAN_PROFILE.superfanPoints.toLocaleString()} pts
                  </Text>
                  <Text style={styles.balanceMeta}>
                    +{FAN_PROFILE.pointsToNext} to reach {FAN_PROFILE.nextTier}
                  </Text>
                </View>
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
          source={media.avatar}
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
  tierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(168,85,247,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.4)',
  },
  tierChipText: { color: PURPLE, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.4 },
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

  // Section (following / activity / perks)
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

  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },

  // Favorite teams
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  teamSwatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  teamName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  teamLeague: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },

  // Following
  followRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  followAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followInitials: { fontSize: 13, fontWeight: '800' },
  followName: { color: '#FFF', fontSize: 13.5, fontWeight: '700' },
  followSchool: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  followUpdate: { color: 'rgba(255,255,255,0.45)', fontSize: 11.5, marginTop: 4 },
  liveSmallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,68,68,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.4)',
  },
  liveSmallDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FF4444' },
  liveSmallText: { color: '#FF4444', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },

  // Activity
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(168,85,247,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityText: { flex: 1, color: '#FFF', fontSize: 13, lineHeight: 17 },
  activityEnd: { alignItems: 'flex-end' },
  activityPoints: { fontSize: 12, fontWeight: '800' },
  activityTime: { color: 'rgba(255,255,255,0.45)', fontSize: 10.5, marginTop: 2 },

  // Perks
  claimedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  claimedIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimedTitle: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  claimedAthlete: { color: 'rgba(255,255,255,0.55)', fontSize: 11.5, marginTop: 2 },
  claimedCost: { color: PURPLE, fontSize: 12, fontWeight: '700' },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.35)',
    backgroundColor: 'rgba(168,85,247,0.08)',
  },
  balanceValue: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  balanceMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3 },

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
