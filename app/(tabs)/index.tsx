import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
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
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { trackScreen } from '@/lib/analytics';

// ───── Layout constants ─────

const SCREEN_W = Dimensions.get('window').width;
const SECTION_OUTER_PAD = 14;
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
const SECTION_SNAP = SECTION_TOTAL_H + SECTION_GAP_V;

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
        name: 'Kiyan Anthony', team: 'Syracuse',
        stat: '21.0 PPG · 5.9 APG',
        initial: 'K', color: '#F76900', usePhoto: true,
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
        name: 'Eddie Lampkin', team: 'Syracuse',
        stat: '4.1 BPG · 11.8 RPG',
        initial: 'E', color: '#F76900',
      },
      {
        id: 'aw-6', variant: 'player',
        topPill: '6th Man · #1', topPillTone: 'neutral',
        name: 'Donnie Freeman', team: 'Syracuse',
        stat: '14 PPG · off bench',
        initial: 'D', color: '#F76900',
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
        value: '$2.4M', athlete: 'Kiyan Anthony', athleteInitial: 'K', athleteColor: '#F76900',
        brand: 'NIKE', brandColor: '#000', duration: '2yr · multi',
      },
      {
        id: 'nil-2', variant: 'deal',
        value: '$1.8M', athlete: 'Cooper Flagg', athleteInitial: 'C', athleteColor: '#001A57',
        brand: 'GATORADE', brandColor: '#FF6900', duration: '1yr · renew',
      },
      {
        id: 'nil-3', variant: 'deal',
        value: '$950K', athlete: 'AJ Dybantsa', athleteInitial: 'A', athleteColor: '#002E5D',
        brand: 'PUMA', brandColor: '#000', duration: '3yr · excl',
      },
      {
        id: 'nil-4', variant: 'deal',
        value: '$680K', athlete: 'RJ Davis', athleteInitial: 'R', athleteColor: '#7BAFD4',
        brand: "BOJANGLES'", brandColor: '#E03A3E', duration: '1yr · regional',
      },
      {
        id: 'nil-5', variant: 'deal',
        value: '$1.2M', athlete: 'Donnie Freeman', athleteInitial: 'D', athleteColor: '#F76900',
        brand: 'SPOTIFY', brandColor: '#1DB954', duration: '2yr · creator',
      },
      {
        id: 'nil-6', variant: 'deal',
        value: '$540K', athlete: 'Eddie Lampkin', athleteInitial: 'E', athleteColor: '#F76900',
        brand: 'BWW', brandColor: '#FFCA02', duration: '1yr',
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
  const isVideoCover = coverMedia?.type === 'video';
  const bgSource = coverMedia
    ? (coverMedia.type === 'image' ? { uri: coverMedia.uri } : null)
    : section.bgImage;

  return (
    <Animated.View
      entering={FadeInDown.delay(60 + index * 50).duration(380)}
      style={styles.section}
    >
      {(bgSource || isVideoCover) && (
        <>
          {isVideoCover ? (
            <VideoCover uri={coverMedia!.uri} style={styles.sectionBgImage} />
          ) : (
            <Image
              source={bgSource!}
              style={styles.sectionBgImage}
              resizeMode="cover"
            />
          )}
          <LinearGradient
            colors={['rgba(28,28,30,0.2)', 'rgba(28,28,30,1)']}
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
            customLogo
              ? { backgroundColor: '#000', borderColor: 'rgba(255,255,255,0.18)' }
              : { backgroundColor: `${section.iconColor}26`, borderColor: `${section.iconColor}55` },
          ]}
        >
          {customLogo ? (
            <Image source={{ uri: customLogo }} style={styles.sectionIconImage} />
          ) : (
            <Text style={styles.sectionIconText}>{section.iconLabel}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle} numberOfLines={1}>{section.title}</Text>
          <Text style={styles.sectionSubtitle} numberOfLines={1}>{section.subtitle}</Text>
        </View>
        <Pressable hitSlop={8} onPress={() => onMenuPress(section)}>
          <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.5)" />
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
                <Ionicons name="close" size={16} color="rgba(255,255,255,0.85)" />
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
                        color={item.destructive ? '#FF453A' : 'rgba(255,255,255,0.85)'}
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
                      color="rgba(255,255,255,0.35)"
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

type CoverMedia = { uri: string; type: 'image' | 'video' };

const STORAGE_KEY_COVERS = 'proslync:home:coverMedia:v2';
const STORAGE_KEY_COVERS_LEGACY = 'proslync:home:coverPhotos:v1';
const STORAGE_KEY_LOGOS = 'proslync:home:customLogos:v1';

// Copies a picked asset (image/video) into the app's persistent documentDirectory
// so the URI survives across app restarts and TestFlight reinstalls. The picker's
// returned URI typically points to a temp/cache file that gets purged.
async function persistAsset(uri: string, sub: string, kind: 'image' | 'video'): Promise<string> {
  try {
    const dir = `${FileSystem.documentDirectory}proslync-media/${sub}/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const fallbackExt = kind === 'video' ? 'mp4' : 'jpg';
    const ext = (uri.split('?')[0].split('.').pop() || fallbackExt).toLowerCase();
    const safeExt = /^[a-z0-9]{2,4}$/.test(ext) ? ext : fallbackExt;
    const dest = `${dir}${Date.now()}.${safeExt}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    // If copy fails, fall back to the original URI — better than nothing.
    return uri;
  }
}

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
  const [coverMedia, setCoverMedia] = useState<Record<string, CoverMedia>>({});
  const [customLogos, setCustomLogos] = useState<Record<string, string>>({});
  const [storageHydrated, setStorageHydrated] = useState(false);

  useEffect(() => { trackScreen('feed', 'home-explore'); }, []);

  // Hydrate persisted picks on mount. Handles legacy v1 (image-only) data.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [coversRaw, legacyRaw, logosRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_COVERS),
          AsyncStorage.getItem(STORAGE_KEY_COVERS_LEGACY),
          AsyncStorage.getItem(STORAGE_KEY_LOGOS),
        ]);
        if (cancelled) return;
        if (coversRaw) {
          setCoverMedia(JSON.parse(coversRaw));
        } else if (legacyRaw) {
          // Migrate legacy v1: { [id]: uri } → { [id]: { uri, type: 'image' } }
          const legacy = JSON.parse(legacyRaw) as Record<string, string>;
          const migrated: Record<string, CoverMedia> = {};
          Object.entries(legacy).forEach(([id, uri]) => {
            migrated[id] = { uri, type: 'image' };
          });
          setCoverMedia(migrated);
        }
        if (logosRaw) setCustomLogos(JSON.parse(logosRaw));
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
      const persistedUri = await persistAsset(asset.uri, `cover-${sectionId}`, type);
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
      const persistedUri = await persistAsset(result.assets[0].uri, `logo-${sectionId}`, 'image');
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

  const snapOffsets = React.useMemo(() => {
    const out = [0];
    for (let i = 2; i < SECTIONS.length; i += 2) {
      out.push(i * SECTION_SNAP);
    }
    return out;
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 62 }]}
        showsVerticalScrollIndicator={false}
        snapToOffsets={snapOffsets}
        decelerationRate="fast"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#888" />
        }
      >
        {SECTIONS.map((s, i) => (
          <SectionCard
            key={s.id}
            section={s}
            index={i}
            onMenuPress={setMenuSection}
            coverMedia={coverMedia[s.id]}
            customLogo={customLogos[s.id]}
          />
        ))}
      </ScrollView>

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

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <View style={[styles.topRow, { top: insets.top + 3 }]}>
        <Pressable
          style={styles.searchBar}
          onPress={() => router.push('/search-screen' as any)}
          accessibilityLabel="Search"
          accessibilityRole="search"
        >
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          </View>
          <Ionicons name="search" size={17} color="rgba(255,255,255,0.65)" />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Search players, teams, deals
          </Text>
        </Pressable>

        <View style={styles.iconPill}>
          <View style={styles.glassLayer} pointerEvents="none">
            <GlassView glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: 23 }]} />
          </View>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/map' as any)}
            accessibilityLabel="Open map"
            accessibilityRole="button"
          >
            <Ionicons name="map-outline" size={19} color="#FFF" />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/notifications' as any)}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={19} color="#FFF" />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/messages' as any)}
            accessibilityLabel="Messages"
            accessibilityRole="button"
          >
            <Ionicons name="paper-plane-outline" size={19} color="#FFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ───── Styles ─────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { paddingHorizontal: SECTION_OUTER_PAD, paddingBottom: 200, gap: 14 },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, zIndex: 10 },

  topRow: {
    position: 'absolute',
    left: 14, right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 200,
  },
  searchBar: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  searchPlaceholder: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    flex: 1,
  },
  iconPill: {
    height: 46,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassLayer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 23,
    overflow: 'hidden',
  },

  // Section card
  section: {
    backgroundColor: '#1C1C1E',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
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
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sectionIconText: { fontSize: 18 },
  sectionIconImage: { width: '100%', height: '100%' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: -0.2 },
  sectionSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  sectionFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, paddingHorizontal: 4,
  },
  sectionFooterText: { fontSize: 16, color: '#FFF', fontWeight: '700' },

  // Mini card
  miniCard: {
    width: MINI_CARD_W,
    height: MINI_CARD_H,
    borderRadius: 14,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  topPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 7,
  },
  topPillText: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.2 },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FF4444' },
  miniFooter: {
    marginTop: 4,
  },
  miniMeta: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  miniMetaSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    marginTop: 2,
  },

  // Matchup body
  matchupBody: { flex: 1, justifyContent: 'center', gap: 8 },
  matchupRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamLogo: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  teamLogoText: { fontSize: 10, fontWeight: '900', color: '#FFF' },
  teamAbbr: { fontSize: 12, color: '#FFF', fontWeight: '700', flex: 1 },
  teamScore: { fontSize: 17, fontWeight: '900', color: '#FFF', fontVariant: ['tabular-nums'] },
  teamScoreDim: { color: 'rgba(255,255,255,0.45)' },

  // Player body
  playerBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  playerAvatar: {
    width: 52, height: 52, borderRadius: 26,
    overflow: 'hidden',
  },
  playerAvatarInitial: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  playerName: { fontSize: 12, color: '#FFF', fontWeight: '700' },
  playerStat: { fontSize: 9.5, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },

  // Deal body
  dealBody: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  dealLogos: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dealLogoCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)',
  },
  dealLogoText: { fontSize: 12, fontWeight: '900', color: '#FFF' },
  dealCross: { fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
  dealAthlete: { fontSize: 11, color: '#FFF', fontWeight: '700' },
  dealBrand: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
});

const menuStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F1012',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    paddingBottom: 28,
  },
  handle: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerIconText: { fontSize: 20 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontSize: 15, color: '#FFF', fontWeight: '600' },
  rowSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 56,
  },
});
