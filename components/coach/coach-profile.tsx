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
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVideoPlayer, VideoView } from 'expo-video';
import { persistLocalMedia, isLocalMediaAlive, type LocalMedia } from '@/lib/media/local-media';
import { resolveSlotMedia } from '@/lib/media/resolve-media';
import Animated, {
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Extrapolation,
} from 'react-native-reanimated';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStableRouter } from '@/hooks/use-stable-router';
import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';

const BANNER_KEY = 'proslync:coachprofile:banner:v2';
const BANNER_KEY_LEGACY = 'proslync:coachprofile:bannerVideo:v1';

const ACCENT = '#FF6F3C';
const TAB_BAR_TOP_FROM_BOTTOM = 90; // iOS 26 floating glass tab bar — top edge from screen bottom (incl. safe area)

const COACH = {
  firstName: 'Glenn',
  lastName: 'Farello',
  username: 'coachfarello',
  metaPrimary: 'Head Coach at Paul VI Catholic',
  metaSecondary: 'Fairfax, Virginia',
  bio: [
    {
      key: 'philosophy',
      title: 'Coaching Philosophy',
      body: "Defense wins. Pace controls. Culture compounds. We play the most disciplined 32 minutes in the WCAC — rim-to-rim, shoulders squared, and everybody accountable for the next guy. I don't coach stars; I coach decisions. The stars take care of themselves.",
    },
    {
      key: 'career',
      title: 'Career Highlights',
      body: '318–82 career record over 14 seasons. 4× WCAC Tournament champion (\'18, \'21, \'23, \'25). 2024 GEICO Nationals quarterfinalist. 27 players committed to D1 programs including Duke, Villanova, Maryland, Georgetown, and UConn.',
    },
    {
      key: 'background',
      title: 'Background',
      body: 'Raised in Brooklyn, played point guard at Boston College (2003-07). Started coaching as a Georgetown graduate assistant in 2009, then three seasons on Patrick Ewing\'s staff before taking the Paul VI job in 2012.',
    },
    {
      key: 'program',
      title: 'Program',
      body: 'Paul VI Catholic · Fairfax, VA · WCAC (Washington Catholic Athletic Conference). Home: Carmel Hall. Rival: DeMatha Catholic. 2025-26 projected: #3 nationally by ESPN, #2 by MaxPreps.',
    },
    {
      key: 'life',
      title: 'Off the Court',
      body: 'Husband to Dr. Amara Thompson (OB/GYN at Inova Fairfax). Girl-dad of two: Imani (9) and Zahra (6). Open-water swimmer. Sub-3:15 marathoner. Unreasonable about sleep hygiene.',
    },
  ],
  focus: [
    {
      key: 'recruiting',
      title: 'Recruiting',
      body: 'Class of \'26 ranked top-5 nationally — 3 Chipotle Nationals watchlist names, 2 McDonald\'s All-American nominees. Active in the \'27 and \'28 classes in the DMV and Tri-State regions.',
    },
    {
      key: 'devo',
      title: 'Player Development',
      body: 'Individual film sessions 2× a week per starter. Shot-diet reviewed every Monday with analytics lead. Strength + sleep monitored via whoop across the entire top-9.',
    },
    {
      key: 'analytics',
      title: 'Analytics',
      body: 'Partnered with Proslync AI since 2024 — pre-scout generation, in-game pattern flags, and post-game film pipeline. Eliminated ~14 hours of weekly scout prep.',
    },
  ],
  watchlist: [
    {
      id: 'rec-1', name: 'Tre Johnson', position: 'PG', school: 'Lake Highland Prep (FL)',
      classYear: 'HS \'26', initials: 'TJ', color: '#FFD60A',
      rank: '#3 ESPN · 5★', stats: '27.4 PPG · 8.2 APG · 5.1 RPG',
      latestUpdate: 'Officially visited Kentucky · committed to take a Duke OV next month.',
      timeAgo: '2 days ago', trending: 'up' as const,
    },
    {
      id: 'rec-2', name: 'Marcus Reyes', position: 'SF', school: 'Sierra Canyon (CA)',
      classYear: 'HS \'26', initials: 'MR', color: '#3B82F6',
      rank: '#11 ESPN · 5★', stats: '24.8 PPG · 7.6 RPG · 3.4 APG',
      latestUpdate: 'Dropped 38 in title game on Saturday — 14-of-22 from the floor.',
      timeAgo: '4 days ago', trending: 'up' as const,
    },
    {
      id: 'rec-3', name: 'Devin Owusu', position: 'C', school: 'Combine Academy (NC)',
      classYear: 'HS \'27', initials: 'DO', color: '#A855F7',
      rank: '#28 247 · 4★', stats: '18.1 PPG · 12.4 RPG · 3.8 BPG',
      latestUpdate: 'Cut list to 6 — UConn, Houston, Auburn, Duke, UNC, Kentucky.',
      timeAgo: '1 week ago', trending: 'flat' as const,
    },
    {
      id: 'rec-4', name: 'Cooper Gibbs', position: 'SG', school: 'IMG Academy (FL)',
      classYear: 'HS \'27', initials: 'CG', color: '#FF6F3C',
      rank: '#52 ESPN · 4★', stats: '19.2 PPG · 4.4 APG · 41% from 3',
      latestUpdate: 'Foot stress reaction — out 4-6 weeks. Recovery on track per trainer.',
      timeAgo: '5 days ago', trending: 'down' as const,
    },
    {
      id: 'rec-5', name: 'Andre Lacy', position: 'PF', school: 'IMG Academy (FL)',
      classYear: 'HS \'28', initials: 'AL', color: '#14B8A6',
      rank: 'Unranked Sophomore · rising', stats: '15.6 PPG · 9.0 RPG (varsity sophomore)',
      latestUpdate: 'First D1 offer in — Maryland. National coverage starting to build.',
      timeAgo: '3 days ago', trending: 'up' as const,
    },
  ],
  staff: [
    { name: 'Ray Diggs', role: 'Associate Head Coach · Defense' },
    { name: 'Travis Smith', role: 'Assistant · Analytics' },
    { name: 'Jon McCloud', role: 'Assistant · Recruiting' },
    { name: 'Sarah Rivera', role: 'Director of Ops' },
  ],
  commits: [
    { name: 'Jordan Miles', year: "'26", to: 'Duke', pos: 'SG' },
    { name: 'Marcus Reid', year: "'26", to: 'Villanova', pos: 'PG' },
    { name: 'Aaron Brooks', year: "'26", to: 'Maryland', pos: 'SF' },
    { name: 'Tyrese Alston', year: "'27", to: 'Uncommitted', pos: 'C' },
  ],
  recentWins: [
    { date: 'Apr 19', opponent: 'DeMatha Catholic', result: 'W 74-68', note: 'WCAC semifinal · Road' },
    { date: 'Apr 17', opponent: 'Bishop O\'Connell', result: 'W 82-61', note: 'Senior night' },
    { date: 'Apr 15', opponent: 'St. John\'s College HS', result: 'W 69-64', note: 'OT · Dan McPherson clutch' },
    { date: 'Apr 12', opponent: '@ Gonzaga College HS', result: 'L 64-71', note: 'Turnover-heavy 4th' },
    { date: 'Apr 9', opponent: 'Bishop Ireton', result: 'W 88-52', note: '' },
  ],
};

type TabKey = 'about' | 'focus' | 'staff' | 'commits' | 'results';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'focus', label: 'Focus' },
  { key: 'staff', label: 'Staff' },
  { key: 'commits', label: 'Commits' },
  { key: 'results', label: 'Results' },
];

export default function CoachProfile() {
  const insets = useSafeAreaInsets();
  const router = useStableRouter();
  const [tab, setTab] = React.useState<TabKey>('about');
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(['philosophy']));
  const [isEditing, setIsEditing] = React.useState(false);
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);

  // Persistent custom banner (image or video) for the coach profile. v2
  // stores { uri, type }; v1 stored a bare video URI and is migrated on
  // first hydration.
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
        // Orphan healing: a reinstall wipes documentDirectory but not always
        // AsyncStorage — drop pointers to files that no longer exist so the
        // curated default shows instead of a black box.
        if (next && !(await isLocalMediaAlive(next.uri))) next = null;
        if (!cancelled && next) setBanner(next);
      } catch {
        // ignore corrupt storage
      } finally {
        if (!cancelled) setBannerHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  React.useEffect(() => {
    if (!bannerHydrated) return;
    if (banner) {
      // Legacy key dies only after the v2 write succeeds (crash-safe migration).
      AsyncStorage.setItem(BANNER_KEY, JSON.stringify(banner))
        .then(() => AsyncStorage.removeItem(BANNER_KEY_LEGACY))
        .catch(() => {});
    } else {
      AsyncStorage.removeItem(BANNER_KEY).catch(() => {});
      AsyncStorage.removeItem(BANNER_KEY_LEGACY).catch(() => {});
    }
  }, [banner, bannerHydrated]);

  const bannerMedia = React.useMemo(
    () => resolveSlotMedia('coach-banner', banner),
    [banner],
  );
  const bannerVideoUri =
    bannerMedia.kind !== 'none' && bannerMedia.type === 'video' ? bannerMedia.uri : null;

  const bannerPlayer = useVideoPlayer(bannerVideoUri ?? null, (p) => {
    if (!p) return;
    p.loop = true;
    p.muted = true;
    p.play();
  });

  React.useEffect(() => {
    if (!bannerPlayer || !bannerVideoUri) return;
    bannerPlayer.play();
    const sub = bannerPlayer.addListener('playingChange', (e: any) => {
      if (!e?.isPlaying) {
        try { bannerPlayer.play(); } catch {}
      }
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

  const removeBanner = React.useCallback(() => {
    setBanner(null);
  }, []);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const dimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [0, 1], Extrapolation.CLAMP),
  }));

  // Segmented pill knob (matches Kiyan)
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

  return (
    <View style={styles.container}>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Banner — matches player profile: image/video + subtle dark tint */}
        <View
          style={[
            styles.bannerWrap,
            { height: insets.top + 290, backgroundColor: '#000' },
          ]}
          pointerEvents="none"
        >
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
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.28)' }]}
            pointerEvents="none"
          />
        </View>

        {/* Tab row — segmented glass pill with sliding knob (matches Kiyan) */}
        <View style={styles.tabsRow}>
          <View
            style={styles.tabSegmentedPill}
            onLayout={(e) => {
              tabPillWidth.value = e.nativeEvent.layout.width;
            }}
          >
            <View style={styles.tabsGlassLayer} pointerEvents="none">
              <GlassView
                glassEffectStyle="regular"
                style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
              />
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
              const active = tab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={styles.tabSegment}
                  onPress={() => setTab(t.key)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[styles.tabPillText, active && styles.tabPillTextActive]}
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
        <View style={styles.tabContent}>
          {tab === 'about' && (
            <View style={styles.aboutSection}>
              <View style={styles.aboutBlockBare}>
                <View
                  style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16 }]}
                  pointerEvents="none"
                />
                <View style={styles.aboutBlockGlass} pointerEvents="none">
                  {isLiquidGlassSupported ? (
                    <LiquidGlassView
                      effect="regular"
                      tintColor="rgba(255,255,255,0.10)"
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  ) : (
                    <GlassView
                      glassEffectStyle="regular"
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  )}
                </View>
                {COACH.bio.map((section, idx) => {
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

          {tab === 'focus' && (
            <View style={styles.aboutSection}>
              <View style={styles.aboutBlockBare}>
                <View
                  style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16 }]}
                  pointerEvents="none"
                />
                <View style={styles.aboutBlockGlass} pointerEvents="none">
                  {isLiquidGlassSupported ? (
                    <LiquidGlassView
                      effect="regular"
                      tintColor="rgba(255,255,255,0.10)"
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  ) : (
                    <GlassView
                      glassEffectStyle="regular"
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  )}
                </View>
                {COACH.focus.map((section, idx) => {
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

              {/* Recruiting watchlist — players the coach is following from other teams / HS */}
              <View style={styles.aboutBlockBare}>
                <View
                  style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16 }]}
                  pointerEvents="none"
                />
                <View style={styles.aboutBlockGlass} pointerEvents="none">
                  {isLiquidGlassSupported ? (
                    <LiquidGlassView
                      effect="regular"
                      tintColor="rgba(255,255,255,0.10)"
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  ) : (
                    <GlassView
                      glassEffectStyle="regular"
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  )}
                </View>

                {/* Header inside the container */}
                <View style={styles.watchlistContainerHeader}>
                  <Text style={styles.watchlistTitle}>Watchlist</Text>
                  <Text style={styles.watchlistSub}>{COACH.watchlist.length} players · news, stats, updates</Text>
                </View>

                {COACH.watchlist.map((p, idx) => {
                  const isOpen = expanded.has(`watch-${p.id}`);
                  return (
                    <Animated.View
                      key={p.id}
                      entering={FadeInDown.delay(idx * 50).duration(360)}
                      style={styles.watchlistRow}
                    >
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggle(`watch-${p.id}`)}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: isOpen }}
                      >
                        <View style={styles.watchlistRowHead}>
                          <View style={[styles.watchlistAvatar, { backgroundColor: p.color }]}>
                            <Text style={styles.watchlistAvatarText}>{p.initials}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.watchlistNameRow}>
                              <Text style={styles.watchlistName} numberOfLines={1}>{p.name}</Text>
                              <Ionicons
                                name={p.trending === 'up' ? 'caret-up' : p.trending === 'down' ? 'caret-down' : 'remove'}
                                size={14}
                                color={p.trending === 'up' ? '#34C759' : p.trending === 'down' ? '#FF453A' : 'rgba(255,255,255,0.55)'}
                              />
                            </View>
                            <Text style={styles.watchlistMeta} numberOfLines={1}>
                              {p.position} · {p.classYear} · {p.school}
                            </Text>
                          </View>
                          <Ionicons
                            name={isOpen ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="rgba(255,255,255,0.6)"
                          />
                        </View>
                      </TouchableOpacity>

                      {isOpen && (
                        <View style={styles.watchlistExpanded}>
                          <View style={styles.watchlistFollowingRow}>
                            <Text style={styles.watchlistRank}>{p.rank}</Text>
                            <TouchableOpacity style={styles.watchlistFollowingPill} activeOpacity={0.7}>
                              <Ionicons name="checkmark" size={11} color="#FF6F3C" />
                              <Text style={styles.watchlistFollowingText}>Following</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.watchlistStats}>{p.stats}</Text>
                          <View style={styles.watchlistUpdateRow}>
                            <View style={styles.watchlistUpdateDot} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.watchlistUpdate}>{p.latestUpdate}</Text>
                              <Text style={styles.watchlistTime}>{p.timeAgo}</Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </Animated.View>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.watchlistAddBtn} activeOpacity={0.7}>
                <Ionicons name="add-circle-outline" size={18} color={ACCENT} />
                <Text style={styles.watchlistAddText}>Add player to watchlist</Text>
              </TouchableOpacity>
            </View>
          )}

          {tab === 'staff' && (
            <View style={styles.listSection}>
              <View style={styles.aboutBlockBare}>
                <View
                  style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16 }]}
                  pointerEvents="none"
                />
                <View style={styles.aboutBlockGlass} pointerEvents="none">
                  {isLiquidGlassSupported ? (
                    <LiquidGlassView
                      effect="regular"
                      tintColor="rgba(255,255,255,0.10)"
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  ) : (
                    <GlassView
                      glassEffectStyle="regular"
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  )}
                </View>
                {COACH.staff.map((s, i) => (
                  <Animated.View
                    key={s.name}
                    entering={FadeInDown.delay(i * 60).duration(400)}
                    style={[styles.row, i !== COACH.staff.length - 1 && styles.rowDivider]}
                  >
                    <View style={styles.staffAvatar}>
                      <Text style={styles.staffInitial}>
                        {s.name.split(' ').map((p) => p[0]).join('')}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{s.name}</Text>
                      <Text style={styles.rowMeta}>{s.role}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}

          {tab === 'commits' && (
            <View style={styles.listSection}>
              <View style={styles.aboutBlockBare}>
                <View
                  style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16 }]}
                  pointerEvents="none"
                />
                <View style={styles.aboutBlockGlass} pointerEvents="none">
                  {isLiquidGlassSupported ? (
                    <LiquidGlassView
                      effect="regular"
                      tintColor="rgba(255,255,255,0.10)"
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  ) : (
                    <GlassView
                      glassEffectStyle="regular"
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  )}
                </View>
                {COACH.commits.map((c, i) => (
                  <Animated.View
                    key={c.name}
                    entering={FadeInDown.delay(i * 60).duration(400)}
                    style={[styles.row, i !== COACH.commits.length - 1 && styles.rowDivider]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{c.name}</Text>
                      <Text style={styles.rowMeta}>{c.year} · {c.pos}</Text>
                    </View>
                    <View
                      style={[
                        styles.pill,
                        c.to === 'Uncommitted' && styles.pillMuted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          c.to === 'Uncommitted' && { color: 'rgba(255,255,255,0.6)' },
                        ]}
                      >
                        {c.to}
                      </Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}

          {tab === 'results' && (
            <View style={styles.listSection}>
              <View style={styles.aboutBlockBare}>
                <View
                  style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16 }]}
                  pointerEvents="none"
                />
                <View style={styles.aboutBlockGlass} pointerEvents="none">
                  {isLiquidGlassSupported ? (
                    <LiquidGlassView
                      effect="regular"
                      tintColor="rgba(255,255,255,0.10)"
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  ) : (
                    <GlassView
                      glassEffectStyle="regular"
                      style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                    />
                  )}
                </View>
                {COACH.recentWins.map((g, i) => {
                  const won = g.result.startsWith('W');
                  return (
                    <Animated.View
                      key={`${g.date}-${g.opponent}`}
                      entering={FadeInDown.delay(i * 60).duration(400)}
                      style={[styles.row, i !== COACH.recentWins.length - 1 && styles.rowDivider]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{g.opponent}</Text>
                        <Text style={styles.rowMeta}>
                          {g.date}
                          {g.note ? ` · ${g.note}` : ''}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.rowResult,
                          { color: won ? '#34C759' : '#FF4444' },
                        ]}
                      >
                        {g.result}
                      </Text>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Bottom darken gradient — gives the floating tab bar glass something to refract */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 100 }]}
        pointerEvents="none"
      />

      {/* Top-left floating profile pill — avatar + hamburger (matches Kiyan) */}
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
          source={require('@/assets/images/coach-avatar.png')}
          style={styles.topLeftProfilePillAvatar}
        />
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

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollDim: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
  topBarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topBarUsername: { fontSize: 20, fontWeight: '700', color: '#FFF' },

  bannerWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#000' },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    marginTop: -180,
    marginBottom: 5,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: '#1a1c22',
  },
  rightCol: { flex: 1, marginLeft: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  metaLine: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  metaLinePrimary: { color: '#FFF', fontWeight: '700' },

  tabsRow: {
    flexDirection: 'row',
    marginTop: -34,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
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

  tabContent: { marginTop: -20 },
  aboutSection: { paddingHorizontal: 16, paddingVertical: 20, gap: 12 },
  listSection: { paddingHorizontal: 16, paddingVertical: 20, gap: 12 },
  aboutBlockBare: {
    gap: 10,
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  aboutBlockGlass: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  aboutLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: ACCENT,
    textTransform: 'uppercase',
  },

  bioItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
    paddingBottom: 2,
    gap: 8,
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bioTitle: { fontSize: 15, color: '#FFF', fontWeight: '600' },
  bioBody: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    letterSpacing: -0.1,
  },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowTitle: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  rowMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  rowResult: { fontSize: 13, fontWeight: '700' },

  staffAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  staffInitial: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.35)',
  },
  pillMuted: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pillText: { color: ACCENT, fontSize: 12, fontWeight: '700' },

  bottomToolbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 100,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
  toolbarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarPill: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toolbarPillActive: {},
  toolbarPillText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

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
