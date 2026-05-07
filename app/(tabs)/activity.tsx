// Wallet Screen - Membership card, offers, and events
import React, { useMemo, useCallback, useState } from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import type { Href } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity, Pressable, Modal, Text, Image, ActivityIndicator, FlatList, TextInput, Keyboard } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Rect, Line, G } from 'react-native-svg';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '@/lib/providers/wallet-provider';
import { useAuth } from '@/lib/providers/auth-provider';
import { useRole } from '@/lib/providers/role-provider';
import { CoachView } from '@/components/coach/coach-view';
import { AgentView } from '@/components/agent/agent-view';
import { BrandView } from '@/components/brand/brand-view';
import { FanView } from '@/components/fan/fan-view';
import { SchoolView } from '@/components/school/school-view';
import { NilManagerView } from '@/components/nil-manager/nil-manager-view';
import { UserRole } from '@/lib/types/auth.types';
import { useMembershipCard } from '@/hooks/use-membership-card';
import { useMyVenues } from '@/hooks/use-venues-query';
import { useVenue } from '@/hooks/use-venue-query';
import { useMyEvents, useDebounce } from '@/hooks';
import type { Event as StatusEvent, OwnerContact } from '@/lib/types/events.types';
import { EventStatus } from '@/lib/types/events.types';
import { eventsApi } from '@/lib/api/events';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  liquidGlass,
  glassBorder,
  glassText,
} from '@/constants/glass/liquid-glass';
import { GlassView } from 'expo-glass-effect';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import {
  Gesture,
  GestureDetector,
  TouchableOpacity as GHTouchableOpacity,
} from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  StatusCardMenuSheet,
  TicketList,
  OfferCarousel,
  WalletSkeleton,
} from '@/components/wallet';
import { FeedMediaPlayer } from '@/components/feed/feed-media-player';

const DefaultAvatarImage = require('@/assets/images/default-avatar.png');

// Top inset beneath the fixed pill header (avatar pill + tab row)
const HEADER_OFFSET = 140;
// Base page background (matches styles.container.backgroundColor)
const PAGE_BG = '#000';
const TAB_BAR_TOP_FROM_BOTTOM = 90; // iOS 26 floating glass tab bar — top edge from screen bottom (incl. safe area)

// Pick the best image URL for an event (flyer takes precedence over thumbnail imageUrl)
function getEventImageUrl(event: Pick<StatusEvent, 'flyer' | 'imageUrl'>): string {
  return event.flyer?.url || event.imageUrl || '';
}

// ─── Mock Data ──────────────────────────────────────────────────
const MOCK_TICKETS = [
  {
    id: 'mock-1',
    title: 'Syracuse vs. Duke',
    dateTime: '2026-04-22T19:00:00Z',
    dateTimeLabel: 'Tue, Apr 22 · 7:00 PM',
    venueName: 'JMA Wireless Dome',
    flyerUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80',
    isEarningEnabled: false,
    isPaid: false,
    ticketStatus: 'active' as const,
  },
  {
    id: 'mock-2',
    title: 'Big East Tip-Off · Cuse vs. UConn',
    dateTime: '2026-04-29T18:30:00Z',
    dateTimeLabel: 'Tue, Apr 29 · 6:30 PM',
    venueName: 'Madison Square Garden',
    flyerUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80',
    isEarningEnabled: false,
    isPaid: true,
    pricePaid: 0,
    ticketStatus: 'active' as const,
  },
  {
    id: 'mock-3',
    title: 'Miami vs. Syracuse',
    dateTime: '2026-04-26T20:00:00Z',
    dateTimeLabel: 'Sat, Apr 26 · 8:00 PM',
    venueName: 'Watsco Center',
    flyerUrl: 'https://images.unsplash.com/photo-1577471489098-30e59e04d9cf?w=1200&q=80',
    isEarningEnabled: false,
    isPaid: false,
    ticketStatus: 'active' as const,
  },
];

const MOCK_TABLES = [
  {
    id: 1,
    label: 'Family Suite 12',
    venueName: 'JMA Wireless Dome',
    sectionName: 'Player Family Section',
    date: 'Tue, Apr 22 · 7:00 PM',
    seatCount: 8,
    status: 'confirmed' as const,
    price: 0,
  },
  {
    id: 2,
    label: 'Courtside Row A',
    venueName: 'Madison Square Garden',
    sectionName: 'Team Guest Box',
    date: 'Tue, Apr 29 · 6:30 PM',
    seatCount: 4,
    status: 'confirmed' as const,
    price: 0,
  },
  {
    id: 3,
    label: 'Suite 201 — Sponsor Guest',
    venueName: 'Chase Center',
    sectionName: 'PUMA x Proslync Suite',
    date: 'Fri, May 1 · 7:30 PM',
    seatCount: 12,
    status: 'pending' as const,
    price: 0,
  },
];

const MOCK_OFFERS = [
  {
    id: 'offer-1',
    code: 'PUMA-NY-04',
    title: 'PUMA MB.04 NY Edition · 40% Off',
    subtitle: 'Early access for roster athletes · drops Fri',
    eventId: 1,
    isClaimed: false,
    expiresAt: '2026-04-28T23:59:00Z',
  },
  {
    id: 'offer-2',
    code: 'CELSIUS-GAMEDAY',
    title: 'Celsius Gameday 12-Pack',
    subtitle: 'Weekly drop to the facility · free',
    eventId: 2,
    isClaimed: true,
    expiresAt: '2026-05-30T23:59:00Z',
  },
  {
    id: 'offer-3',
    code: 'JBC-ALUM',
    title: 'Jordan Brand · $500 JBC Alum Credit',
    subtitle: 'Redeem on the new Flight Line capsule',
    eventId: 1,
    isClaimed: false,
  },
  {
    id: 'offer-4',
    code: 'BEATS-PRO',
    title: 'Beats Studio Pro · On the House',
    subtitle: 'Courtesy drop + engraved set',
    eventId: 1,
    isClaimed: false,
    expiresAt: '2026-05-15T23:59:00Z',
  },
  {
    id: 'offer-5',
    code: 'BODYARMOR-POST',
    title: 'BODYARMOR Postseason Kit',
    subtitle: '2 cases delivered + branded gym bag',
    eventId: 2,
    isClaimed: false,
  },
];

const personalTabs = ['Stats', 'Team', 'Schedule'] as const;
const personalAdminTabs = ['Stats', 'Team', 'Schedule', 'Admin'] as const;
const venueTabs = ['Deals', 'Earnings', 'Wallet'] as const;

// ── Mock data for the new tabs ──────────────────────────────────

const SEASON_AVG = { ppg: 14.2, rpg: 3.8, apg: 3.1, spg: 1.1, fgPct: 46.1, threePct: 36.4, ftPct: 82.3, mpg: 28.4 };

const GAME_LOG = [
  { id: 'gl-1', opponent: 'vs Duke', result: 'W 74-68', line: '21 PTS · 4 REB · 3 AST · 7-13 FG · 4-7 3P', date: 'Tue 4/22' },
  { id: 'gl-2', opponent: '@ Miami', result: 'W 72-69', line: '18 PTS · 2 REB · 4 AST · 6-11 FG · 3-5 3P', date: 'Sat 4/19' },
  { id: 'gl-3', opponent: 'vs Georgia Tech', result: 'L 65-70', line: '11 PTS · 5 REB · 2 AST · 4-10 FG', date: 'Thu 4/17' },
  { id: 'gl-4', opponent: 'vs Virginia Tech', result: 'W 78-71', line: '5 PTS · 3 REB · 2 AST · 2-6 FG', date: 'Tue 4/15' },
  { id: 'gl-5', opponent: '@ North Carolina', result: 'L 70-81', line: '10 PTS · 2 REB · 10-min night', date: 'Sat 4/12' },
  { id: 'gl-6', opponent: '@ #3 Duke', result: 'L 54-72', line: '6 PTS · 1 REB · 18 MIN', date: 'Wed 4/9' },
];

const PEER_COMP = [
  { label: 'PTS / game', you: '14.2', avg: '9.8', best: '18.4', delta: '+45%', positive: true },
  { label: 'FG %', you: '46.1%', avg: '42.8%', best: '51.2%', delta: '+8%', positive: true },
  { label: '3PT %', you: '36.4%', avg: '32.7%', best: '41.8%', delta: '+11%', positive: true },
  { label: 'AST / game', you: '3.1', avg: '2.4', best: '4.8', delta: '+29%', positive: true },
  { label: 'Minutes', you: '28.4', avg: '24.6', best: '32.1', delta: '+15%', positive: true },
];

type TeamMember = { id: string; name: string; role: string; tag?: string; color: string; initial: string };
const COACHING_STAFF: TeamMember[] = [
  { id: 'c-autry', name: 'Adrian "Red" Autry', role: 'Head Coach', tag: '2nd season', color: '#F76900', initial: 'A' },
  { id: 'c-gmac', name: 'Gerry McNamara', role: 'Assistant · PG Dev', tag: 'Cuse alum', color: '#F76900', initial: 'G' },
  { id: 'c-tony', name: 'Tony Brown', role: 'Assistant · Wings', color: '#0F1B3F', initial: 'T' },
  { id: 'c-allen', name: 'Allen Griffin', role: 'Assistant · Post', color: '#0F1B3F', initial: 'A' },
];

const ROSTER: TeamMember[] = [
  { id: 'r-jj', name: 'JJ Starling', role: 'G · Junior', tag: '#11', color: '#F76900', initial: 'J' },
  { id: 'r-donnie', name: 'Donnie Freeman', role: 'F · Sophomore', tag: '#4', color: '#F76900', initial: 'D' },
  { id: 'r-naithan', name: 'Naithan George', role: 'G · Junior', tag: '#2', color: '#0F1B3F', initial: 'N' },
  { id: 'r-lucas', name: 'Lucas Taylor', role: 'G · Senior', tag: '#23', color: '#0F1B3F', initial: 'L' },
  { id: 'r-eddie', name: 'Eddie Lampkin Jr.', role: 'C · Senior', tag: '#5', color: '#F76900', initial: 'E' },
];

type ScheduleGame = { id: string; date: string; opponent: string; home: boolean; venue: string; status: 'upcoming' | 'live' | 'final'; result?: string };
const SCHEDULE: ScheduleGame[] = [
  { id: 's-1', date: 'Tue · Apr 22', opponent: 'Duke', home: true, venue: 'JMA Wireless Dome', status: 'upcoming' },
  { id: 's-2', date: 'Sat · Apr 26', opponent: 'Miami', home: false, venue: 'Watsco Center', status: 'upcoming' },
  { id: 's-3', date: 'Tue · Apr 29', opponent: 'UConn', home: false, venue: 'Madison Square Garden', status: 'upcoming' },
  { id: 's-4', date: 'Sat · May 3', opponent: 'Virginia', home: true, venue: 'JMA Wireless Dome', status: 'upcoming' },
  { id: 's-5', date: 'Wed · May 7', opponent: 'Louisville', home: false, venue: 'KFC Yum! Center', status: 'upcoming' },
  { id: 's-6', date: 'Sat · Apr 19', opponent: 'Georgia Tech', home: true, venue: 'JMA Wireless Dome', status: 'final', result: 'L 65-70' },
  { id: 's-7', date: 'Tue · Apr 15', opponent: 'Virginia Tech', home: true, venue: 'JMA Wireless Dome', status: 'final', result: 'W 78-71' },
];

// ── Professional mode ───────────────────────────────────────────

type ActiveDeal = { id: string; brand: string; color: string; initial: string; contract: string; status: 'Active' | 'Pending' | 'Signed'; amount: string; due: string };
const ACTIVE_DEALS: ActiveDeal[] = [
  { id: 'ad-1', brand: 'PUMA Hoops', color: '#E11E2B', initial: 'P', contract: 'Signature line · MB.04 NY Edition', status: 'Active', amount: '$85,000 + 4% royalty', due: 'Photoshoot — May 12' },
  { id: 'ad-2', brand: 'Celsius', color: '#00C2A8', initial: 'C', contract: 'Gameday Series · 3 posts', status: 'Active', amount: '$12,000 flat', due: '2 posts by Apr 30' },
  { id: 'ad-3', brand: 'Beats by Dre', color: '#E52321', initial: 'B', contract: 'Studio session + reel', status: 'Signed', amount: '$8,000 + product', due: 'Studio May 7' },
  { id: 'ad-4', brand: 'Jordan Brand', color: '#111', initial: 'J', contract: 'JBC alum capsule (500u)', status: 'Pending', amount: '$65,000 + tier', due: 'Decision EOD Fri' },
];

type OfferInbox = { id: string; brand: string; color: string; initial: string; summary: string; amount: string; matchScore: number; received: string };
const OFFER_INBOX: OfferInbox[] = [
  { id: 'oi-1', brand: 'BODYARMOR', color: '#0A2342', initial: 'B', summary: 'Postseason campaign · 4 deliverables', amount: '$22k – $38k', matchScore: 91, received: '2h ago' },
  { id: 'oi-2', brand: 'YETI', color: '#004D47', initial: 'Y', summary: 'Outdoor capsule · 2 posts + UGC', amount: '$8k – $14k', matchScore: 74, received: '6h ago' },
  { id: 'oi-3', brand: "Raising Cane's", color: '#D0131F', initial: 'R', summary: 'In-store appearance · Brooklyn', amount: '$5k flat', matchScore: 82, received: 'yesterday' },
];

const EARNINGS_YTD = { total: 184325, pending: 41200, nextPayout: '$18,450 on May 1', monthDelta: '+23% vs March' };

type RevenueRow = { brand: string; amount: number; color: string; initial: string };
const REVENUE_BY_BRAND: RevenueRow[] = [
  { brand: 'PUMA Hoops', amount: 85000, color: '#E11E2B', initial: 'P' },
  { brand: 'Jordan Brand', amount: 28500, color: '#111', initial: 'J' },
  { brand: 'Celsius', amount: 24000, color: '#00C2A8', initial: 'C' },
  { brand: 'Beats by Dre', amount: 16000, color: '#E52321', initial: 'B' },
  { brand: 'Cameos / appearances', amount: 18325, color: '#FF6F3C', initial: '★' },
  { brand: 'Merch storefront', amount: 12500, color: '#0F1B3F', initial: 'M' },
];

type Invoice = { id: string; brand: string; color: string; initial: string; amount: string; dueDate: string; status: 'sent' | 'overdue' | 'paid' };
const UPCOMING_INVOICES: Invoice[] = [
  { id: 'in-1', brand: 'Celsius', color: '#00C2A8', initial: 'C', amount: '$4,000', dueDate: 'Due May 1', status: 'sent' },
  { id: 'in-2', brand: 'Jordan Brand', color: '#111', initial: 'J', amount: '$12,500', dueDate: 'Due May 12', status: 'sent' },
  { id: 'in-3', brand: 'BODYARMOR', color: '#0A2342', initial: 'B', amount: '$2,800', dueDate: 'Overdue 3d', status: 'overdue' },
];

type Payout = { id: string; brand: string; color: string; initial: string; amount: string; date: string };
const RECENT_PAYOUTS: Payout[] = [
  { id: 'p-1', brand: 'PUMA Hoops', color: '#E11E2B', initial: 'P', amount: '$42,500', date: 'Apr 15' },
  { id: 'p-2', brand: 'Celsius', color: '#00C2A8', initial: 'C', amount: '$4,000', date: 'Apr 1' },
  { id: 'p-3', brand: 'Merch storefront', color: '#0F1B3F', initial: 'M', amount: '$3,145', date: 'Apr 1' },
  { id: 'p-4', brand: 'Cameos', color: '#FF6F3C', initial: '★', amount: '$2,850', date: 'Mar 20' },
];

const WALLET_BALANCE = { available: 24318, pending: 8900, nextPayoutDate: 'May 1' };
const PAYOUT_METHOD = { type: 'Stripe Connect', mask: '•••• 4821', bank: 'Chase Checking' };

// ─── Tab content components ────────────────────────────────────

function SectionHeader({ label, accent }: { label: string; accent?: string }) {
  return (
    <Text style={[tabStyles.sectionLabel, accent ? { color: accent } : null]}>{label}</Text>
  );
}

function BrandBadge({ color, initial, size = 36 }: { color: string; initial: string; size?: number }) {
  return (
    <View style={[tabStyles.brandBadge, { width: size, height: size, borderRadius: Math.min(10, size / 3.5), backgroundColor: color }]}>
      <Text style={[tabStyles.brandBadgeText, { fontSize: size * 0.45 }]}>{initial}</Text>
    </View>
  );
}

// ── PERSONAL ── Stats analytics (matches the athlete-detail aesthetic) ──

const STATS_YELLOW = '#FF6F3C';
const STATS_CARD_BG = '#1C1C1E';
const STATS_FEMALE_GREY = 'rgba(255,255,255,0.35)';

function PlayerStatsAnalytics() {
  const ppg = SEASON_AVG.ppg;
  const fgPct = SEASON_AVG.fgPct;
  // Composite "stat rating" 0-100 — back-of-envelope from PPG + FG% + AST
  const score = Math.min(99, Math.round((ppg * 2.4) + (fgPct * 0.5) + (SEASON_AVG.apg * 3)));
  const [scoreSheetOpen, setScoreSheetOpen] = useState(false);

  return (
    <View style={{ gap: 10 }}>
      <PlayerHeroIdentityCard score={score} onScorePress={() => setScoreSheetOpen(true)} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <StatsMetricCard label="Points / Game" value={ppg.toFixed(1)} delta={+1.4} topPct={12} />
        </View>
        <View style={{ flex: 1 }}>
          <StatsMetricCard label="FG %" value={`${fgPct.toFixed(1)}%`} delta={+0.8} topPct={18} />
        </View>
      </View>
      <RecentGamesCard />
      <PeerComparisonChartCard />
      <ScoreBreakdownSheet
        score={score}
        visible={scoreSheetOpen}
        onClose={() => setScoreSheetOpen(false)}
      />
    </View>
  );
}

function PlayerHeroIdentityCard({
  score,
  onScorePress,
}: {
  score: number;
  onScorePress: () => void;
}) {
  return (
    <View style={statsCardStyles.heroCard}>
      <View style={statsCardStyles.heroLeft}>
        <View style={statsCardStyles.heroAvatarWrap}>
          <Image
            source={require('@/assets/images/kiyan-avatar.png')}
            style={statsCardStyles.heroAvatar}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={statsCardStyles.heroName} numberOfLines={1}>Kiyan Anthony</Text>
          <View style={statsCardStyles.sportRow}>
            <MaterialCommunityIcons name="basketball" size={14} color={STATS_YELLOW} />
            <Text style={statsCardStyles.heroSport}>Basketball · Syracuse</Text>
          </View>
        </View>
      </View>
      <Pressable
        onPress={onScorePress}
        accessibilityRole="button"
        accessibilityLabel="View score breakdown"
        accessibilityHint="Opens a breakdown of the factors making up this score"
        hitSlop={8}
        style={({ pressed }) => [statsCardStyles.scoreTouchable, { opacity: pressed ? 0.7 : 1 }]}
      >
        <StatScoreGauge score={score} />
        <View style={statsCardStyles.scoreInfoBadge} pointerEvents="none">
          <Ionicons name="information" size={11} color="#FFF" />
        </View>
      </Pressable>
    </View>
  );
}

// ── Score breakdown sheet — explains what makes up the score ──

type ScoreFactor = {
  key: string;
  name: string;
  score: number;
  weight: number;
  description: string;
  detail: string;
};

const SCORE_FACTORS: ScoreFactor[] = [
  {
    key: 'performance',
    name: 'Performance',
    score: 78,
    weight: 30,
    description: 'On-court output: PPG, FG%, AST, advanced metrics, win contribution.',
    detail: '20.1 PPG and 4.6 APG — top quartile of ACC freshmen.',
  },
  {
    key: 'engagement',
    name: 'Fan Engagement',
    score: 84,
    weight: 25,
    description: 'Reach, post engagement rate, comment quality, growth velocity.',
    detail: '7.9% engagement rate beats the 4.2% NIL average.',
  },
  {
    key: 'audience',
    name: 'Audience Quality',
    score: 71,
    weight: 20,
    description: 'Demographic alignment, geographic spread, audience depth and authenticity.',
    detail: '40% Gen Z; strong 18–34 skew, NYC + Northeast concentration.',
  },
  {
    key: 'brand',
    name: 'Brand Fit',
    score: 66,
    weight: 15,
    description: 'Alignment with verified brand archetypes and category demand.',
    detail: 'High match for athleticwear and energy categories; limited luxury alignment.',
  },
  {
    key: 'conversion',
    name: 'Conversion Potential',
    score: 58,
    weight: 10,
    description: 'Likelihood that fan attention converts to purchase, subscription, or attendance.',
    detail: 'CTR and lift data still developing; needs longer history.',
  },
];

function bandFor(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: '#34C759' };
  if (score >= 65) return { label: 'Strong', color: STATS_YELLOW };
  if (score >= 50) return { label: 'Average', color: '#FFD60A' };
  return { label: 'Needs work', color: '#FF453A' };
}

const SCORE_SHEET_TRAVEL = 700;

function ScoreBreakdownSheet({
  score,
  visible,
  onClose,
}: {
  score: number;
  visible: boolean;
  onClose: () => void;
}) {
  const translateY = useSharedValue(SCORE_SHEET_TRAVEL);
  const backdropProgress = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      backdropProgress.value = withTiming(1, { duration: 280 });
      translateY.value = withTiming(0, { duration: 320 });
    }
  }, [visible]);

  const dismiss = React.useCallback(() => {
    translateY.value = withTiming(SCORE_SHEET_TRAVEL, { duration: 220 });
    backdropProgress.value = withTiming(0, { duration: 220 });
    setTimeout(onClose, 220);
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        backdropProgress.value = 1 - Math.min(e.translationY / SCORE_SHEET_TRAVEL, 1);
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 600) {
        translateY.value = withTiming(SCORE_SHEET_TRAVEL, { duration: 220 });
        backdropProgress.value = withTiming(0, { duration: 220 });
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
        backdropProgress.value = withTiming(1, { duration: 200 });
      }
    });

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,0,0,${0.65 * backdropProgress.value})`,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <Animated.View style={[scoreSheetStyles.backdrop, backdropAnimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        <Animated.View style={[scoreSheetStyles.sheet, sheetAnimStyle]}>
          <GestureDetector gesture={panGesture}>
            <View>
              <View style={scoreSheetStyles.handle} />
              <View style={scoreSheetStyles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={scoreSheetStyles.title}>Score Breakdown</Text>
                  <Text style={scoreSheetStyles.subtitle}>
                    Your overall score of {score} is composed of these factors. Hover values reflect your current standing.
                  </Text>
                </View>
              </View>
            </View>
          </GestureDetector>
          <ScrollView style={scoreSheetStyles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
            {SCORE_FACTORS.map((factor) => {
              const band = bandFor(factor.score);
              return (
                <View key={factor.key} style={scoreSheetStyles.factorRow}>
                  <View style={scoreSheetStyles.factorHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={scoreSheetStyles.factorName}>{factor.name}</Text>
                      <Text style={scoreSheetStyles.factorWeight}>Weight {factor.weight}%</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={scoreSheetStyles.factorScore}>{factor.score}</Text>
                      <Text style={[scoreSheetStyles.factorBand, { color: band.color }]}>{band.label}</Text>
                    </View>
                  </View>
                  <View style={scoreSheetStyles.barTrack}>
                    <View style={[scoreSheetStyles.barFill, { width: `${factor.score}%`, backgroundColor: band.color }]} />
                  </View>
                  <Text style={scoreSheetStyles.factorDescription}>{factor.description}</Text>
                  <Text style={scoreSheetStyles.factorDetail}>{factor.detail}</Text>
                </View>
              );
            })}
            <View style={scoreSheetStyles.footnoteWrap}>
              <Ionicons name="sparkles-outline" size={14} color="rgba(255,255,255,0.55)" />
              <Text style={scoreSheetStyles.footnote}>
                Auto-calculated daily from performance, audience, and engagement signals. Influence your score by improving on-court output, growing engagement, and broadening your audience.
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function StatScoreGauge({ score }: { score: number }) {
  const size = 64;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const visible = 0.82;
  const dash = c * pct * visible;
  const gap = c - dash;
  return (
    <View style={statsCardStyles.gaugeWrap}>
      <Svg width={size} height={size}>
        <G rotation="-200" originX={size / 2} originY={size / 2}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={STATS_YELLOW}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
      <View style={statsCardStyles.gaugeCenter} pointerEvents="none">
        <Text style={statsCardStyles.gaugeText}>{score}</Text>
      </View>
    </View>
  );
}

function StatsMetricCard({
  label,
  value,
  delta,
  topPct,
}: {
  label: string;
  value: string;
  delta: number;
  topPct: number;
}) {
  return (
    <View style={statsCardStyles.metricCard}>
      <View style={statsCardStyles.metricLabelRow}>
        <Text style={statsCardStyles.metricLabel}>{label}</Text>
        <Ionicons name="information-circle-outline" size={13} color="rgba(255,255,255,0.4)" />
      </View>
      <View style={statsCardStyles.metricValueRow}>
        <Text style={statsCardStyles.metricValue}>{value}</Text>
        <View style={statsCardStyles.deltaPill}>
          <Ionicons name="arrow-up" size={10} color={STATS_YELLOW} style={{ transform: [{ rotate: '45deg' }] }} />
          <Text style={statsCardStyles.deltaText}>{delta.toFixed(2)}</Text>
        </View>
      </View>
      <View style={statsCardStyles.metricFooter}>
        <Text style={statsCardStyles.metricFooterText}>TOP {topPct}%</Text>
        <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.4)" />
      </View>
    </View>
  );
}

function RecentGamesCard() {
  // Parse points from each GAME_LOG line (e.g., "21 PTS · ...")
  const games = GAME_LOG.slice(0, 4).map((g) => {
    const ptsMatch = g.line.match(/(\d+)\s*PTS/);
    const pts = ptsMatch ? parseInt(ptsMatch[1], 10) : 0;
    const win = g.result.startsWith('W');
    return { id: g.id, opponent: g.opponent, pts, win, result: g.result };
  });
  const maxPts = games.reduce((m, x) => Math.max(m, x.pts), 0) || 1;

  return (
    <View style={statsCardStyles.bigCard}>
      <Text style={statsCardStyles.bigCardLabel}>Recent Games</Text>
      <View style={{ gap: 10, marginTop: 14 }}>
        {games.map((g) => {
          const widthPct = (g.pts / maxPts) * 100;
          return (
            <View key={g.id} style={statsCardStyles.gameRow}>
              <View style={statsCardStyles.gameHeaderRow}>
                <Text style={statsCardStyles.gameOpponent}>{g.opponent}</Text>
                <Text
                  style={[
                    statsCardStyles.gameResult,
                    { color: g.win ? '#34C759' : '#FF4444' },
                  ]}
                >
                  {g.result}
                </Text>
              </View>
              <View style={statsCardStyles.gameBarRow}>
                <View style={statsCardStyles.gameBarTrack}>
                  <View style={[statsCardStyles.gameBarFill, { width: `${widthPct}%` }]} />
                </View>
                <Text style={statsCardStyles.gamePts}>{g.pts} PTS</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function PeerComparisonChartCard() {
  // Use first 5 PEER_COMP rows; parse values to numbers
  const data = PEER_COMP.slice(0, 5).map((p) => ({
    label: p.label.replace(' / game', '').replace('PTS', 'PTS'),
    you: parseFloat(p.you.replace('%', '')),
    avg: parseFloat(p.avg.replace('%', '')),
  }));

  const width = 320;
  const height = 140;
  const padLeft = 30;
  const padRight = 8;
  const padTop = 14;
  const padBottom = 22;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const max = Math.max(...data.flatMap((d) => [d.you, d.avg])) * 1.2;
  const groupW = innerW / data.length;
  const barW = (groupW - 8) / 2;

  return (
    <View style={statsCardStyles.bigCard}>
      <View style={statsCardStyles.headerRow}>
        <Text style={statsCardStyles.bigCardLabel}>vs ACC Freshmen</Text>
        <View style={statsCardStyles.legendRow}>
          <View style={[statsCardStyles.legendDot, { backgroundColor: STATS_YELLOW }]} />
          <Text style={statsCardStyles.legendText}>You</Text>
          <View style={[statsCardStyles.legendDot, { backgroundColor: STATS_FEMALE_GREY, marginLeft: 8 }]} />
          <Text style={statsCardStyles.legendText}>Avg</Text>
        </View>
      </View>
      <View style={{ marginTop: 14 }}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {[0, 0.5, 1].map((t) => {
            const yPos = padTop + innerH * (1 - t);
            return (
              <Line
                key={t}
                x1={padLeft}
                y1={yPos}
                x2={width - padRight}
                y2={yPos}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            );
          })}
          {data.map((d, i) => {
            const groupX = padLeft + i * groupW + 4;
            const youH = (d.you / max) * innerH;
            const avgH = (d.avg / max) * innerH;
            return (
              <G key={d.label}>
                <Rect
                  x={groupX}
                  y={padTop + innerH - youH}
                  width={barW}
                  height={Math.max(youH, 1)}
                  fill={STATS_YELLOW}
                  rx={2}
                />
                <Rect
                  x={groupX + barW + 2}
                  y={padTop + innerH - avgH}
                  width={barW}
                  height={Math.max(avgH, 1)}
                  fill={STATS_FEMALE_GREY}
                  rx={2}
                />
              </G>
            );
          })}
        </Svg>
        <View style={statsCardStyles.barLabelsRow} pointerEvents="none">
          {data.map((d) => (
            <View key={d.label} style={statsCardStyles.bucketCol}>
              <View style={statsCardStyles.bucketValuesRow}>
                <Text style={statsCardStyles.bucketValue}>{d.you}</Text>
                <Text style={[statsCardStyles.bucketValue, { color: 'rgba(255,255,255,0.55)' }]}>{d.avg}</Text>
              </View>
              <Text style={statsCardStyles.bucketLabel} numberOfLines={1}>{d.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const statsCardStyles = StyleSheet.create({
  // Hero
  heroCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,111,60,0.35)',
  },
  heroAvatar: { width: '100%', height: '100%' },
  heroName: { color: '#FFF', fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  sportRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  heroSport: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },

  // Score gauge
  gaugeWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  gaugeCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  gaugeText: { color: '#FFF', fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  scoreTouchable: { position: 'relative' },
  scoreInfoBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: STATS_YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: STATS_CARD_BG,
  },

  // Metric card
  metricCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    minHeight: 124,
  },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricLabel: { color: '#FFF', fontSize: 13, fontWeight: '500' },
  metricValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metricValue: { color: '#FFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  deltaText: { color: STATS_YELLOW, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  metricFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 'auto' },
  metricFooterText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },

  // Big cards
  bigCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 16,
    padding: 16,
  },
  bigCardLabel: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { color: 'rgba(255,255,255,0.55)', fontSize: 10 },

  // Recent games
  gameRow: { gap: 6 },
  gameHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gameOpponent: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  gameResult: { fontSize: 11, fontWeight: '700' },
  gameBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gameBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  gameBarFill: { height: '100%', backgroundColor: STATS_YELLOW, borderRadius: 3 },
  gamePts: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', minWidth: 50, textAlign: 'right' },

  // Bar chart labels
  barLabelsRow: { flexDirection: 'row', paddingLeft: 30, paddingRight: 8, marginTop: 2 },
  bucketCol: { flex: 1, alignItems: 'center' },
  bucketValuesRow: { flexDirection: 'row', gap: 2, marginBottom: -2 },
  bucketValue: { color: '#FFF', fontSize: 9, fontWeight: '600' },
  bucketLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 9, marginTop: 4 },
});

// ── Score breakdown sheet styles ──

const scoreSheetStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0F1012',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scroll: { flexShrink: 1 },
  handle: {
    width: 38, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center', marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.2 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 17 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  factorRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  factorName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  factorWeight: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  factorScore: { fontSize: 20, fontWeight: '900', color: '#FFF', fontVariant: ['tabular-nums'] },
  factorBand: { fontSize: 11, fontWeight: '700', marginTop: -2 },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  factorDescription: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 9, lineHeight: 17 },
  factorDetail: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4, fontStyle: 'italic', lineHeight: 15 },
  footnoteWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  footnote: { flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 16 },
});

// ── PERSONAL ── Game Log analytics (matches Stats tab aesthetic) ──

function GameLogAnalytics() {
  const wins = GAME_LOG.filter((g) => g.result.startsWith('W')).length;
  const losses = GAME_LOG.length - wins;
  const recentForm = GAME_LOG.slice(0, 5).map((g) => (g.result.startsWith('W') ? 'W' : 'L'));
  const ptsList = GAME_LOG.map((g) => {
    const m = g.line.match(/(\d+)\s*PTS/);
    return m ? parseInt(m[1], 10) : 0;
  });
  const totalPts = ptsList.reduce((s, p) => s + p, 0);
  const avgPts = ptsList.length ? totalPts / ptsList.length : 0;
  const high = ptsList.length ? Math.max(...ptsList) : 0;
  const maxPts = high || 1;

  return (
    <View style={{ gap: 10 }}>
      {/* Hero summary */}
      <View style={statsCardStyles.heroCard}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={gameLogStyles.heroLabel}>SEASON RECORD</Text>
          <Text style={gameLogStyles.heroRecord}>
            {wins}–{losses}
          </Text>
          <View style={gameLogStyles.formRow}>
            <Text style={gameLogStyles.formLabel}>Last 5</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {recentForm.map((r, i) => (
                <View
                  key={i}
                  style={[
                    gameLogStyles.formBadge,
                    {
                      backgroundColor: r === 'W' ? 'rgba(52,199,89,0.18)' : 'rgba(255,68,68,0.18)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      gameLogStyles.formBadgeText,
                      { color: r === 'W' ? '#34C759' : '#FF4444' },
                    ]}
                  >
                    {r}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={gameLogStyles.heroStatsCol}>
          <View style={gameLogStyles.heroStatBlock}>
            <Text style={gameLogStyles.heroStatValue}>{avgPts.toFixed(1)}</Text>
            <Text style={gameLogStyles.heroStatLabel}>AVG PTS</Text>
          </View>
          <View style={gameLogStyles.heroStatBlock}>
            <Text style={[gameLogStyles.heroStatValue, { color: STATS_YELLOW }]}>{high}</Text>
            <Text style={gameLogStyles.heroStatLabel}>SEASON HIGH</Text>
          </View>
        </View>
      </View>

      {/* Per-game cards */}
      {GAME_LOG.map((g, i) => {
        const win = g.result.startsWith('W');
        const pts = ptsList[i];
        const widthPct = (pts / maxPts) * 100;
        return (
          <View key={g.id} style={gameLogStyles.gameCard}>
            <View style={gameLogStyles.gameCardTop}>
              <View style={gameLogStyles.dateChip}>
                <Text style={gameLogStyles.dateChipText}>{g.date}</Text>
              </View>
              <Text style={gameLogStyles.gameOpponent} numberOfLines={1}>{g.opponent}</Text>
              <View
                style={[
                  gameLogStyles.resultPill,
                  {
                    backgroundColor: win ? 'rgba(52,199,89,0.16)' : 'rgba(255,68,68,0.16)',
                  },
                ]}
              >
                <Text
                  style={[
                    gameLogStyles.resultPillText,
                    { color: win ? '#34C759' : '#FF4444' },
                  ]}
                >
                  {g.result}
                </Text>
              </View>
            </View>
            <View style={gameLogStyles.gameBarRow}>
              <View style={gameLogStyles.gameBarTrack}>
                <View
                  style={[
                    gameLogStyles.gameBarFill,
                    { width: `${widthPct}%` },
                  ]}
                />
              </View>
              <Text style={gameLogStyles.gamePts}>{pts} PTS</Text>
            </View>
            <Text style={gameLogStyles.gameLine}>{g.line}</Text>
          </View>
        );
      })}
    </View>
  );
}

const gameLogStyles = StyleSheet.create({
  heroLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroRecord: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  formLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '600',
  },
  formBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formBadgeText: { fontSize: 11, fontWeight: '900' },
  heroStatsCol: { gap: 12, alignItems: 'flex-end' },
  heroStatBlock: { alignItems: 'flex-end' },
  heroStatValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  gameCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  gameCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dateChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' },
  gameOpponent: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  resultPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  resultPillText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  gameBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gameBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  gameBarFill: { height: '100%', backgroundColor: STATS_YELLOW, borderRadius: 3 },
  gamePts: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    minWidth: 50,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  gameLine: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    letterSpacing: -0.1,
  },
});

// ── PERSONAL ── vs ACC analytics (matches Stats tab aesthetic) ──

function PeerCompareAnalytics() {
  const data = PEER_COMP.map((p) => {
    const youNum = parseFloat(p.you.replace('%', ''));
    const avgNum = parseFloat(p.avg.replace('%', ''));
    const bestNum = parseFloat(p.best.replace('%', ''));
    return {
      label: p.label,
      you: youNum,
      avg: avgNum,
      best: bestNum,
      youStr: p.you,
      avgStr: p.avg,
      bestStr: p.best,
      delta: p.delta,
      positive: p.positive,
    };
  });

  // Average percentile (you vs best across stats)
  const percentile = Math.round(
    (data.reduce((sum, d) => sum + (d.you / d.best), 0) / data.length) * 100,
  );

  return (
    <View style={{ gap: 10 }}>
      {/* Percentile hero card */}
      <View style={statsCardStyles.heroCard}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={gameLogStyles.heroLabel}>PERCENTILE · ACC FROSH</Text>
          <Text style={gameLogStyles.heroRecord}>{percentile}%</Text>
          <Text style={peerStyles.heroSub}>Among ACC freshmen guards</Text>
        </View>
        <StatScoreGauge score={percentile} />
      </View>

      {/* Bar chart card */}
      <View style={statsCardStyles.bigCard}>
        <View style={statsCardStyles.headerRow}>
          <Text style={statsCardStyles.bigCardLabel}>Head-to-Head</Text>
          <View style={statsCardStyles.legendRow}>
            <View style={[statsCardStyles.legendDot, { backgroundColor: STATS_YELLOW }]} />
            <Text style={statsCardStyles.legendText}>You</Text>
            <View style={[statsCardStyles.legendDot, { backgroundColor: STATS_FEMALE_GREY, marginLeft: 8 }]} />
            <Text style={statsCardStyles.legendText}>Avg</Text>
          </View>
        </View>
        <PeerBarChart data={data} />
      </View>

      {/* Detailed comparison list */}
      <View style={statsCardStyles.bigCard}>
        <Text style={statsCardStyles.bigCardLabel}>Detailed Breakdown</Text>
        <View style={{ marginTop: 12, gap: 14 }}>
          {data.map((d) => {
            const widthPct = Math.min(100, (d.you / d.best) * 100);
            return (
              <View key={d.label} style={peerStyles.statRow}>
                <View style={peerStyles.statHeader}>
                  <Text style={peerStyles.statLabel}>{d.label}</Text>
                  <Text
                    style={[
                      peerStyles.statDelta,
                      { color: d.positive ? '#34C759' : 'rgba(255,255,255,0.55)' },
                    ]}
                  >
                    {d.delta} vs avg
                  </Text>
                </View>
                <View style={peerStyles.statBarRow}>
                  <View style={peerStyles.statBarTrack}>
                    <View style={[peerStyles.statBarFill, { width: `${widthPct}%` }]} />
                  </View>
                  <Text style={peerStyles.statYou}>{d.youStr}</Text>
                </View>
                <View style={peerStyles.statRefRow}>
                  <Text style={peerStyles.statRefText}>Avg {d.avgStr}</Text>
                  <Text style={peerStyles.statRefText}>Best {d.bestStr}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function PeerBarChart({ data }: { data: { label: string; you: number; avg: number }[] }) {
  const width = 320;
  const height = 140;
  const padLeft = 30;
  const padRight = 8;
  const padTop = 14;
  const padBottom = 22;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const max = Math.max(...data.flatMap((d) => [d.you, d.avg])) * 1.2;
  const groupW = innerW / data.length;
  const barW = (groupW - 8) / 2;

  return (
    <View style={{ marginTop: 14 }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {[0, 0.5, 1].map((t) => {
          const yPos = padTop + innerH * (1 - t);
          return (
            <Line
              key={t}
              x1={padLeft}
              y1={yPos}
              x2={width - padRight}
              y2={yPos}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          );
        })}
        {data.map((d, i) => {
          const groupX = padLeft + i * groupW + 4;
          const youH = (d.you / max) * innerH;
          const avgH = (d.avg / max) * innerH;
          return (
            <G key={d.label}>
              <Rect
                x={groupX}
                y={padTop + innerH - youH}
                width={barW}
                height={Math.max(youH, 1)}
                fill={STATS_YELLOW}
                rx={2}
              />
              <Rect
                x={groupX + barW + 2}
                y={padTop + innerH - avgH}
                width={barW}
                height={Math.max(avgH, 1)}
                fill={STATS_FEMALE_GREY}
                rx={2}
              />
            </G>
          );
        })}
      </Svg>
      <View style={statsCardStyles.barLabelsRow} pointerEvents="none">
        {data.map((d) => (
          <View key={d.label} style={statsCardStyles.bucketCol}>
            <View style={statsCardStyles.bucketValuesRow}>
              <Text style={statsCardStyles.bucketValue}>{d.you}</Text>
              <Text style={[statsCardStyles.bucketValue, { color: 'rgba(255,255,255,0.55)' }]}>{d.avg}</Text>
            </View>
            <Text style={statsCardStyles.bucketLabel} numberOfLines={1}>
              {d.label.replace(' / game', '').replace(' %', '%')}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const peerStyles = StyleSheet.create({
  heroSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 2,
  },
  statRow: { gap: 6 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  statDelta: { fontSize: 11, fontWeight: '700' },
  statBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  statBarFill: { height: '100%', backgroundColor: STATS_YELLOW, borderRadius: 3 },
  statYou: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    minWidth: 60,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  statRefRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statRefText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '600',
  },
});

const teamStyles = StyleSheet.create({
  memberCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  memberName: { color: '#FFF', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  memberRole: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
  tagPill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,111,60,0.16)',
  },
  tagPillText: {
    color: '#FF6F3C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  jerseyPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.45)',
  },
  jerseyPillText: {
    color: '#FF6F3C',
    fontSize: 13,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },
});

// ── PERSONAL ── Stats tab ──
function StatsTabContent() {
  return (
    <View style={{ gap: 16 }}>
      <PlayerStatsAnalytics />
      <GameLogAnalytics />
      <PeerCompareAnalytics />
    </View>
  );
}

function StatTile({ value, label, big }: { value: string; label: string; big?: boolean }) {
  return (
    <View style={[tabStyles.statTile, big && tabStyles.statTileBig]}>
      <Text style={[tabStyles.statValue, big && tabStyles.statValueBig]}>{value}</Text>
      <Text style={tabStyles.statLabel}>{label}</Text>
    </View>
  );
}

// ── PERSONAL ── Team tab ──
function TeamTabContent() {
  const router = useStableRouter();

  const openMember = (m: TeamMember, kind: 'staff' | 'roster') => {
    router.push({
      pathname: '/team-member/[id]',
      params: {
        id: m.id,
        name: m.name,
        role: m.role,
        tag: m.tag ?? '',
        color: m.color,
        initial: m.initial,
        kind,
      },
    });
  };

  return (
    <View style={{ gap: 16 }}>
      {/* Coaching Staff section */}
      <View style={{ gap: 10 }}>
        <View style={statsCardStyles.heroCard}>
          <View style={statsCardStyles.heroLeft}>
            <View style={[statsCardStyles.heroAvatarWrap, { backgroundColor: '#FF6F3C' }]}>
              <MaterialCommunityIcons name="whistle-outline" size={26} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={statsCardStyles.heroName}>Coaching Staff</Text>
              <View style={statsCardStyles.sportRow}>
                <Ionicons name="people" size={14} color="#FF6F3C" />
                <Text style={statsCardStyles.heroSport}>
                  {COACHING_STAFF.length} coaches · Syracuse
                </Text>
              </View>
            </View>
          </View>
        </View>

        {COACHING_STAFF.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => openMember(m, 'staff')}
            style={({ pressed }) => [
              teamStyles.memberCard,
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
          >
            <View style={[teamStyles.memberAvatar, { backgroundColor: m.color }]}>
              <Text style={teamStyles.memberAvatarText}>{m.initial}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={teamStyles.memberName}>{m.name}</Text>
              <Text style={teamStyles.memberRole}>{m.role}</Text>
              {m.tag ? (
                <View style={teamStyles.tagPill}>
                  <Text style={teamStyles.tagPillText}>{m.tag}</Text>
                </View>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
          </Pressable>
        ))}
      </View>

      {/* Roster section */}
      <View style={{ gap: 10 }}>
        <View style={statsCardStyles.heroCard}>
          <View style={statsCardStyles.heroLeft}>
            <View style={[statsCardStyles.heroAvatarWrap, { backgroundColor: '#FF6F3C' }]}>
              <MaterialCommunityIcons name="basketball" size={26} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={statsCardStyles.heroName}>Roster</Text>
              <View style={statsCardStyles.sportRow}>
                <Ionicons name="people" size={14} color="#FF6F3C" />
                <Text style={statsCardStyles.heroSport}>
                  {ROSTER.length} players · Syracuse
                </Text>
              </View>
            </View>
          </View>
        </View>

        {ROSTER.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => openMember(m, 'roster')}
            style={({ pressed }) => [
              teamStyles.memberCard,
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
          >
            <View style={[teamStyles.memberAvatar, { backgroundColor: m.color }]}>
              <Text style={teamStyles.memberAvatarText}>{m.initial}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={teamStyles.memberName}>{m.name}</Text>
              <Text style={teamStyles.memberRole}>{m.role}</Text>
            </View>
            {m.tag ? (
              <View style={teamStyles.jerseyPill}>
                <Text style={teamStyles.jerseyPillText}>{m.tag}</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ── PERSONAL ── Schedule tab ──
function ScheduleTabContent() {
  const upcoming = SCHEDULE.filter((g) => g.status === 'upcoming');
  const past = SCHEDULE.filter((g) => g.status === 'final');

  return (
    <View style={{ gap: 16 }}>
      {/* Hero summary card */}
      <View style={statsCardStyles.heroCard}>
        <View style={statsCardStyles.heroLeft}>
          <View style={[statsCardStyles.heroAvatarWrap, { backgroundColor: '#FF6F3C' }]}>
            <MaterialCommunityIcons name="calendar-month" size={26} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={statsCardStyles.heroName}>18–8</Text>
            <View style={statsCardStyles.sportRow}>
              <Ionicons name="trophy" size={14} color="#FF6F3C" />
              <Text style={statsCardStyles.heroSport}>10–4 ACC · T-4th in conference</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Upcoming section */}
      {upcoming.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={tabStyles.sectionLabel}>UPCOMING</Text>
          {upcoming.map((g) => (
            <View key={g.id} style={scheduleStyles.gameCard}>
              <View style={scheduleStyles.dateCol}>
                <Text style={scheduleStyles.dateDay}>{g.date.split(' · ')[0]}</Text>
                <Text style={scheduleStyles.dateNum}>{g.date.split(' · ')[1]}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={scheduleStyles.opponent}>
                  {g.home ? 'vs' : '@'} {g.opponent}
                </Text>
                <Text style={scheduleStyles.venue} numberOfLines={1}>{g.venue}</Text>
              </View>
              <View
                style={[
                  scheduleStyles.locPill,
                  g.home ? scheduleStyles.locPillHome : scheduleStyles.locPillAway,
                ]}
              >
                <Text
                  style={[
                    scheduleStyles.locPillText,
                    { color: g.home ? '#FF6F3C' : 'rgba(255,255,255,0.85)' },
                  ]}
                >
                  {g.home ? 'HOME' : 'AWAY'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent section */}
      {past.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={tabStyles.sectionLabel}>RECENT</Text>
          {past.map((g) => {
            const win = g.result?.startsWith('W');
            return (
              <View key={g.id} style={scheduleStyles.gameCard}>
                <View style={scheduleStyles.dateCol}>
                  <Text style={scheduleStyles.dateDay}>{g.date.split(' · ')[0]}</Text>
                  <Text style={scheduleStyles.dateNum}>{g.date.split(' · ')[1]}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={scheduleStyles.opponent}>
                    {g.home ? 'vs' : '@'} {g.opponent}
                  </Text>
                  <Text style={scheduleStyles.venue} numberOfLines={1}>{g.venue}</Text>
                </View>
                <View
                  style={[
                    scheduleStyles.resultPill,
                    {
                      backgroundColor: win
                        ? 'rgba(52,199,89,0.16)'
                        : 'rgba(255,68,68,0.16)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      scheduleStyles.resultPillText,
                      { color: win ? '#34C759' : '#FF4444' },
                    ]}
                  >
                    {g.result}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const scheduleStyles = StyleSheet.create({
  gameCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dateCol: {
    width: 52,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dateDay: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  dateNum: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
    marginTop: 2,
  },
  opponent: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  venue: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
  locPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  locPillHome: {
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderColor: 'rgba(255,111,60,0.45)',
  },
  locPillAway: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  locPillText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  resultPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  resultPillText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.4 },
});

// ── PROFESSIONAL ── Deals tab ──
function DealsTabContent() {
  const activeCount = ACTIVE_DEALS.filter((d) => d.status === 'Active').length;

  return (
    <View style={{ gap: 16 }}>
      {/* Hero summary card */}
      <View style={statsCardStyles.heroCard}>
        <View style={statsCardStyles.heroLeft}>
          <View style={[statsCardStyles.heroAvatarWrap, { backgroundColor: '#FF6F3C' }]}>
            <Ionicons name="briefcase" size={24} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={statsCardStyles.heroName}>Deals</Text>
            <View style={statsCardStyles.sportRow}>
              <Ionicons name="pulse" size={14} color="#FF6F3C" />
              <Text style={statsCardStyles.heroSport}>
                {activeCount} active · {OFFER_INBOX.length} new offers
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Active Contracts section */}
      <View style={{ gap: 10 }}>
        <Text style={tabStyles.sectionLabel}>ACTIVE CONTRACTS</Text>
        {ACTIVE_DEALS.map((d) => {
          const statusColor =
            d.status === 'Active' ? '#34C759' : d.status === 'Pending' ? '#FF6F3C' : 'rgba(255,255,255,0.85)';
          const statusBg =
            d.status === 'Active'
              ? 'rgba(52,199,89,0.16)'
              : d.status === 'Pending'
                ? 'rgba(255,111,60,0.16)'
                : 'rgba(255,255,255,0.06)';
          return (
            <View key={d.id} style={dealsStyles.card}>
              <View style={dealsStyles.cardTop}>
                <View style={[dealsStyles.brandBadge, { backgroundColor: d.color }]}>
                  <Text style={dealsStyles.brandBadgeText}>{d.initial}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={dealsStyles.brandName}>{d.brand}</Text>
                  <Text style={dealsStyles.contractLine}>{d.contract}</Text>
                </View>
                <View style={[dealsStyles.statusPill, { backgroundColor: statusBg }]}>
                  <Text style={[dealsStyles.statusText, { color: statusColor }]}>
                    {d.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={dealsStyles.metaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={dealsStyles.metaLabel}>VALUE</Text>
                  <Text style={dealsStyles.metaValue}>{d.amount}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={dealsStyles.metaLabel}>NEXT</Text>
                  <Text style={dealsStyles.metaValue}>{d.due}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Offer Inbox section */}
      <View style={{ gap: 10 }}>
        <Text style={tabStyles.sectionLabel}>OFFER INBOX</Text>
        {OFFER_INBOX.map((o) => (
          <View key={o.id} style={dealsStyles.card}>
            <View style={dealsStyles.cardTop}>
              <View style={[dealsStyles.brandBadge, { backgroundColor: o.color }]}>
                <Text style={dealsStyles.brandBadgeText}>{o.initial}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={dealsStyles.brandName}>{o.brand}</Text>
                <Text style={dealsStyles.contractLine}>{o.summary}</Text>
                <Text style={dealsStyles.offerAmount}>{o.amount} · {o.received}</Text>
              </View>
              <View style={dealsStyles.matchPill}>
                <Text style={dealsStyles.matchLabel}>MATCH</Text>
                <Text style={dealsStyles.matchScore}>{o.matchScore}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const dealsStyles = StyleSheet.create({
  card: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
  brandName: { color: '#FFF', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  contractLine: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  offerAmount: { color: '#FF6F3C', fontSize: 12, fontWeight: '700', marginTop: 2 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.45)',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.1,
    marginTop: 4,
  },
  matchPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.45)',
    alignItems: 'center',
  },
  matchLabel: { color: '#FF6F3C', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  matchScore: {
    color: '#FF6F3C',
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
});

// ── PROFESSIONAL ── Earnings tab ──
function EarningsTabContent() {
  const total = EARNINGS_YTD.total + EARNINGS_YTD.pending;
  const maxRevenue = REVENUE_BY_BRAND.reduce((m, r) => Math.max(m, r.amount), 0) || 1;

  return (
    <View style={{ gap: 16 }}>
      {/* Hero summary card */}
      <View style={statsCardStyles.heroCard}>
        <View style={statsCardStyles.heroLeft}>
          <View style={[statsCardStyles.heroAvatarWrap, { backgroundColor: '#FF6F3C' }]}>
            <Ionicons name="cash-outline" size={26} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={statsCardStyles.heroName}>${EARNINGS_YTD.total.toLocaleString()}</Text>
            <View style={statsCardStyles.sportRow}>
              <Ionicons name="trending-up" size={14} color="#34C759" />
              <Text style={statsCardStyles.heroSport}>
                YTD · {EARNINGS_YTD.monthDelta}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Snapshot tiles */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={[earningsStyles.tile, { flex: 1 }]}>
          <Text style={earningsStyles.tileLabel}>Pending</Text>
          <Text style={earningsStyles.tileValue}>${EARNINGS_YTD.pending.toLocaleString()}</Text>
        </View>
        <View style={[earningsStyles.tile, { flex: 1.4 }]}>
          <Text style={earningsStyles.tileLabel}>Next payout</Text>
          <Text style={earningsStyles.tileValue} numberOfLines={1}>{EARNINGS_YTD.nextPayout}</Text>
        </View>
      </View>

      {/* Revenue by Partner section */}
      <View style={{ gap: 10 }}>
        <Text style={tabStyles.sectionLabel}>REVENUE BY PARTNER</Text>
        {REVENUE_BY_BRAND.map((r) => {
          const widthPct = (r.amount / maxRevenue) * 100;
          const sharePct = (r.amount / total) * 100;
          return (
            <View key={r.brand} style={earningsStyles.card}>
              <View style={earningsStyles.cardTop}>
                <View style={[earningsStyles.brandBadge, { backgroundColor: r.color }]}>
                  <Text style={earningsStyles.brandBadgeText}>{r.initial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={earningsStyles.brandName}>{r.brand}</Text>
                  <Text style={earningsStyles.brandShare}>{sharePct.toFixed(1)}% of YTD</Text>
                </View>
                <Text style={earningsStyles.amount}>${r.amount.toLocaleString()}</Text>
              </View>
              <View style={earningsStyles.barTrack}>
                <View style={[earningsStyles.barFill, { width: `${widthPct}%` }]} />
              </View>
            </View>
          );
        })}
      </View>

      {/* Upcoming Invoices section */}
      <View style={{ gap: 10 }}>
        <Text style={tabStyles.sectionLabel}>UPCOMING INVOICES</Text>
        {UPCOMING_INVOICES.map((inv) => {
          const isOverdue = inv.status === 'overdue';
          return (
            <View key={inv.id} style={earningsStyles.card}>
              <View style={earningsStyles.cardTop}>
                <View style={[earningsStyles.brandBadge, { backgroundColor: inv.color }]}>
                  <Text style={earningsStyles.brandBadgeText}>{inv.initial}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={earningsStyles.brandName}>{inv.brand}</Text>
                  <Text style={[earningsStyles.brandShare, isOverdue && { color: '#FF4444' }]}>
                    {inv.dueDate}
                  </Text>
                </View>
                <View
                  style={[
                    earningsStyles.statusPill,
                    {
                      backgroundColor: isOverdue
                        ? 'rgba(255,68,68,0.16)'
                        : 'rgba(255,111,60,0.16)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      earningsStyles.statusText,
                      { color: isOverdue ? '#FF4444' : '#FF6F3C' },
                    ]}
                  >
                    {inv.amount}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const earningsStyles = StyleSheet.create({
  tile: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  tileLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  tileValue: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
  brandName: { color: '#FFF', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  brandShare: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  amount: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#FF6F3C', borderRadius: 3 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
});

// ── PROFESSIONAL ── Wallet tab ──
function WalletTabContent() {
  return (
    <View style={{ gap: 16 }}>
      {/* Hero balance card */}
      <View style={statsCardStyles.heroCard}>
        <View style={statsCardStyles.heroLeft}>
          <View style={[statsCardStyles.heroAvatarWrap, { backgroundColor: '#FF6F3C' }]}>
            <Ionicons name="wallet" size={24} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={statsCardStyles.heroName}>${WALLET_BALANCE.available.toLocaleString()}</Text>
            <View style={statsCardStyles.sportRow}>
              <Ionicons name="checkmark-circle" size={14} color="#34C759" />
              <Text style={statsCardStyles.heroSport}>Available now</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Snapshot tiles */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={[earningsStyles.tile, { flex: 1 }]}>
          <Text style={earningsStyles.tileLabel}>Pending</Text>
          <Text style={earningsStyles.tileValue}>
            ${WALLET_BALANCE.pending.toLocaleString()}
          </Text>
        </View>
        <View style={[earningsStyles.tile, { flex: 1 }]}>
          <Text style={earningsStyles.tileLabel}>Next payout</Text>
          <Text style={earningsStyles.tileValue} numberOfLines={1}>
            {WALLET_BALANCE.nextPayoutDate}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={walletStyles.actionRow}>
        <TouchableOpacity style={walletStyles.primaryBtn} activeOpacity={0.85}>
          <Ionicons name="arrow-down" size={15} color="#000" />
          <Text style={walletStyles.primaryBtnText}>Transfer out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={walletStyles.secondaryBtn} activeOpacity={0.7}>
          <Ionicons name="swap-vertical" size={15} color="#FFF" />
          <Text style={walletStyles.secondaryBtnText}>Manage</Text>
        </TouchableOpacity>
      </View>

      {/* Payout Method */}
      <View style={{ gap: 10 }}>
        <Text style={tabStyles.sectionLabel}>PAYOUT METHOD</Text>
        <TouchableOpacity activeOpacity={0.7} style={earningsStyles.card}>
          <View style={earningsStyles.cardTop}>
            <View style={[earningsStyles.brandBadge, { backgroundColor: '#635BFF' }]}>
              <Ionicons name="card" size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={earningsStyles.brandName}>{PAYOUT_METHOD.type}</Text>
              <Text style={earningsStyles.brandShare}>
                {PAYOUT_METHOD.bank} · {PAYOUT_METHOD.mask}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Recent payouts */}
      <View style={{ gap: 10 }}>
        <Text style={tabStyles.sectionLabel}>RECENT PAYOUTS</Text>
        {RECENT_PAYOUTS.map((p) => (
          <View key={p.id} style={earningsStyles.card}>
            <View style={earningsStyles.cardTop}>
              <View style={[earningsStyles.brandBadge, { backgroundColor: p.color }]}>
                <Text style={earningsStyles.brandBadgeText}>{p.initial}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={earningsStyles.brandName}>{p.brand}</Text>
                <Text style={earningsStyles.brandShare}>{p.date}</Text>
              </View>
              <View style={[earningsStyles.statusPill, { backgroundColor: 'rgba(52,199,89,0.16)' }]}>
                <Text style={[earningsStyles.statusText, { color: '#34C759' }]}>+{p.amount}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const walletStyles = StyleSheet.create({
  actionRow: { flexDirection: 'row', gap: 8 },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFF',
  },
  primaryBtnText: { color: '#000', fontWeight: '800', fontSize: 13, letterSpacing: -0.1 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: STATS_CARD_BG,
  },
  secondaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13, letterSpacing: -0.1 },
});

// ─── Profile Selector Modal ────────────────────────────────────

function ProfileSelectorModal({
  visible,
  currentUser,
  venues,
  organizations,
  selectedVenueId,
  selectedOrgId,
  isProfessionalMode,
  onClose,
  onSelectPersonal,
  onSelectProfessional,
  onSelectVenue,
  onSelectOrg,
  onCreateOrg,
}: {
  visible: boolean;
  currentUser: { id: number; userName?: string; firstName?: string; lastName?: string; avatar?: { url: string } | null };
  venues: { id: number; name: string; imageUrl?: string }[];
  organizations: { id: number; name: string; logo?: { url: string } | null }[];
  selectedVenueId: number | null;
  selectedOrgId: number | null;
  isProfessionalMode: boolean;
  onClose: () => void;
  onSelectPersonal: () => void;
  onSelectProfessional: () => void;
  onSelectVenue: (venue: { id: number; name: string }) => void;
  onSelectOrg: (org: { id: number; name: string }) => void;
  onCreateOrg: () => void;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(400);
  const backdropOpacity = useSharedValue(0);
  const SHEET_TRAVEL = 400;

  React.useEffect(() => {
    if (visible) {
      backdropOpacity.value = 1;
      translateY.value = withTiming(0, { duration: 300 });
    }
  }, [visible]);

  const dismiss = React.useCallback(() => {
    translateY.value = withTiming(400, { duration: 200 });
    backdropOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(onClose, 200);
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        backdropOpacity.value = 1 - Math.min(e.translationY / SHEET_TRAVEL, 1);
      }
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 500) {
        translateY.value = withTiming(400, { duration: 200 });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 200 });
        backdropOpacity.value = withTiming(1, { duration: 200 });
      }
    });

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,0,0,${0.6 * backdropOpacity.value})`,
  }));

  if (!visible) return null;

  const displayName = currentUser.firstName
    ? `${currentUser.firstName}${currentUser.lastName ? ' ' + currentUser.lastName : ''}`
    : currentUser.userName || 'User';

  const isProfessional = isProfessionalMode;
  const isPersonal = !isProfessional;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      <Animated.View style={[selectorStyles.overlay, backdropAnimStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={dismiss} />

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[selectorStyles.sheet, sheetAnimStyle]}>
            <View style={selectorStyles.content}>
              <View style={selectorStyles.handle} />

              <View style={selectorStyles.listContainer}>
                {/* Personal */}
                <GHTouchableOpacity
                  style={[selectorStyles.item, isPersonal && selectorStyles.itemActive]}
                  activeOpacity={isPersonal ? 1 : 0.7}
                  onPress={() => {
                    if (!isPersonal) onSelectPersonal();
                  }}
                >
                  <Image
                    source={
                      currentUser.avatar?.url
                        ? { uri: currentUser.avatar.url }
                        : require('@/assets/images/kiyan-avatar.png')
                    }
                    style={selectorStyles.avatarImage}
                  />
                  <View style={selectorStyles.info}>
                    <Text style={selectorStyles.nameText}>Personal</Text>
                    <Text style={selectorStyles.subtitleText}>
                      Stats, schedule, team
                    </Text>
                  </View>
                  {isPersonal && <Ionicons name="checkmark-circle" size={22} color="#FF6F3C" />}
                </GHTouchableOpacity>

                {/* Professional */}
                <GHTouchableOpacity
                  style={[selectorStyles.item, isProfessional && selectorStyles.itemActive]}
                  activeOpacity={isProfessional ? 1 : 0.7}
                  onPress={() => {
                    if (!isProfessional) onSelectProfessional();
                  }}
                >
                  <View style={[selectorStyles.iconWrap, isProfessional && selectorStyles.iconWrapActive]}>
                    <Ionicons name="briefcase" size={18} color={isProfessional ? '#FFF' : 'rgba(255,255,255,0.75)'} />
                  </View>
                  <View style={selectorStyles.info}>
                    <Text style={selectorStyles.nameText}>Professional</Text>
                    <Text style={selectorStyles.subtitleText}>
                      Deals, earnings, analytics, team
                    </Text>
                  </View>
                  {isProfessional && <Ionicons name="checkmark-circle" size={22} color="#FF6F3C" />}
                </GHTouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </Modal>
  );
}

// ─── Dashboard Menu (shown when venue selected) ────────────────

interface DashboardMenuItem {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

function DashboardMenuGroup({
  title,
  items,
  delay,
  onItemPress,
}: {
  title: string;
  items: DashboardMenuItem[];
  delay: number;
  onItemPress: (route: string) => void;
}) {
  const t = glassText['light'];
  const border = glassBorder['light'];

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500).springify()} style={dashStyles.section}>
      <View style={[dashStyles.sectionCard, { borderColor: border }]}>
        {items.map((item, index) => (
          <React.Fragment key={item.route}>
            <TouchableOpacity style={dashStyles.menuItem} onPress={() => onItemPress(item.route)} activeOpacity={0.7}>
              <View style={dashStyles.menuItemIcon}>
                <Ionicons name={item.icon} size={18} color={t.primary} />
              </View>
              <View style={dashStyles.menuItemContent}>
                <Text style={[dashStyles.menuItemTitle, { color: t.primary }]}>{item.title}</Text>
                <Text style={[dashStyles.menuItemSubtitle, { color: t.muted }]}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={t.muted} />
            </TouchableOpacity>
            {index < items.length - 1 && <View style={[dashStyles.divider, { backgroundColor: border }]} />}
          </React.Fragment>
        ))}
      </View>
    </Animated.View>
  );
}

function VenueDashboardContent({ venueId, venueName, organizationId, activeSection }: { venueId: number; venueName?: string; organizationId?: number; activeSection: string }) {
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: venueData } = useVenue(venueId || undefined);

  const handleNav = useCallback(
    (route: string) => router.push(route as Href),
    [router],
  );

  const createEventQuery = [
    organizationId ? `organizationId=${organizationId}` : '',
    venueId ? `venueId=${venueId}` : '',
    venueName ? `venueName=${encodeURIComponent(venueName)}` : '',
    venueData?.address ? `venueAddress=${encodeURIComponent(venueData.address)}` : '',
  ].filter(Boolean).join('&');
  const orgQuery = organizationId ? `?organizationId=${organizationId}` : '';

  const insightsItems: DashboardMenuItem[] = [
    ...(venueId ? [{ title: 'Manage Venue' as const, subtitle: 'Manage your venue' as const, icon: 'business-outline' as const, route: `/manage-venue/${venueId}` }] : []),
    { title: 'Analytics', subtitle: 'View detailed insights', icon: 'bar-chart-outline', route: `/dashboard/analytics${orgQuery}` },
    { title: 'Revenue', subtitle: 'Track earnings and trends', icon: 'trending-up-outline', route: `/dashboard/revenue${orgQuery}` },
    { title: 'Wallet', subtitle: 'View earnings and payouts', icon: 'wallet-outline', route: `/dashboard/payments${orgQuery}` },
  ];

  const sectionMap: Record<string, { title: string; items: DashboardMenuItem[] }> = {
    Insights: { title: 'INSIGHTS', items: insightsItems },
  };

  if (activeSection === 'Overview') {
    return (
      <View style={dashStyles.scrollView}>
        <OverviewEventsList organizationId={organizationId} insetsBottom={insets.bottom} />
        <Pressable
          style={[dashStyles.createEventFab, { bottom: insets.bottom + 20 }]}
          onPress={() => handleNav(`/create-event${createEventQuery ? `?${createEventQuery}` : ''}`)}
        >
          <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
          <Ionicons name="add" size={32} color="#000" style={{ fontWeight: '900' }} />
        </Pressable>
      </View>
    );
  }

  if (activeSection === 'Audience') {
    return <AudienceContent organizationId={organizationId} insetsBottom={insets.bottom} />;
  }

  const section = sectionMap[activeSection];
  if (!section || section.items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="construct-outline" size={48} color="rgba(0,0,0,0.2)" />
        <Text style={styles.emptyStateText}>No items</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={dashStyles.scrollView}
      contentContainerStyle={[dashStyles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      <DashboardMenuGroup title={section.title} items={section.items} delay={100} onItemPress={handleNav} />
    </ScrollView>
  );
}

// Inline event list shown on the Overview tab
function OverviewEventsList({ organizationId, insetsBottom }: { organizationId?: number; insetsBottom: number }) {
  const router = useStableRouter();
  const { data: events = [], isLoading, refetch } = useMyEvents(organizationId);
  const { refreshControl } = useRefreshControl({
    onRefresh: async () => {
      await refetch();
    },
  });

  if (isLoading) {
    return (
      <View style={dashStyles.overviewEmpty}>
        <ActivityIndicator color="#000" />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={dashStyles.overviewEmpty}>
        <Ionicons name="calendar-outline" size={48} color="rgba(0,0,0,0.2)" />
        <Text style={dashStyles.overviewEmptyText}>No events yet</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={dashStyles.scrollView}
      contentContainerStyle={[dashStyles.overviewListContent, { paddingBottom: insetsBottom + 180 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {events.filter((e) => getEventImageUrl(e)).map((event) => (
        <OverviewEventCard
          key={event.id}
          event={event}
          onPress={() => router.push({ pathname: '/manage-event/[id]', params: { id: String(event.id) } })}
        />
      ))}
    </ScrollView>
  );
}

function OverviewEventCard({ event, onPress }: { event: StatusEvent; onPress: () => void }) {
  const flyerUrl = getEventImageUrl(event);
  const isVideo = event.flyer?.mimeType?.startsWith('video/') || false;

  const dateStr = useMemo(
    () => new Date(event.startDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    [event.startDate],
  );
  const statusLabel = useMemo(
    () => event.status === EventStatus.DRAFT
      ? 'Draft'
      : event.status === EventStatus.PUBLISHED
        ? 'Published'
        : event.status === EventStatus.ACTIVE
          ? 'Live'
          : event.status === EventStatus.FINISHED
            ? 'Ended'
            : 'Cancelled',
    [event.status],
  );

  return (
    <TouchableOpacity
      style={dashStyles.eventCard}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel={`Manage event ${event.name}`}
      accessibilityRole="button"
    >
      {/* Blurred backdrop */}
      {flyerUrl ? (
        <>
          <Image
            source={{ uri: flyerUrl }}
            style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
            resizeMode="cover"
          />
          <BlurView
            intensity={50}
            tint="dark"
            style={[StyleSheet.absoluteFill, { borderRadius: 18, overflow: 'hidden' }]}
          />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFill, { borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)' }]} />
      )}

      {/* Main media */}
      {flyerUrl ? (
        isVideo ? (
          <View style={dashStyles.eventImage}>
            <FeedMediaPlayer
              mediaType="video"
              videoUrl={flyerUrl}
              imageUrl={flyerUrl}
              poster={flyerUrl}
              isActive={true}
            />
          </View>
        ) : (
          <Image source={{ uri: flyerUrl }} style={dashStyles.eventImage} resizeMode="cover" />
        )
      ) : (
        <View style={[dashStyles.eventImage, dashStyles.eventImagePlaceholder]}>
          <Ionicons name="calendar-outline" size={40} color="rgba(0,0,0,0.2)" />
        </View>
      )}
      <View style={dashStyles.eventCardBody}>
        <Text style={dashStyles.eventName} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={dashStyles.eventMeta} numberOfLines={1}>
          {dateStr}
          {event.location ? ` · ${event.location}` : ''}
        </Text>
        <View style={dashStyles.eventStatsRow}>
          <View style={dashStyles.eventStat}>
            <Text style={dashStyles.eventStatValue}>{event.attendeeCount ?? 0}</Text>
            <Text style={dashStyles.eventStatLabel}>RSVPs</Text>
          </View>
          <View style={dashStyles.eventStatusPill}>
            <Text style={dashStyles.eventStatusText}>{statusLabel}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Audience Content (inline My List + Text Blast flow) ──────

const PAGE_SIZE = 20;

function AudienceContent({ organizationId, insetsBottom }: { organizationId?: number; insetsBottom: number }) {
  const router = useStableRouter();
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [searchText, setSearchText] = React.useState('');
  const [filterEventIds, setFilterEventIds] = React.useState<Set<number>>(new Set());
  const [filterModalVisible, setFilterModalVisible] = React.useState(false);
  const debouncedSearch = useDebounce(searchText, 300);

  const { data: myEvents = [] } = useMyEvents(organizationId);
  const filterCount = filterEventIds.size;
  const filterLabel = filterCount === 0 ? null : filterCount === 1 ? myEvents.find((e) => filterEventIds.has(e.id))?.name : `${filterCount} events`;

  const toggleFilterEvent = React.useCallback((id: number) => {
    setFilterEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const query = useInfiniteQuery({
    queryKey: ['owner-contacts-audience', debouncedSearch, organizationId, [...filterEventIds]],
    queryFn: async ({ pageParam }) => {
      return eventsApi.getOwnerContacts({
        page: pageParam as number,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        organizationId,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasNext && lastPage.page) return lastPage.page + 1;
      return undefined;
    },
    staleTime: 1000 * 60 * 2,
  });

  const contacts: OwnerContact[] = React.useMemo(
    () => query.data?.pages.flatMap((p) => p.contacts) ?? [],
    [query.data],
  );

  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));

  const toggleSelect = React.useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = React.useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  }, [allSelected, contacts]);

  const handleNext = React.useCallback(() => {
    if (selectedIds.size === 0) return;
    router.push({
      pathname: '/text-blast-compose',
      params: { count: String(selectedIds.size) },
    });
  }, [selectedIds.size, router]);

  return (
    <View style={audStyles.flex}>
      {/* Search + Filter */}
      <View style={audStyles.searchRow}>
        <View style={audStyles.searchBar}>
          <Ionicons name="search" size={18} color="rgba(0,0,0,0.4)" />
          <TextInput
            style={audStyles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search contacts"
            placeholderTextColor="rgba(0,0,0,0.35)"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color="rgba(0,0,0,0.3)" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[audStyles.filterButton, filterCount > 0 && audStyles.filterButtonActive]}
          onPress={() => {
            Keyboard.dismiss();
            setFilterModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="funnel-outline" size={16} color={filterCount > 0 ? '#fff' : '#000'} />
          {filterLabel ? (
            <Text style={[audStyles.filterButtonText, audStyles.filterButtonTextActive]} numberOfLines={1}>{filterLabel}</Text>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          style={audStyles.selectAllPill}
          onPress={() => {
            Keyboard.dismiss();
            handleSelectAll();
          }}
          activeOpacity={0.7}
        >
          <Text style={audStyles.selectAllText}>{allSelected ? 'Deselect' : 'Select All'}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFilterModalVisible(false)}>
        <View style={audStyles.filterModal}>
          <View style={audStyles.filterModalHeader}>
            <Text style={audStyles.filterModalTitle}>Filter By Events</Text>
            <TouchableOpacity
              style={audStyles.filterModalDone}
              onPress={() => setFilterModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={audStyles.filterModalDoneText}>Done{filterCount > 0 ? ` (${filterCount})` : ''}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[audStyles.filterModalAllRow, filterCount === 0 && audStyles.filterModalAllRowActive]}
            onPress={() => setFilterEventIds(new Set())}
            activeOpacity={0.7}
          >
            <Ionicons name="people" size={20} color={filterCount === 0 ? '#fff' : '#000'} />
            <Text style={[audStyles.filterModalAllText, filterCount === 0 && audStyles.filterModalAllTextActive]}>All Events</Text>
            {filterCount === 0 && <Ionicons name="checkmark" size={20} color="#fff" />}
          </TouchableOpacity>

          <ScrollView contentContainerStyle={audStyles.filterModalGrid} showsVerticalScrollIndicator={false}>
            {myEvents.map((ev) => {
              const isActive = filterEventIds.has(ev.id);
              const flyerUrl = ev.flyer?.url || ev.imageUrl;
              return (
                <TouchableOpacity
                  key={ev.id}
                  style={audStyles.filterModalCard}
                  onPress={() => toggleFilterEvent(ev.id)}
                  activeOpacity={0.7}
                >
                  {flyerUrl ? (
                    <Image source={{ uri: flyerUrl }} style={[audStyles.filterModalCardImage, isActive && audStyles.filterModalCardImageActive]} resizeMode="cover" />
                  ) : (
                    <View style={[audStyles.filterModalCardImage, audStyles.filterModalCardImagePlaceholder, isActive && audStyles.filterModalCardImageActive]}>
                      <Ionicons name="calendar-outline" size={28} color="rgba(0,0,0,0.2)" />
                    </View>
                  )}
                  {isActive && (
                    <View style={audStyles.filterModalCheckmark}>
                      <Ionicons name="checkmark-circle" size={24} color="#000" />
                    </View>
                  )}
                  <Text style={[audStyles.filterModalCardName, isActive && audStyles.filterModalCardNameActive]} numberOfLines={2}>{ev.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* List */}
      <FlatList
        style={audStyles.list}
        data={contacts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AudienceRow
            contact={item}
            selected={selectedIds.has(item.id)}
            onToggle={() => toggleSelect(item.id)}
          />
        )}
        contentContainerStyle={[audStyles.listContent, { paddingBottom: insetsBottom + 100 }]}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          query.isLoading ? (
            <View style={audStyles.empty}>
              <ActivityIndicator color="#000" />
            </View>
          ) : (
            <View style={audStyles.empty}>
              <Ionicons name="people-outline" size={44} color="rgba(0,0,0,0.2)" />
              <Text style={audStyles.emptyText}>No contacts yet</Text>
            </View>
          )
        }
      />

      {/* Next button */}
      <View style={[audStyles.nextBar, { paddingBottom: insetsBottom + 13 }]}>
        <TouchableOpacity
          style={[audStyles.nextButton, selectedIds.size === 0 && audStyles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={selectedIds.size === 0}
          activeOpacity={0.85}
        >
          <Text style={audStyles.nextButtonText}>
            {selectedIds.size > 0 ? `Next (${selectedIds.size})` : 'Select recipients'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AudienceRow({
  contact,
  selected,
  onToggle,
}: {
  contact: OwnerContact;
  selected: boolean;
  onToggle: () => void;
}) {
  const displayName =
    contact.firstName || contact.lastName
      ? `${contact.firstName ?? ''}${contact.lastName ? ' ' + contact.lastName : ''}`.trim()
      : contact.userName || 'User';
  const subtitle = contact.userName ? `@${contact.userName}` : contact.phoneNumber || '';

  return (
    <TouchableOpacity
      style={audStyles.row}
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityLabel={`${displayName}${subtitle ? `, ${subtitle}` : ''}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <Image
        source={contact.avatar ? { uri: contact.avatar } : DefaultAvatarImage}
        style={audStyles.rowAvatar}
      />
      <View style={audStyles.rowInfo}>
        <Text style={audStyles.rowName} numberOfLines={1}>
          {displayName}
        </Text>
        {subtitle ? (
          <Text style={audStyles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[audStyles.checkbox, selected && audStyles.checkboxChecked]}>
        {selected ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
      </View>
    </TouchableOpacity>
  );
}

function PersonalAdminContent() {
  const router = useStableRouter();
  const insets = useSafeAreaInsets();

  const handleNav = useCallback(
    (route: string) => router.push(route as Href),
    [router],
  );

  const adminItems: DashboardMenuItem[] = [
    { title: 'Admin Panel', subtitle: 'Manage users, events, and posts', icon: 'shield-checkmark-outline', route: '/admin' },
  ];

  return (
    <ScrollView
      style={dashStyles.scrollView}
      contentContainerStyle={[dashStyles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      <DashboardMenuGroup title="ADMIN" items={adminItems} delay={100} onItemPress={handleNav} />
    </ScrollView>
  );
}

export default function WalletScreen() {
  const { role } = useRole();
  if (role === 'coach') return <CoachView />;
  if (role === 'agent') return <AgentView />;
  if (role === 'brand') return <BrandView />;
  if (role === 'fan') return <FanView />;
  if (role === 'school') return <SchoolView />;
  if (role === 'nilManager') return <NilManagerView />;
  return <PlayerActivityScreen />;
}

function PlayerActivityScreen() {
  const router = useStableRouter();
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const {
    user,
    offers,
    events,
    isLoading,
    claimOffer,
    refreshWallet,
  } = useWallet();
  const { data: myVenues = [] } = useMyVenues();

  const [cardMenuVisible, setCardMenuVisible] = React.useState(false);
  const [profileSelectorVisible, setProfileSelectorVisible] = React.useState(false);
  const [selectedVenue, setSelectedVenue] = React.useState<{ id: number; name: string } | null>(null);
  const [selectedOrg, setSelectedOrg] = React.useState<{ id: number; name: string } | null>(null);
  const [isProfessionalMode, setIsProfessionalMode] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState<string>('Stats');

  const tabs = React.useMemo(
    () =>
      (isProfessionalMode
        ? venueTabs
        : authUser?.role === UserRole.ADMIN
          ? personalAdminTabs
          : personalTabs) as readonly string[],
    [isProfessionalMode, authUser?.role],
  );
  const activeTabIndex = Math.max(0, tabs.indexOf(activeTab));
  const tabPillWidth = useSharedValue(0);
  const animatedTabIndex = useSharedValue(activeTabIndex);
  React.useEffect(() => {
    animatedTabIndex.value = withTiming(activeTabIndex, { duration: 180 });
  }, [activeTabIndex, animatedTabIndex]);
  const tabKnobStyle = useAnimatedStyle(() => {
    const segW = tabPillWidth.value / Math.max(tabs.length, 1);
    const inset = 4;
    return {
      width: Math.max(segW - inset * 2, 0),
      transform: [{ translateX: animatedTabIndex.value * segW + inset }],
    };
  });

  const { data: membershipCard, isLoading: isLoadingCard } = useMembershipCard(
    !!user?.isProfileComplete
  );

  const handleExpandQR = useCallback(() => {
    if (membershipCard?.pdf417Payload) {
      setCardMenuVisible(false);
      router.push({
        pathname: '/qr-card',
        params: {
          payload: membershipCard.pdf417Payload,
          cardNumber: membershipCard.cardNumber ?? '',
        },
      });
    }
  }, [membershipCard, router]);

  // Profile selector handlers (stable — setState setters don't need deps)
  const handleSelectPersonal = useCallback(() => {
    setSelectedVenue(null);
    setSelectedOrg(null);
    setIsProfessionalMode(false);
    setActiveTab('Stats');
    setProfileSelectorVisible(false);
  }, []);

  const handleSelectVenue = useCallback((venue: { id: number; name: string }) => {
    setSelectedVenue(venue);
    setSelectedOrg(null);
    setIsProfessionalMode(true);
    setActiveTab('Deals');
    setProfileSelectorVisible(false);
  }, []);

  const handleSelectOrg = useCallback((org: { id: number; name: string }) => {
    setSelectedOrg(org);
    setSelectedVenue(null);
    setIsProfessionalMode(true);
    setActiveTab('Deals');
    setProfileSelectorVisible(false);
  }, []);

  const handleSelectProfessional = useCallback(() => {
    setSelectedVenue(null);
    setSelectedOrg(null);
    setIsProfessionalMode(true);
    setActiveTab('Deals');
    setProfileSelectorVisible(false);
  }, []);

  const handleCreateOrg = useCallback(() => {
    setProfileSelectorVisible(false);
    router.push('/create-organization');
  }, [router]);

  const handleCloseProfileSelector = useCallback(() => {
    setProfileSelectorVisible(false);
  }, []);

  // RSVP-only events (no ticketId) that haven't ended yet — passed to TicketList separately
  const rsvpEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => {
      if (e.ticketId) return false; // Only RSVP events
      const end = e.endDateTime ? new Date(e.endDateTime).getTime() : NaN;
      const start = new Date(e.dateTime).getTime();
      // Use endDateTime if valid, otherwise startDate + 12h
      const cutoff = !isNaN(end) ? end : (!isNaN(start) ? start + 12 * 60 * 60 * 1000 : 0);
      return cutoff > now;
    });
  }, [events]);

  // Pull-to-refresh with haptic feedback
  const { refreshControl } = useRefreshControl({
    onRefresh: refreshWallet,
  });

  const showSkeleton = isLoading || !user;

  return (
    <View style={styles.container}>

      {/* Floating pill row — TOP */}
      <View style={[styles.headerScrollFixed, styles.headerScrollContent, { top: insets.top + 8 }]}>
        <Pressable
          style={styles.headerPill}
          onPress={() => setProfileSelectorVisible(true)}
          accessibilityLabel="Switch profile"
          accessibilityRole="button"
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView
              glassEffectStyle="regular"
              style={[StyleSheet.absoluteFill, { borderRadius: 23 }]}
            />
          </View>
          {isProfessionalMode && !selectedVenue && !selectedOrg ? (
            <View style={[styles.headerPillAvatar, styles.headerPillBriefcase]}>
              <Ionicons name="briefcase" size={20} color="#FFF" />
            </View>
          ) : (
            <ExpoImage
              source={
                selectedVenue
                  ? (myVenues.find((v) => v.id === selectedVenue.id)?.imageUrl
                      ? { uri: myVenues.find((v) => v.id === selectedVenue.id)!.imageUrl }
                      : DefaultAvatarImage)
                  : selectedOrg
                    ? (authUser?.organizations?.find((o) => o.id === selectedOrg.id)?.logo?.url
                        ? { uri: authUser!.organizations!.find((o) => o.id === selectedOrg.id)!.logo!.url }
                        : DefaultAvatarImage)
                    : require('@/assets/images/kiyan-avatar.png')
              }
              style={styles.headerPillAvatar}
            />
          )}
          <Ionicons name="menu" size={22} color="#FFF" style={styles.headerPillIcon} />
        </Pressable>

        <View
          style={styles.tabSegmentedPill}
          onLayout={(e) => {
            tabPillWidth.value = e.nativeEvent.layout.width;
          }}
        >
          <View style={styles.glassLayer} pointerEvents="none">
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
          {tabs.map((label) => {
            const isActive = activeTab === label;
            return (
              <Pressable
                key={label}
                style={styles.tabSegment}
                onPress={() => setActiveTab(label)}
                accessibilityLabel={`${label} tab`}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {showSkeleton ? (
        <WalletSkeleton topOffset={HEADER_OFFSET} />
      ) : activeTab === 'Admin' ? (
        <PersonalAdminContent />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: 160, paddingHorizontal: 16, gap: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {activeTab === 'Stats' && <StatsTabContent />}
          {activeTab === 'Team' && <TeamTabContent />}
          {activeTab === 'Schedule' && <ScheduleTabContent />}
          {activeTab === 'Deals' && <DealsTabContent />}
          {activeTab === 'Earnings' && <EarningsTabContent />}
          {activeTab === 'Wallet' && <WalletTabContent />}
        </ScrollView>
      )}

      {/* Profile Selector */}
      {authUser && (
        <ProfileSelectorModal
          visible={profileSelectorVisible}
          currentUser={authUser}
          venues={myVenues.map((v) => ({ id: v.id, name: v.name, imageUrl: v.imageUrl }))}
          organizations={(authUser?.organizations ?? []).map((o) => ({ id: o.id, name: o.name, logo: o.logo }))}
          selectedVenueId={selectedVenue?.id ?? null}
          selectedOrgId={selectedOrg?.id ?? null}
          isProfessionalMode={isProfessionalMode}
          onClose={handleCloseProfileSelector}
          onSelectPersonal={handleSelectPersonal}
          onSelectProfessional={handleSelectProfessional}
          onSelectVenue={handleSelectVenue}
          onSelectOrg={handleSelectOrg}
          onCreateOrg={handleCreateOrg}
        />
      )}

      {user && (
        <StatusCardMenuSheet
          visible={cardMenuVisible}
          onClose={() => setCardMenuVisible(false)}
          onExpandQR={handleExpandQR}
          user={user}
          pdf417Payload={membershipCard?.pdf417Payload}
          cardNumber={membershipCard?.cardNumber ?? undefined}
          isLoadingCard={isLoadingCard}
        />
      )}

      {/* Top fade — gives the floating top pill row visual depth */}
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        locations={[0, 0.5, 1]}
        style={[styles.topFade, { height: insets.top + 90 }]}
        pointerEvents="none"
      />

      {/* Bottom fade — keeps content fading into the floating native tab bar */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 170 }]}
        pointerEvents="none"
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  scrollView: {
    flex: 1,
  },
  headerScrollFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    flexGrow: 0,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    zIndex: 99,
  },
  headerScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
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
    backgroundColor: 'rgba(255,255,255,0.22)',
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
  headerPillBriefcase: {
    backgroundColor: '#FF6F3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPillIcon: {
    marginLeft: 8,
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 23,
  },
  tabPill: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
  },
  tabPillTextActive: {
    color: '#FF6F3C',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 80,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.35)',
  },
  tableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tableCardLeft: {
    flex: 1,
    gap: 2,
  },
  tableLabel: {
    fontSize: 17,
    color: '#000',
  },
  tableMeta: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
  },
  tableCardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  tableSeats: {
    fontSize: 14,
    color: '#000',
  },
  tableStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tableStatusText: {
    fontSize: 12,
  },

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarPillText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  pillSegment: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSegmentText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
  pillSegmentTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
});

const selectorStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: 0,
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingBottom: 40,
    backgroundColor: '#0F1114',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    paddingTop: 10,
    paddingBottom: 16,
    letterSpacing: -0.3,
  },
  listContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  itemActive: {
    backgroundColor: 'rgba(255,111,60,0.10)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconWrapActive: {
    backgroundColor: '#FF6F3C',
    borderColor: 'rgba(255,111,60,0.6)',
  },
  info: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  helperText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 18,
    paddingHorizontal: 20,
    paddingTop: 14,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
});

const tabStyles = StyleSheet.create({
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: 'rgba(255,255,255,0.45)', paddingHorizontal: 4 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 16, overflow: 'hidden' },
  brandBadge: { alignItems: 'center', justifyContent: 'center' },
  brandBadgeText: { color: '#FFF', fontWeight: '900', letterSpacing: -0.4 },

  // Stat tiles
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statTile: { flexBasis: '23%', flexGrow: 1, backgroundColor: '#1C1C1E', borderRadius: 14, padding: 12, alignItems: 'center' },
  statTileBig: { flexBasis: '48%', backgroundColor: 'rgba(255,111,60,0.10)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,111,60,0.30)' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#FFF', fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
  statValueBig: { fontSize: 30, color: '#FF6F3C' },
  statLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.8, marginTop: 2 },

  // Game log
  logRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  logRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  logRowTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  logOpponent: { fontSize: 14, fontWeight: '700', color: '#FFF', letterSpacing: -0.1 },
  logResult: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  logLine: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2, letterSpacing: -0.1 },
  logDate: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  // Peer compare
  peerHeader: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8, gap: 10, backgroundColor: 'rgba(255,255,255,0.04)' },
  peerRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, gap: 10, alignItems: 'center' },
  peerCell: { flex: 1, fontSize: 13, color: '#FFF', fontWeight: '700', fontVariant: ['tabular-nums'], textAlign: 'right' },
  peerValSelf: { color: '#FF6F3C' },
  peerHead: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: 'rgba(255,255,255,0.5)' },
  peerLabel: { fontSize: 13, color: '#FFF', fontWeight: '600' },
  peerDelta: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Team
  teamSummaryLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: 'rgba(255,255,255,0.5)' },
  teamSummaryBig: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: -0.4 },
  teamSummarySub: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  memberName: { fontSize: 14, fontWeight: '700', color: '#FFF', letterSpacing: -0.2 },
  memberRole: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  memberJersey: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.3 },

  // Schedule
  scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  scheduleDateCol: { width: 56, alignItems: 'center' },
  scheduleDay: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 },
  scheduleDate: { fontSize: 13, fontWeight: '800', color: '#FFF', letterSpacing: -0.1, marginTop: 2 },
  scheduleOpponent: { fontSize: 14, fontWeight: '700', color: '#FFF', letterSpacing: -0.2 },
  scheduleVenue: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  schedulePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth },
  pillHome: { borderColor: 'rgba(255,111,60,0.45)', backgroundColor: 'rgba(255,111,60,0.12)' },
  pillAway: { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.06)' },
  schedulePillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  scheduleResult: { fontSize: 13, fontWeight: '800' },

  // Deals
  dealRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dealMeta: { flexDirection: 'row', gap: 10 },
  dealMetaLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color: 'rgba(255,255,255,0.45)' },
  dealMetaValue: { fontSize: 12, color: '#FFF', fontWeight: '700', marginTop: 2, letterSpacing: -0.1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth },
  statusActive: { borderColor: 'rgba(52,199,89,0.45)', backgroundColor: 'rgba(52,199,89,0.12)' },
  statusPending: { borderColor: 'rgba(255,111,60,0.45)', backgroundColor: 'rgba(255,111,60,0.12)' },
  statusSigned: { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)' },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  matchPill: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,111,60,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,111,60,0.45)' },
  matchLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, color: 'rgba(255,111,60,0.85)' },
  matchScore: { fontSize: 16, fontWeight: '900', color: '#FF6F3C', fontVariant: ['tabular-nums'] },

  // Earnings
  earningsBig: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  earningsMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  earningsMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  revenueRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  revenueBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  revenueBarFill: { height: 4, borderRadius: 2 },
  revenueAmount: { fontSize: 13, fontWeight: '800', color: '#FFF', fontVariant: ['tabular-nums'] },

  // Invoices
  invoiceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },

  // Wallet
  walletBtnRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  walletBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)' },
  walletBtnPrimary: { backgroundColor: '#FFF', borderColor: '#FFF' },
  walletBtnText: { fontSize: 12, fontWeight: '800', color: '#FFF', letterSpacing: -0.1 },

  // Sub-tabs (Stats / Game Log / vs ACC) — profile-style underline
  subTabsRow: { flexDirection: 'row', paddingHorizontal: 4 },
  subTab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  subTabActive: { borderBottomColor: '#FF6F3C' },
  subTabLabel: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.55)', letterSpacing: -0.1 },
  subTabLabelActive: { color: '#FFF', fontWeight: '700' },
});

const dashStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: HEADER_OFFSET,
  },
  createEventFab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  overviewEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  overviewEmptyText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.4)',
  },
  overviewListContent: {
    padding: 16,
    paddingTop: HEADER_OFFSET,
    gap: 14,
  },
  eventCard: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCardBody: {
    paddingTop: 12,
    paddingHorizontal: 4,
    gap: 6,
  },
  eventName: {
    fontSize: 17,
    color: '#fff',
  },
  eventMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  eventStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  eventStatValue: {
    fontSize: 18,
    color: '#fff',
  },
  eventStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  eventStatusPill: {
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
  },
  eventStatusText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
  },
  menuItemSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 62,
  },
});

const audStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: HEADER_OFFSET,
    paddingBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  selectAllPill: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 13,
    color: '#000',
  },
  filterButton: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 130,
  },
  filterButtonActive: {
    backgroundColor: '#000',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#000',
    flexShrink: 1,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  // Filter modal
  filterModal: {
    flex: 1,
    backgroundColor: PAGE_BG,
    paddingTop: 16,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterModalTitle: {
    fontSize: 20,
    color: '#000',
  },
  filterModalDone: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalDoneText: {
    fontSize: 14,
    color: '#fff',
  },
  filterModalAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  filterModalAllRowActive: {
    backgroundColor: '#000',
  },
  filterModalAllText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  filterModalAllTextActive: {
    color: '#fff',
  },
  filterModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 40,
  },
  filterModalCard: {
    width: '47%' as any,
    marginBottom: 4,
  },
  filterModalCardImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterModalCardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalCardImageActive: {
    borderWidth: 3,
    borderColor: '#000',
  },
  filterModalCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  filterModalCardName: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    marginTop: 6,
  },
  filterModalCardNameActive: {
    color: '#000',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  rowAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    color: '#000',
  },
  rowSubtitle: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.4)',
  },
  nextBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    width: 240,
    borderRadius: 26,
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  composeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  composeBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  composeHeaderInfo: {
    flex: 1,
    alignItems: 'center',
  },
  composeHeaderTitle: {
    fontSize: 16,
    color: '#000',
  },
  composeHeaderSubtitle: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 1,
  },
  composeBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  composeHint: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  composeInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: PAGE_BG,
  },
  composeInputWrapper: {
    flex: 1,
    minHeight: 38,
    maxHeight: 120,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  composeInput: {
    fontSize: 15,
    color: '#000',
    padding: 0,
    margin: 0,
    maxHeight: 100,
  },
  composeSend: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  composeSendDisabled: {
    opacity: 0.3,
  },
});
