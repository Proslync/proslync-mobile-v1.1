import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { FeedNavBar } from '@/components/feed/feed-nav-bar';
import { SearchSheet } from '@/components/shared/search-sheet';
import { trackScreen } from '@/lib/analytics';

const { width: SCREEN_W } = Dimensions.get('window');

// ───── Card types ─────

type ScoreLine = { team: string; score: number };
type GameCardData = {
  kind: 'game';
  id: string;
  away: ScoreLine;
  home: ScoreLine;
  status: 'LIVE' | 'FINAL' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'HALF' | 'OT';
  clock?: string;
  venue: string;
  leader?: { name: string; line: string };
  featured?: boolean; // Kiyan is in it
};

type DealCardData = {
  kind: 'deal';
  id: string;
  brand: string;
  brandLogoColor: string;
  brandInitial: string;
  dealType: string;
  category: string;
  compLine: string;
  deadline: string;
  network: 'open' | 'invite';
  matchScore: number; // 0-100
};

type PersonCardData = {
  kind: 'person';
  id: string;
  name: string;
  handle: string;
  sport: string;
  school: string;
  avatarColor: string;
  initial: string;
  followers: string;
  tag?: string; // "Top 3 PG nationally" etc.
  mutualCount?: number;
  verified?: boolean;
};

type DiscoveryItem = GameCardData | DealCardData | PersonCardData;
type FilterMode = 'For You' | 'Following';
type HeroPick =
  | { kind: 'game'; item: GameCardData; reason: 'LIVE' | 'FEATURED' }
  | { kind: 'deal'; item: DealCardData; reason: 'TOP MATCH' }
  | { kind: 'person'; item: PersonCardData; reason: 'TRENDING' };

// ───── Mock data ─────

const GAMES: GameCardData[] = [
  {
    kind: 'game',
    id: 'g-cuse-duke',
    away: { team: 'DUKE', score: 54 },
    home: { team: 'CUSE', score: 62 },
    status: 'Q4',
    clock: '4:32',
    venue: 'JMA Wireless Dome',
    leader: { name: 'Kiyan Anthony', line: '21 PTS · 4 REB · 3 AST · FG 7-13' },
    featured: true,
  },
  {
    kind: 'game',
    id: 'g-cameron',
    away: { team: 'UNC', score: 68 },
    home: { team: 'DUKE', score: 71 },
    status: 'FINAL',
    venue: 'Cameron Indoor Stadium',
    leader: { name: 'Cooper Flagg', line: '29 PTS · 10 REB · 3 BLK · FG 11-18' },
  },
  {
    kind: 'game',
    id: 'g-chase',
    away: { team: 'LAL', score: 88 },
    home: { team: 'GSW', score: 94 },
    status: 'Q3',
    clock: '5:08',
    venue: 'Chase Center',
    leader: { name: 'Stephen Curry', line: '28 PTS · 6 AST · 4-8 3P' },
  },
  {
    kind: 'game',
    id: 'g-watsco',
    away: { team: 'CUSE', score: 38 },
    home: { team: 'MIA', score: 33 },
    status: 'Q2',
    clock: '6:14',
    venue: 'Watsco Center',
    leader: { name: 'Kiyan Anthony', line: '12 PTS · 2 REB · FG 4-7' },
    featured: true,
  },
  {
    kind: 'game',
    id: 'g-jpj',
    away: { team: 'ND', score: 59 },
    home: { team: 'UVA', score: 64 },
    status: 'Q4',
    clock: '1:42',
    venue: 'John Paul Jones Arena',
    leader: { name: 'M. Trimble', line: '20 PTS · 5 AST' },
  },
];

const DEALS: DealCardData[] = [
  {
    kind: 'deal',
    id: 'd-puma',
    brand: 'PUMA Hoops',
    brandLogoColor: '#E11E2B',
    brandInitial: 'P',
    dealType: 'Signature line · MB.04 NY Edition',
    category: 'Footwear · Apparel',
    compLine: '$85k + 4% royalty',
    deadline: 'Offer expires Friday',
    network: 'invite',
    matchScore: 97,
  },
  {
    kind: 'deal',
    id: 'd-celsius',
    brand: 'Celsius',
    brandLogoColor: '#00C2A8',
    brandInitial: 'C',
    dealType: 'Gameday Series · 3 posts + tunnel cut',
    category: 'Beverage',
    compLine: '$12k – $18k',
    deadline: 'Apply by Apr 28',
    network: 'open',
    matchScore: 89,
  },
  {
    kind: 'deal',
    id: 'd-jordan',
    brand: 'Jordan Brand',
    brandLogoColor: '#111',
    brandInitial: 'J',
    dealType: 'Capsule drop · 500 units',
    category: 'Apparel',
    compLine: '$65k + sample tier',
    deadline: 'Decision by EOD',
    network: 'invite',
    matchScore: 94,
  },
  {
    kind: 'deal',
    id: 'd-beats',
    brand: 'Beats by Dre',
    brandLogoColor: '#E52321',
    brandInitial: 'B',
    dealType: 'Studio session + social reel',
    category: 'Audio',
    compLine: '$8k flat + product',
    deadline: 'Slot open Tue',
    network: 'invite',
    matchScore: 84,
  },
  {
    kind: 'deal',
    id: 'd-bodyarmor',
    brand: 'BODYARMOR',
    brandLogoColor: '#0A2342',
    brandInitial: 'B',
    dealType: 'Postseason campaign · 4 deliverables',
    category: 'Sports Drink',
    compLine: '$22k – $38k',
    deadline: 'Apply by May 3',
    network: 'open',
    matchScore: 78,
  },
];

const PEOPLE: PersonCardData[] = [
  {
    kind: 'person',
    id: 'p-coop',
    name: 'Cooper Flagg',
    handle: 'coopflagg',
    sport: 'Basketball',
    school: 'Duke',
    avatarColor: '#001A57',
    initial: 'C',
    followers: '2.4M',
    tag: 'Wooden Award Watch',
    mutualCount: 3,
    verified: true,
  },
  {
    kind: 'person',
    id: 'p-dylan',
    name: 'Dylan Harper',
    handle: 'dylanharper',
    sport: 'Basketball',
    school: 'Rutgers',
    avatarColor: '#CC0033',
    initial: 'D',
    followers: '812K',
    tag: 'Top 5 PG · Class of 2024',
    mutualCount: 4,
    verified: true,
  },
  {
    kind: 'person',
    id: 'p-ace',
    name: 'Ace Bailey',
    handle: 'acebailey',
    sport: 'Basketball',
    school: 'Rutgers',
    avatarColor: '#CC0033',
    initial: 'A',
    followers: '640K',
    tag: '5★ prospect',
    mutualCount: 2,
    verified: true,
  },
  {
    kind: 'person',
    id: 'p-maya',
    name: 'Maya Chen',
    handle: 'mayachen',
    sport: 'Soccer',
    school: 'UCLA',
    avatarColor: '#2774AE',
    initial: 'M',
    followers: '318K',
    tag: 'Hermann Trophy nominee',
    mutualCount: 1,
  },
  {
    kind: 'person',
    id: 'p-jalen',
    name: 'Jalen Ortiz',
    handle: 'jortiz',
    sport: 'Football',
    school: 'Michigan',
    avatarColor: '#00274C',
    initial: 'J',
    followers: '1.1M',
    tag: 'Big Ten OPOTY',
    verified: true,
  },
  {
    kind: 'person',
    id: 'p-jj',
    name: 'JJ Starling',
    handle: 'jj_starling',
    sport: 'Basketball',
    school: 'Syracuse',
    avatarColor: '#F76900',
    initial: 'J',
    followers: '244K',
    tag: 'Cuse backcourt',
    mutualCount: 9,
  },
];

// ───── Prioritization helpers ─────

function parseFollowers(s: string): number {
  const n = parseFloat(s);
  if (s.endsWith('M')) return n * 1_000_000;
  if (s.endsWith('K')) return n * 1_000;
  return n || 0;
}

function isLiveStatus(s: GameCardData['status']): boolean {
  return s !== 'FINAL';
}

function isFollowing(item: DiscoveryItem): boolean {
  switch (item.kind) {
    case 'game':
      return !!item.featured;
    case 'deal':
      return item.network === 'invite';
    case 'person':
      return (item.mutualCount ?? 0) >= 3;
  }
}

function applyFilter<T extends DiscoveryItem>(items: T[], filter: FilterMode): T[] {
  if (filter === 'For You') return items;
  return items.filter(isFollowing);
}

function pickHero(filter: FilterMode): HeroPick | null {
  const games = applyFilter(GAMES, filter);
  const liveFeatured = games.find((g) => isLiveStatus(g.status) && g.featured);
  if (liveFeatured) return { kind: 'game', item: liveFeatured, reason: 'LIVE' };

  const liveAny = games.find((g) => isLiveStatus(g.status));
  if (liveAny) return { kind: 'game', item: liveAny, reason: 'LIVE' };

  const deals = applyFilter(DEALS, filter);
  const topDeal = [...deals].sort((a, b) => b.matchScore - a.matchScore)[0];
  if (topDeal) return { kind: 'deal', item: topDeal, reason: 'TOP MATCH' };

  const people = applyFilter(PEOPLE, filter);
  const topPerson = [...people].sort(
    (a, b) => parseFollowers(b.followers) - parseFollowers(a.followers),
  )[0];
  if (topPerson) return { kind: 'person', item: topPerson, reason: 'TRENDING' };

  return null;
}

function getLiveGames(filter: FilterMode, excludeId?: string): GameCardData[] {
  return applyFilter(GAMES, filter)
    .filter((g) => isLiveStatus(g.status) && g.id !== excludeId)
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
}

function getRecentGames(filter: FilterMode, excludeId?: string): GameCardData[] {
  return applyFilter(GAMES, filter).filter(
    (g) => g.status === 'FINAL' && g.id !== excludeId,
  );
}

function getMatchedDeals(filter: FilterMode, excludeId?: string, limit = 3): DealCardData[] {
  return applyFilter(DEALS, filter)
    .filter((d) => d.id !== excludeId)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

function getSuggestedPeople(
  filter: FilterMode,
  excludeId?: string,
): PersonCardData[] {
  return applyFilter(PEOPLE, filter)
    .filter((p) => p.id !== excludeId)
    .sort((a, b) => parseFollowers(b.followers) - parseFollowers(a.followers));
}

// ───── Section + layout primitives ─────

function SectionHeader({
  label,
  accent,
  onSeeAll,
}: {
  label: string;
  accent?: string;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderLeft}>
        {accent && <View style={[styles.sectionDot, { backgroundColor: accent }]} />}
        <Text style={styles.sectionHeaderText}>{label}</Text>
      </View>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.6} hitSlop={8}>
          <Text style={styles.sectionSeeAll}>See all →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function HorizontalCarousel<T extends { id: string }>({
  items,
  renderItem,
  snapInterval,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactElement;
  snapInterval?: number;
}) {
  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => renderItem(item)}
      contentContainerStyle={styles.carouselContent}
      ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
      showsHorizontalScrollIndicator={false}
      snapToInterval={snapInterval}
      decelerationRate="fast"
    />
  );
}

function FollowingEmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>Nothing here yet</Text>
      <Text style={styles.emptyText}>
        Follow more athletes, accept invite-only deals, and we'll surface what you care
        about here.
      </Text>
    </View>
  );
}

// ───── Card components (full-width, default) ─────

function GameCard({ data, onPress }: { data: GameCardData; onPress: () => void }) {
  const isLive = isLiveStatus(data.status);
  const leaderIsAway = data.away.score > data.home.score;
  const leaderIsHome = data.home.score > data.away.score;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
      <View style={styles.gameHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.gameClockRow}>
            {isLive && <View style={styles.gameLiveDot} />}
            <Text style={styles.gameClock}>
              {isLive && data.clock ? `${data.status} · ${data.clock}` : data.status}
            </Text>
          </View>
          <Text style={styles.gameVenue} numberOfLines={1}>{data.venue}</Text>
        </View>
      </View>

      <View style={styles.gameScoreboard}>
        <View style={styles.gameTeamRow}>
          <Text style={[styles.gameTeam, !leaderIsAway && styles.gameTeamDim]}>{data.away.team}</Text>
          <Text style={[styles.gameScore, !leaderIsAway && styles.gameScoreDim]}>{data.away.score}</Text>
        </View>
        <View style={styles.gameTeamRow}>
          <Text style={[styles.gameTeam, !leaderIsHome && styles.gameTeamDim]}>{data.home.team}</Text>
          <Text style={[styles.gameScore, !leaderIsHome && styles.gameScoreDim]}>{data.home.score}</Text>
        </View>
      </View>

      {data.leader && (
        <View style={styles.gameLeaderRow}>
          <Image
            source={require('@/assets/images/kiyan-avatar.png')}
            style={styles.gameLeaderAvatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.gameLeaderName, data.featured && { color: '#FF6F3C' }]}>{data.leader.name}</Text>
            <Text style={styles.gameLeaderLine}>{data.leader.line}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function CompactGameCard({ data, onPress }: { data: GameCardData; onPress: () => void }) {
  const isLive = isLiveStatus(data.status);
  const leaderIsAway = data.away.score > data.home.score;
  const leaderIsHome = data.home.score > data.away.score;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.compactGameCard}>
      <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
      <View style={styles.compactGameClockRow}>
        {isLive && <View style={styles.gameLiveDot} />}
        <Text style={styles.gameClock} numberOfLines={1}>
          {isLive && data.clock ? `${data.status} · ${data.clock}` : data.status}
        </Text>
        {data.featured && (
          <View style={styles.compactFeatPill}>
            <Text style={styles.compactFeatPillText}>YOU</Text>
          </View>
        )}
      </View>
      <View style={styles.compactGameScores}>
        <View style={styles.gameTeamRow}>
          <Text style={[styles.compactGameTeam, !leaderIsAway && styles.gameTeamDim]}>{data.away.team}</Text>
          <Text style={[styles.compactGameScore, !leaderIsAway && styles.gameScoreDim]}>{data.away.score}</Text>
        </View>
        <View style={styles.gameTeamRow}>
          <Text style={[styles.compactGameTeam, !leaderIsHome && styles.gameTeamDim]}>{data.home.team}</Text>
          <Text style={[styles.compactGameScore, !leaderIsHome && styles.gameScoreDim]}>{data.home.score}</Text>
        </View>
      </View>
      <Text style={styles.compactGameVenue} numberOfLines={1}>{data.venue}</Text>
    </TouchableOpacity>
  );
}

function CompactRecentGameCard({ data, onPress }: { data: GameCardData; onPress: () => void }) {
  const winnerIsAway = data.away.score > data.home.score;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.recentRow}>
      <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
      <View style={styles.recentStatusCol}>
        <Text style={styles.recentStatusText}>FINAL</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.recentTeamRow}>
          <Text style={[styles.recentTeamName, !winnerIsAway && styles.recentTeamDim]} numberOfLines={1}>
            {data.away.team}
          </Text>
          <Text style={[styles.recentScore, !winnerIsAway && styles.recentScoreDim]}>{data.away.score}</Text>
        </View>
        <View style={styles.recentTeamRow}>
          <Text style={[styles.recentTeamName, winnerIsAway && styles.recentTeamDim]} numberOfLines={1}>
            {data.home.team}
          </Text>
          <Text style={[styles.recentScore, winnerIsAway && styles.recentScoreDim]}>{data.home.score}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function matchColor(score: number) {
  // 0 → red (255,68,68); 100 → green (52,199,89). Linearly interpolate.
  const t = Math.max(0, Math.min(100, score)) / 100;
  const r = Math.round(255 + (52 - 255) * t);
  const g = Math.round(68 + (199 - 68) * t);
  const b = Math.round(68 + (89 - 68) * t);
  return `rgb(${r},${g},${b})`;
}

function DealCard({ data, onPress }: { data: DealCardData; onPress: () => void }) {
  const matchC = matchColor(data.matchScore);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
      <View
        style={[
          styles.dealMatchCircle,
          { borderColor: matchC, backgroundColor: 'transparent' },
        ]}
      >
        <Text style={[styles.dealMatchCircleScore, { color: matchC }]}>
          {data.matchScore}
        </Text>
      </View>

      <View style={[styles.dealHeader, { paddingRight: 60 }]}>
        {data.brand === 'PUMA Hoops' ? (
          <Image
            source={require('@/assets/images/contact-puma.png')}
            style={styles.dealLogo}
          />
        ) : (
          <View style={[styles.dealLogo, { backgroundColor: data.brandLogoColor }]}>
            <Text style={styles.dealLogoInitial}>{data.brandInitial}</Text>
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.dealBrand} numberOfLines={1}>{data.brand}</Text>
          <Text style={styles.dealType} numberOfLines={1}>{data.dealType}</Text>
          <Text style={styles.dealCategory} numberOfLines={1}>{data.category}</Text>
        </View>
      </View>

      <View style={styles.dealMetaRow}>
        <View style={styles.dealMetaChip}>
          <Text style={styles.dealMetaLabel}>Comp</Text>
          <Text style={styles.dealMetaValue}>{data.compLine}</Text>
        </View>
        <View style={styles.dealMetaChip}>
          <Text style={styles.dealMetaLabel}>Deadline</Text>
          <Text style={styles.dealMetaValue}>{data.deadline}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.applyBtn} activeOpacity={0.85}>
        <Text style={styles.applyBtnText}>Apply</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function PersonCard({ data, onPress }: { data: PersonCardData; onPress: () => void }) {
  const [following, setFollowing] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
      <View style={styles.personRow}>
        <View style={[styles.personAvatar, { backgroundColor: data.avatarColor }]}>
          <Text style={styles.personAvatarInitial}>{data.initial}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.personNameRow}>
            <Text style={styles.personName} numberOfLines={1}>{data.name}</Text>
            {data.verified && <MaterialCommunityIcons name="check-decagram" size={14} color="#FF6F3C" />}
          </View>
          <Text style={styles.personMeta} numberOfLines={1}>
            {data.sport}  ·  {data.school}  ·  {data.followers} followers
          </Text>
          {data.tag && <Text style={styles.personTag} numberOfLines={1}>{data.tag}</Text>}
          {data.mutualCount != null && data.mutualCount > 0 && (
            <Text style={styles.personMutual}>{data.mutualCount} mutual{data.mutualCount === 1 ? '' : 's'}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.followBtn, following && styles.followBtnActive]}
          activeOpacity={0.8}
          onPress={(e) => { e.stopPropagation?.(); setFollowing((v) => !v); }}
        >
          <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function CompactPersonCard({ data, onPress }: { data: PersonCardData; onPress: () => void }) {
  const [following, setFollowing] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.compactPersonCard}>
      <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
      <View style={[styles.compactPersonAvatar, { backgroundColor: data.avatarColor }]}>
        <Text style={styles.compactPersonAvatarInitial}>{data.initial}</Text>
      </View>
      <View style={styles.compactPersonNameRow}>
        <Text style={styles.compactPersonName} numberOfLines={1}>{data.name}</Text>
        {data.verified && <MaterialCommunityIcons name="check-decagram" size={12} color="#FF6F3C" />}
      </View>
      <Text style={styles.compactPersonMeta} numberOfLines={1}>{data.sport} · {data.school}</Text>
      <Text style={styles.compactPersonFollowers} numberOfLines={1}>{data.followers} followers</Text>
      <TouchableOpacity
        style={[styles.compactFollowBtn, following && styles.compactFollowBtnActive]}
        activeOpacity={0.8}
        onPress={(e) => { e.stopPropagation?.(); setFollowing((v) => !v); }}
      >
        <Text style={[styles.compactFollowBtnText, following && styles.compactFollowBtnTextActive]}>
          {following ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ───── Hero card ─────

function HeroCard({
  pick,
  onPress,
}: {
  pick: HeroPick;
  onPress: () => void;
}) {
  const inner =
    pick.kind === 'game' ? (
      <GameCard data={pick.item} onPress={onPress} />
    ) : pick.kind === 'deal' ? (
      <DealCard data={pick.item} onPress={onPress} />
    ) : (
      <PersonCard data={pick.item} onPress={onPress} />
    );
  return (
    <View style={styles.heroWrap}>
      <View style={styles.heroBorder}>
        {inner}
      </View>
      <View style={styles.heroPill}>
        {pick.reason === 'LIVE' && <View style={styles.heroPillDot} />}
        <Text style={styles.heroPillText}>{pick.reason}</Text>
      </View>
    </View>
  );
}

// ───── Screen ─────

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterMode>('For You');
  const [searchVisible, setSearchVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { trackScreen('feed', 'discovery'); }, []);

  const sections = React.useMemo(() => {
    const hero = pickHero(activeFilter);
    const heroId = hero?.item.id;
    return {
      hero,
      liveGames: getLiveGames(activeFilter, hero?.kind === 'game' ? heroId : undefined),
      matchedDeals: getMatchedDeals(activeFilter, hero?.kind === 'deal' ? heroId : undefined),
      suggestedPeople: getSuggestedPeople(
        activeFilter,
        hero?.kind === 'person' ? heroId : undefined,
      ),
      recentGames: getRecentGames(activeFilter, hero?.kind === 'game' ? heroId : undefined),
    };
  }, [activeFilter]);

  const totalCount =
    (sections.hero ? 1 : 0) +
    sections.liveGames.length +
    sections.matchedDeals.length +
    sections.suggestedPeople.length +
    sections.recentGames.length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const handleGamePress = useCallback(() => {
    router.push('/(tabs)/search' as any);
  }, [router]);

  const handleDealPress = useCallback(() => {
    router.push('/(tabs)/profile' as any);
  }, [router]);

  const handlePersonPress = useCallback(
    (p: PersonCardData) => {
      router.push({ pathname: '/user/[username]', params: { username: p.handle } } as any);
    },
    [router],
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#888" />
        }
      >
        {sections.hero && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <HeroCard
              pick={sections.hero}
              onPress={
                sections.hero.kind === 'game'
                  ? handleGamePress
                  : sections.hero.kind === 'deal'
                    ? handleDealPress
                    : () => handlePersonPress(sections.hero!.item as PersonCardData)
              }
            />
          </Animated.View>
        )}

        {sections.liveGames.length > 0 && (
          <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.section}>
            <SectionHeader label="LIVE & UPCOMING" accent="#FF6F3C" />
            <HorizontalCarousel
              items={sections.liveGames}
              snapInterval={290}
              renderItem={(item) => (
                <CompactGameCard data={item} onPress={handleGamePress} />
              )}
            />
          </Animated.View>
        )}

        {sections.matchedDeals.length > 0 && (
          <Animated.View entering={FadeInDown.delay(120).duration(300)} style={styles.section}>
            <SectionHeader label="MATCHED FOR YOU" accent="#FF6F3C" />
            <View style={styles.verticalSection}>
              {sections.matchedDeals.map((deal) => (
                <DealCard key={deal.id} data={deal} onPress={handleDealPress} />
              ))}
            </View>
          </Animated.View>
        )}

        {sections.suggestedPeople.length > 0 && (
          <Animated.View entering={FadeInDown.delay(180).duration(300)} style={styles.section}>
            <SectionHeader label="ATHLETES TO FOLLOW" />
            <HorizontalCarousel
              items={sections.suggestedPeople}
              snapInterval={210}
              renderItem={(item) => (
                <CompactPersonCard data={item} onPress={() => handlePersonPress(item)} />
              )}
            />
          </Animated.View>
        )}

        {sections.recentGames.length > 0 && (
          <Animated.View entering={FadeInDown.delay(240).duration(300)} style={styles.section}>
            <SectionHeader label="RECENT RESULTS" />
            <View style={styles.verticalSectionTight}>
              {sections.recentGames.map((g) => (
                <CompactRecentGameCard key={g.id} data={g} onPress={handleGamePress} />
              ))}
            </View>
          </Animated.View>
        )}

        {totalCount === 0 && <FollowingEmptyState />}
      </ScrollView>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <FeedNavBar
        activeFilter={activeFilter}
        onFilterChange={(f) => setActiveFilter(f as FilterMode)}
        onSearchPress={() => setSearchVisible(true)}
        onSharePress={() => {}}
      />

      <SearchSheet visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </View>
  );
}

// ───── Styles ─────

const CARD_PAD = 14;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 260, zIndex: 10 },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 130, zIndex: 5 },
  listContent: { paddingBottom: 200, paddingHorizontal: 14, gap: 18 },

  // Section primitives
  section: { gap: 10 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
  },
  sectionSeeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: -0.1,
  },
  verticalSection: { gap: 12 },
  verticalSectionTight: { gap: 8 },
  carouselContent: { paddingHorizontal: 0, paddingRight: 14 },

  // Hero
  heroWrap: { position: 'relative' },
  heroBorder: {
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.45)',
    padding: 0,
    overflow: 'hidden',
  },
  heroPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,111,60,0.95)',
    zIndex: 6,
  },
  heroPillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' },
  heroPillText: { fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 0.8 },

  // Empty state
  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  emptyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },

  // Generic card
  card: {
    borderRadius: 18,
    padding: CARD_PAD,
    gap: 12,
    overflow: 'hidden',
  },

  // Game card
  gameHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  gameClockRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  gameLiveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF4444' },
  gameClock: { fontSize: 12, fontWeight: '800', color: '#FF6F3C', letterSpacing: 0.6, textTransform: 'uppercase' },
  gameVenue: { flex: 1, fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  gameScoreboard: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 12, gap: 8 },
  gameTeamRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gameTeam: { fontSize: 17, fontWeight: '800', color: '#FFF', letterSpacing: 0.4 },
  gameTeamDim: { color: 'rgba(255,255,255,0.55)' },
  gameScore: { fontSize: 28, fontWeight: '900', color: '#FFF', fontVariant: ['tabular-nums'], letterSpacing: -0.6 },
  gameScoreDim: { color: 'rgba(255,255,255,0.55)' },
  gameLeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  gameLeaderAvatar: { width: 36, height: 36, borderRadius: 18 },
  gameLeaderName: { fontSize: 13, fontWeight: '700', color: '#FFF', letterSpacing: -0.1 },
  gameLeaderLine: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1, letterSpacing: -0.1 },

  // Compact game card (horizontal scroll)
  compactGameCard: {
    width: 280,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    overflow: 'hidden',
  },
  compactGameClockRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  compactFeatPill: {
    marginLeft: 'auto',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,111,60,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.5)',
  },
  compactFeatPillText: { fontSize: 9, fontWeight: '900', color: '#FF6F3C', letterSpacing: 0.6 },
  compactGameScores: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 10, gap: 6 },
  compactGameTeam: { fontSize: 15, fontWeight: '800', color: '#FFF', letterSpacing: 0.4 },
  compactGameScore: { fontSize: 22, fontWeight: '900', color: '#FFF', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  compactGameVenue: { fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: -0.1 },

  // Recent results row (vertical, compact)
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  recentStatusCol: {
    width: 50,
    alignItems: 'center',
  },
  recentStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.45)',
  },
  recentTeamRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recentTeamName: { fontSize: 14, fontWeight: '700', color: '#FFF', letterSpacing: -0.1 },
  recentTeamDim: { color: 'rgba(255,255,255,0.5)' },
  recentScore: { fontSize: 16, fontWeight: '800', color: '#FFF', fontVariant: ['tabular-nums'] },
  recentScoreDim: { color: 'rgba(255,255,255,0.5)' },

  // Deal card
  dealHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dealLogo: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dealLogoInitial: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.4 },
  dealBrand: { fontSize: 15, fontWeight: '700', color: '#FFF', letterSpacing: -0.2 },
  dealType: { fontSize: 14, color: 'rgba(255,255,255,0.85)', letterSpacing: -0.1 },
  dealCategory: { fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.2, textTransform: 'uppercase' },
  dealMetaRow: { flexDirection: 'row', gap: 8 },
  dealMetaChip: { flex: 1, paddingVertical: 4, gap: 2 },
  dealMatchCircle: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  dealMatchCircleScore: { fontSize: 14, fontWeight: '800', lineHeight: 18 },
  dealMetaLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' },
  dealMetaValue: { fontSize: 13, color: '#FFF', fontWeight: '700', letterSpacing: -0.1 },
  applyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  applyBtnText: { fontSize: 14, fontWeight: '700', color: '#000', letterSpacing: 0.2 },

  // Person card
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  personAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  personAvatarInitial: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  personNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  personName: { fontSize: 15, fontWeight: '700', color: '#FFF', letterSpacing: -0.2 },
  personMeta: { fontSize: 12, color: 'rgba(255,255,255,0.55)', letterSpacing: -0.1 },
  personTag: { fontSize: 12, color: '#FF6F3C', fontWeight: '700', letterSpacing: -0.1, marginTop: 2 },
  personMutual: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  followBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#FFF' },
  followBtnActive: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)' },
  followBtnText: { fontSize: 13, fontWeight: '800', color: '#000', letterSpacing: -0.1 },
  followBtnTextActive: { color: '#FFF' },

  // Compact person card (horizontal scroll)
  compactPersonCard: {
    width: 200,
    borderRadius: 16,
    padding: 14,
    gap: 4,
    overflow: 'hidden',
    alignItems: 'flex-start',
  },
  compactPersonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  compactPersonAvatarInitial: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  compactPersonNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compactPersonName: { fontSize: 14, fontWeight: '700', color: '#FFF', letterSpacing: -0.2 },
  compactPersonMeta: { fontSize: 11, color: 'rgba(255,255,255,0.55)' },
  compactPersonFollowers: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 8 },
  compactFollowBtn: {
    alignSelf: 'stretch',
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  compactFollowBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  compactFollowBtnText: { fontSize: 12, fontWeight: '800', color: '#000', letterSpacing: -0.1 },
  compactFollowBtnTextActive: { color: '#FFF' },
});
