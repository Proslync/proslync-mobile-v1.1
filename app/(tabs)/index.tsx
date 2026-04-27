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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
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

// Interleave the three stacks so the feed reads like a mixed discovery view
function buildFeed(): DiscoveryItem[] {
  const feed: DiscoveryItem[] = [];
  const maxLen = Math.max(GAMES.length, DEALS.length, PEOPLE.length);
  for (let i = 0; i < maxLen; i++) {
    if (GAMES[i]) feed.push(GAMES[i]);
    if (DEALS[i]) feed.push(DEALS[i]);
    if (PEOPLE[i]) feed.push(PEOPLE[i]);
  }
  return feed;
}

// ───── Card components ─────

function SectionKicker({ icon, label, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }) {
  return (
    <View style={styles.kickerRow}>
      <View style={[styles.kickerIcon, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
        <Ionicons name={icon} size={11} color={color} />
      </View>
      <Text style={[styles.kickerText, { color }]}>{label}</Text>
    </View>
  );
}

function GameCard({ data, onPress }: { data: GameCardData; onPress: () => void }) {
  const isLive = data.status !== 'FINAL';
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

// ───── Screen ─────

export default function FeedScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('For You');
  const [searchVisible, setSearchVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { trackScreen('feed', 'discovery'); }, []);

  const feed = React.useMemo(() => buildFeed(), []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const handleGamePress = useCallback((g: GameCardData) => {
    router.push('/(tabs)/search' as any);
  }, [router]);

  const handleDealPress = useCallback((d: DealCardData) => {
    // Placeholder — link to deals screen when it exists
    router.push('/(tabs)/profile' as any);
  }, [router]);

  const handlePersonPress = useCallback((p: PersonCardData) => {
    router.push({ pathname: '/user/[username]', params: { username: p.handle } } as any);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: DiscoveryItem }) => {
    switch (item.kind) {
      case 'game':
        return <GameCard data={item} onPress={() => handleGamePress(item)} />;
      case 'deal':
        return <DealCard data={item} onPress={() => handleDealPress(item)} />;
      case 'person':
        return <PersonCard data={item} onPress={() => handlePersonPress(item)} />;
    }
  }, [handleGamePress, handleDealPress, handlePersonPress]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        data={feed}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#888" />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <FeedNavBar
        activeFilter={activeFilter}
        onFilterChange={(f) => setActiveFilter(f)}
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
  listContent: { paddingTop: 60, paddingBottom: 160, paddingHorizontal: 14 },
  listHeader: { paddingHorizontal: 2, paddingBottom: 14 },
  listHeaderTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: -0.4 },
  listHeaderSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4, letterSpacing: -0.1 },

  card: {
    borderRadius: 18,
    padding: CARD_PAD,
    gap: 12,
    overflow: 'hidden',
  },

  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kickerIcon: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  kickerText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },

  // Game card
  gameHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  gameClockRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  gameLiveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF4444' },
  gameClock: { fontSize: 12, fontWeight: '800', color: '#FF6F3C', letterSpacing: 0.6, textTransform: 'uppercase' },
  gameVenue: { flex: 1, fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  gameStatusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.10)' },
  gameStatusPillLive: { backgroundColor: '#FF6F3C' },
  gameStatusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFF' },
  gameStatusText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
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

  // Deal card
  dealHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dealLogo: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dealLogoInitial: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: -0.4 },
  dealBrand: { fontSize: 15, fontWeight: '700', color: '#FFF', letterSpacing: -0.2 },
  dealType: { fontSize: 14, color: 'rgba(255,255,255,0.85)', letterSpacing: -0.1 },
  dealCategory: { fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.2, textTransform: 'uppercase' },
  dealMatchPill: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(255,111,60,0.14)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,111,60,0.45)' },
  dealMatchLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, color: 'rgba(255,111,60,0.85)' },
  dealMatchScore: { fontSize: 16, fontWeight: '900', color: '#FF6F3C', fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
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
  dealNetworkPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: StyleSheet.hairlineWidth },
  dealNetworkOpen: { borderColor: 'rgba(52,199,89,0.4)' },
  dealNetworkInvite: { borderColor: 'rgba(255,111,60,0.4)' },
  dealNetworkDot: { width: 6, height: 6, borderRadius: 3 },
  dealNetworkText: { fontSize: 11, fontWeight: '700', color: '#FFF', letterSpacing: 0.2 },
  dealCtaRow: { flexDirection: 'row', gap: 6 },
  ghostBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.06)' },
  ghostBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF', letterSpacing: -0.1 },
  primaryGhostBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,111,60,0.45)', backgroundColor: 'rgba(255,111,60,0.12)' },
  primaryGhostBtnText: { fontSize: 12, fontWeight: '700', color: '#FF6F3C', letterSpacing: -0.1 },
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
});
