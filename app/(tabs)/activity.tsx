// Wallet Screen - Membership card, offers, and events
import React, { useMemo, useCallback } from 'react';
import { useStableRouter } from '@/hooks/use-stable-router';
import type { Href } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity, Pressable, Modal, Text, Image, ActivityIndicator, FlatList, TextInput, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '@/lib/providers/wallet-provider';
import { useAuth } from '@/lib/providers/auth-provider';
import { useRole } from '@/lib/providers/role-provider';
import { CoachView } from '@/components/coach/coach-view';
import { ScorekeeperView } from '@/components/scorekeeper/scorekeeper-view';
import { BrandView } from '@/components/brand/brand-view';
import { FanView } from '@/components/fan/fan-view';
import { SchoolView } from '@/components/school/school-view';
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

// ── PERSONAL ── Stats tab ──
function StatsTabContent() {
  const [subTab, setSubTab] = React.useState<'stats' | 'log' | 'peers'>('stats');
  const SUB_TABS: { key: 'stats' | 'log' | 'peers'; label: string }[] = [
    { key: 'stats', label: 'Stats' },
    { key: 'log', label: 'Game Log' },
    { key: 'peers', label: 'vs ACC' },
  ];

  return (
    <View style={{ gap: 16 }}>
      <View style={tabStyles.subTabsRow}>
        {SUB_TABS.map(({ key, label }) => {
          const isActive = subTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[tabStyles.subTab, isActive && tabStyles.subTabActive]}
              onPress={() => setSubTab(key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[tabStyles.subTabLabel, isActive && tabStyles.subTabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {subTab === 'stats' && (
        <>
          <SectionHeader label="SEASON AVERAGES" accent="#FF6F3C" />
          <View style={tabStyles.statGrid}>
            <StatTile value={SEASON_AVG.ppg.toFixed(1)} label="PTS" big />
            <StatTile value={SEASON_AVG.rpg.toFixed(1)} label="REB" />
            <StatTile value={SEASON_AVG.apg.toFixed(1)} label="AST" />
            <StatTile value={SEASON_AVG.spg.toFixed(1)} label="STL" />
            <StatTile value={`${SEASON_AVG.fgPct.toFixed(1)}%`} label="FG" />
            <StatTile value={`${SEASON_AVG.threePct.toFixed(1)}%`} label="3P" />
            <StatTile value={`${SEASON_AVG.ftPct.toFixed(1)}%`} label="FT" />
            <StatTile value={SEASON_AVG.mpg.toFixed(1)} label="MIN" />
          </View>
        </>
      )}

      {subTab === 'log' && (
        <>
          <SectionHeader label="GAME LOG" accent="#FF6F3C" />
          <View style={tabStyles.card}>
            {GAME_LOG.map((g, i) => (
              <View key={g.id} style={[tabStyles.logRow, i !== GAME_LOG.length - 1 && tabStyles.logRowDivider]}>
                <View style={{ flex: 1 }}>
                  <View style={tabStyles.logRowTop}>
                    <Text style={tabStyles.logOpponent}>{g.opponent}</Text>
                    <Text style={[tabStyles.logResult, { color: g.result.startsWith('W') ? '#34C759' : '#FF4444' }]}>{g.result}</Text>
                  </View>
                  <Text style={tabStyles.logLine}>{g.line}</Text>
                </View>
                <Text style={tabStyles.logDate}>{g.date}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {subTab === 'peers' && (
        <>
          <SectionHeader label="VS ACC FRESHMEN GUARDS" accent="#FF6F3C" />
          <View style={tabStyles.card}>
            <View style={tabStyles.peerHeader}>
              <Text style={[tabStyles.peerCell, tabStyles.peerHead, { flex: 2, textAlign: 'left' }]}>STAT</Text>
              <Text style={[tabStyles.peerCell, tabStyles.peerHead]}>YOU</Text>
              <Text style={[tabStyles.peerCell, tabStyles.peerHead]}>AVG</Text>
              <Text style={[tabStyles.peerCell, tabStyles.peerHead]}>BEST</Text>
            </View>
            {PEER_COMP.map((s, i) => (
              <View key={s.label} style={[tabStyles.peerRow, i !== PEER_COMP.length - 1 && tabStyles.logRowDivider]}>
                <View style={{ flex: 2 }}>
                  <Text style={tabStyles.peerLabel}>{s.label}</Text>
                  <Text style={[tabStyles.peerDelta, { color: s.positive ? '#34C759' : 'rgba(255,255,255,0.55)' }]}>{s.delta} vs avg</Text>
                </View>
                <Text style={[tabStyles.peerCell, tabStyles.peerValSelf]}>{s.you}</Text>
                <Text style={tabStyles.peerCell}>{s.avg}</Text>
                <Text style={tabStyles.peerCell}>{s.best}</Text>
              </View>
            ))}
          </View>
        </>
      )}
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
  const [subTab, setSubTab] = React.useState<'staff' | 'roster'>('staff');
  const SUB_TABS: { key: 'staff' | 'roster'; label: string }[] = [
    { key: 'staff', label: 'Staff' },
    { key: 'roster', label: 'Roster' },
  ];

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
      <View style={tabStyles.subTabsRow}>
        {SUB_TABS.map(({ key, label }) => {
          const isActive = subTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[tabStyles.subTab, isActive && tabStyles.subTabActive]}
              onPress={() => setSubTab(key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[tabStyles.subTabLabel, isActive && tabStyles.subTabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {subTab === 'staff' && (
        <>
          <SectionHeader label="COACHING STAFF" accent="#FF6F3C" />
          <View style={tabStyles.card}>
            {COACHING_STAFF.map((m, i) => (
              <Pressable
                key={m.id}
                onPress={() => openMember(m, 'staff')}
                style={({ pressed }) => [
                  tabStyles.memberRow,
                  i !== COACHING_STAFF.length - 1 && tabStyles.logRowDivider,
                  pressed && { opacity: 0.6 },
                ]}
                accessibilityRole="button"
              >
                <BrandBadge color={m.color} initial={m.initial} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={tabStyles.memberName}>{m.name}</Text>
                  <Text style={tabStyles.memberRole}>{m.role}{m.tag ? ` · ${m.tag}` : ''}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
              </Pressable>
            ))}
          </View>
        </>
      )}

      {subTab === 'roster' && (
        <>
          <SectionHeader label="ROSTER" accent="#FF6F3C" />
          <View style={tabStyles.card}>
            {ROSTER.map((m, i) => (
              <Pressable
                key={m.id}
                onPress={() => openMember(m, 'roster')}
                style={({ pressed }) => [
                  tabStyles.memberRow,
                  i !== ROSTER.length - 1 && tabStyles.logRowDivider,
                  pressed && { opacity: 0.6 },
                ]}
                accessibilityRole="button"
              >
                <BrandBadge color={m.color} initial={m.initial} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={tabStyles.memberName}>{m.name}</Text>
                  <Text style={tabStyles.memberRole}>{m.role}</Text>
                </View>
                {m.tag && <Text style={tabStyles.memberJersey}>{m.tag}</Text>}
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ── PERSONAL ── Schedule tab ──
function ScheduleTabContent() {
  const [subTab, setSubTab] = React.useState<'upcoming' | 'recent'>('upcoming');
  const SUB_TABS: { key: 'upcoming' | 'recent'; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'recent', label: 'Recent' },
  ];
  const upcoming = SCHEDULE.filter((g) => g.status === 'upcoming');
  const past = SCHEDULE.filter((g) => g.status === 'final');

  return (
    <View style={{ gap: 16 }}>
      <View style={[tabStyles.card, { padding: 16, gap: 4 }]}>
        <Text style={tabStyles.teamSummaryLabel}>RECORD</Text>
        <Text style={tabStyles.teamSummaryBig}>18–8  ·  10–4 ACC</Text>
        <Text style={tabStyles.teamSummarySub}>T-4th ACC · Kenpom #31 · NET #28</Text>
      </View>

      <View style={tabStyles.subTabsRow}>
        {SUB_TABS.map(({ key, label }) => {
          const isActive = subTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[tabStyles.subTab, isActive && tabStyles.subTabActive]}
              onPress={() => setSubTab(key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[tabStyles.subTabLabel, isActive && tabStyles.subTabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {subTab === 'upcoming' && (
        <>
          <SectionHeader label="UPCOMING" accent="#FF6F3C" />
          <View style={tabStyles.card}>
            {upcoming.map((g, i) => (
              <View key={g.id} style={[tabStyles.scheduleRow, i !== upcoming.length - 1 && tabStyles.logRowDivider]}>
                <View style={tabStyles.scheduleDateCol}>
                  <Text style={tabStyles.scheduleDay}>{g.date.split(' · ')[0]}</Text>
                  <Text style={tabStyles.scheduleDate}>{g.date.split(' · ')[1]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={tabStyles.scheduleOpponent}>{g.home ? 'vs' : '@'} {g.opponent}</Text>
                  <Text style={tabStyles.scheduleVenue}>{g.venue}</Text>
                </View>
                <View style={[tabStyles.schedulePill, g.home ? tabStyles.pillHome : tabStyles.pillAway]}>
                  <Text style={[tabStyles.schedulePillText, { color: g.home ? '#FF6F3C' : 'rgba(255,255,255,0.85)' }]}>{g.home ? 'HOME' : 'AWAY'}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {subTab === 'recent' && (
        <>
          <SectionHeader label="RECENT RESULTS" accent="#FF6F3C" />
          <View style={tabStyles.card}>
            {past.map((g, i) => (
              <View key={g.id} style={[tabStyles.scheduleRow, i !== past.length - 1 && tabStyles.logRowDivider]}>
                <View style={tabStyles.scheduleDateCol}>
                  <Text style={tabStyles.scheduleDay}>{g.date.split(' · ')[0]}</Text>
                  <Text style={tabStyles.scheduleDate}>{g.date.split(' · ')[1]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={tabStyles.scheduleOpponent}>{g.home ? 'vs' : '@'} {g.opponent}</Text>
                  <Text style={tabStyles.scheduleVenue}>{g.venue}</Text>
                </View>
                <Text style={[tabStyles.scheduleResult, { color: g.result?.startsWith('W') ? '#34C759' : '#FF4444' }]}>{g.result}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ── PROFESSIONAL ── Deals tab ──
function DealsTabContent() {
  const [subTab, setSubTab] = React.useState<'active' | 'offers'>('active');
  const SUB_TABS: { key: 'active' | 'offers'; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'offers', label: 'Offers' },
  ];

  return (
    <View style={{ gap: 16 }}>
      <View style={tabStyles.subTabsRow}>
        {SUB_TABS.map(({ key, label }) => {
          const isActive = subTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[tabStyles.subTab, isActive && tabStyles.subTabActive]}
              onPress={() => setSubTab(key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[tabStyles.subTabLabel, isActive && tabStyles.subTabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {subTab === 'active' && (
        <>
          <SectionHeader label="ACTIVE CONTRACTS" accent="#FF6F3C" />
          <View style={{ gap: 10 }}>
            {ACTIVE_DEALS.map((d) => (
              <View key={d.id} style={[tabStyles.card, { padding: 14, gap: 10 }]}>
                <View style={tabStyles.dealRow}>
                  <BrandBadge color={d.color} initial={d.initial} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={tabStyles.memberName}>{d.brand}</Text>
                    <Text style={tabStyles.memberRole}>{d.contract}</Text>
                  </View>
                  <View style={[tabStyles.statusPill, d.status === 'Active' && tabStyles.statusActive, d.status === 'Pending' && tabStyles.statusPending, d.status === 'Signed' && tabStyles.statusSigned]}>
                    <Text style={[tabStyles.statusText, { color: d.status === 'Active' ? '#34C759' : d.status === 'Pending' ? '#FF6F3C' : '#FFF' }]}>{d.status}</Text>
                  </View>
                </View>
                <View style={tabStyles.dealMeta}>
                  <View style={{ flex: 1 }}>
                    <Text style={tabStyles.dealMetaLabel}>Value</Text>
                    <Text style={tabStyles.dealMetaValue}>{d.amount}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={tabStyles.dealMetaLabel}>Next deliverable</Text>
                    <Text style={tabStyles.dealMetaValue}>{d.due}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {subTab === 'offers' && (
        <>
          <SectionHeader label="OFFER INBOX" accent="#FF6F3C" />
          <View style={{ gap: 10 }}>
            {OFFER_INBOX.map((o) => (
              <View key={o.id} style={[tabStyles.card, { padding: 14 }]}>
                <View style={tabStyles.dealRow}>
                  <BrandBadge color={o.color} initial={o.initial} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={tabStyles.memberName}>{o.brand}</Text>
                    <Text style={tabStyles.memberRole}>{o.summary}</Text>
                    <Text style={tabStyles.dealMetaValue}>{o.amount}  ·  {o.received}</Text>
                  </View>
                  <View style={tabStyles.matchPill}>
                    <Text style={tabStyles.matchLabel}>MATCH</Text>
                    <Text style={tabStyles.matchScore}>{o.matchScore}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ── PROFESSIONAL ── Earnings tab ──
function EarningsTabContent() {
  const total = EARNINGS_YTD.total + EARNINGS_YTD.pending;
  const [subTab, setSubTab] = React.useState<'partners' | 'invoices'>('partners');
  const SUB_TABS: { key: 'partners' | 'invoices'; label: string }[] = [
    { key: 'partners', label: 'Partners' },
    { key: 'invoices', label: 'Invoices' },
  ];

  return (
    <View style={{ gap: 16 }}>
      <View style={[tabStyles.card, { padding: 18, gap: 6 }]}>
        <Text style={tabStyles.teamSummaryLabel}>YTD EARNINGS</Text>
        <Text style={tabStyles.earningsBig}>${EARNINGS_YTD.total.toLocaleString()}</Text>
        <View style={tabStyles.earningsMetaRow}>
          <Text style={tabStyles.earningsMetaText}>Pending: ${EARNINGS_YTD.pending.toLocaleString()}</Text>
          <Text style={[tabStyles.earningsMetaText, { color: '#34C759' }]}>{EARNINGS_YTD.monthDelta}</Text>
        </View>
        <Text style={tabStyles.earningsMetaText}>Next payout · {EARNINGS_YTD.nextPayout}</Text>
      </View>

      <View style={tabStyles.subTabsRow}>
        {SUB_TABS.map(({ key, label }) => {
          const isActive = subTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[tabStyles.subTab, isActive && tabStyles.subTabActive]}
              onPress={() => setSubTab(key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[tabStyles.subTabLabel, isActive && tabStyles.subTabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {subTab === 'partners' && (
        <>
          <SectionHeader label="REVENUE BY PARTNER" accent="#FF6F3C" />
          <View style={tabStyles.card}>
            {REVENUE_BY_BRAND.map((r, i) => {
              const pct = (r.amount / total) * 100;
              return (
                <View key={r.brand} style={[tabStyles.revenueRow, i !== REVENUE_BY_BRAND.length - 1 && tabStyles.logRowDivider]}>
                  <BrandBadge color={r.color} initial={r.initial} size={34} />
                  <View style={{ flex: 1 }}>
                    <Text style={tabStyles.memberName}>{r.brand}</Text>
                    <View style={tabStyles.revenueBarBg}>
                      <View style={[tabStyles.revenueBarFill, { width: `${Math.min(100, pct * 2)}%`, backgroundColor: r.color }]} />
                    </View>
                  </View>
                  <Text style={tabStyles.revenueAmount}>${r.amount.toLocaleString()}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      {subTab === 'invoices' && (
        <>
          <SectionHeader label="UPCOMING INVOICES" accent="#FF6F3C" />
          <View style={tabStyles.card}>
            {UPCOMING_INVOICES.map((inv, i) => (
              <View key={inv.id} style={[tabStyles.invoiceRow, i !== UPCOMING_INVOICES.length - 1 && tabStyles.logRowDivider]}>
                <BrandBadge color={inv.color} initial={inv.initial} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={tabStyles.memberName}>{inv.brand}</Text>
                  <Text style={[tabStyles.memberRole, inv.status === 'overdue' && { color: '#FF4444' }]}>{inv.dueDate}</Text>
                </View>
                <Text style={tabStyles.revenueAmount}>{inv.amount}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ── PROFESSIONAL ── Wallet tab ──
function WalletTabContent() {
  const [subTab, setSubTab] = React.useState<'payouts' | 'method'>('payouts');
  const SUB_TABS: { key: 'payouts' | 'method'; label: string }[] = [
    { key: 'payouts', label: 'Payouts' },
    { key: 'method', label: 'Method' },
  ];

  return (
    <View style={{ gap: 16 }}>
      <View style={[tabStyles.card, { padding: 18, gap: 6 }]}>
        <Text style={tabStyles.teamSummaryLabel}>AVAILABLE BALANCE</Text>
        <Text style={tabStyles.earningsBig}>${WALLET_BALANCE.available.toLocaleString()}</Text>
        <View style={tabStyles.earningsMetaRow}>
          <Text style={tabStyles.earningsMetaText}>Pending · ${WALLET_BALANCE.pending.toLocaleString()}</Text>
          <Text style={tabStyles.earningsMetaText}>Next · {WALLET_BALANCE.nextPayoutDate}</Text>
        </View>
        <View style={tabStyles.walletBtnRow}>
          <TouchableOpacity style={[tabStyles.walletBtn, tabStyles.walletBtnPrimary]} activeOpacity={0.8}>
            <Ionicons name="arrow-down" size={14} color="#000" />
            <Text style={[tabStyles.walletBtnText, { color: '#000' }]}>Transfer out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tabStyles.walletBtn} activeOpacity={0.8}>
            <Ionicons name="swap-vertical" size={14} color="#FFF" />
            <Text style={tabStyles.walletBtnText}>Manage</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={tabStyles.subTabsRow}>
        {SUB_TABS.map(({ key, label }) => {
          const isActive = subTab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[tabStyles.subTab, isActive && tabStyles.subTabActive]}
              onPress={() => setSubTab(key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[tabStyles.subTabLabel, isActive && tabStyles.subTabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {subTab === 'payouts' && (
        <>
          <SectionHeader label="RECENT PAYOUTS" accent="#FF6F3C" />
          <View style={tabStyles.card}>
            {RECENT_PAYOUTS.map((p, i) => (
              <View key={p.id} style={[tabStyles.revenueRow, i !== RECENT_PAYOUTS.length - 1 && tabStyles.logRowDivider]}>
                <BrandBadge color={p.color} initial={p.initial} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={tabStyles.memberName}>{p.brand}</Text>
                  <Text style={tabStyles.memberRole}>{p.date}</Text>
                </View>
                <Text style={[tabStyles.revenueAmount, { color: '#34C759' }]}>+{p.amount}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {subTab === 'method' && (
        <>
          <SectionHeader label="PAYOUT METHOD" accent="#FF6F3C" />
          <View style={[tabStyles.card, { padding: 14 }]}>
            <View style={tabStyles.dealRow}>
              <View style={[tabStyles.brandBadge, { backgroundColor: '#635BFF', width: 40, height: 40, borderRadius: 12 }]}>
                <Ionicons name="card" size={18} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={tabStyles.memberName}>{PAYOUT_METHOD.type}</Text>
                <Text style={tabStyles.memberRole}>{PAYOUT_METHOD.bank}  ·  {PAYOUT_METHOD.mask}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

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

              <Text style={selectorStyles.title}>Switch Account</Text>

              <View style={selectorStyles.listContainer}>
                {/* Personal */}
                <GHTouchableOpacity
                  style={[selectorStyles.item, isPersonal && selectorStyles.itemActive]}
                  activeOpacity={isPersonal ? 1 : 0.7}
                  onPress={() => {
                    if (!isPersonal) onSelectPersonal();
                  }}
                >
                  <View style={[selectorStyles.iconWrap, isPersonal && selectorStyles.iconWrapActive]}>
                    <Ionicons name="person" size={20} color={isPersonal ? '#FFF' : 'rgba(255,255,255,0.75)'} />
                  </View>
                  <View style={selectorStyles.info}>
                    <Text style={selectorStyles.nameText}>Personal</Text>
                    <Text style={selectorStyles.subtitleText}>
                      {displayName} · Tickets, tables, DMs
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

              <Text style={selectorStyles.helperText}>
                Your professional workspace surfaces brand offers, payouts, and compliance tools. Personal mode is your fan-facing account.
              </Text>
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
  if (role === 'scorekeeper') return <ScorekeeperView />;
  if (role === 'brand') return <BrandView />;
  if (role === 'fan') return <FanView />;
  if (role === 'school') return <SchoolView />;
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

      {/* Floating pill row */}
      <View style={[styles.headerScrollFixed, styles.headerScrollContent]}>
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
          <Animated.View style={[styles.tabKnob, tabKnobStyle]} pointerEvents="none" />
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
          contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 160, paddingHorizontal: 16, gap: 16 }}
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

      {/* Floating bottom toolbar — back | dashboard | live */}
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
    bottom: TAB_BAR_TOP_FROM_BOTTOM + 10,
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
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 16, overflow: 'hidden' },
  brandBadge: { alignItems: 'center', justifyContent: 'center' },
  brandBadgeText: { color: '#FFF', fontWeight: '900', letterSpacing: -0.4 },

  // Stat tiles
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statTile: { flexBasis: '23%', flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 12, padding: 10, alignItems: 'center' },
  statTileBig: { flexBasis: '48%', backgroundColor: 'rgba(255,111,60,0.10)', borderColor: 'rgba(255,111,60,0.35)' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#FFF', fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
  statValueBig: { fontSize: 28, color: '#FF6F3C' },
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
