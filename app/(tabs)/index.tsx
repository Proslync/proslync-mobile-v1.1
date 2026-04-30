import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  ScrollView,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { trackScreen } from '@/lib/analytics';

const ACTIVE_BLUE = '#3B82F6';

// ───── Types ─────

type GameStatus = 'LIVE' | 'FINAL' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'HALF' | 'OT' | 'PRE';

type Team = {
  abbr: string;
  name: string;
  color: string;
  record: string;
};

type Game = {
  id: string;
  away: Team;
  home: Team;
  awayScore: number;
  homeScore: number;
  status: GameStatus;
  clock?: string;       // game clock like '4:32' (live games)
  startTime?: string;   // pre-game start time '9:30 PM'
  date: string;         // 'Apr 23, 2026' for hero
  venue: string;
  viewers: string;      // '53.6k'
  comments: string;     // '28.8k'
};

type Moment = {
  id: string;
  gameId: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'OT' | 'HALF';
  clock: string;            // '1.6' or '4:32'
  awayScore: number;
  homeScore: number;
  ageMinutes: number;       // 5, 7, 8, etc.
  player: { name: string; initial: string; color: string; usePhoto?: boolean };
  headline: string;
  statLine: string;
  tags: { emoji: string; label: string }[];
  winProbDelta: number;     // +6.8, -8, etc. (positive = home favored)
  reactionTotal: string;    // '1.4k'
  reactionEmojis: string[]; // ['🔥', '🏀', '😤']
  comments: string;         // '2.3k'
};

// ───── Mock data ─────

const GAMES: Game[] = [
  {
    id: 'g-cuse-duke',
    away: { abbr: 'DUKE', name: 'Duke', color: '#001A57', record: '21-3' },
    home: { abbr: 'CUSE', name: 'Syracuse', color: '#F76900', record: '18-8' },
    awayScore: 54,
    homeScore: 62,
    status: 'FINAL',
    date: 'Apr 23, 2026',
    venue: 'JMA Wireless Dome',
    viewers: '53.6k',
    comments: '28.8k',
  },
  {
    id: 'g-cameron',
    away: { abbr: 'UNC', name: 'UNC', color: '#7BAFD4', record: '17-7' },
    home: { abbr: 'DUKE', name: 'Duke', color: '#001A57', record: '21-3' },
    awayScore: 68,
    homeScore: 71,
    status: 'FINAL',
    date: 'Apr 22, 2026',
    venue: 'Cameron Indoor Stadium',
    viewers: '92.1k',
    comments: '47.4k',
  },
  {
    id: 'g-chase',
    away: { abbr: 'LAL', name: 'Lakers', color: '#552583', record: '38-22' },
    home: { abbr: 'GSW', name: 'Warriors', color: '#FDB927', record: '36-24' },
    awayScore: 88,
    homeScore: 94,
    status: 'Q3',
    clock: '5:08',
    date: 'Tonight',
    venue: 'Chase Center',
    viewers: '142k',
    comments: '38.9k',
  },
];

const MOMENTS: Moment[] = [
  // ── g-cuse-duke moments (newest first) ──
  {
    id: 'm-1',
    gameId: 'g-cuse-duke',
    quarter: 'Q4', clock: '0.4',
    awayScore: 54, homeScore: 62,
    ageMinutes: 4,
    player: { name: 'Kiyan Anthony', initial: 'K', color: '#F76900', usePhoto: true },
    headline: 'Game-sealing pull-up 3',
    statLine: 'K. Anthony · 21 PTS · 7-13 FG',
    tags: [
      { emoji: '🔥', label: 'Career-high pace' },
      { emoji: '🏀', label: '3-straight makes' },
    ],
    winProbDelta: 18,
    reactionTotal: '4.2k',
    reactionEmojis: ['🔥', '🏀', '👑'],
    comments: '1.1k',
  },
  {
    id: 'm-2',
    gameId: 'g-cuse-duke',
    quarter: 'Q4', clock: '1:48',
    awayScore: 52, homeScore: 57,
    ageMinutes: 7,
    player: { name: 'Cooper Flagg', initial: 'C', color: '#001A57' },
    headline: 'Missed contested 17ʹ jumper',
    statLine: 'C. Flagg · 6-15 FG · 3/9 from 3',
    tags: [
      { emoji: '❄️', label: '4-of-last-12' },
      { emoji: '⚡', label: 'Key possession' },
    ],
    winProbDelta: -9,
    reactionTotal: '2.1k',
    reactionEmojis: ['😬', '🥲', '🏀'],
    comments: '648',
  },
  {
    id: 'm-3',
    gameId: 'g-cuse-duke',
    quarter: 'Q4', clock: '4:14',
    awayScore: 50, homeScore: 55,
    ageMinutes: 11,
    player: { name: 'Donnie Freeman', initial: 'D', color: '#F76900' },
    headline: 'Putback dunk + 1',
    statLine: 'D. Freeman · 14 PTS · 8 REB',
    tags: [
      { emoji: '💪', label: 'Crowd erupts' },
    ],
    winProbDelta: 7.2,
    reactionTotal: '1.6k',
    reactionEmojis: ['💪', '🔥', '🦁'],
    comments: '423',
  },
  {
    id: 'm-4',
    gameId: 'g-cuse-duke',
    quarter: 'Q3', clock: '0:00',
    awayScore: 44, homeScore: 50,
    ageMinutes: 18,
    player: { name: 'JJ Starling', initial: 'J', color: '#F76900' },
    headline: 'Buzzer-beater pull-up to end Q3',
    statLine: 'J. Starling · 11 PTS · 5 AST',
    tags: [
      { emoji: '⏱', label: 'Beat the buzzer' },
      { emoji: '🎯', label: 'Off the dribble' },
    ],
    winProbDelta: 6.8,
    reactionTotal: '2.8k',
    reactionEmojis: ['🎯', '🏀', '🔥'],
    comments: '882',
  },
  {
    id: 'm-5',
    gameId: 'g-cuse-duke',
    quarter: 'Q3', clock: '5:32',
    awayScore: 40, homeScore: 41,
    ageMinutes: 24,
    player: { name: 'Kiyan Anthony', initial: 'K', color: '#F76900', usePhoto: true },
    headline: 'And-one drive past Flagg',
    statLine: 'K. Anthony · 14 PTS · 5-9 FG',
    tags: [
      { emoji: '🔥', label: 'Hot streak' },
    ],
    winProbDelta: 5.4,
    reactionTotal: '3.1k',
    reactionEmojis: ['🔥', '👑', '💪'],
    comments: '914',
  },
  {
    id: 'm-6',
    gameId: 'g-cuse-duke',
    quarter: 'Q2', clock: '0:12',
    awayScore: 28, homeScore: 31,
    ageMinutes: 41,
    player: { name: 'Eddie Lampkin Jr.', initial: 'E', color: '#F76900' },
    headline: 'Block at the rim on Flagg',
    statLine: 'E. Lampkin · 4 BLK · 9 REB',
    tags: [
      { emoji: '🚫', label: 'Statement defense' },
    ],
    winProbDelta: 4.1,
    reactionTotal: '1.2k',
    reactionEmojis: ['🚫', '💪', '🦁'],
    comments: '376',
  },
  {
    id: 'm-7',
    gameId: 'g-cuse-duke',
    quarter: 'Q1', clock: '3:48',
    awayScore: 12, homeScore: 11,
    ageMinutes: 56,
    player: { name: 'Cooper Flagg', initial: 'C', color: '#001A57' },
    headline: 'Two-handed alley-oop slam',
    statLine: 'C. Flagg · 6 PTS early · 2-2 FG',
    tags: [
      { emoji: '💥', label: 'Highlight reel' },
      { emoji: '🏀', label: 'Lob from Knueppel' },
    ],
    winProbDelta: -3.2,
    reactionTotal: '5.4k',
    reactionEmojis: ['💥', '🔥', '😤'],
    comments: '1.8k',
  },
  // ── g-cameron moments ──
  {
    id: 'm-c-1',
    gameId: 'g-cameron',
    quarter: 'Q4', clock: '0:00',
    awayScore: 68, homeScore: 71,
    ageMinutes: 12,
    player: { name: 'Cooper Flagg', initial: 'C', color: '#001A57' },
    headline: 'Game-winning fadeaway',
    statLine: 'C. Flagg · 29 PTS · 10 REB · 3 BLK',
    tags: [
      { emoji: '👑', label: 'POG' },
      { emoji: '🔥', label: 'Wooden Award lock' },
    ],
    winProbDelta: 22,
    reactionTotal: '8.4k',
    reactionEmojis: ['👑', '🔥', '🐐'],
    comments: '2.4k',
  },
  {
    id: 'm-c-2',
    gameId: 'g-cameron',
    quarter: 'Q4', clock: '0:18',
    awayScore: 68, homeScore: 69,
    ageMinutes: 13,
    player: { name: 'RJ Davis', initial: 'R', color: '#7BAFD4' },
    headline: 'Tying corner three',
    statLine: 'R. Davis · 24 PTS · 6-11 from 3',
    tags: [
      { emoji: '🎯', label: 'Catch & shoot' },
    ],
    winProbDelta: -14,
    reactionTotal: '3.1k',
    reactionEmojis: ['🎯', '🥶', '🏀'],
    comments: '892',
  },
  {
    id: 'm-c-3',
    gameId: 'g-cameron',
    quarter: 'Q3', clock: '2:14',
    awayScore: 52, homeScore: 56,
    ageMinutes: 28,
    player: { name: 'Kon Knueppel', initial: 'K', color: '#001A57' },
    headline: 'Step-back triple over Davis',
    statLine: 'K. Knueppel · 18 PTS · 4-7 from 3',
    tags: [
      { emoji: '🥶', label: 'Cold-blooded' },
    ],
    winProbDelta: 5.4,
    reactionTotal: '1.9k',
    reactionEmojis: ['🥶', '🔥', '🏀'],
    comments: '534',
  },
  // ── g-chase moments ──
  {
    id: 'm-ch-1',
    gameId: 'g-chase',
    quarter: 'Q3', clock: '5:08',
    awayScore: 88, homeScore: 94,
    ageMinutes: 3,
    player: { name: 'Stephen Curry', initial: 'S', color: '#FDB927' },
    headline: 'Logo three over Reaves',
    statLine: 'S. Curry · 28 PTS · 4-8 from 3',
    tags: [
      { emoji: '🐐', label: 'Vintage Steph' },
      { emoji: '🎯', label: 'From 32 ft' },
    ],
    winProbDelta: 12,
    reactionTotal: '6.7k',
    reactionEmojis: ['🐐', '🔥', '🥶'],
    comments: '1.7k',
  },
  {
    id: 'm-ch-2',
    gameId: 'g-chase',
    quarter: 'Q3', clock: '7:42',
    awayScore: 84, homeScore: 86,
    ageMinutes: 7,
    player: { name: 'LeBron James', initial: 'L', color: '#552583' },
    headline: 'Chasedown block on Kuminga',
    statLine: 'L. James · 22 PTS · 8 AST · 2 BLK',
    tags: [
      { emoji: '💪', label: 'Defensive POG' },
    ],
    winProbDelta: -4.8,
    reactionTotal: '4.1k',
    reactionEmojis: ['💪', '🚫', '👑'],
    comments: '1.2k',
  },
];

// ───── Helpers ─────

function formatStatus(g: Game): string {
  if (g.status === 'FINAL') return 'Final';
  if (g.status === 'PRE') return g.startTime ?? 'Pre-game';
  if (g.status === 'HALF') return 'Halftime';
  if (g.status === 'OT') return `OT · ${g.clock}`;
  return g.clock ? `${g.status} · ${g.clock}` : g.status;
}

function quarterLabel(q: Moment['quarter']): string {
  switch (q) {
    case 'Q1': return '1st';
    case 'Q2': return '2nd';
    case 'Q3': return '3rd';
    case 'Q4': return '4th';
    case 'HALF': return 'Halftime';
    case 'OT': return 'OT';
  }
}

// ───── Components ─────

function GameTab({
  game,
  active,
  onPress,
}: {
  game: Game;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.gameTabWrap}>
      <View style={styles.gameTab}>
        <Text style={styles.gameTabStatus} numberOfLines={1}>
          {formatStatus(game)}
        </Text>
        <View style={styles.gameTabRow}>
          <View style={[styles.gameTabBadge, { backgroundColor: game.away.color }]}>
            <Text style={styles.gameTabBadgeText}>{game.away.abbr.charAt(0)}</Text>
          </View>
          <Text style={[styles.gameTabScore, game.homeScore > game.awayScore && styles.gameTabScoreDim]}>
            {game.awayScore}
          </Text>
          <Text style={styles.gameTabDash}>–</Text>
          <Text style={[styles.gameTabScore, game.awayScore > game.homeScore && styles.gameTabScoreDim]}>
            {game.homeScore}
          </Text>
          <View style={[styles.gameTabBadge, { backgroundColor: game.home.color }]}>
            <Text style={styles.gameTabBadgeText}>{game.home.abbr.charAt(0)}</Text>
          </View>
        </View>
      </View>
      {active && <View style={styles.gameTabUnderline} />}
    </Pressable>
  );
}

function HeroScoreboard({ game }: { game: Game }) {
  const awayWin = game.awayScore > game.homeScore;
  const homeWin = game.homeScore > game.awayScore;
  return (
    <View style={styles.heroCard}>
      <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
      <View style={styles.heroRow}>
        {/* Away */}
        <View style={styles.heroTeamCol}>
          <View style={[styles.heroLogo, { backgroundColor: game.away.color }]}>
            <Text style={styles.heroLogoText}>{game.away.abbr.charAt(0)}</Text>
          </View>
          <Text style={[styles.heroScore, !awayWin && game.status === 'FINAL' && styles.heroScoreDim]}>
            {game.awayScore}
          </Text>
          <Text style={styles.heroTeamName}>{game.away.name}</Text>
          <Text style={styles.heroTeamRecord}>({game.away.record})</Text>
        </View>

        {/* Center status */}
        <View style={styles.heroCenter}>
          <Text style={styles.heroStatus} numberOfLines={1}>
            {formatStatus(game)}
          </Text>
          <Text style={styles.heroDate} numberOfLines={1}>{game.date}</Text>
          <View style={styles.heroMetaRow}>
            <Ionicons name="eye-outline" size={11} color="rgba(255,255,255,0.5)" />
            <Text style={styles.heroMetaText}>{game.viewers}</Text>
            <Ionicons name="chatbubble-outline" size={11} color="rgba(255,255,255,0.5)" />
            <Text style={styles.heroMetaText}>{game.comments}</Text>
          </View>
        </View>

        {/* Home */}
        <View style={styles.heroTeamCol}>
          <View style={[styles.heroLogo, { backgroundColor: game.home.color }]}>
            <Text style={styles.heroLogoText}>{game.home.abbr.charAt(0)}</Text>
          </View>
          <Text style={[styles.heroScore, !homeWin && game.status === 'FINAL' && styles.heroScoreDim]}>
            {game.homeScore}
          </Text>
          <Text style={styles.heroTeamName}>{game.home.name}</Text>
          <Text style={styles.heroTeamRecord}>({game.home.record})</Text>
        </View>
      </View>
    </View>
  );
}

function SubTabRow({
  game,
  activeSubTab,
  onChange,
}: {
  game: Game;
  activeSubTab: string;
  onChange: (key: string) => void;
}) {
  const tabs = ['Feed', 'Game', game.away.abbr, game.home.abbr];
  return (
    <View style={styles.subTabRow}>
      {tabs.map((t) => {
        const isActive = activeSubTab === t;
        return (
          <Pressable
            key={t}
            onPress={() => onChange(t)}
            style={styles.subTabBtn}
          >
            <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>{t}</Text>
            {isActive && <View style={styles.subTabUnderline} />}
          </Pressable>
        );
      })}
    </View>
  );
}

function MomentSectionDivider({ label, score }: { label: string; score: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label} · {score}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

function MomentCard({ moment }: { moment: Moment }) {
  const isPositive = moment.winProbDelta >= 0;
  return (
    <View style={styles.momentCard}>
      <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
      {/* Top metadata row */}
      <View style={styles.momentMetaRow}>
        <View style={styles.momentMetaLeft}>
          <Text style={styles.momentScore}>
            {moment.awayScore}-{moment.homeScore}
          </Text>
          <Text style={styles.momentMetaDot}>·</Text>
          <Text style={styles.momentQuarter}>{moment.quarter} {moment.clock}</Text>
          <Text style={styles.momentMetaDot}>·</Text>
          <Text style={styles.momentAge}>{moment.ageMinutes}m</Text>
        </View>
        <View style={styles.winProbPill}>
          <Ionicons
            name={isPositive ? 'caret-up' : 'caret-down'}
            size={10}
            color={isPositive ? '#34C759' : '#FF4444'}
          />
          <Text style={[styles.winProbText, { color: isPositive ? '#34C759' : '#FF4444' }]}>
            {isPositive ? '+' : ''}{moment.winProbDelta}
          </Text>
        </View>
      </View>

      {/* Body row */}
      <View style={styles.momentBody}>
        {moment.player.usePhoto ? (
          <Image
            source={require('@/assets/images/kiyan-avatar.png')}
            style={styles.momentAvatar}
          />
        ) : (
          <View style={[styles.momentAvatar, { backgroundColor: moment.player.color, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={styles.momentAvatarInitial}>{moment.player.initial}</Text>
          </View>
        )}

        <View style={styles.momentContent}>
          <Text style={styles.momentHeadline}>{moment.headline}</Text>
          <Text style={styles.momentStatLine}>{moment.statLine}</Text>
          {moment.tags.length > 0 && (
            <View style={styles.momentTagsRow}>
              {moment.tags.map((t, i) => (
                <View key={i} style={styles.momentTagChip}>
                  <Text style={styles.momentTagEmoji}>{t.emoji}</Text>
                  <Text style={styles.momentTagText}>{t.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Bottom row */}
      <View style={styles.momentFooter}>
        <View style={styles.reactionsRow}>
          <Text style={styles.reactionCount}>{moment.reactionTotal}</Text>
          <View style={styles.emojiStack}>
            {moment.reactionEmojis.map((e, i) => (
              <View key={i} style={[styles.emojiBubble, i > 0 && { marginLeft: -8 }]}>
                <Text style={styles.emojiText}>{e}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.commentsRow}>
          <Ionicons name="chatbubble-outline" size={13} color="rgba(255,255,255,0.55)" />
          <Text style={styles.commentsCount}>{moment.comments}</Text>
          <Ionicons name="paper-plane-outline" size={13} color="rgba(255,255,255,0.55)" style={{ marginLeft: 6 }} />
        </View>
      </View>
    </View>
  );
}

function PlaceholderTab({ subTab }: { subTab: string }) {
  return (
    <View style={styles.placeholder}>
      <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
      <Ionicons name="construct-outline" size={28} color="rgba(255,255,255,0.4)" />
      <Text style={styles.placeholderTitle}>{subTab} view coming soon</Text>
      <Text style={styles.placeholderText}>
        Full game stats, team breakdowns, and player splits will land here.
      </Text>
    </View>
  );
}

// ───── Screen ─────

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [activeGameId, setActiveGameId] = useState(GAMES[0].id);
  const [activeSubTab, setActiveSubTab] = useState('Feed');

  useEffect(() => { trackScreen('feed', 'live-game'); }, []);

  const activeGame = GAMES.find((g) => g.id === activeGameId) ?? GAMES[0];
  const moments = MOMENTS.filter((m) => m.gameId === activeGameId);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  // Group moments by quarter for section dividers
  const grouped: { quarter: Moment['quarter']; awayScore: number; homeScore: number; items: Moment[] }[] = [];
  for (const m of moments) {
    const last = grouped[grouped.length - 1];
    if (last && last.quarter === m.quarter) {
      last.items.push(m);
    } else {
      grouped.push({ quarter: m.quarter, awayScore: m.awayScore, homeScore: m.homeScore, items: [m] });
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 62 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#888" />
        }
        stickyHeaderIndices={[]}
      >
        {/* Top game tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gameTabsScrollContent}
        >
          {GAMES.map((g) => (
            <GameTab
              key={g.id}
              game={g}
              active={g.id === activeGameId}
              onPress={() => {
                setActiveGameId(g.id);
                setActiveSubTab('Feed');
              }}
            />
          ))}
        </ScrollView>

        {/* Hero scoreboard */}
        <View style={{ paddingHorizontal: 14, marginTop: 6 }}>
          <HeroScoreboard game={activeGame} />
        </View>

        {/* Sub-tabs */}
        <SubTabRow
          game={activeGame}
          activeSubTab={activeSubTab}
          onChange={setActiveSubTab}
        />

        {/* Body */}
        {activeSubTab === 'Feed' ? (
          <View style={styles.feedBody}>
            {grouped.length === 0 ? (
              <View style={styles.emptyMoments}>
                <Text style={styles.emptyMomentsText}>No moments yet for this game.</Text>
              </View>
            ) : (
              grouped.map((group, gi) => (
                <View key={`${activeGameId}-${group.quarter}-${gi}`}>
                  <MomentSectionDivider
                    label={`End of ${quarterLabel(group.quarter)}`}
                    score={`${group.awayScore}-${group.homeScore}`}
                  />
                  {group.items.map((m, i) => (
                    <Animated.View
                      key={m.id}
                      entering={FadeInDown.delay(60 + i * 40).duration(280)}
                    >
                      <MomentCard moment={m} />
                    </Animated.View>
                  ))}
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 14, marginTop: 14 }}>
            <PlaceholderTab subTab={activeSubTab} />
          </View>
        )}
      </ScrollView>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      {/* Top-left floating icon — map */}
      <Pressable
        onPress={() => router.push('/(tabs)/search' as any)}
        style={[styles.topLeftCircleWrap, { top: insets.top + 8 }]}
        accessibilityLabel="Open map"
        accessibilityRole="button"
      >
        <View style={styles.topRightGlassLayer} pointerEvents="none">
          <GlassView
            glassEffectStyle="regular"
            style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
          />
        </View>
        <Ionicons name="map-outline" size={20} color="#FFF" />
      </Pressable>

      {/* Top-right floating icon — messages */}
      <Pressable
        onPress={() => router.push('/(tabs)/explore' as any)}
        style={[styles.topRightCircleWrap, { top: insets.top + 8 }]}
        accessibilityLabel="Open messages"
        accessibilityRole="button"
      >
        <View style={styles.topRightGlassLayer} pointerEvents="none">
          <GlassView
            glassEffectStyle="regular"
            style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
          />
        </View>
        <Ionicons name="paper-plane-outline" size={20} color="#FFF" />
      </Pressable>

    </View>
  );
}

// ───── Styles ─────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { paddingBottom: 200 },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 260, zIndex: 10 },

  // Top-corner floating icons (map left, messages right)
  topLeftCircleWrap: {
    position: 'absolute',
    left: 14,
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  topRightCircleWrap: {
    position: 'absolute',
    right: 14,
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  topRightGlassLayer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 23,
    overflow: 'hidden',
  },

  // Game tabs (horizontal scroll)
  gameTabsScrollContent: { paddingHorizontal: 14, gap: 14, paddingVertical: 4 },
  gameTabWrap: { alignItems: 'center', minWidth: 124 },
  gameTab: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 4,
  },
  gameTabStatus: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  gameTabRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gameTabBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameTabBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  gameTabScore: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  gameTabScoreDim: { color: 'rgba(255,255,255,0.5)' },
  gameTabDash: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  gameTabUnderline: {
    height: 2,
    backgroundColor: ACTIVE_BLUE,
    width: '70%',
    borderRadius: 1,
    marginTop: 2,
  },

  // Hero scoreboard
  heroCard: {
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTeamCol: { flex: 1, alignItems: 'center', gap: 2 },
  heroLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroLogoText: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  heroScore: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  heroScoreDim: { color: 'rgba(255,255,255,0.5)' },
  heroTeamName: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  heroTeamRecord: { fontSize: 10, color: 'rgba(255,255,255,0.45)' },
  heroCenter: { flex: 1.1, alignItems: 'center', gap: 4 },
  heroStatus: { fontSize: 13, color: '#FFF', fontWeight: '700', letterSpacing: 0.3 },
  heroDate: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  heroMetaText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    marginRight: 6,
  },

  // Sub-tabs
  subTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginTop: 14,
    gap: 24,
  },
  subTabBtn: { paddingBottom: 10, alignItems: 'center', gap: 8 },
  subTabText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
  },
  subTabTextActive: { color: '#FFF', fontWeight: '700' },
  subTabUnderline: {
    height: 2,
    backgroundColor: ACTIVE_BLUE,
    width: '120%',
    borderRadius: 1,
  },

  // Feed body
  feedBody: { paddingHorizontal: 14, gap: 8, marginTop: 6 },

  // Section divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 6,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.18)' },
  dividerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  // Moment card
  momentCard: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 6,
  },
  momentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  momentMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  momentScore: { fontSize: 12, color: '#FFF', fontWeight: '700' },
  momentMetaDot: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  momentQuarter: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  momentAge: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  winProbPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  winProbText: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },

  momentBody: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  momentAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
  },
  momentAvatarInitial: { fontSize: 26, fontWeight: '900', color: '#FFF' },
  momentContent: { flex: 1, gap: 4 },
  momentHeadline: { fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: -0.2 },
  momentStatLine: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  momentTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  momentTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  momentTagEmoji: { fontSize: 11 },
  momentTagText: { fontSize: 11, color: '#FFF', fontWeight: '600' },

  momentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  reactionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reactionCount: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  emojiStack: { flexDirection: 'row' },
  emojiBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  emojiText: { fontSize: 12 },
  commentsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentsCount: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },

  // Placeholder
  placeholder: {
    padding: 28,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  placeholderTitle: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  placeholderText: { fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center', maxWidth: 240 },

  // Empty
  emptyMoments: { paddingVertical: 60, alignItems: 'center' },
  emptyMomentsText: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
});
