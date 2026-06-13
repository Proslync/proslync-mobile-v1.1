import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from 'expo-glass-effect';
import * as React from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FanHomeFeed } from '@/components/fan/fan-home-feed';
import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import { FloatingTabPill, useTabCollapse } from '@/components/shared/floating-tab-pill';

import {
  FAN_FEED,
  FAN_FOLLOWING,
  FAN_GAMES,
  FAN_PERKS,
  FAN_PREDICTIONS,
  FAN_PROFILE,
  type FeedItem,
  type LiveGame,
  type Perk,
  type Prediction,
} from '@/lib/data/mock-fan-data';

const ACCENT = '#FF6F3C';
const PURPLE = '#A855F7';
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(255,255,255,0.09)';
const TAB_BAR_TOP_FROM_BOTTOM = 90; // iOS 26 floating glass tab bar — top edge from screen bottom (incl. safe area)

// Fan has 3 main tabs: Home / Pick'em / Perks.
// The inner Home sub-tabs (Following | Games) are left as-is.
const FAN_TABS = ['Home', "Pick'em", 'Perks'] as const;
type FanTabLabel = (typeof FAN_TABS)[number];

type TabKey = 'home' | 'pickem' | 'perks';

function tabLabelToKey(label: FanTabLabel): TabKey {
  if (label === 'Home') return 'home';
  if (label === "Pick'em") return 'pickem';
  return 'perks';
}
function tabKeyToLabel(key: TabKey): FanTabLabel {
  if (key === 'home') return 'Home';
  if (key === 'pickem') return "Pick'em";
  return 'Perks';
}

export function FanView() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<TabKey>('home');
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);
  const { collapsed, onScroll } = useTabCollapse();

  const topPad = insets.top + 16;
  const bottomPad = insets.bottom + 120;

  return (
    <View style={styles.container}>
      {activeTab === 'home' && <FanHomeFeed topInset={topPad} onScroll={onScroll} />}
      {activeTab === 'pickem' && <PickemTab topPad={topPad} bottomPad={bottomPad} onScroll={onScroll} />}
      {activeTab === 'perks' && <PerksTab topPad={topPad} bottomPad={bottomPad} onScroll={onScroll} />}

      {/* Top fade */}
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        locations={[0, 0.5, 1]}
        style={[styles.topFade, { height: insets.top + 28 }]}
        pointerEvents="none"
      />

      {/* Bottom fade */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 110 }]}
        pointerEvents="none"
      />

      {/* Floating bottom pill — 3 main tabs, 240 wide (fits "Pick'em") */}
      <FloatingTabPill
        tabs={FAN_TABS}
        activeKey={tabKeyToLabel(activeTab)}
        onSelect={(label) => setActiveTab(tabLabelToKey(label))}
        collapsed={collapsed}
        bottomInset={insets.bottom}
      />

      <RoleSwitcherSheet visible={roleSheetVisible} onClose={() => setRoleSheetVisible(false)} />
    </View>
  );
}

// ============================================================
// Tab 1 — Following Feed
// ============================================================

function HomeTab({ topPad, bottomPad }: { topPad: number; bottomPad: number }) {
  const [subTab, setSubTab] = React.useState<'following' | 'games'>('following');
  const SUB_TABS = [
    { key: 'following', label: 'Following', count: FAN_FOLLOWING.length },
    { key: 'games', label: 'Games', count: FAN_GAMES.length },
  ] as const;

  const subIndex = Math.max(0, SUB_TABS.findIndex((t) => t.key === subTab));
  const subPillWidth = useSharedValue(0);
  const animatedSubIndex = useSharedValue(subIndex);
  React.useEffect(() => {
    animatedSubIndex.value = withTiming(subIndex, { duration: 180 });
  }, [subIndex, animatedSubIndex]);
  const subKnobStyle = useAnimatedStyle(() => {
    const segW = subPillWidth.value / Math.max(SUB_TABS.length, 1);
    const inset = 4;
    return {
      width: Math.max(segW - inset * 2, 0),
      transform: [{ translateX: animatedSubIndex.value * segW + inset }],
    };
  });

  return (
    <View style={{ flex: 1, paddingTop: topPad }}>
      <View
        style={styles.subTabsRow}
        onLayout={(e) => {
          subPillWidth.value = e.nativeEvent.layout.width;
        }}
      >
        <View style={styles.glassLayer} pointerEvents="none">
          <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
        </View>
        <Animated.View style={[styles.tabKnob, subKnobStyle]} pointerEvents="none" />
        {SUB_TABS.map(({ key, label, count }) => {
          const isActive = subTab === key;
          return (
            <Pressable
              key={key}
              style={styles.subTab}
              onPress={() => setSubTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.subTabLabel, isActive && styles.subTabLabelActive]}>
                {label}
              </Text>
              <View style={[styles.subTabBadge, isActive && styles.subTabBadgeActive]}>
                <Text style={[styles.subTabBadgeText, isActive && styles.subTabBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {subTab === 'following' && <FeedTab bottomPad={bottomPad} />}
      {subTab === 'games' && <GamesTab bottomPad={bottomPad} />}
    </View>
  );
}

function FeedTab({ bottomPad }: { bottomPad: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Athlete strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.athleteStrip}
      >
        {FAN_FOLLOWING.map((a) => (
          <TouchableOpacity key={a.id} activeOpacity={0.7} style={styles.athleteChip}>
            <View
              style={[
                styles.athleteChipAvatar,
                {
                  backgroundColor: `${a.avatarColor}20`,
                  borderColor: a.isLive ? '#FF4444' : `${a.avatarColor}60`,
                },
              ]}
            >
              <Text style={[styles.athleteChipText, { color: a.avatarColor }]}>
                {a.initials}
              </Text>
              {a.isLive && <View style={styles.liveIndicator} />}
            </View>
            <Text style={styles.athleteChipName} numberOfLines={1}>
              {a.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.kicker}>LATEST · {FAN_FEED.length}</Text>
      {FAN_FEED.map((item, i) => (
        <FeedCard key={item.id} item={item} delay={i * 60} />
      ))}
    </ScrollView>
  );
}

function FeedCard({ item, delay }: { item: FeedItem; delay: number }) {
  const typeLabel = {
    highlight: '🔥 HIGHLIGHT',
    post: '📱 POST',
    announcement: '📣 ANNOUNCEMENT',
    milestone: '🏆 MILESTONE',
  }[item.type];

  const typeColor = {
    highlight: '#FF4444',
    post: PURPLE,
    announcement: ACCENT,
    milestone: '#F5B400',
  }[item.type];

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(380)}
      style={styles.feedCard}
    >
      <View style={styles.feedHead}>
        <View
          style={[
            styles.feedAvatar,
            {
              backgroundColor: `${item.athleteColor}20`,
              borderColor: `${item.athleteColor}60`,
            },
          ]}
        >
          <Text style={[styles.feedAvatarText, { color: item.athleteColor }]}>
            {item.athleteInitials}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.feedName}>{item.athleteName}</Text>
          <View style={styles.feedTypeRow}>
            <Text style={[styles.feedType, { color: typeColor }]}>{typeLabel}</Text>
            <Text style={styles.feedTime}>· {item.timeAgo}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.feedContent}>{item.content}</Text>
      <View style={styles.feedReactions}>
        <View style={styles.reactBtn}>
          <Ionicons name="heart-outline" size={15} color="rgba(255,255,255,0.7)" />
          <Text style={styles.reactText}>{item.reactions.likes.toLocaleString()}</Text>
        </View>
        <View style={styles.reactBtn}>
          <Ionicons name="chatbubble-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.reactText}>{item.reactions.comments.toLocaleString()}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={14} color={PURPLE} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ============================================================
// Tab 2 — Games Today
// ============================================================

function GamesTab({ bottomPad }: { bottomPad: number }) {
  const live = FAN_GAMES.filter((g) => g.status === 'live');
  const upcoming = FAN_GAMES.filter((g) => g.status === 'upcoming');
  const finals = FAN_GAMES.filter((g) => g.status === 'final');

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      {live.length > 0 && (
        <>
          <Text style={styles.kicker}>LIVE · {live.length}</Text>
          {live.map((g, i) => <GameCard key={g.id} g={g} delay={i * 60} />)}
        </>
      )}

      <Text style={styles.kicker}>UPCOMING</Text>
      {upcoming.map((g, i) => <GameCard key={g.id} g={g} delay={i * 60} />)}

      <Text style={styles.kicker}>FINAL · TODAY</Text>
      {finals.map((g, i) => <GameCard key={g.id} g={g} delay={i * 60} />)}
    </ScrollView>
  );
}

function GameCard({ g, delay }: { g: LiveGame; delay: number }) {
  const isLive = g.status === 'live';
  const isFinal = g.status === 'final';
  const borderColor = isLive ? 'rgba(255,68,68,0.35)' : CARD_BORDER;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(380)}
      style={[styles.gameCard, { borderColor }]}
    >
      {isLive && (
        <LinearGradient
          colors={['rgba(255,68,68,0.12)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.gameHeader}>
        {isLive && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>LIVE</Text>
          </View>
        )}
        {!isLive && (
          <Text
            style={[
              styles.gameStatusText,
              { color: isFinal ? 'rgba(255,255,255,0.5)' : ACCENT },
            ]}
          >
            {isFinal ? 'FINAL' : g.tipoff}
          </Text>
        )}
        {g.hasFollowedAthlete && (
          <View style={styles.followedChip}>
            <Ionicons name="star" size={9} color={PURPLE} />
            <Text style={styles.followedChipText}>Following</Text>
          </View>
        )}
        {isLive && (
          <Text style={styles.gameClock}>
            {g.quarter} · {g.clock}
          </Text>
        )}
      </View>

      <View style={styles.gameScoreRow}>
        <View style={styles.gameTeamBlock}>
          <Text style={styles.gameTeam}>{g.away}</Text>
          {g.awayScore !== undefined && (
            <Text
              style={[
                styles.gameScore,
                isLive && g.awayScore > (g.homeScore ?? 0) && styles.gameScoreLeading,
              ]}
            >
              {g.awayScore}
            </Text>
          )}
        </View>
        <Text style={styles.gameAt}>@</Text>
        <View style={styles.gameTeamBlock}>
          <Text style={styles.gameTeam}>{g.home}</Text>
          {g.homeScore !== undefined && (
            <Text
              style={[
                styles.gameScore,
                isLive && g.homeScore > (g.awayScore ?? 0) && styles.gameScoreLeading,
              ]}
            >
              {g.homeScore}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.gameFooter}>
        <Text style={styles.gameVenue}>{g.venue}</Text>
        {isLive && (
          <View style={styles.watchedRow}>
            <Ionicons name="eye-outline" size={11} color="rgba(255,255,255,0.5)" />
            <Text style={styles.watchedText}>
              {(g.watchedBy / 1000).toFixed(1)}K watching
            </Text>
          </View>
        )}
      </View>

      {isLive && (
        <TouchableOpacity activeOpacity={0.85} style={styles.watchBtn}>
          <Ionicons name="play" size={13} color="#FFFFFF" />
          <Text style={styles.watchBtnText}>Watch live stream</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ============================================================
// Tab 3 — Pick'em
// ============================================================

function PickemTab({ topPad, bottomPad, onScroll }: { topPad: number; bottomPad: number; onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void }) {
  const [picks, setPicks] = React.useState<Record<string, string | undefined>>(
    Object.fromEntries(FAN_PREDICTIONS.map((p) => [p.id, p.myPick])),
  );

  const setPick = (predId: string, optId: string) => {
    setPicks((prev) => ({ ...prev, [predId]: optId }));
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingTop: topPad, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <Animated.View entering={FadeIn.duration(300)} style={styles.fanScoreCard}>
        <LinearGradient
          colors={['rgba(168,85,247,0.18)', 'rgba(168,85,247,0.02)']}
          style={StyleSheet.absoluteFill}
        />
        <View>
          <Text style={styles.fanScoreLabel}>FAN SCORE · SEASON</Text>
          <Text style={styles.fanScoreValue}>{FAN_PROFILE.superfanPoints.toLocaleString()}</Text>
          <Text style={styles.fanScoreMeta}>
            #134 on the national leaderboard · up 22 this week
          </Text>
        </View>
        <View style={styles.fanScoreRight}>
          <Text style={styles.accuracyValue}>67%</Text>
          <Text style={styles.accuracyLabel}>accuracy</Text>
        </View>
      </Animated.View>

      {FAN_PREDICTIONS.map((p, i) => (
        <PredictionCard
          key={p.id}
          p={p}
          pick={picks[p.id]}
          onPick={(opt) => !p.locked && setPick(p.id, opt)}
          delay={i * 70}
        />
      ))}
    </ScrollView>
  );
}

function PredictionCard({
  p,
  pick,
  onPick,
  delay,
}: {
  p: Prediction;
  pick: string | undefined;
  onPick: (optId: string) => void;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(380)}
      style={[styles.predCard, p.locked && { opacity: 0.85 }]}
    >
      <View style={styles.predHead}>
        <Text style={styles.predLabel}>{p.label}</Text>
        <View style={[styles.potPill, p.locked && { opacity: 0.6 }]}>
          <Ionicons name="trophy" size={11} color={ACCENT} />
          <Text style={styles.potText}>{p.potPoints} pts</Text>
        </View>
      </View>
      <Text
        style={[
          styles.predDeadline,
          p.locked && { color: '#FF4444', fontWeight: '700' },
        ]}
      >
        {p.deadline}
      </Text>
      <View style={styles.predOpts}>
        {p.options.map((opt) => {
          const selected = pick === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={p.locked ? 1 : 0.7}
              onPress={() => onPick(opt.id)}
              style={[styles.predOpt, selected && styles.predOptSelected]}
            >
              <View style={styles.predOptBarTrack}>
                <View
                  style={[
                    styles.predOptBarFill,
                    {
                      width: `${opt.pct}%`,
                      backgroundColor: selected ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.07)',
                    },
                  ]}
                />
              </View>
              <View style={styles.predOptContent}>
                <Text
                  style={[
                    styles.predOptText,
                    selected && styles.predOptTextSelected,
                  ]}
                >
                  {opt.text}
                </Text>
                <Text
                  style={[
                    styles.predOptPct,
                    selected && { color: PURPLE, fontWeight: '800' },
                  ]}
                >
                  {opt.pct}%
                </Text>
              </View>
              {selected && (
                <View style={styles.predMyPick}>
                  <Ionicons name="checkmark-circle" size={12} color={PURPLE} />
                  <Text style={styles.predMyPickText}>YOUR PICK</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ============================================================
// Tab 4 — Perks
// ============================================================

function PerksTab({ topPad, bottomPad, onScroll }: { topPad: number; bottomPad: number; onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingTop: topPad, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {/* Tier progress */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.tierCard}>
        <LinearGradient
          colors={['rgba(168,85,247,0.22)', 'rgba(168,85,247,0.02)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tierRow}>
          <View style={styles.tierBadge}>
            <Ionicons name="diamond" size={22} color={PURPLE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tierCurrent}>{FAN_PROFILE.superfanTier} Tier</Text>
            <Text style={styles.tierPoints}>{FAN_PROFILE.superfanPoints.toLocaleString()} points</Text>
          </View>
          <Text style={styles.tierToNext}>+{FAN_PROFILE.pointsToNext} to {FAN_PROFILE.nextTier}</Text>
        </View>
        <View style={styles.tierTrack}>
          <View
            style={[
              styles.tierFill,
              {
                width: `${
                  (FAN_PROFILE.superfanPoints /
                    (FAN_PROFILE.superfanPoints + FAN_PROFILE.pointsToNext)) *
                  100
                }%`,
              },
            ]}
          />
        </View>
      </Animated.View>

      <Text style={styles.kicker}>AVAILABLE · {FAN_PERKS.filter((p) => !p.claimed).length}</Text>
      {FAN_PERKS.filter((p) => !p.claimed).map((p, i) => (
        <PerkCard key={p.id} p={p} delay={i * 70} />
      ))}

      <Text style={styles.kicker}>CLAIMED · {FAN_PERKS.filter((p) => p.claimed).length}</Text>
      {FAN_PERKS.filter((p) => p.claimed).map((p, i) => (
        <PerkCard key={p.id} p={p} delay={i * 70} />
      ))}
    </ScrollView>
  );
}

function PerkCard({ p, delay }: { p: Perk; delay: number }) {
  const icon: Record<Perk['type'], keyof typeof Ionicons.glyphMap> = {
    tickets: 'ticket',
    merch: 'shirt',
    experience: 'basketball',
    meet: 'people',
  };

  const tierColor: Record<Perk['tier'], string> = {
    Gold: '#F5B400',
    Platinum: '#C0C0C0',
    Diamond: PURPLE,
  };

  const affordable = FAN_PROFILE.superfanPoints >= p.cost;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(380)}
      style={[styles.perkCard, p.claimed && { opacity: 0.55 }]}
    >
      <View style={styles.perkIconBox}>
        <Ionicons name={icon[p.type]} size={22} color={ACCENT} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.perkTopRow}>
          <View style={[styles.perkTierPill, { borderColor: tierColor[p.tier], backgroundColor: `${tierColor[p.tier]}1a` }]}>
            <Text style={[styles.perkTierText, { color: tierColor[p.tier] }]}>
              {p.tier.toUpperCase()}
            </Text>
          </View>
          {p.claimed && (
            <View style={styles.claimedPill}>
              <Ionicons name="checkmark" size={11} color="#34C759" />
              <Text style={styles.claimedText}>CLAIMED</Text>
            </View>
          )}
        </View>
        <Text style={styles.perkTitle}>{p.title}</Text>
        <Text style={styles.perkAthlete}>{p.athlete}</Text>
        <Text style={styles.perkDesc}>{p.description}</Text>
        {!p.claimed && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.claimBtn,
              !affordable && styles.claimBtnDisabled,
            ]}
          >
            <Ionicons name="diamond-outline" size={13} color={affordable ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.claimBtnText, !affordable && { color: 'rgba(255,255,255,0.5)' }]}>
              {affordable ? 'Claim' : `Need ${(p.cost - FAN_PROFILE.superfanPoints).toLocaleString()} more`}
            </Text>
            <Text
              style={[
                styles.claimBtnCost,
                !affordable && { color: 'rgba(255,255,255,0.5)' },
              ]}
            >
              {p.cost.toLocaleString()} pts
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Sub-tab segmented switcher (Following | Games inside Home tab) — glass pill
  // matching the Home/Pick'em/Perks row above it.
  subTabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    position: 'relative',
  },
  subTab: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  subTabLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  subTabLabelActive: { color: '#FFF' },
  subTabBadge: {
    minWidth: 20,
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  subTabBadgeActive: { backgroundColor: ACCENT },
  subTabBadgeText: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.6)' },
  subTabBadgeTextActive: { color: '#FFF' },

  tabRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
    gap: 8,
    alignItems: 'center',
  },
  tabPill: {
    paddingHorizontal: 16,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tabPillActive: {
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderColor: 'rgba(168,85,247,0.4)',
  },
  tabPillText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  tabPillTextActive: { color: '#FF6F3C', fontWeight: '700' },

  // Floating header row — avatar pill + segmented tabs (matches player activity)
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 99 },
  headerScrollFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    paddingLeft: 3,
    paddingRight: 12,
    overflow: 'hidden',
  },
  headerPillAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerPillIcon: {
    marginLeft: 8,
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 23,
  },
  tabSegmentedPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  tabSegment: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabKnob: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },

  kicker: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 14,
  },

  // Feed — athlete strip
  athleteStrip: {
    paddingHorizontal: 0,
    paddingBottom: 4,
    gap: 12,
  },
  athleteChip: { alignItems: 'center', width: 64 },
  athleteChipAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  athleteChipText: { fontSize: 14, fontWeight: '800' },
  liveIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FF4444',
    borderWidth: 2,
    borderColor: '#000',
  },
  athleteChipName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
  },

  feedCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 14,
    backgroundColor: CARD_BG,
    marginBottom: 10,
  },
  feedHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedAvatarText: { fontSize: 13, fontWeight: '800' },
  feedName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  feedTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  feedType: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  feedTime: { color: 'rgba(255,255,255,0.45)', fontSize: 11 },
  feedContent: { color: '#FFFFFF', fontSize: 13.5, lineHeight: 19, marginBottom: 10 },
  feedReactions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  reactBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reactText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  shareBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(168,85,247,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Games
  gameCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    marginBottom: 10,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.4)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF4444' },
  livePillText: { color: '#FF4444', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  gameStatusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  followedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.35)',
  },
  followedChipText: { color: PURPLE, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.3 },
  gameClock: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  gameScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  gameTeamBlock: { flex: 1, alignItems: 'center' },
  gameTeam: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  gameScore: {
    fontSize: 36,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  gameScoreLeading: { color: '#FFFFFF' },
  gameAt: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginHorizontal: 4 },

  gameFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  gameVenue: { fontSize: 11, color: 'rgba(255,255,255,0.45)' },
  watchedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  watchedText: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },

  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,68,68,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.4)',
  },
  watchBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // Pick'em
  fanScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    marginBottom: 14,
  },
  fanScoreLabel: { fontSize: 10, color: PURPLE, letterSpacing: 0.8, fontWeight: '800' },
  fanScoreValue: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginTop: 4 },
  fanScoreMeta: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  fanScoreRight: { alignItems: 'center' },
  accuracyValue: { color: PURPLE, fontSize: 26, fontWeight: '800' },
  accuracyLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
    marginTop: 2,
    fontWeight: '600',
  },

  predCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    marginBottom: 10,
  },
  predHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  predLabel: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  potPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.3)',
  },
  potText: { color: ACCENT, fontSize: 11, fontWeight: '800' },
  predDeadline: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    marginBottom: 10,
  },
  predOpts: { gap: 6 },
  predOpt: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  predOptSelected: { borderColor: 'rgba(168,85,247,0.5)' },
  predOptBarTrack: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  predOptBarFill: { height: '100%' },
  predOptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  predOptText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  predOptTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  predOptPct: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  predMyPick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  predMyPickText: {
    fontSize: 9.5,
    color: PURPLE,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Perks
  tierCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    marginBottom: 10,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  tierBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierCurrent: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  tierPoints: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  tierToNext: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  tierTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  tierFill: { height: 6, borderRadius: 3, backgroundColor: PURPLE },

  perkCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    marginBottom: 10,
  },
  perkIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  perkTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  perkTierPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  perkTierText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  claimedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.3)',
  },
  claimedText: { color: '#34C759', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  perkTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  perkAthlete: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3 },
  perkDesc: { color: 'rgba(255,255,255,0.55)', fontSize: 11.5, marginTop: 4, lineHeight: 16 },

  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(168,85,247,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.4)',
  },
  claimBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  claimBtnText: { flex: 1, color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  claimBtnCost: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },

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
  },
  toolbarPillText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
