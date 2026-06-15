import * as React from 'react';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  Pressable,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type LayoutChangeEvent,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import { trackScreen } from '@/lib/analytics';
import { persistLocalMedia, isLocalMediaAlive, healLocalMediaUri, type LocalMedia } from '@/lib/media/local-media';
import { resolveSlotMedia } from '@/lib/media/resolve-media';
import { TILE_MEDIA_STORAGE_KEY, tileSlot } from '@/lib/home/tiles';
import { MasonryTile } from '@/components/home/masonry-tile';
import { FanPostComposer } from "@/components/fan/post-composer";
import { SymbolView } from "expo-symbols";
import { ActionSheet } from '@/components/ui/action-sheet';
import { FanAssistant } from '@/components/home/fan-assistant-sheet';
import { HomeNotificationsSheet } from '@/components/home/home-notifications-sheet';
import {
  CANVAS, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY,
  SURFACE, SURFACE_RAISED, HAIRLINE, HAIRLINE_SUBTLE,
  RADIUS_SM, RADIUS_CARD, RADIUS_LG, RADIUS_PILL,
} from '@/components/shared/ui-kit/tokens';

// ───── Layout constants ─────

const SCREEN_W = Dimensions.get('window').width;
const SECTION_OUTER_PAD = 14;
// ── Masonry grid geometry (home runs slightly bigger cards than the fan feed) ──
const GRID_MARGIN = 8;
const GRID_GUTTER = 6;
const GRID_CARD_WIDTH = (SCREEN_W - GRID_MARGIN * 2 - GRID_GUTTER) / 2;
const SECTION_INNER_PAD = 12;
const CARD_GAP = 10;
const SECTION_W = SCREEN_W - SECTION_OUTER_PAD * 2;
const INNER_W = SECTION_W - SECTION_INNER_PAD * 2;
// Each card lives in a "slot" (preserves the section's overall size).
const MINI_SLOT_W = (INNER_W - CARD_GAP) / 2;
const MINI_SLOT_H = Math.round(MINI_SLOT_W * 1.12);
// The visible card is smaller than its slot — centered inside it.
const MINI_CARD_SCALE_W = 0.92;
const MINI_CARD_SCALE_H = 0.74;
const MINI_CARD_W = Math.round(MINI_SLOT_W * MINI_CARD_SCALE_W);
const MINI_CARD_H = Math.round(MINI_SLOT_H * MINI_CARD_SCALE_H);
// Outer feed snap-pitch: header (icon + padding) + slot + footer + outer padding + section gap
const SECTION_HEADER_H = 50;
const SECTION_FOOTER_H = 44;
const SECTION_TOTAL_H = SECTION_INNER_PAD * 2 + SECTION_HEADER_H + MINI_SLOT_H + SECTION_FOOTER_H;
const SECTION_GAP_V = 14;

// ───── Types ─────

export type MatchupCard = {
  id: string;
  variant: 'matchup';
  status: 'LIVE' | 'FINAL' | 'PRE';
  statusLabel: string;
  away: { abbr: string; color: string; score?: number };
  home: { abbr: string; color: string; score?: number };
  meta?: string;
};

export type PlayerCard = {
  id: string;
  variant: 'player';
  topPill: string;
  topPillTone: 'gold' | 'orange' | 'teal' | 'neutral';
  name: string;
  team: string;
  stat: string;
  initial: string;
  color: string;
  usePhoto?: boolean;
};

export type DealCard = {
  id: string;
  variant: 'deal';
  value: string;
  athlete: string;
  athleteInitial: string;
  athleteColor: string;
  brand: string;
  brandColor: string;
  duration: string;
};

export type AnyCard = MatchupCard | PlayerCard | DealCard;

export type Section = {
  id: string;
  title: string;
  subtitle: string;
  iconLabel: string;
  iconColor: string;
  accent: string;
  cards: AnyCard[];
  awardGroups?: { award: string; nominees: PlayerCard[] }[];
  bgImage?: any;
};

// ───── Mock data ─────

export const SECTIONS: Section[] = [
  {
    id: 'ncaab',
    title: 'NCAA Basketball',
    subtitle: '6 live · 18 today',
    iconLabel: '🏀',
    iconColor: '#F76900',
    accent: '#FF6F3C',
    cards: [
      {
        id: 'ncaab-1', variant: 'matchup',
        status: 'LIVE', statusLabel: 'LIVE · Q3 4:32',
        away: { abbr: 'DUKE', color: '#001A57', score: 54 },
        home: { abbr: 'CUSE', color: '#F76900', score: 62 },
        meta: 'JMA Wireless',
      },
      {
        id: 'ncaab-2', variant: 'matchup',
        status: 'LIVE', statusLabel: 'LIVE · Q4 1:48',
        away: { abbr: 'UNC', color: '#7BAFD4', score: 68 },
        home: { abbr: 'UVA', color: '#232D4B', score: 71 },
        meta: 'JPJ Arena',
      },
      {
        id: 'ncaab-7', variant: 'matchup',
        status: 'LIVE', statusLabel: 'LIVE · Q2 8:11',
        away: { abbr: 'KEN', color: '#0033A0', score: 41 },
        home: { abbr: 'TENN', color: '#FF8200', score: 38 },
        meta: 'Thompson-Boling',
      },
      {
        id: 'ncaab-8', variant: 'matchup',
        status: 'LIVE', statusLabel: 'LIVE · Q1 6:24',
        away: { abbr: 'PUR', color: '#CFB991', score: 18 },
        home: { abbr: 'IND', color: '#990000', score: 22 },
        meta: 'Assembly Hall',
      },
      {
        id: 'ncaab-9', variant: 'matchup',
        status: 'LIVE', statusLabel: 'LIVE · OT',
        away: { abbr: 'MICH', color: '#00274C', score: 76 },
        home: { abbr: 'OSU', color: '#BB0000', score: 76 },
        meta: 'Schottenstein',
      },
      {
        id: 'ncaab-10', variant: 'matchup',
        status: 'LIVE', statusLabel: 'LIVE · Q4 0:42',
        away: { abbr: 'TX', color: '#BF5700', score: 81 },
        home: { abbr: 'OU', color: '#841617', score: 79 },
        meta: 'Lloyd Noble',
      },
      {
        id: 'ncaab-3', variant: 'matchup',
        status: 'PRE', statusLabel: 'Tonight · 7:00p',
        away: { abbr: 'KU', color: '#0051BA' },
        home: { abbr: 'KSU', color: '#512888' },
        meta: 'Bramlage',
      },
      {
        id: 'ncaab-4', variant: 'matchup',
        status: 'PRE', statusLabel: 'Tonight · 9:00p',
        away: { abbr: 'UCLA', color: '#2D68C4' },
        home: { abbr: 'ARIZ', color: '#AB0520' },
        meta: 'McKale Center',
      },
      {
        id: 'ncaab-11', variant: 'matchup',
        status: 'PRE', statusLabel: 'Tonight · 7:30p',
        away: { abbr: 'HOU', color: '#C8102E' },
        home: { abbr: 'ARK', color: '#9D2235' },
        meta: 'Bud Walton',
      },
      {
        id: 'ncaab-12', variant: 'matchup',
        status: 'PRE', statusLabel: 'Tomorrow · 6:00p',
        away: { abbr: 'AUB', color: '#0C2340' },
        home: { abbr: 'ALA', color: '#9E1B32' },
        meta: 'Coleman Coliseum',
      },
      {
        id: 'ncaab-13', variant: 'matchup',
        status: 'PRE', statusLabel: 'Sat · 2:00p',
        away: { abbr: 'MARQ', color: '#003366' },
        home: { abbr: 'UCONN', color: '#000E2F' },
        meta: 'Gampel Pavilion',
      },
      {
        id: 'ncaab-14', variant: 'matchup',
        status: 'PRE', statusLabel: 'Sat · 9:00p',
        away: { abbr: 'OREG', color: '#154733' },
        home: { abbr: 'WASH', color: '#4B2E83' },
        meta: 'Hec Ed Pavilion',
      },
      {
        id: 'ncaab-5', variant: 'matchup',
        status: 'FINAL', statusLabel: 'Final',
        away: { abbr: 'GONZ', color: '#041E42', score: 78 },
        home: { abbr: 'SMC', color: '#06315B', score: 71 },
        meta: 'WCC',
      },
      {
        id: 'ncaab-6', variant: 'matchup',
        status: 'FINAL', statusLabel: 'Final · OT',
        away: { abbr: 'BAY', color: '#003015', score: 88 },
        home: { abbr: 'TTU', color: '#CC0000', score: 92 },
        meta: 'United Supermkts',
      },
      {
        id: 'ncaab-15', variant: 'matchup',
        status: 'FINAL', statusLabel: 'Final',
        away: { abbr: 'ILL', color: '#13294B', score: 84 },
        home: { abbr: 'MSU', color: '#18453B', score: 79 },
        meta: 'State Farm Ctr',
      },
      {
        id: 'ncaab-16', variant: 'matchup',
        status: 'FINAL', statusLabel: 'Final · 2OT',
        away: { abbr: 'LSU', color: '#461D7C', score: 96 },
        home: { abbr: 'MISS', color: '#CE1126', score: 91 },
        meta: 'PMAC',
      },
      {
        id: 'ncaab-17', variant: 'matchup',
        status: 'FINAL', statusLabel: 'Final',
        away: { abbr: 'USC', color: '#990000', score: 73 },
        home: { abbr: 'UTAH', color: '#CC0000', score: 81 },
        meta: 'Galen Center',
      },
      {
        id: 'ncaab-18', variant: 'matchup',
        status: 'FINAL', statusLabel: 'Final',
        away: { abbr: 'WVU', color: '#002855', score: 67 },
        home: { abbr: 'ISU', color: '#C8102E', score: 70 },
        meta: 'Hilton Coliseum',
      },
    ],
  },
  {
    id: 'awards',
    title: 'Award Watch',
    subtitle: 'POY · Wooden · ROY',
    iconLabel: '🏆',
    iconColor: '#FFD60A',
    accent: '#FFD60A',
    cards: [
      {
        id: 'aw-1', variant: 'player',
        topPill: '#1 · Wooden', topPillTone: 'gold',
        name: 'Cooper Flagg', team: 'Duke',
        stat: '22.4 PPG · 9.6 RPG',
        initial: 'C', color: '#001A57',
      },
      {
        id: 'aw-2', variant: 'player',
        topPill: '#2 · POY', topPillTone: 'gold',
        name: 'Paige Bueckers', team: 'UConn',
        stat: '26.2 PPG · 6.1 APG',
        initial: 'P', color: '#000E2F',
      },
      {
        id: 'aw-3', variant: 'player',
        topPill: '#1 · ROY', topPillTone: 'orange',
        name: 'AJ Dybantsa', team: 'BYU',
        stat: '19.8 PPG · True Frosh',
        initial: 'A', color: '#002E5D',
      },
      {
        id: 'aw-4', variant: 'player',
        topPill: '🔥 5G streak', topPillTone: 'orange',
        name: 'RJ Davis', team: 'UNC',
        stat: '24.2 PPG · 6/11 from 3',
        initial: 'R', color: '#7BAFD4',
      },
      {
        id: 'aw-5', variant: 'player',
        topPill: 'DPOY · #1', topPillTone: 'teal',
        name: 'Travis Hunter', team: 'Colorado',
        stat: '4 INT · 2-way starter',
        initial: 'T', color: '#CFB87C',
      },
      {
        id: 'aw-6', variant: 'player',
        topPill: 'Spotlight · VB', topPillTone: 'neutral',
        name: 'Simone Lee', team: 'Penn St',
        stat: '5.2 k/set · Big Ten leader',
        initial: 'S', color: '#041E42',
      },
    ],
    awardGroups: [
      {
        award: 'Wooden Award',
        nominees: [
          { id: 'aw-w-1', variant: 'player', topPill: '#1', topPillTone: 'gold', name: 'Cooper Flagg', team: 'Duke', stat: '22.4 PPG · 9.6 RPG', initial: 'C', color: '#001A57' },
          { id: 'aw-w-2', variant: 'player', topPill: '#2', topPillTone: 'gold', name: 'Kiyan Anthony', team: 'Syracuse', stat: '21.0 PPG · 5.9 APG', initial: 'K', color: '#F76900', usePhoto: true },
          { id: 'aw-w-3', variant: 'player', topPill: '#3', topPillTone: 'gold', name: 'RJ Davis', team: 'UNC', stat: '24.2 PPG · 6/11 from 3', initial: 'R', color: '#7BAFD4' },
          { id: 'aw-w-4', variant: 'player', topPill: '#4', topPillTone: 'gold', name: 'AJ Dybantsa', team: 'BYU', stat: '19.8 PPG · True Frosh', initial: 'A', color: '#002E5D' },
          { id: 'aw-w-5', variant: 'player', topPill: '#5', topPillTone: 'gold', name: 'Hunter Sallis', team: 'Wake Forest', stat: '18.5 PPG · 41% 3PT', initial: 'H', color: '#9E7E38' },
          { id: 'aw-w-6', variant: 'player', topPill: '#6', topPillTone: 'gold', name: 'Trey Alexander', team: 'Creighton', stat: '17.2 PPG · 6.4 APG', initial: 'T', color: '#00478A' },
        ],
      },
      {
        award: 'Player of the Year',
        nominees: [
          { id: 'aw-p-1', variant: 'player', topPill: '#1', topPillTone: 'gold', name: 'Zach Edey', team: 'Purdue', stat: '24.6 PPG · 12.0 RPG', initial: 'Z', color: '#CFB991' },
          { id: 'aw-p-2', variant: 'player', topPill: '#2', topPillTone: 'gold', name: 'Tyler Kolek', team: 'Marquette', stat: '16.2 PPG · 7.7 APG', initial: 'T', color: '#003366' },
          { id: 'aw-p-3', variant: 'player', topPill: '#3', topPillTone: 'gold', name: 'Boo Buie', team: 'Northwestern', stat: '19.8 PPG · 4.8 APG', initial: 'B', color: '#4E2A84' },
          { id: 'aw-p-4', variant: 'player', topPill: '#4', topPillTone: 'gold', name: 'Kyle Filipowski', team: 'Duke', stat: '17.4 PPG · 8.5 RPG', initial: 'K', color: '#001A57' },
          { id: 'aw-p-5', variant: 'player', topPill: '#5', topPillTone: 'gold', name: 'Hunter Dickinson', team: 'Kansas', stat: '18.1 PPG · 11.0 RPG', initial: 'H', color: '#0051BA' },
          { id: 'aw-p-6', variant: 'player', topPill: '#6', topPillTone: 'gold', name: 'Jalen Cone', team: 'Northern AZ', stat: '22.8 PPG · 38% 3PT', initial: 'J', color: '#003466' },
        ],
      },
      {
        award: 'Rookie of the Year',
        nominees: [
          { id: 'aw-r-1', variant: 'player', topPill: '#1', topPillTone: 'orange', name: 'AJ Dybantsa', team: 'BYU', stat: '19.8 PPG · True Frosh', initial: 'A', color: '#002E5D' },
          { id: 'aw-r-2', variant: 'player', topPill: '#2', topPillTone: 'orange', name: 'Cameron Boozer', team: 'Duke', stat: '17.2 PPG · 8.6 RPG', initial: 'C', color: '#001A57' },
          { id: 'aw-r-3', variant: 'player', topPill: '#3', topPillTone: 'orange', name: 'Tre Johnson', team: 'Texas', stat: '19.4 PPG · 33% 3PT', initial: 'T', color: '#BF5700' },
          { id: 'aw-r-4', variant: 'player', topPill: '#4', topPillTone: 'orange', name: 'Boogie Fland', team: 'Arkansas', stat: '14.2 PPG · 5.5 APG', initial: 'B', color: '#9D2235' },
          { id: 'aw-r-5', variant: 'player', topPill: '#5', topPillTone: 'orange', name: 'VJ Edgecombe', team: 'Baylor', stat: '13.8 PPG · 5.1 RPG', initial: 'V', color: '#003015' },
          { id: 'aw-r-6', variant: 'player', topPill: '#6', topPillTone: 'orange', name: 'Karter Knox', team: 'Arkansas', stat: '11.5 PPG · 4.3 RPG', initial: 'K', color: '#9D2235' },
        ],
      },
      {
        award: 'Defensive Player of the Year',
        nominees: [
          { id: 'aw-d-1', variant: 'player', topPill: '#1', topPillTone: 'teal', name: 'Eddie Lampkin', team: 'Syracuse', stat: '4.1 BPG · 11.8 RPG', initial: 'E', color: '#F76900' },
          { id: 'aw-d-2', variant: 'player', topPill: '#2', topPillTone: 'teal', name: 'Donovan Clingan', team: 'UConn', stat: '3.6 BPG · 10.2 RPG', initial: 'D', color: '#000E2F' },
          { id: 'aw-d-3', variant: 'player', topPill: '#3', topPillTone: 'teal', name: 'Yves Missi', team: 'Baylor', stat: '2.9 BPG · 8.1 RPG', initial: 'Y', color: '#003015' },
          { id: 'aw-d-4', variant: 'player', topPill: '#4', topPillTone: 'teal', name: 'Adem Bona', team: 'UCLA', stat: '3.2 BPG · 7.6 RPG', initial: 'A', color: '#2D68C4' },
          { id: 'aw-d-5', variant: 'player', topPill: '#5', topPillTone: 'teal', name: "Kel'el Ware", team: 'Indiana', stat: '2.5 BPG · 9.4 RPG', initial: 'K', color: '#990000' },
          { id: 'aw-d-6', variant: 'player', topPill: '#6', topPillTone: 'teal', name: 'Vladislav Goldin', team: 'FAU', stat: '2.3 BPG · 6.8 RPG', initial: 'V', color: '#003366' },
        ],
      },
      {
        award: 'Sixth Man of the Year',
        nominees: [
          { id: 'aw-s-1', variant: 'player', topPill: '#1', topPillTone: 'neutral', name: 'Donnie Freeman', team: 'Syracuse', stat: '14.0 PPG · off bench', initial: 'D', color: '#F76900' },
          { id: 'aw-s-2', variant: 'player', topPill: '#2', topPillTone: 'neutral', name: 'Reece Beekman', team: 'Virginia', stat: '9.8 PPG · 6.2 APG', initial: 'R', color: '#232D4B' },
          { id: 'aw-s-3', variant: 'player', topPill: '#3', topPillTone: 'neutral', name: 'KJ Simpson', team: 'Colorado', stat: '12.4 PPG · bench', initial: 'K', color: '#CFB87C' },
          { id: 'aw-s-4', variant: 'player', topPill: '#4', topPillTone: 'neutral', name: 'Caleb Love', team: 'Arizona', stat: '11.6 PPG · 30% 3PT', initial: 'C', color: '#AB0520' },
          { id: 'aw-s-5', variant: 'player', topPill: '#5', topPillTone: 'neutral', name: 'Andrew Carr', team: 'Wake Forest', stat: '8.9 PPG · 6.4 RPG', initial: 'A', color: '#9E7E38' },
          { id: 'aw-s-6', variant: 'player', topPill: '#6', topPillTone: 'neutral', name: 'Tyler Burton', team: 'Villanova', stat: '9.5 PPG · 5.0 RPG', initial: 'T', color: '#002F6C' },
        ],
      },
    ],
  },
  {
    id: 'nba',
    title: 'NBA',
    subtitle: 'Conference Finals',
    iconLabel: '🏀',
    iconColor: '#1D428A',
    accent: '#3B82F6',
    cards: [
      {
        id: 'nba-1', variant: 'matchup',
        status: 'LIVE', statusLabel: 'LIVE · Q3 5:08',
        away: { abbr: 'LAL', color: '#552583', score: 88 },
        home: { abbr: 'GSW', color: '#FDB927', score: 94 },
        meta: 'Chase · WCF G6',
      },
      {
        id: 'nba-2', variant: 'matchup',
        status: 'PRE', statusLabel: 'Tomorrow · 8:30p',
        away: { abbr: 'BOS', color: '#007A33' },
        home: { abbr: 'NYK', color: '#006BB6' },
        meta: 'MSG · ECF G7',
      },
      {
        id: 'nba-3', variant: 'matchup',
        status: 'FINAL', statusLabel: 'Final',
        away: { abbr: 'OKC', color: '#007AC1', score: 112 },
        home: { abbr: 'DEN', color: '#0E2240', score: 105 },
        meta: 'Ball Arena',
      },
      {
        id: 'nba-4', variant: 'matchup',
        status: 'FINAL', statusLabel: 'Final · 2OT',
        away: { abbr: 'MIA', color: '#98002E', score: 124 },
        home: { abbr: 'PHI', color: '#006BB6', score: 119 },
        meta: 'Wells Fargo',
      },
      {
        id: 'nba-5', variant: 'matchup',
        status: 'PRE', statusLabel: 'Sat · 3:30p',
        away: { abbr: 'MIN', color: '#0C2340' },
        home: { abbr: 'PHX', color: '#1D1160' },
        meta: 'Footprint Ctr',
      },
      {
        id: 'nba-6', variant: 'matchup',
        status: 'PRE', statusLabel: 'Sun · 7:00p',
        away: { abbr: 'MIL', color: '#00471B' },
        home: { abbr: 'IND', color: '#FDBB30' },
        meta: 'Gainbridge',
      },
    ],
  },
  {
    id: 'nil',
    title: 'Top NIL Deals',
    subtitle: 'Closed this week',
    iconLabel: '💎',
    iconColor: '#14B8A6',
    accent: '#14B8A6',
    cards: [
      {
        id: 'nil-1', variant: 'deal',
        value: '$3.1M', athlete: 'Paige Bueckers', athleteInitial: 'P', athleteColor: '#000E2F',
        brand: 'NIKE', brandColor: '#000', duration: '3yr · excl',
      },
      {
        id: 'nil-2', variant: 'deal',
        value: '$1.8M', athlete: 'Cooper Flagg', athleteInitial: 'C', athleteColor: '#001A57',
        brand: 'GATORADE', brandColor: '#FF6900', duration: '1yr · renew',
      },
      {
        id: 'nil-3', variant: 'deal',
        value: '$2.4M', athlete: 'Travis Hunter', athleteInitial: 'T', athleteColor: '#CFB87C',
        brand: 'BEATS', brandColor: '#C8102E', duration: '2yr · multi',
      },
      {
        id: 'nil-4', variant: 'deal',
        value: '$680K', athlete: 'Kiyan Anthony', athleteInitial: 'K', athleteColor: '#F76900',
        brand: 'CARMAX', brandColor: '#003087', duration: '1yr · regional',
      },
      {
        id: 'nil-5', variant: 'deal',
        value: '$1.1M', athlete: 'Paul Skenes', athleteInitial: 'P', athleteColor: '#461D7C',
        brand: "ZAXBY'S", brandColor: '#E8451B', duration: '2yr · Southeast',
      },
      {
        id: 'nil-6', variant: 'deal',
        value: '$540K', athlete: 'Simone Lee', athleteInitial: 'S', athleteColor: '#041E42',
        brand: 'GATORADE', brandColor: '#FF6900', duration: '1yr · renew',
      },
    ],
  },
  {
    id: 'mlb',
    title: 'MLB',
    subtitle: 'May 2 · 14 games',
    iconLabel: '⚾',
    iconColor: '#FF6F3C',
    accent: '#FF6F3C',
    cards: [
      {
        id: 'mlb-1', variant: 'matchup',
        status: 'LIVE', statusLabel: 'LIVE · 7th 1 out',
        away: { abbr: 'NYY', color: '#003087', score: 4 },
        home: { abbr: 'BOS', color: '#BD3039', score: 3 },
        meta: 'Fenway',
      },
      {
        id: 'mlb-2', variant: 'matchup',
        status: 'LIVE', statusLabel: 'LIVE · 5th 2 outs',
        away: { abbr: 'LAD', color: '#005A9C', score: 8 },
        home: { abbr: 'SFG', color: '#FD5A1E', score: 2 },
        meta: 'Oracle Park',
      },
      {
        id: 'mlb-3', variant: 'matchup',
        status: 'PRE', statusLabel: 'Tonight · 7:05p',
        away: { abbr: 'ATL', color: '#13274F' },
        home: { abbr: 'PHI', color: '#E81828' },
        meta: 'Citizens Bank',
      },
      {
        id: 'mlb-4', variant: 'matchup',
        status: 'FINAL', statusLabel: 'Final',
        away: { abbr: 'HOU', color: '#002D62', score: 6 },
        home: { abbr: 'SEA', color: '#0C2C56', score: 4 },
        meta: 'T-Mobile Park',
      },
      {
        id: 'mlb-5', variant: 'matchup',
        status: 'PRE', statusLabel: 'Tonight · 8:10p',
        away: { abbr: 'CHC', color: '#0E3386' },
        home: { abbr: 'CWS', color: '#27251F' },
        meta: 'Guaranteed',
      },
      {
        id: 'mlb-6', variant: 'matchup',
        status: 'FINAL', statusLabel: 'Final · 11 inn',
        away: { abbr: 'SDP', color: '#2F241D', score: 5 },
        home: { abbr: 'COL', color: '#33006F', score: 4 },
        meta: 'Coors Field',
      },
    ],
  },
  {
    id: 'nhl',
    title: 'NHL',
    subtitle: 'Stanley Cup Playoffs',
    iconLabel: '🏒',
    iconColor: '#3B82F6',
    accent: '#3B82F6',
    cards: [
      {
        id: 'nhl-1', variant: 'matchup',
        status: 'LIVE', statusLabel: 'LIVE · 2nd 6:14',
        away: { abbr: 'EDM', color: '#FF4C00', score: 2 },
        home: { abbr: 'DAL', color: '#006847', score: 1 },
        meta: 'American Airlines · WCF G3',
      },
      {
        id: 'nhl-2', variant: 'matchup',
        status: 'PRE', statusLabel: 'Tomorrow · 7:00p',
        away: { abbr: 'BOS', color: '#FFB81C' },
        home: { abbr: 'FLA', color: '#C8102E' },
        meta: 'Amerant Bank · ECF G4',
      },
      {
        id: 'nhl-3', variant: 'matchup',
        status: 'FINAL', statusLabel: 'Final · OT',
        away: { abbr: 'COL', color: '#6F263D', score: 4 },
        home: { abbr: 'VGK', color: '#B4975A', score: 3 },
        meta: 'T-Mobile Arena',
      },
      {
        id: 'nhl-4', variant: 'matchup',
        status: 'FINAL', statusLabel: 'Final',
        away: { abbr: 'NYR', color: '#0038A8', score: 5 },
        home: { abbr: 'TOR', color: '#00205B', score: 2 },
        meta: 'Scotiabank Arena',
      },
      {
        id: 'nhl-5', variant: 'matchup',
        status: 'PRE', statusLabel: 'Sat · 8:00p',
        away: { abbr: 'CAR', color: '#CC0000' },
        home: { abbr: 'NJD', color: '#CE1126' },
        meta: 'Prudential Center',
      },
      {
        id: 'nhl-6', variant: 'matchup',
        status: 'PRE', statusLabel: 'Sun · 3:00p',
        away: { abbr: 'WPG', color: '#041E42' },
        home: { abbr: 'NSH', color: '#FFB81C' },
        meta: 'Bridgestone Arena',
      },
    ],
  },
  {
    id: 'wnba',
    title: 'WNBA',
    subtitle: "Opening week · let's go",
    iconLabel: '🏀',
    iconColor: '#FF6F3C',
    accent: '#FF6F3C',
    cards: [
      {
        id: 'wnba-1', variant: 'matchup',
        status: 'LIVE', statusLabel: 'LIVE · Q3 4:08',
        away: { abbr: 'IND', color: '#FFCD00', score: 58 },
        home: { abbr: 'NYL', color: '#6ECEB2', score: 64 },
        meta: 'Barclays Center',
      },
      {
        id: 'wnba-2', variant: 'matchup',
        status: 'PRE', statusLabel: 'Tonight · 10:00p',
        away: { abbr: 'LV', color: '#BA0C2F' },
        home: { abbr: 'LA', color: '#702F8A' },
        meta: 'Crypto.com Arena',
      },
      {
        id: 'wnba-3', variant: 'matchup',
        status: 'FINAL', statusLabel: 'Final',
        away: { abbr: 'CHI', color: '#418FDE', score: 79 },
        home: { abbr: 'CON', color: '#0C2340', score: 74 },
        meta: 'Mohegan Sun Arena',
      },
      {
        id: 'wnba-4', variant: 'matchup',
        status: 'PRE', statusLabel: 'Tomorrow · 7:30p',
        away: { abbr: 'PHX', color: '#201747' },
        home: { abbr: 'SEA', color: '#2C5234' },
        meta: 'Climate Pledge Arena',
      },
      {
        id: 'wnba-5', variant: 'matchup',
        status: 'FINAL', statusLabel: 'Final · OT',
        away: { abbr: 'WAS', color: '#E03A3E', score: 88 },
        home: { abbr: 'DAL', color: '#C8102E', score: 91 },
        meta: 'College Park Center',
      },
      {
        id: 'wnba-6', variant: 'matchup',
        status: 'PRE', statusLabel: 'Sat · 4:00p',
        away: { abbr: 'MIN', color: '#0C2340' },
        home: { abbr: 'ATL', color: '#C8102E' },
        meta: 'Gateway Center Arena',
      },
    ],
  },
  {
    id: 'portal',
    title: 'Transfer Portal',
    subtitle: 'Top movers this week',
    iconLabel: '🔄',
    iconColor: '#A855F7',
    accent: '#A855F7',
    cards: [
      {
        id: 'tp-1', variant: 'player',
        topPill: 'QB1 · 5★', topPillTone: 'gold',
        name: 'Marcus Hayes', team: 'Texas → Oregon',
        stat: '3,847 yds · 32 TD',
        initial: 'M', color: '#154733',
      },
      {
        id: 'tp-2', variant: 'player',
        topPill: 'WR · 4★', topPillTone: 'orange',
        name: 'Jaylen Brooks', team: 'Bama → USC',
        stat: '1,103 yds · 11 TD',
        initial: 'J', color: '#990000',
      },
      {
        id: 'tp-3', variant: 'player',
        topPill: 'EDGE · 5★', topPillTone: 'orange',
        name: 'Devon Mills', team: 'Miami → Georgia',
        stat: '14.5 sacks · 22 TFL',
        initial: 'D', color: '#BA0C2F',
      },
      {
        id: 'tp-4', variant: 'player',
        topPill: 'CB · 4★', topPillTone: 'teal',
        name: 'Kameron Reed', team: 'LSU → Penn St',
        stat: '5 INT · 14 PD',
        initial: 'K', color: '#041E42',
      },
      {
        id: 'tp-5', variant: 'player',
        topPill: 'RB · 4★', topPillTone: 'gold',
        name: 'Tre’Sean Owens', team: 'Auburn → Florida',
        stat: '1,288 yds · 15 TD',
        initial: 'T', color: '#0021A5',
      },
      {
        id: 'tp-6', variant: 'player',
        topPill: 'OT · 4★', topPillTone: 'neutral',
        name: 'Anthony Reyes', team: 'Stanford → Notre Dame',
        stat: '11 starts · PFF 86.4',
        initial: 'A', color: '#0C2340',
      },
    ],
  },
];

// ───── Helpers ─────

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function pillTone(card: AnyCard): { bg: string; fg: string } {
  if (card.variant === 'matchup') {
    if (card.status === 'LIVE') return { bg: 'rgba(239,68,68,0.15)', fg: '#FF4444' };
    if (card.status === 'PRE') return { bg: 'rgba(255,255,255,0.08)', fg: 'rgba(255,255,255,0.85)' };
    return { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.55)' };
  }
  if (card.variant === 'player') {
    if (card.topPillTone === 'gold') return { bg: 'rgba(255,214,10,0.18)', fg: '#FFD60A' };
    if (card.topPillTone === 'orange') return { bg: 'rgba(255,111,60,0.18)', fg: '#FF6F3C' };
    if (card.topPillTone === 'teal') return { bg: 'rgba(20,184,166,0.18)', fg: '#14B8A6' };
    return { bg: 'rgba(255,255,255,0.08)', fg: '#FFF' };
  }
  return { bg: 'rgba(20,184,166,0.18)', fg: '#14B8A6' };
}

// ───── Mini card body renderers ─────

function MatchupBody({ card }: { card: MatchupCard }) {
  const awayWin = card.status === 'FINAL' && (card.away.score ?? 0) > (card.home.score ?? 0);
  const homeWin = card.status === 'FINAL' && (card.home.score ?? 0) > (card.away.score ?? 0);
  return (
    <View style={styles.matchupBody}>
      <View style={styles.matchupRow}>
        <View style={[styles.teamLogo, { backgroundColor: card.away.color }]}>
          <Text style={styles.teamLogoText}>{card.away.abbr.charAt(0)}</Text>
        </View>
        <Text style={styles.teamAbbr} numberOfLines={1}>{card.away.abbr}</Text>
        <Text style={[styles.teamScore, !awayWin && card.status === 'FINAL' && styles.teamScoreDim]}>
          {card.away.score ?? '—'}
        </Text>
      </View>
      <View style={styles.matchupRow}>
        <View style={[styles.teamLogo, { backgroundColor: card.home.color }]}>
          <Text style={styles.teamLogoText}>{card.home.abbr.charAt(0)}</Text>
        </View>
        <Text style={styles.teamAbbr} numberOfLines={1}>{card.home.abbr}</Text>
        <Text style={[styles.teamScore, !homeWin && card.status === 'FINAL' && styles.teamScoreDim]}>
          {card.home.score ?? '—'}
        </Text>
      </View>
    </View>
  );
}

function PlayerBody({ card }: { card: PlayerCard }) {
  return (
    <View style={styles.playerBody}>
      {card.usePhoto ? (
        <Image source={require('@/assets/images/kiyan-avatar.png')} style={styles.playerAvatar} />
      ) : (
        <View style={[styles.playerAvatar, { backgroundColor: card.color, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={styles.playerAvatarInitial}>{card.initial}</Text>
        </View>
      )}
      <Text style={styles.playerName} numberOfLines={1}>{card.name}</Text>
      <Text style={styles.playerStat} numberOfLines={1}>{card.stat}</Text>
    </View>
  );
}

function DealBody({ card }: { card: DealCard }) {
  return (
    <View style={styles.dealBody}>
      <View style={styles.dealLogos}>
        <View style={[styles.dealLogoCircle, { backgroundColor: card.athleteColor }]}>
          <Text style={styles.dealLogoText}>{card.athleteInitial}</Text>
        </View>
        <Text style={styles.dealCross}>×</Text>
        <View style={[styles.dealLogoCircle, { backgroundColor: card.brandColor }]}>
          <Text style={styles.dealLogoText}>{card.brand.charAt(0)}</Text>
        </View>
      </View>
      <Text style={styles.dealAthlete} numberOfLines={1}>{card.athlete}</Text>
      <Text style={styles.dealBrand} numberOfLines={1}>× {card.brand}</Text>
    </View>
  );
}

// ───── Mini card ─────

function MiniCard({ card }: { card: AnyCard }) {
  const tone = pillTone(card);
  const topPillText =
    card.variant === 'player' ? card.topPill :
    card.variant === 'deal' ? card.value :
    null;

  const cardInner = (
    <>
      {topPillText !== null && (
        <View style={[styles.topPill, { backgroundColor: tone.bg }]}>
          <Text style={[styles.topPillText, { color: tone.fg }]} numberOfLines={1}>
            {topPillText}
          </Text>
        </View>
      )}

      {card.variant === 'matchup' && <MatchupBody card={card} />}
      {card.variant === 'player' && <PlayerBody card={card} />}
      {card.variant === 'deal' && <DealBody card={card} />}

      <View style={styles.miniFooter}>
        <Text style={styles.miniMeta} numberOfLines={1}>
          {card.variant === 'matchup' ? (card.meta ?? '') :
           card.variant === 'player' ? card.team :
           card.duration}
        </Text>
        {card.variant === 'matchup' && (
          <Text style={styles.miniMetaSub} numberOfLines={1}>
            {card.statusLabel}
          </Text>
        )}
      </View>
    </>
  );

  return (
    <View style={styles.miniCard}>
      {/* Always-rendered base glass — paints from the first frame. */}
      <GlassView
        glassEffectStyle="clear"
        style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
      />
      {/* Apple Liquid Glass overlays the base when supported. */}
      {isLiquidGlassSupported && (
        <LiquidGlassView
          effect="clear"
          tintColor="rgba(255,255,255,0.04)"
          style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
        />
      )}
      {/* Dark wash so content reads cleanly. */}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 14 }]}
        pointerEvents="none"
      />
      {cardInner}
    </View>
  );
}

// ───── Video cover ─────
// Sub-component so the player is only mounted when there's a valid URI.
// Avoids the null→URI transition where the hook keeps a dead player.
export function VideoCover({ uri, style }: { uri: string; style: any }) {
  const player = useVideoPlayer(uri, (p) => {
    if (!p) return;
    p.loop = true;
    p.muted = true;
    p.play();
  });

  React.useEffect(() => {
    if (!player) return;
    try { player.play(); } catch {}
    const playSub = player.addListener('playingChange', (e: any) => {
      if (!e?.isPlaying) {
        try { player.play(); } catch {}
      }
    });
    const statusSub = player.addListener('statusChange', (e: any) => {
      if (e?.status === 'readyToPlay') {
        try { player.play(); } catch {}
      }
    });
    return () => {
      try { playSub.remove(); } catch {}
      try { statusSub.remove(); } catch {}
    };
  }, [player, uri]);

  return (
    <VideoView
      player={player}
      style={style}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

// ───── Section ─────

function SectionCard({
  section,
  index,
  onMenuPress,
  coverMedia,
  customLogo,
}: {
  section: Section;
  index: number;
  onMenuPress: (section: Section) => void;
  coverMedia?: CoverMedia;
  customLogo?: string;
}) {
  const router = useRouter();
  const pages = chunk(section.cards, 2);
  const resolvedCover = useMemo(
    () => resolveSlotMedia(`cover-${section.id}`, coverMedia ?? null),
    [section.id, coverMedia],
  );
  const coverVideoUri =
    resolvedCover.kind !== 'none' && resolvedCover.type === 'video' ? resolvedCover.uri : null;
  const bgSource =
    resolvedCover.kind === 'local' && resolvedCover.type === 'image'
      ? { uri: resolvedCover.uri }
      : resolvedCover.kind === 'curated-image'
        ? resolvedCover.source
        : resolvedCover.kind === 'none'
          ? section.bgImage
          : null;

  const resolvedLogo = useMemo(
    () => resolveSlotMedia(`logo-${section.id}`, customLogo ? { uri: customLogo, type: 'image' } : null),
    [section.id, customLogo],
  );
  const logoSource =
    resolvedLogo.kind === 'local'
      ? { uri: resolvedLogo.uri }
      : resolvedLogo.kind === 'curated-image'
        ? resolvedLogo.source
        : null;

  return (
    <Animated.View
      entering={FadeInDown.delay(60 + index * 50).duration(380)}
      style={styles.section}
    >
      {(bgSource || coverVideoUri) && (
        <>
          {coverVideoUri ? (
            <VideoCover uri={coverVideoUri} style={styles.sectionBgImage} />
          ) : (
            <Image
              source={bgSource!}
              style={styles.sectionBgImage}
              resizeMode="cover"
            />
          )}
          <LinearGradient
            colors={['rgba(14,14,16,0.2)', 'rgba(14,14,16,1)']}
            locations={[0, 1]}
            style={styles.sectionBgOverlay}
            pointerEvents="none"
          />
        </>
      )}
      <View style={styles.sectionContent}>
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionIcon,
            logoSource
              ? { backgroundColor: CANVAS, borderColor: HAIRLINE }
              : { backgroundColor: `${section.iconColor}26`, borderColor: `${section.iconColor}55` },
          ]}
        >
          {logoSource ? (
            <Image source={logoSource} style={styles.sectionIconImage} />
          ) : (
            <Text style={styles.sectionIconText}>{section.iconLabel}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle} numberOfLines={1}>{section.title}</Text>
          <Text style={styles.sectionSubtitle} numberOfLines={1}>{section.subtitle}</Text>
        </View>
        <Pressable hitSlop={8} onPress={() => onMenuPress(section)}>
          <Ionicons name="ellipsis-horizontal" size={20} color={TEXT_SECONDARY} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        style={{ width: INNER_W }}
      >
        {pages.map((page, pi) => (
          <View
            key={pi}
            style={{
              width: INNER_W,
              height: MINI_SLOT_H,
              flexDirection: 'row',
              gap: CARD_GAP,
            }}
          >
            <View style={{ width: MINI_SLOT_W, alignItems: 'center', justifyContent: 'center' }}>
              <MiniCard card={page[0]} />
            </View>
            <View style={{ width: MINI_SLOT_W, alignItems: 'center', justifyContent: 'center' }}>
              {page[1] && <MiniCard card={page[1]} />}
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable
        style={styles.sectionFooter}
        hitSlop={6}
        onPress={() => router.push({ pathname: '/section/[id]', params: { id: section.id } } as any)}
        accessibilityRole="button"
        accessibilityLabel={`View all ${section.title}`}
      >
        <Text style={styles.sectionFooterText}>View all</Text>
        <Ionicons name="chevron-forward" size={20} color="#FFF" />
      </Pressable>
      </View>
    </Animated.View>
  );
}

// ───── Section menu sheet ─────

const SHEET_TRAVEL = 600;

function SectionMenuSheet({
  section,
  visible,
  onClose,
  hasCoverPhoto,
  hasCustomLogo,
  onPickCoverPhoto,
  onRemoveCoverPhoto,
  onPickLogo,
  onRemoveLogo,
}: {
  section: Section | null;
  visible: boolean;
  onClose: () => void;
  hasCoverPhoto: boolean;
  hasCustomLogo: boolean;
  onPickCoverPhoto: () => void;
  onRemoveCoverPhoto: () => void;
  onPickLogo: () => void;
  onRemoveLogo: () => void;
}) {
  const translateY = useSharedValue(SHEET_TRAVEL);
  const backdropOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      backdropOpacity.value = 1;
      translateY.value = withTiming(0, { duration: 320 });
    }
  }, [visible]);

  const dismiss = React.useCallback(() => {
    translateY.value = withTiming(SHEET_TRAVEL, { duration: 220 });
    backdropOpacity.value = withTiming(0, { duration: 220 });
    setTimeout(onClose, 220);
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
        translateY.value = withTiming(SHEET_TRAVEL, { duration: 220 });
        backdropOpacity.value = withTiming(0, { duration: 220 });
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

  if (!section) return null;

  const items: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    sub: string;
    destructive?: boolean;
    onPress?: () => void;
  }[] = [
    {
      icon: 'image-outline',
      label: hasCoverPhoto ? 'Change cover · photo or video' : 'Add cover · photo or video',
      sub: 'Pick a photo or video from your library',
      onPress: onPickCoverPhoto,
    },
    ...(hasCoverPhoto ? [{
      icon: 'trash-outline' as const,
      label: 'Remove cover',
      sub: 'Restore default appearance',
      onPress: onRemoveCoverPhoto,
      destructive: true,
    }] : []),
    {
      icon: 'aperture-outline',
      label: hasCustomLogo ? 'Change logo' : 'Add logo',
      sub: 'Crop to a square 1:1 logo',
      onPress: onPickLogo,
    },
    ...(hasCustomLogo ? [{
      icon: 'trash-outline' as const,
      label: 'Remove logo',
      sub: 'Restore the default emoji icon',
      onPress: onRemoveLogo,
      destructive: true,
    }] : []),
    { icon: 'grid-outline', label: 'View all', sub: `Open full ${section.title.toLowerCase()} list` },
    { icon: 'add-circle-outline', label: 'Follow', sub: 'Get updates in your activity feed' },
    { icon: 'thumbs-down-outline', label: 'Not interested', sub: 'Show fewer cards like these' },
    { icon: 'eye-off-outline', label: 'Hide section', sub: 'Remove this section from home', destructive: true },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <Animated.View style={[menuStyles.backdrop, backdropAnimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[menuStyles.sheet, sheetAnimStyle]}>
            <View style={menuStyles.handle} />

            <View style={menuStyles.header}>
              <View style={[menuStyles.headerIcon, { backgroundColor: `${section.iconColor}26`, borderColor: `${section.iconColor}55` }]}>
                <Text style={menuStyles.headerIconText}>{section.iconLabel}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={menuStyles.headerTitle} numberOfLines={1}>{section.title}</Text>
                <Text style={menuStyles.headerSub} numberOfLines={1}>{section.subtitle}</Text>
              </View>
              <Pressable onPress={dismiss} style={menuStyles.closeBtn} hitSlop={8} accessibilityLabel="Close">
                <Ionicons name="close" size={16} color={TEXT_PRIMARY} />
              </Pressable>
            </View>

            <View style={menuStyles.list}>
              {items.map((item, i) => (
                <React.Fragment key={item.label}>
                  <Pressable
                    style={menuStyles.row}
                    onPress={() => {
                      dismiss();
                      if (item.onPress) setTimeout(item.onPress, 240);
                    }}
                    accessibilityRole="button"
                  >
                    <View style={menuStyles.rowIcon}>
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={item.destructive ? '#FF453A' : TEXT_PRIMARY}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[menuStyles.rowLabel, item.destructive && { color: '#FF453A' }]}>
                        {item.label}
                      </Text>
                      <Text style={menuStyles.rowSub} numberOfLines={1}>{item.sub}</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={TEXT_TERTIARY}
                    />
                  </Pressable>
                  {i < items.length - 1 && <View style={menuStyles.divider} />}
                </React.Fragment>
              ))}
            </View>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </Modal>
  );
}

// ───── Screen ─────

type CoverMedia = LocalMedia;

const STORAGE_KEY_COVERS = 'proslync:home:coverMedia:v2';
const STORAGE_KEY_COVERS_LEGACY = 'proslync:home:coverPhotos:v1';
const STORAGE_KEY_LOGOS = 'proslync:home:customLogos:v1';
const STORAGE_KEY_TILE_MEDIA = TILE_MEDIA_STORAGE_KEY;


async function requestPhotoPermission(): Promise<boolean> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      'Photo access needed',
      'Allow photo library access in Settings to pick an image.',
    );
    return false;
  }
  return true;
}

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [menuSection, setMenuSection] = useState<Section | null>(null);
  const [menuTileId, setMenuTileId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [coverMedia, setCoverMedia] = useState<Record<string, CoverMedia>>({});
  const [customLogos, setCustomLogos] = useState<Record<string, string>>({});
  const [tileMedia, setTileMedia] = useState<Record<string, { uri: string; type: 'image' | 'video' }>>({});
  const [storageHydrated, setStorageHydrated] = useState(false);

  useEffect(() => { trackScreen('feed', 'home-explore'); }, []);

  // Hydrate persisted picks on mount. Handles legacy v1 (image-only) data and
  // prunes entries whose backing file is gone (orphan healing after reinstall).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [coversRaw, legacyRaw, logosRaw, tileMediaRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_COVERS),
          AsyncStorage.getItem(STORAGE_KEY_COVERS_LEGACY),
          AsyncStorage.getItem(STORAGE_KEY_LOGOS),
          AsyncStorage.getItem(STORAGE_KEY_TILE_MEDIA),
        ]);
        if (cancelled) return;
        let covers: Record<string, CoverMedia> = {};
        if (coversRaw) {
          covers = JSON.parse(coversRaw);
        } else if (legacyRaw) {
          // Migrate legacy v1: { [id]: uri } → { [id]: { uri, type: 'image' } }
          const legacy = JSON.parse(legacyRaw) as Record<string, string>;
          Object.entries(legacy).forEach(([id, uri]) => {
            covers[id] = { uri, type: 'image' };
          });
        }
        const prunedCovers: Record<string, CoverMedia> = {};
        await Promise.all(
          Object.entries(covers).map(async ([id, m]) => {
            const healed = await healLocalMediaUri(m.uri);
            if (healed) prunedCovers[id] = healed !== m.uri ? { ...m, uri: healed } : m;
          }),
        );
        const logos = logosRaw ? (JSON.parse(logosRaw) as Record<string, string>) : {};
        const prunedLogos: Record<string, string> = {};
        await Promise.all(
          Object.entries(logos).map(async ([id, uri]) => {
            const healed = await healLocalMediaUri(uri);
            if (healed) prunedLogos[id] = healed;
          }),
        );
        if (cancelled) return;
        if (Object.keys(prunedCovers).length) {
          setCoverMedia(prunedCovers);
        } else if (coversRaw || legacyRaw) {
          // All entries pruned — clear stale storage so next mount skips the stat work.
          AsyncStorage.setItem(STORAGE_KEY_COVERS, JSON.stringify({})).catch(() => {});
        }
        if (Object.keys(prunedLogos).length) {
          setCustomLogos(prunedLogos);
        } else if (logosRaw) {
          AsyncStorage.setItem(STORAGE_KEY_LOGOS, JSON.stringify({})).catch(() => {});
        }
        // Tile media: heal local URIs, prune stale entries.
        const rawTiles = tileMediaRaw
          ? (JSON.parse(tileMediaRaw) as Record<string, { uri: string; type: 'image' | 'video' }>)
          : {};
        const prunedTiles: Record<string, { uri: string; type: 'image' | 'video' }> = {};
        await Promise.all(
          Object.entries(rawTiles).map(async ([id, m]) => {
            const healed = await healLocalMediaUri(m.uri);
            if (healed) prunedTiles[id] = healed !== m.uri ? { ...m, uri: healed } : m;
          }),
        );
        if (Object.keys(prunedTiles).length) {
          setTileMedia(prunedTiles);
        } else if (tileMediaRaw) {
          AsyncStorage.setItem(STORAGE_KEY_TILE_MEDIA, JSON.stringify({})).catch(() => {});
        }
      } catch {
        // ignore corrupt storage
      } finally {
        if (!cancelled) setStorageHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist on change (only after first hydration).
  useEffect(() => {
    if (!storageHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY_COVERS, JSON.stringify(coverMedia)).catch(() => {});
  }, [coverMedia, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY_LOGOS, JSON.stringify(customLogos)).catch(() => {});
  }, [customLogos, storageHydrated]);

  useEffect(() => {
    if (!storageHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY_TILE_MEDIA, JSON.stringify(tileMedia)).catch(() => {});
  }, [tileMedia, storageHydrated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const pickCoverPhoto = useCallback(async (sectionId: string) => {
    if (!(await requestPhotoPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [16, 12],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const type: 'image' | 'video' = asset.type === 'video' ? 'video' : 'image';
      const persistedUri = await persistLocalMedia(asset.uri, `cover-${sectionId}`, type);
      setCoverMedia((p) => ({ ...p, [sectionId]: { uri: persistedUri, type } }));
    }
  }, []);

  const removeCoverPhoto = useCallback((sectionId: string) => {
    setCoverMedia((p) => {
      const next = { ...p };
      delete next[sectionId];
      return next;
    });
  }, []);

  const pickLogo = useCallback(async (sectionId: string) => {
    if (!(await requestPhotoPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const persistedUri = await persistLocalMedia(result.assets[0].uri, `logo-${sectionId}`, 'image');
      setCustomLogos((p) => ({ ...p, [sectionId]: persistedUri }));
    }
  }, []);

  const removeLogo = useCallback((sectionId: string) => {
    setCustomLogos((p) => {
      const next = { ...p };
      delete next[sectionId];
      return next;
    });
  }, []);

  const pickTileMedia = useCallback(async (tileId: string) => {
    if (!(await requestPhotoPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const type: 'image' | 'video' = asset.type === 'video' ? 'video' : 'image';
      const persistedUri = await persistLocalMedia(asset.uri, tileSlot(tileId), type);
      setTileMedia((p) => ({ ...p, [tileId]: { uri: persistedUri, type } }));
    }
  }, []);

  const removeTileMedia = useCallback((tileId: string) => {
    setTileMedia((p) => {
      const next = { ...p };
      delete next[tileId];
      return next;
    });
  }, []);

  // ── Tiles data (one tile per card + one hub tile per section) ──────────────
  const tiles = useMemo(() => {
    const result: Array<{ id: string; caption: string; subtitle: string; sectionId: string }> = [];
    for (const section of SECTIONS) {
      // Hub tile (one per section)
      result.push({ id: `${section.id}:hub`, caption: section.title, subtitle: section.subtitle, sectionId: section.id });
      // Per-card tiles
      section.cards.forEach((card, idx) => {
        let caption = section.title;
        let subtitle = section.subtitle;
        if (card.variant === 'matchup') {
          caption = `${card.away.abbr} @ ${card.home.abbr}`;
          subtitle = `${section.title} · ${card.statusLabel}${card.meta ? ' · ' + card.meta : ''}`;
        } else if (card.variant === 'player') {
          caption = card.name;
          subtitle = card.topPill ? `${section.title} · ${card.topPill} · ${card.team}` : `${section.title} · ${card.team}`;
        } else if (card.variant === 'deal') {
          caption = `${card.athlete} × ${card.brand}`;
          subtitle = `NIL Deal · ${card.value} · ${card.duration}`;
        }
        result.push({ id: `${section.id}:${card.id ?? idx}`, caption, subtitle, sectionId: section.id });
      });
    }
    return result;
  }, []);

  // ── Per-tile resolved media (local pick or curated fallback) ─────────────
  // Builds a Map<tileId, TileMedia | null> once per [tiles, tileMedia] change.
  // CURATED_MEDIA is static so the lookup is cheap.
  const tileMediaMap = useMemo(() => {
    const map = new Map<string, import('@/components/home/masonry-tile').TileMedia | null>();
    for (const t of tiles) {
      const local = tileMedia[t.id] ?? null;
      const resolved = resolveSlotMedia(tileSlot(t.id), local);
      if (resolved.kind === 'local') {
        map.set(t.id, { type: resolved.type, uri: resolved.uri });
      } else if (resolved.kind === 'curated-video') {
        map.set(t.id, { type: 'video', uri: resolved.uri });
      } else if (resolved.kind === 'curated-image') {
        map.set(t.id, { type: 'image', source: resolved.source });
      } else {
        map.set(t.id, null);
      }
    }
    return map;
  }, [tiles, tileMedia]);

  // ── Stable navigation callback ────────────────────────────────────────────
  // Every tile opens its card detail page (media + title + subtitle + sectionId).
  const openCard = useCallback(
    (tileId: string, caption: string, subtitle: string, sectionId: string) => {
      router.push({ pathname: '/card/[id]', params: { id: tileId, caption, subtitle, sectionId } } as any);
    },
    [router],
  );

  // ── Collapsing header ─────────────────────────────────────────────────────
  // Header is absolutely positioned; we track height via onLayout so we know
  // exactly how far to translate it when hiding.
  // Initialise to 49 (header top-offset 3 + control height 46) so the first
  // hide gesture uses a sane distance before onLayout fires.
  const [headerHeight, setHeaderHeight] = React.useState(49);
  const lastScrollY = useRef(0);
  const headerSV = useSharedValue(0); // 0 = visible, 1 = hidden
  // Track the last-dispatched goal so we only write headerSV when it changes,
  // preventing redundant withTiming calls that would restart in-flight animations.
  const headerGoalRef = useRef(0);
  // Pure interpolation — no withTiming inside the worklet.
  const headerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(headerSV.value, [0, 1], [0, -(headerHeight + 24)]) }],
    opacity: interpolate(headerSV.value, [0, 1], [1, 0]),
  }));
  // The black top fade must vanish with the header, otherwise hiding the
  // header just reveals a black strip instead of the content beneath it.
  const topFadeAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(headerSV.value, [0, 1], [1, 0]),
  }));
  // Floating action pill — shrinks on scroll-down, grows on scroll-up
  // (reuses the header's scroll signal; matches the profile/dashboard pill).
  const floatingPillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(headerSV.value, [0, 1], [1, 0.8]) }],
    opacity: interpolate(headerSV.value, [0, 1], [1, 0.85]),
  }));

  const onListScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const prev = lastScrollY.current;
      const delta = y - prev;
      lastScrollY.current = y;
      // Derive goal; null means "no change" (delta below threshold).
      const goal = y <= 0 ? 0 : delta > 8 ? 1 : delta < -8 ? 0 : null;
      if (goal !== null && headerGoalRef.current !== goal) {
        headerGoalRef.current = goal;
        headerSV.value = withTiming(goal, { duration: 220 });
      }
    },
    [headerSV],
  );

  // Header clearance: top-of-screen safe inset + 3 (header top offset) + 46
  // (button height) + 13 (gap to content) ≈ insets.top + 62.
  const HEADER_CLEARANCE = insets.top + 12;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Masonry grid ─────────────────────────────────────────────────── */}
      <FlashList
        data={tiles}
        numColumns={2}
        // @ts-ignore — FlashList's type defs don't yet expose the masonry prop
        masonry
        keyExtractor={(t) => t.id}
        renderItem={({ item: t, index }) => (
          <View style={{ paddingHorizontal: GRID_GUTTER / 2, paddingBottom: GRID_GUTTER }}>
            <MasonryTile
              id={t.id}
              caption={t.caption}
              colWidth={GRID_CARD_WIDTH}
              index={index}
              onPress={() => openCard(t.id, t.caption, t.subtitle, t.sectionId)}
              media={tileMediaMap.get(t.id) ?? null}
              onMenuPress={() => setMenuTileId(t.id)}
            />
          </View>
        )}
        contentContainerStyle={{
          paddingHorizontal: GRID_MARGIN - GRID_GUTTER / 2,
          paddingTop: HEADER_CLEARANCE,
          paddingBottom: 240,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={onListScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#888" />
        }
      />

      <SectionMenuSheet
        section={menuSection}
        visible={!!menuSection}
        onClose={() => setMenuSection(null)}
        hasCoverPhoto={!!menuSection && !!coverMedia[menuSection.id]}
        hasCustomLogo={!!menuSection && !!customLogos[menuSection.id]}
        onPickCoverPhoto={() => menuSection && pickCoverPhoto(menuSection.id)}
        onRemoveCoverPhoto={() => menuSection && removeCoverPhoto(menuSection.id)}
        onPickLogo={() => menuSection && pickLogo(menuSection.id)}
        onRemoveLogo={() => menuSection && removeLogo(menuSection.id)}
      />

      {/* Tile media action sheet */}
      <ActionSheet
        visible={!!menuTileId}
        title={menuTileId ? (tiles.find((t) => t.id === menuTileId)?.caption ?? undefined) : undefined}
        onClose={() => setMenuTileId(null)}
        options={[
          {
            label: 'Upload photo or video',
            icon: 'image-outline',
            onPress: () => { if (menuTileId) pickTileMedia(menuTileId); },
          },
          ...(menuTileId && tileMedia[menuTileId]
            ? [{
                label: 'Remove media',
                icon: 'trash-outline' as const,
                destructive: true,
                onPress: () => { if (menuTileId) removeTileMedia(menuTileId); },
              }]
            : []),
        ]}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      {/* Top fade — covers the area behind the floating header row. Fades
          out together with the header so hidden-state shows content, not black. */}
      <Animated.View
        style={[styles.topFade, { height: HEADER_CLEARANCE }, topFadeAnimStyle]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[CANVAS, CANVAS, 'rgba(14,14,16,0)']}
          locations={[0, 0.8, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Floating action pill — map · notifications · plus.
          Same glass material, size, position and scroll-shrink as the
          profile/dashboard tab pills. */}
      <Animated.View
        style={[styles.floatingPillWrap, { bottom: insets.bottom + 14 }]}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.floatingPill, floatingPillStyle]}>
          <View style={styles.floatingPillGlass} pointerEvents="none">
            <GlassView
              glassEffectStyle="regular"
              style={[StyleSheet.absoluteFill, { borderRadius: 21 }]}
            />
          </View>
          <Pressable
            style={styles.floatingPillBtn}
            onPress={() => router.push('/map' as any)}
            accessibilityLabel="Map"
            accessibilityRole="button"
          >
            <SymbolView name="map" size={20} tintColor="#FFF" />
          </Pressable>
          <Pressable
            style={styles.floatingPillBtn}
            onPress={() => setNotifOpen(true)}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <SymbolView name="bell" size={20} tintColor="#FFF" />
          </Pressable>
          <Pressable
            style={styles.floatingPillBtn}
            onPress={() => setComposerOpen(true)}
            accessibilityLabel="Create post"
            accessibilityRole="button"
          >
            <SymbolView name="plus" size={20} tintColor="#FFF" />
          </Pressable>
          <Pressable
            style={styles.floatingPillBtn}
            onPress={() => setAssistantOpen(true)}
            accessibilityLabel="Ask Proslync"
            accessibilityRole="button"
          >
            <SymbolView name="bubble.left" size={20} tintColor="#FFF" />
          </Pressable>
        </Animated.View>
      </Animated.View>

      <FanPostComposer
        visible={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPosted={() => setComposerOpen(false)}
      />

      {/* Notifications — opened from the action pill's bell icon */}
      <HomeNotificationsSheet visible={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Fan assistant — opened from the action pill's chat icon (FAB hidden) */}
      <FanAssistant open={assistantOpen} onOpenChange={setAssistantOpen} hideFab />
    </View>
  );
}

// ───── Styles ─────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CANVAS },
  // Floating action pill — identical material/size/position to the
  // profile & dashboard tab pills, but with three icon actions.
  floatingPillWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  floatingPill: {
    width: 240,
    height: 42,
    borderRadius: RADIUS_PILL,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  floatingPillGlass: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: RADIUS_PILL,
  },
  floatingPillBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: SECTION_OUTER_PAD, paddingBottom: 240, gap: SECTION_GAP_V },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, zIndex: 10 },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 150 },

  topRow: {
    position: 'absolute',
    left: 14, right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    zIndex: 200,
  },
  iconBare: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMark: {
    width: 34,
    height: 34,
  },
  brandWordmark: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: -0.4,
    marginLeft: -2,
  },

  // Section card
  section: {
    backgroundColor: SURFACE,
    borderRadius: RADIUS_LG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE_SUBTLE,
    overflow: 'hidden',
  },
  sectionContent: {
    padding: SECTION_INNER_PAD,
  },
  sectionBgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionBgOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingBottom: 12, paddingHorizontal: 4,
  },
  sectionIcon: {
    width: 38, height: 38, borderRadius: RADIUS_PILL,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sectionIconText: { fontSize: 18 },
  sectionIconImage: { width: '100%', height: '100%' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: -0.2 },
  sectionSubtitle: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 1 },
  sectionFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, paddingHorizontal: 4,
  },
  sectionFooterText: { fontSize: 17, color: TEXT_PRIMARY, fontWeight: '700' },

  // Mini card
  miniCard: {
    width: MINI_CARD_W,
    height: MINI_CARD_H,
    borderRadius: RADIUS_CARD,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    overflow: 'hidden',
  },
  topPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS_SM,
  },
  topPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FF4444' },
  miniFooter: {
    marginTop: 4,
  },
  miniMeta: {
    fontSize: 10,
    color: TEXT_TERTIARY,
  },
  miniMetaSub: {
    fontSize: 10,
    color: TEXT_SECONDARY,
    fontWeight: '600',
    marginTop: 2,
  },

  // Matchup body
  matchupBody: { flex: 1, justifyContent: 'center', gap: 8 },
  matchupRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamLogo: {
    width: 22, height: 22, borderRadius: RADIUS_PILL,
    alignItems: 'center', justifyContent: 'center',
  },
  teamLogoText: { fontSize: 10, fontWeight: '900', color: TEXT_PRIMARY },
  teamAbbr: { fontSize: 12, color: TEXT_PRIMARY, fontWeight: '700', flex: 1 },
  teamScore: { fontSize: 17, fontWeight: '900', color: TEXT_PRIMARY, fontVariant: ['tabular-nums'] },
  teamScoreDim: { color: TEXT_TERTIARY },

  // Player body
  playerBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  playerAvatar: {
    width: 52, height: 52, borderRadius: RADIUS_PILL,
    overflow: 'hidden',
  },
  playerAvatarInitial: { fontSize: 20, fontWeight: '900', color: TEXT_PRIMARY },
  playerName: { fontSize: 12, color: TEXT_PRIMARY, fontWeight: '700' },
  playerStat: { fontSize: 10, color: TEXT_SECONDARY, textAlign: 'center' },

  // Deal body
  dealBody: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  dealLogos: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dealLogoCircle: {
    width: 28, height: 28, borderRadius: RADIUS_PILL,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: HAIRLINE,
  },
  dealLogoText: { fontSize: 12, fontWeight: '900', color: TEXT_PRIMARY },
  dealCross: { fontSize: 14, color: TEXT_TERTIARY, fontWeight: '700' },
  dealAthlete: { fontSize: 11, color: TEXT_PRIMARY, fontWeight: '700' },
  dealBrand: { fontSize: 10, color: TEXT_SECONDARY, fontWeight: '600' },
});

const menuStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: CANVAS,
    borderTopLeftRadius: RADIUS_LG,
    borderTopRightRadius: RADIUS_LG,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    borderColor: HAIRLINE,
    overflow: 'hidden',
    paddingBottom: 28,
  },
  handle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: SURFACE_RAISED,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS_PILL,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerIconText: { fontSize: 20 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT_PRIMARY },
  headerSub: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS_PILL,
    backgroundColor: SURFACE_RAISED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 15, color: TEXT_PRIMARY, fontWeight: '600' },
  rowSub: { fontSize: 12, color: TEXT_TERTIARY, marginTop: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: HAIRLINE_SUBTLE,
    marginLeft: 56,
  },
});
