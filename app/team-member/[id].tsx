import * as React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';

const TAB_BAR_TOP_FROM_BOTTOM = 90;

// ─── Coach profile data ────────────────────────────────────────────
// Per-coach archetype card data inspired by sports-game scouting screens
// (overall, attribute bars, play tendencies, signature sets, tenure).
type AttrGroup = 'offense' | 'defense' | 'dev' | 'leader';
type Attribute = { label: string; value: number; group: AttrGroup };
type Tendency = { label: string; pct: number };
type RecordTile = { label: string; value: string };
type Achievement = { year: string; title: string };
type SigPlay = { name: string; desc: string };
type TenureEntry = { years: string; team: string; role: string };

type CoachProfile = {
  overall: number;
  archetype: string;
  philosophy: string[];
  bio: string;
  attributes: Attribute[];
  tendencies: Tendency[];
  record: RecordTile[];
  achievements: Achievement[];
  sigPlays: SigPlay[];
  quote: string;
  tenure: TenureEntry[];
};

const COACH_PROFILES: Record<string, CoachProfile> = {
  'c-autry': {
    overall: 87,
    archetype: 'Player-First Builder',
    philosophy: ['Defensive identity', 'Pace + space', 'Versatile lineups', 'Development-first'],
    bio: 'Cuse alum building the program around discipline-first defense and a free-flowing transition attack. Heavy emphasis on player development across both ends of the floor.',
    attributes: [
      { label: 'Offensive Mind', value: 84, group: 'offense' },
      { label: 'Defensive Mind', value: 91, group: 'defense' },
      { label: 'Player Dev', value: 88, group: 'dev' },
      { label: 'Recruiting', value: 90, group: 'leader' },
      { label: 'In-Game Adjust', value: 82, group: 'leader' },
      { label: 'Rotation Mgmt', value: 79, group: 'leader' },
      { label: 'Locker Room', value: 93, group: 'leader' },
      { label: 'Media Savvy', value: 76, group: 'leader' },
    ],
    tendencies: [
      { label: 'Transition', pct: 24 },
      { label: 'Pick & Roll', pct: 31 },
      { label: 'Isolation', pct: 11 },
      { label: 'Post-Up', pct: 14 },
      { label: 'Off-Ball Screen', pct: 12 },
      { label: 'Spot-Up', pct: 8 },
    ],
    record: [
      { label: 'Seasons HC', value: '2' },
      { label: 'Record', value: '34-29' },
      { label: 'Win %', value: '.540' },
      { label: 'NCAA Tourn', value: '0' },
      { label: 'ACC Titles', value: '0' },
      { label: 'Players → NBA', value: '3' },
    ],
    achievements: [
      { year: '2024', title: 'ACC Coach of the Year (Runner-up)' },
      { year: '2023', title: 'Promoted to HC at Syracuse' },
      { year: '2010', title: 'NIT Champion (assistant)' },
    ],
    sigPlays: [
      { name: 'Orange Press', desc: '2-2-1 full-court press triggered off made FT — designed to bait early transition.' },
      { name: 'Twist Hammer', desc: 'Weak-side hammer screen out of a horns set — Starling is the trigger.' },
      { name: 'ATO Wedge', desc: 'After-timeout double-screen elevator for the wing shooter.' },
    ],
    quote: 'Defense travels. Toughness travels. Everything else we coach.',
    tenure: [
      { years: '2023–Now', team: 'Syracuse Orange', role: 'Head Coach' },
      { years: '2011–2023', team: 'Syracuse Orange', role: 'Assistant / Assoc HC' },
      { years: '2007–2011', team: 'Boston University', role: 'Assistant' },
    ],
  },
  'c-gmac': {
    overall: 81,
    archetype: 'PG Whisperer',
    philosophy: ['Pace control', 'Read-and-react', 'Skill dev', 'Toughness'],
    bio: 'Syracuse legend turned premier guard-development assistant. Specializes in pick-and-roll reads, finishing, and decision-making under duress.',
    attributes: [
      { label: 'Offensive Mind', value: 88, group: 'offense' },
      { label: 'Defensive Mind', value: 73, group: 'defense' },
      { label: 'Player Dev', value: 94, group: 'dev' },
      { label: 'Recruiting', value: 85, group: 'leader' },
      { label: 'In-Game Adjust', value: 78, group: 'leader' },
      { label: 'Rotation Mgmt', value: 71, group: 'leader' },
      { label: 'Locker Room', value: 90, group: 'leader' },
      { label: 'Media Savvy', value: 80, group: 'leader' },
    ],
    tendencies: [
      { label: 'PnR Read', pct: 36 },
      { label: 'DHO', pct: 22 },
      { label: 'Drag Screen', pct: 14 },
      { label: 'Iso (PG)', pct: 9 },
      { label: 'Floor Spacing', pct: 13 },
      { label: 'Roll/Pop', pct: 6 },
    ],
    record: [
      { label: 'Cuse Yrs', value: '14' },
      { label: 'Asst Yrs', value: '9' },
      { label: 'PGs → NBA', value: '4' },
      { label: 'NCAA Title', value: "'03" },
      { label: 'Career 3PM', value: '400' },
      { label: 'Asst Coach Yr', value: '2x finalist' },
    ],
    achievements: [
      { year: '2003', title: 'NCAA Champion (player)' },
      { year: '2006', title: 'All-Big East First Team' },
      { year: '2019', title: 'Returned to Syracuse staff' },
    ],
    sigPlays: [
      { name: 'PG Read Set', desc: 'High ball-screen with weak-side spacer — read coverage, force a 4-on-3.' },
      { name: 'Quick Drag', desc: 'Transition drag screen for early offense.' },
    ],
    quote: 'Guards win in this league. We build them here.',
    tenure: [
      { years: '2019–Now', team: 'Syracuse Orange', role: 'Assistant Coach' },
      { years: '2015–2019', team: 'Siena Saints', role: 'Assoc HC' },
      { years: '2010–2014', team: 'Various Pro Stops', role: 'Player' },
    ],
  },
  'c-tony': {
    overall: 78,
    archetype: 'Wing Architect',
    philosophy: ['Wing development', 'Switch defense', '3-and-D'],
    bio: 'Wing specialist focused on closeouts, off-ball cutting, and shot mechanics. Built the program\'s wing-by-committee defensive identity.',
    attributes: [
      { label: 'Offensive Mind', value: 76, group: 'offense' },
      { label: 'Defensive Mind', value: 87, group: 'defense' },
      { label: 'Player Dev', value: 86, group: 'dev' },
      { label: 'Recruiting', value: 79, group: 'leader' },
      { label: 'In-Game Adjust', value: 73, group: 'leader' },
      { label: 'Rotation Mgmt', value: 70, group: 'leader' },
      { label: 'Locker Room', value: 84, group: 'leader' },
      { label: 'Media Savvy', value: 65, group: 'leader' },
    ],
    tendencies: [
      { label: 'Closeout Drills', pct: 28 },
      { label: 'Off-Ball Screen', pct: 22 },
      { label: 'Switch Defense', pct: 25 },
      { label: 'Backdoor Cut', pct: 14 },
      { label: 'Corner 3 Sets', pct: 11 },
    ],
    record: [
      { label: 'Cuse Yrs', value: '4' },
      { label: 'Wings → NBA', value: '2' },
      { label: 'Opp 3P%', value: '32.4' },
      { label: 'Career Yrs', value: '12' },
    ],
    achievements: [
      { year: '2021', title: 'Joined Syracuse staff' },
      { year: '2018', title: 'NABC Assistant of the Year nominee' },
    ],
    sigPlays: [
      { name: 'Wing Hammer', desc: 'Drag wing into weak-side hammer for catch-and-shoot.' },
      { name: 'Switch+', desc: 'Cross-match coverage triggered by ball-screen — wing locks the ball-handler.' },
    ],
    quote: 'Wings decide playoff games. Closeouts decide wings.',
    tenure: [
      { years: '2021–Now', team: 'Syracuse Orange', role: 'Assistant Coach' },
      { years: '2015–2021', team: 'Iona Gaels', role: 'Assoc HC' },
    ],
  },
  'c-allen': {
    overall: 76,
    archetype: 'Post & Rim Coach',
    philosophy: ['Interior toughness', 'Footwork-first', 'Boards', 'Verticality'],
    bio: 'Post-play technician focused on footwork, screen-setting, and rim protection. Built Eddie Lampkin Jr. into an All-ACC interior anchor.',
    attributes: [
      { label: 'Offensive Mind', value: 72, group: 'offense' },
      { label: 'Defensive Mind', value: 88, group: 'defense' },
      { label: 'Player Dev', value: 85, group: 'dev' },
      { label: 'Recruiting', value: 74, group: 'leader' },
      { label: 'In-Game Adjust', value: 70, group: 'leader' },
      { label: 'Rotation Mgmt', value: 68, group: 'leader' },
      { label: 'Locker Room', value: 82, group: 'leader' },
      { label: 'Media Savvy', value: 60, group: 'leader' },
    ],
    tendencies: [
      { label: 'Post Touch', pct: 26 },
      { label: 'Roll Finish', pct: 24 },
      { label: 'O-Reb Crash', pct: 22 },
      { label: 'Drop Coverage', pct: 17 },
      { label: 'Iso Post', pct: 11 },
    ],
    record: [
      { label: 'Cuse Yrs', value: '3' },
      { label: 'Bigs → NBA', value: '1' },
      { label: 'Team RPG', value: '38.4' },
      { label: 'Opp Rim FG%', value: '52.1' },
    ],
    achievements: [
      { year: '2022', title: 'Joined Syracuse staff' },
      { year: '2017', title: 'Mid-Major Assistant of the Year' },
    ],
    sigPlays: [
      { name: 'Pin-Down + Roll', desc: 'Hammer down + immediate roll for bigs to attack the rim.' },
      { name: 'Verticality Reps', desc: 'Daily 30-min reps on no-foul rim protection.' },
    ],
    quote: 'Bigs win games on the second jump.',
    tenure: [
      { years: '2022–Now', team: 'Syracuse Orange', role: 'Assistant Coach' },
      { years: '2016–2022', team: 'Quinnipiac', role: 'Assoc HC' },
    ],
  },
};

// ─── Player profile data ─────────────────────────────────────────
type BadgeTier = 'gold' | 'silver' | 'bronze';
type Badge = { name: string; tier: BadgeTier };
type SeasonAvg = { label: string; value: string };
type HotZone = { zone: string; pct: number };
type CareerHigh = { label: string; value: string };
type RecentGame = { vs: string; line: string; result: string };

type PlayerProfile = {
  overall: number;
  archetype: string;
  attributes: Attribute[];
  badges: Badge[];
  seasonAvg: SeasonAvg[];
  hotZones: HotZone[];
  careerHighs: CareerHigh[];
  strengths: string[];
  weaknesses: string[];
  sigMoves: SigPlay[];
  recentGames: RecentGame[];
};

const PLAYER_PROFILES: Record<string, PlayerProfile> = {
  'r-jj': {
    overall: 84,
    archetype: 'Two-Way Lead Guard',
    attributes: [
      { label: 'Inside Scoring', value: 78, group: 'offense' },
      { label: 'Outside Shot', value: 80, group: 'offense' },
      { label: 'Playmaking', value: 82, group: 'offense' },
      { label: 'Rebounding', value: 65, group: 'dev' },
      { label: 'Perimeter D', value: 81, group: 'defense' },
      { label: 'Interior D', value: 60, group: 'defense' },
      { label: 'Athleticism', value: 86, group: 'dev' },
      { label: 'Basketball IQ', value: 79, group: 'leader' },
    ],
    badges: [
      { name: 'Tight Handles', tier: 'gold' },
      { name: 'Catch & Shoot', tier: 'silver' },
      { name: 'Quick First Step', tier: 'silver' },
      { name: 'On-Ball Pest', tier: 'bronze' },
    ],
    seasonAvg: [
      { label: 'PPG', value: '14.2' }, { label: 'RPG', value: '3.6' }, { label: 'APG', value: '3.1' },
      { label: 'SPG', value: '1.4' }, { label: 'BPG', value: '0.2' }, { label: 'MPG', value: '31.8' },
      { label: 'FG%', value: '45.0' }, { label: '3P%', value: '37.4' }, { label: 'FT%', value: '82.1' },
    ],
    hotZones: [
      { zone: 'Restricted', pct: 64 }, { zone: 'Paint', pct: 48 }, { zone: 'Mid L', pct: 41 },
      { zone: 'Mid C', pct: 39 }, { zone: 'Mid R', pct: 44 }, { zone: '3PT L', pct: 38 },
      { zone: '3PT C', pct: 37 }, { zone: '3PT R', pct: 39 },
    ],
    careerHighs: [
      { label: 'PTS', value: '31' }, { label: 'AST', value: '9' }, { label: 'REB', value: '7' },
      { label: 'STL', value: '5' }, { label: '3PM', value: '7' },
    ],
    strengths: ['Explosive first step', 'Pull-up off PnR', 'Active hands on defense'],
    weaknesses: ['Strength finishing at the rim', 'Off-ball gravity / movement'],
    sigMoves: [
      { name: 'Step-Back 3', desc: 'Snake dribble into a step-back from the right wing — go-to in late-clock situations.' },
      { name: 'Snake PnR', desc: 'Rejects the screen, snakes back middle, kicks weak side for the open 3.' },
    ],
    recentGames: [
      { vs: 'vs Duke', line: '21 PTS · 4 REB · 3 AST', result: 'W 78-71' },
      { vs: '@ Miami', line: '12 PTS · 2 REB', result: 'W 65-58' },
      { vs: '@ UConn', line: '18 PTS · 5 AST', result: 'L 64-72' },
    ],
  },
  'r-donnie': {
    overall: 82,
    archetype: 'Versatile Wing',
    attributes: [
      { label: 'Inside Scoring', value: 76, group: 'offense' },
      { label: 'Outside Shot', value: 72, group: 'offense' },
      { label: 'Playmaking', value: 68, group: 'offense' },
      { label: 'Rebounding', value: 78, group: 'dev' },
      { label: 'Perimeter D', value: 82, group: 'defense' },
      { label: 'Interior D', value: 75, group: 'defense' },
      { label: 'Athleticism', value: 87, group: 'dev' },
      { label: 'Basketball IQ', value: 75, group: 'leader' },
    ],
    badges: [
      { name: 'Putback Boss', tier: 'gold' },
      { name: 'Cutter', tier: 'silver' },
      { name: 'Lockdown', tier: 'silver' },
      { name: 'Transition Finisher', tier: 'bronze' },
    ],
    seasonAvg: [
      { label: 'PPG', value: '13.1' }, { label: 'RPG', value: '6.4' }, { label: 'APG', value: '1.8' },
      { label: 'SPG', value: '0.9' }, { label: 'BPG', value: '0.6' }, { label: 'MPG', value: '30.4' },
      { label: 'FG%', value: '49.2' }, { label: '3P%', value: '34.1' }, { label: 'FT%', value: '74.3' },
    ],
    hotZones: [
      { zone: 'Restricted', pct: 71 }, { zone: 'Paint', pct: 54 }, { zone: 'Mid L', pct: 38 },
      { zone: 'Mid C', pct: 42 }, { zone: 'Mid R', pct: 40 }, { zone: '3PT L', pct: 33 },
      { zone: '3PT C', pct: 35 }, { zone: '3PT R', pct: 36 },
    ],
    careerHighs: [
      { label: 'PTS', value: '26' }, { label: 'REB', value: '14' }, { label: 'AST', value: '4' },
      { label: 'BLK', value: '4' }, { label: '3PM', value: '4' },
    ],
    strengths: ['Above-rim finishing', 'Switch defender 1-4', 'Transition motor'],
    weaknesses: ['Spot-up consistency', 'Free-throw stroke'],
    sigMoves: [
      { name: 'Baseline Slip', desc: 'Slips the baseline screen for a one-foot finish over help.' },
      { name: 'Cross-Screen ISO', desc: 'Settles on the block off a cross-screen — face-up to attack.' },
    ],
    recentGames: [
      { vs: 'vs Duke', line: '14 PTS · 8 REB · 2 BLK', result: 'W 78-71' },
      { vs: '@ Miami', line: '17 PTS · 9 REB', result: 'W 65-58' },
      { vs: '@ UConn', line: '11 PTS · 7 REB · 1 STL', result: 'L 64-72' },
    ],
  },
  'r-naithan': {
    overall: 78,
    archetype: 'Floor General',
    attributes: [
      { label: 'Inside Scoring', value: 70, group: 'offense' },
      { label: 'Outside Shot', value: 75, group: 'offense' },
      { label: 'Playmaking', value: 85, group: 'offense' },
      { label: 'Rebounding', value: 63, group: 'dev' },
      { label: 'Perimeter D', value: 77, group: 'defense' },
      { label: 'Interior D', value: 58, group: 'defense' },
      { label: 'Athleticism', value: 76, group: 'dev' },
      { label: 'Basketball IQ', value: 86, group: 'leader' },
    ],
    badges: [
      { name: 'Floor General', tier: 'silver' },
      { name: 'Quick Decisions', tier: 'silver' },
      { name: 'Catch & Shoot', tier: 'bronze' },
      { name: 'Pocket Passer', tier: 'gold' },
    ],
    seasonAvg: [
      { label: 'PPG', value: '9.8' }, { label: 'RPG', value: '2.8' }, { label: 'APG', value: '5.4' },
      { label: 'SPG', value: '1.1' }, { label: 'BPG', value: '0.1' }, { label: 'MPG', value: '28.6' },
      { label: 'FG%', value: '41.2' }, { label: '3P%', value: '35.7' }, { label: 'FT%', value: '79.4' },
    ],
    hotZones: [
      { zone: 'Restricted', pct: 58 }, { zone: 'Paint', pct: 44 }, { zone: 'Mid L', pct: 37 },
      { zone: 'Mid C', pct: 40 }, { zone: 'Mid R', pct: 39 }, { zone: '3PT L', pct: 34 },
      { zone: '3PT C', pct: 38 }, { zone: '3PT R', pct: 34 },
    ],
    careerHighs: [
      { label: 'PTS', value: '22' }, { label: 'AST', value: '12' }, { label: 'REB', value: '5' },
      { label: 'STL', value: '4' }, { label: '3PM', value: '5' },
    ],
    strengths: ['Pace control', 'Pocket pass on the roll', 'Two-foot stop on drives'],
    weaknesses: ['Pull-up shot creation', 'Switch onto bigs in PnR'],
    sigMoves: [
      { name: 'Wraparound', desc: 'Wraparound bounce pass to the dunker spot out of high PnR.' },
      { name: 'Drag Hesi', desc: 'Hesitation off a drag screen — pull-up or kick to the corner.' },
    ],
    recentGames: [
      { vs: 'vs Duke', line: '8 PTS · 7 AST · 2 STL', result: 'W 78-71' },
      { vs: '@ Miami', line: '11 PTS · 5 AST', result: 'W 65-58' },
      { vs: '@ UConn', line: '6 PTS · 4 AST · 3 TO', result: 'L 64-72' },
    ],
  },
  'r-lucas': {
    overall: 75,
    archetype: 'Movement Shooter',
    attributes: [
      { label: 'Inside Scoring', value: 66, group: 'offense' },
      { label: 'Outside Shot', value: 84, group: 'offense' },
      { label: 'Playmaking', value: 70, group: 'offense' },
      { label: 'Rebounding', value: 62, group: 'dev' },
      { label: 'Perimeter D', value: 73, group: 'defense' },
      { label: 'Interior D', value: 55, group: 'defense' },
      { label: 'Athleticism', value: 72, group: 'dev' },
      { label: 'Basketball IQ', value: 78, group: 'leader' },
    ],
    badges: [
      { name: 'Catch & Shoot', tier: 'gold' },
      { name: 'Off-Screen', tier: 'silver' },
      { name: 'Limitless Range', tier: 'bronze' },
      { name: 'Veteran Composure', tier: 'silver' },
    ],
    seasonAvg: [
      { label: 'PPG', value: '7.5' }, { label: 'RPG', value: '2.4' }, { label: 'APG', value: '1.5' },
      { label: 'SPG', value: '0.6' }, { label: 'BPG', value: '0.1' }, { label: 'MPG', value: '22.1' },
      { label: 'FG%', value: '43.0' }, { label: '3P%', value: '41.2' }, { label: 'FT%', value: '87.0' },
    ],
    hotZones: [
      { zone: 'Restricted', pct: 52 }, { zone: 'Paint', pct: 40 }, { zone: 'Mid L', pct: 44 },
      { zone: 'Mid C', pct: 43 }, { zone: 'Mid R', pct: 46 }, { zone: '3PT L', pct: 41 },
      { zone: '3PT C', pct: 42 }, { zone: '3PT R', pct: 40 },
    ],
    careerHighs: [
      { label: 'PTS', value: '24' }, { label: '3PM', value: '8' }, { label: 'AST', value: '5' },
      { label: 'STL', value: '4' }, { label: 'REB', value: '6' },
    ],
    strengths: ['Off-screen footwork', 'Quick-trigger release', 'Veteran shot selection'],
    weaknesses: ['On-ball shot creation', 'Athletic ceiling vs switches'],
    sigMoves: [
      { name: 'Pin-Down', desc: 'Comes off the pin-down with shoulders squared for the catch & shoot.' },
      { name: 'Flare Relocate', desc: 'Flare screen exit → relocates baseline corner for the kick-out 3.' },
    ],
    recentGames: [
      { vs: 'vs Duke', line: '11 PTS · 3 3PM', result: 'W 78-71' },
      { vs: '@ Miami', line: '6 PTS · 2 AST', result: 'W 65-58' },
      { vs: '@ UConn', line: '9 PTS · 2 3PM · 2 REB', result: 'L 64-72' },
    ],
  },
  'r-eddie': {
    overall: 80,
    archetype: 'Glass Cleaner',
    attributes: [
      { label: 'Inside Scoring', value: 84, group: 'offense' },
      { label: 'Outside Shot', value: 50, group: 'offense' },
      { label: 'Playmaking', value: 60, group: 'offense' },
      { label: 'Rebounding', value: 89, group: 'dev' },
      { label: 'Perimeter D', value: 62, group: 'defense' },
      { label: 'Interior D', value: 84, group: 'defense' },
      { label: 'Athleticism', value: 73, group: 'dev' },
      { label: 'Basketball IQ', value: 74, group: 'leader' },
    ],
    badges: [
      { name: 'Brick Wall', tier: 'gold' },
      { name: 'Rebound Chaser', tier: 'gold' },
      { name: 'Putback Boss', tier: 'silver' },
      { name: 'Anchor', tier: 'bronze' },
    ],
    seasonAvg: [
      { label: 'PPG', value: '8.9' }, { label: 'RPG', value: '9.4' }, { label: 'APG', value: '1.0' },
      { label: 'SPG', value: '0.4' }, { label: 'BPG', value: '1.3' }, { label: 'MPG', value: '26.7' },
      { label: 'FG%', value: '58.3' }, { label: '3P%', value: '—' }, { label: 'FT%', value: '68.0' },
    ],
    hotZones: [
      { zone: 'Restricted', pct: 73 }, { zone: 'Paint', pct: 56 }, { zone: 'Mid L', pct: 35 },
      { zone: 'Mid C', pct: 32 }, { zone: 'Mid R', pct: 36 }, { zone: '3PT L', pct: 0 },
      { zone: '3PT C', pct: 0 }, { zone: '3PT R', pct: 0 },
    ],
    careerHighs: [
      { label: 'PTS', value: '18' }, { label: 'REB', value: '19' }, { label: 'BLK', value: '5' },
      { label: 'AST', value: '5' }, { label: '3PM', value: '0' },
    ],
    strengths: ['Hands at the rim', 'Screen contact + slip', 'Second-jump finish'],
    weaknesses: ['Free-throw line accuracy', 'Perimeter mobility on switches'],
    sigMoves: [
      { name: 'Roll Slip Dunk', desc: 'Slips the ball-screen for a rim run + lob target.' },
      { name: 'Boxout Tap', desc: 'Boxes out + taps the offensive rebound to the perimeter for reset.' },
    ],
    recentGames: [
      { vs: 'vs Duke', line: '12 PTS · 11 REB · 2 BLK', result: 'W 78-71' },
      { vs: '@ Miami', line: '6 PTS · 8 REB', result: 'W 65-58' },
      { vs: '@ UConn', line: '10 PTS · 10 REB · 1 BLK', result: 'L 64-72' },
    ],
  },
};

const BADGE_COLOR: Record<BadgeTier, { fg: string; bg: string; border: string; label: string }> = {
  gold: { fg: '#FFD60A', bg: 'rgba(255,214,10,0.12)', border: 'rgba(255,214,10,0.45)', label: 'GOLD' },
  silver: { fg: '#C7CCD3', bg: 'rgba(199,204,211,0.10)', border: 'rgba(199,204,211,0.40)', label: 'SLV' },
  bronze: { fg: '#C97A4A', bg: 'rgba(201,122,74,0.12)', border: 'rgba(201,122,74,0.40)', label: 'BRZ' },
};

const GROUP_COLOR: Record<AttrGroup, string> = {
  offense: '#FF6F3C',
  defense: '#34C7E0',
  dev: '#34C759',
  leader: '#FFD60A',
};

const GROUP_LABEL: Record<AttrGroup, string> = {
  offense: 'OFF',
  defense: 'DEF',
  dev: 'DEV',
  leader: 'LDR',
};

// Color the OVL number by rating band (gold tier / blue / standard).
function ratingColor(value: number): string {
  if (value >= 90) return '#FFD60A';
  if (value >= 80) return '#34C7E0';
  if (value >= 70) return '#FFFFFF';
  return 'rgba(255,255,255,0.7)';
}

export default function TeamMemberDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    role: string;
    tag?: string;
    color: string;
    initial: string;
    avatar?: string;
    kind: 'staff' | 'roster';
  }>();

  const isRoster = params.kind === 'roster';
  const coach = !isRoster ? COACH_PROFILES[params.id] : undefined;
  const player = isRoster ? PLAYER_PROFILES[params.id] : undefined;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: TAB_BAR_TOP_FROM_BOTTOM + 60,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroBlock}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: params.color || '#F76900' },
            ]}
          >
            {params.avatar ? (
              <Image source={{ uri: params.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{params.initial}</Text>
            )}
          </View>
          <Text style={styles.name}>{params.name}</Text>
          <Text style={styles.role}>{params.role}</Text>
          {params.tag ? (
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{params.tag}</Text>
            </View>
          ) : null}
        </View>

        {isRoster ? (
          player ? <PlayerDetailSections player={player} /> : <StaffFallback />
        ) : coach ? (
          <CoachDetailSections coach={coach} />
        ) : (
          <StaffFallback />
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomRow,
          { bottom: TAB_BAR_TOP_FROM_BOTTOM + 10 },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backCircleWrap}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <GlassView
            style={styles.backCircle}
            glassEffectStyle="regular"
            tintColor="rgba(255,255,255,0.06)"
          >
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </GlassView>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Coach (staff) sections ──────────────────────────────────────
function CoachDetailSections({ coach }: { coach: CoachProfile }) {
  return (
    <View style={{ gap: 18, marginTop: 22 }}>
      {/* OVERALL hero card */}
      <View style={styles.overallCard}>
        <LinearGradient
          colors={['rgba(255,111,60,0.25)', 'rgba(255,111,60,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={styles.overallEyebrow}>OVERALL</Text>
          <Text style={[styles.overallNumber, { color: ratingColor(coach.overall) }]}>
            {coach.overall}
          </Text>
        </View>
        <View style={styles.overallDivider} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.archetypeEyebrow}>ARCHETYPE</Text>
          <Text style={styles.archetype}>{coach.archetype}</Text>
        </View>
      </View>

      {/* Philosophy chips */}
      <Section title="PHILOSOPHY">
        <View style={styles.chipWrap}>
          {coach.philosophy.map((p) => (
            <View key={p} style={styles.chip}>
              <Text style={styles.chipText}>{p}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Bio */}
      <Section title="SCOUTING REPORT">
        <Text style={styles.bodyText}>{coach.bio}</Text>
      </Section>

      {/* Attribute bars */}
      <Section title="ATTRIBUTES">
        <View style={{ padding: 14, gap: 10 }}>
          {coach.attributes.map((a) => (
            <AttrBar key={a.label} attr={a} />
          ))}
        </View>
      </Section>

      {/* Tendencies */}
      <Section title="PLAYBOOK TENDENCIES">
        <View style={{ padding: 14, gap: 10 }}>
          {coach.tendencies.map((t) => (
            <TendencyBar key={t.label} tendency={t} />
          ))}
        </View>
      </Section>

      {/* Career record grid */}
      <Section title="CAREER RECORD">
        <View style={styles.recordGrid}>
          {coach.record.map((r) => (
            <View key={r.label} style={styles.recordTile}>
              <Text style={styles.recordValue}>{r.value}</Text>
              <Text style={styles.recordLabel}>{r.label}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Signature plays */}
      <Section title="SIGNATURE SETS">
        <View style={{ padding: 12, gap: 10 }}>
          {coach.sigPlays.map((p) => (
            <View key={p.name} style={styles.sigPlay}>
              <View style={styles.sigPlayHeader}>
                <View style={styles.sigPlayBadge}>
                  <Ionicons name="basketball" size={11} color="#FF6F3C" />
                </View>
                <Text style={styles.sigPlayName}>{p.name}</Text>
              </View>
              <Text style={styles.sigPlayDesc}>{p.desc}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Achievements timeline */}
      <Section title="NOTABLE ACHIEVEMENTS">
        {coach.achievements.map((a, i, arr) => (
          <View
            key={a.year + a.title}
            style={[styles.timelineRow, i !== arr.length - 1 && styles.rowDivider]}
          >
            <View style={styles.timelineYear}>
              <Text style={styles.timelineYearText}>{a.year}</Text>
            </View>
            <Text style={styles.timelineTitle}>{a.title}</Text>
          </View>
        ))}
      </Section>

      {/* Tenure */}
      <Section title="TENURE">
        {coach.tenure.map((t, i, arr) => (
          <View
            key={t.years + t.team}
            style={[styles.tenureRow, i !== arr.length - 1 && styles.rowDivider]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.tenureTeam}>{t.team}</Text>
              <Text style={styles.tenureRole}>{t.role}</Text>
            </View>
            <Text style={styles.tenureYears}>{t.years}</Text>
          </View>
        ))}
      </Section>

      {/* Pull quote */}
      <View style={styles.quoteCard}>
        <Text style={styles.quoteMark}>“</Text>
        <Text style={styles.quoteText}>{coach.quote}</Text>
      </View>
    </View>
  );
}

function AttrBar({ attr }: { attr: Attribute }) {
  const color = GROUP_COLOR[attr.group];
  const pct = Math.min(100, Math.max(0, attr.value));
  return (
    <View style={styles.attrRow}>
      <View style={[styles.attrGroupChip, { borderColor: `${color}55`, backgroundColor: `${color}1A` }]}>
        <Text style={[styles.attrGroupText, { color }]}>{GROUP_LABEL[attr.group]}</Text>
      </View>
      <Text style={styles.attrLabel} numberOfLines={1}>
        {attr.label}
      </Text>
      <View style={styles.attrTrack}>
        <View style={[styles.attrFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.attrValue, { color: ratingColor(attr.value) }]}>{attr.value}</Text>
    </View>
  );
}

function TendencyBar({ tendency }: { tendency: Tendency }) {
  const pct = Math.min(100, Math.max(0, tendency.pct));
  return (
    <View>
      <View style={styles.tendencyHeader}>
        <Text style={styles.tendencyLabel}>{tendency.label}</Text>
        <Text style={styles.tendencyPct}>{tendency.pct}%</Text>
      </View>
      <View style={styles.tendencyTrack}>
        <LinearGradient
          colors={['#FF6F3C', '#FFD60A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.tendencyFill, { width: `${pct * 3}%` }]}
        />
      </View>
    </View>
  );
}

function StaffFallback() {
  return (
    <View style={{ marginTop: 24 }}>
      <Section title="DETAILS COMING SOON">
        <Text style={styles.bodyText}>
          We&apos;re still building out this coach&apos;s scouting report.
        </Text>
      </Section>
    </View>
  );
}

// ─── Player (roster) sections ────────────────────────────────────
function PlayerDetailSections({ player }: { player: PlayerProfile }) {
  return (
    <View style={{ gap: 18, marginTop: 22 }}>
      {/* OVERALL hero card */}
      <View style={styles.overallCard}>
        <LinearGradient
          colors={['rgba(52,199,224,0.22)', 'rgba(52,199,224,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={styles.overallEyebrow}>OVERALL</Text>
          <Text style={[styles.overallNumber, { color: ratingColor(player.overall) }]}>
            {player.overall}
          </Text>
        </View>
        <View style={styles.overallDivider} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.archetypeEyebrow}>ARCHETYPE</Text>
          <Text style={styles.archetype}>{player.archetype}</Text>
        </View>
      </View>

      {/* Season averages grid */}
      <Section title="SEASON AVERAGES">
        <View style={styles.recordGrid}>
          {player.seasonAvg.map((s) => (
            <View key={s.label} style={styles.recordTile}>
              <Text style={styles.recordValue}>{s.value}</Text>
              <Text style={styles.recordLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Attribute bars */}
      <Section title="ATTRIBUTES">
        <View style={{ padding: 14, gap: 10 }}>
          {player.attributes.map((a) => (
            <AttrBar key={a.label} attr={a} />
          ))}
        </View>
      </Section>

      {/* Badges */}
      <Section title="BADGES">
        <View style={styles.badgeWrap}>
          {player.badges.map((b) => {
            const c = BADGE_COLOR[b.tier];
            return (
              <View
                key={b.name}
                style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}
              >
                <View style={[styles.badgeTier, { backgroundColor: c.fg }]}>
                  <Text style={styles.badgeTierText}>{c.label}</Text>
                </View>
                <Text style={[styles.badgeName, { color: c.fg }]}>{b.name}</Text>
              </View>
            );
          })}
        </View>
      </Section>

      {/* Hot zones */}
      <Section title="HOT ZONES">
        <View style={{ padding: 14, gap: 8 }}>
          {player.hotZones.map((z) => (
            <HotZoneBar key={z.zone} zone={z} />
          ))}
        </View>
      </Section>

      {/* Career highs */}
      <Section title="CAREER HIGHS">
        <View style={styles.recordGrid}>
          {player.careerHighs.map((c) => (
            <View key={c.label} style={styles.recordTile}>
              <Text style={styles.recordValue}>{c.value}</Text>
              <Text style={styles.recordLabel}>{c.label}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Strengths / Weaknesses */}
      <Section title="STRENGTHS">
        <View style={{ padding: 12, gap: 6 }}>
          {player.strengths.map((s) => (
            <View key={s} style={styles.tagRow}>
              <Ionicons name="checkmark-circle" size={14} color="#34C759" />
              <Text style={styles.tagRowText}>{s}</Text>
            </View>
          ))}
        </View>
      </Section>
      <Section title="WEAKNESSES">
        <View style={{ padding: 12, gap: 6 }}>
          {player.weaknesses.map((w) => (
            <View key={w} style={styles.tagRow}>
              <Ionicons name="remove-circle" size={14} color="#FF4444" />
              <Text style={styles.tagRowText}>{w}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Signature moves */}
      <Section title="SIGNATURE MOVES">
        <View style={{ padding: 12, gap: 10 }}>
          {player.sigMoves.map((m) => (
            <View key={m.name} style={styles.sigPlay}>
              <View style={styles.sigPlayHeader}>
                <View style={styles.sigPlayBadge}>
                  <Ionicons name="flash" size={11} color="#FF6F3C" />
                </View>
                <Text style={styles.sigPlayName}>{m.name}</Text>
              </View>
              <Text style={styles.sigPlayDesc}>{m.desc}</Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Recent games */}
      <Section title="RECENT GAMES">
        {player.recentGames.map((g, i, a) => (
          <View
            key={g.vs}
            style={[styles.row, i !== a.length - 1 && styles.rowDivider]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{g.vs}</Text>
              <Text style={styles.rowSub}>{g.line}</Text>
            </View>
            <Text
              style={[
                styles.result,
                { color: g.result.startsWith('W') ? '#34C759' : '#FF4444' },
              ]}
            >
              {g.result}
            </Text>
          </View>
        ))}
      </Section>
    </View>
  );
}

function HotZoneBar({ zone }: { zone: HotZone }) {
  // Color the zone by efficiency band.
  const color =
    zone.pct >= 50 ? '#FF6F3C' : zone.pct >= 40 ? '#FFD60A' : zone.pct >= 30 ? '#C7CCD3' : zone.pct === 0 ? 'rgba(255,255,255,0.3)' : '#34C7E0';
  const pct = Math.min(100, Math.max(0, zone.pct));
  return (
    <View>
      <View style={styles.tendencyHeader}>
        <Text style={styles.tendencyLabel}>{zone.zone}</Text>
        <Text style={[styles.tendencyPct, { color }]}>
          {zone.pct === 0 ? '—' : `${zone.pct}%`}
        </Text>
      </View>
      <View style={styles.tendencyTrack}>
        <View style={[styles.tendencyFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  heroBlock: { alignItems: 'center', gap: 10 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarText: { color: '#FFF', fontSize: 40, fontWeight: '700' },
  name: { color: '#FFF', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  role: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,111,60,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.3)',
    marginTop: 4,
  },
  tagText: { color: '#FF6F3C', fontSize: 12, fontWeight: '600' },
  sectionHeader: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowTitle: { color: '#FFF', fontSize: 15, fontWeight: '500' },
  rowSub: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 2 },
  result: { fontSize: 13, fontWeight: '700' },
  bodyText: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 20, padding: 14 },
  statRow: { flexDirection: 'row', padding: 14, gap: 8 },
  statCol: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 0.6 },
  bottomRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  backCircleWrap: { width: 46, height: 46 },
  backCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  // OVERALL hero
  overallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  overallEyebrow: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  overallNumber: { fontSize: 56, fontWeight: '900', lineHeight: 58, fontVariant: ['tabular-nums'] },
  overallDivider: { width: 1, height: 56, backgroundColor: 'rgba(255,255,255,0.12)' },
  archetypeEyebrow: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  archetype: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },

  // Philosophy chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.3)',
  },
  chipText: { color: '#FFB593', fontSize: 12, fontWeight: '600' },

  // Attribute bars
  attrRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attrGroupChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 32,
    alignItems: 'center',
  },
  attrGroupText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  attrLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', width: 110 },
  attrTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  attrFill: { height: '100%', borderRadius: 4 },
  attrValue: {
    fontSize: 13,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    minWidth: 28,
    textAlign: 'right',
  },

  // Tendencies
  tendencyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  tendencyLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '600' },
  tendencyPct: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  tendencyTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  tendencyFill: { height: '100%', borderRadius: 3 },

  // Record grid (3 col)
  recordGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  recordTile: {
    width: '33.333%',
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  recordValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
  },
  recordLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Signature plays
  sigPlay: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.18)',
    gap: 4,
  },
  sigPlayHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sigPlayBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,111,60,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sigPlayName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sigPlayDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 17 },

  // Timeline (achievements)
  timelineRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  timelineYear: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255,111,60,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,111,60,0.35)',
  },
  timelineYearText: { color: '#FF8855', fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  timelineTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, flex: 1 },

  // Tenure
  tenureRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  tenureTeam: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  tenureRole: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  tenureYears: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // Badges
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeTier: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTierText: { color: '#000', fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  badgeName: { fontSize: 12, fontWeight: '700', letterSpacing: -0.1 },

  // Strengths / Weaknesses
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagRowText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, flex: 1 },

  // Quote
  quoteCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,111,60,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.2)',
    gap: 6,
  },
  quoteMark: {
    color: 'rgba(255,111,60,0.6)',
    fontSize: 42,
    lineHeight: 36,
    fontWeight: '900',
  },
  quoteText: {
    color: '#FFF',
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
