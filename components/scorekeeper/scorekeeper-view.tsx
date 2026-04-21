import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  SK_ASSIGNMENTS,
  SK_LIVE_GAME,
  SK_PLAY_LOG,
  SK_ROSTER_AWAY,
  SK_ROSTER_HOME,
  SK_STATS,
  type PlayLog,
} from '@/lib/data/mock-scorekeeper-data';

const ACCENT = '#FF6F3C';
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(255,255,255,0.09)';

type TabKey = 'scoreboard' | 'games' | 'roster' | 'log';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'scoreboard', label: 'Scoreboard' },
  { key: 'games', label: 'My Games' },
  { key: 'roster', label: 'Roster & Fouls' },
  { key: 'log', label: 'Play Log' },
];

function formatClock(total: number) {
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (total < 60) return `${total}.${Math.floor((Date.now() % 1000) / 100)}`; // rough tenth
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function ScorekeeperView() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<TabKey>('scoreboard');

  return (
    <View style={[styles.container, { paddingTop: insets.top + 4 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Scorekeeper</Text>
          <Text style={styles.headerSubtitle}>
            {SK_STATS.gamesThisSeason} games this season · {SK_STATS.accuracy}% accuracy
          </Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText}>ON THE BOOK</Text>
        </View>
      </View>

      {/* Tab row */}
      <View style={styles.tabRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.7}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabPill, active && styles.tabPillActive]}
              >
                <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {activeTab === 'scoreboard' && <ScoreboardTab insets={insets.bottom} />}
      {activeTab === 'games' && <GamesTab insets={insets.bottom} />}
      {activeTab === 'roster' && <RosterTab insets={insets.bottom} />}
      {activeTab === 'log' && <LogTab insets={insets.bottom} />}
    </View>
  );
}

// ============================================================
// Scoreboard tab — live data entry
// ============================================================

function ScoreboardTab({ insets }: { insets: number }) {
  const [homeScore, setHomeScore] = React.useState(SK_LIVE_GAME.homeScore);
  const [awayScore, setAwayScore] = React.useState(SK_LIVE_GAME.awayScore);
  const [homeFouls, setHomeFouls] = React.useState(SK_LIVE_GAME.homeFouls);
  const [awayFouls, setAwayFouls] = React.useState(SK_LIVE_GAME.awayFouls);
  const [homeTOs, setHomeTOs] = React.useState(SK_LIVE_GAME.timeoutsHome);
  const [awayTOs, setAwayTOs] = React.useState(SK_LIVE_GAME.timeoutsAway);
  const [quarter, setQuarter] = React.useState(SK_LIVE_GAME.quarter);
  const [running, setRunning] = React.useState(false);
  const [clock, setClock] = React.useState(SK_LIVE_GAME.clockSeconds);
  const [shotClock, setShotClock] = React.useState(SK_LIVE_GAME.shotClock);
  const [possession, setPossession] = React.useState<'home' | 'away'>(
    SK_LIVE_GAME.possession,
  );

  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setClock((c) => (c > 0 ? c - 1 : 0));
      setShotClock((s) => (s > 0 ? s - 1 : 24));
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const addHome = (n: number) => setHomeScore((s) => Math.max(0, s + n));
  const addAway = (n: number) => setAwayScore((s) => Math.max(0, s + n));

  const mm = Math.floor(clock / 60);
  const ss = clock % 60;

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Big scoreboard */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.scoreboardCard}>
        <LinearGradient
          colors={['rgba(255,111,60,0.18)', 'rgba(255,111,60,0.02)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.clockRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRunning((r) => !r)}
            style={[styles.runBtn, running && styles.runBtnActive]}
          >
            <Ionicons
              name={running ? 'pause' : 'play'}
              size={16}
              color={running ? '#FF4444' : '#34C759'}
            />
            <Text
              style={[
                styles.runBtnText,
                { color: running ? '#FF4444' : '#34C759' },
              ]}
            >
              {running ? 'RUNNING' : 'PAUSED'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.quarterText}>Q{quarter}</Text>
          <View style={styles.shotClockPill}>
            <Text style={styles.shotClockLabel}>SHOT</Text>
            <Text style={styles.shotClockValue}>{shotClock}</Text>
          </View>
        </View>

        <Text style={styles.gameClock}>
          {mm}:{String(ss).padStart(2, '0')}
        </Text>

        <View style={styles.clockButtonsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setClock((c) => Math.max(0, c - 60))}
            style={styles.clockBtn}
          >
            <Text style={styles.clockBtnText}>-1:00</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setClock((c) => Math.max(0, c - 1))}
            style={styles.clockBtn}
          >
            <Text style={styles.clockBtnText}>-1s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setClock((c) => c + 1)}
            style={styles.clockBtn}
          >
            <Text style={styles.clockBtnText}>+1s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShotClock(24)}
            style={[styles.clockBtn, { backgroundColor: 'rgba(255,111,60,0.15)', borderColor: 'rgba(255,111,60,0.35)' }]}
          >
            <Text style={[styles.clockBtnText, { color: ACCENT }]}>RESET 24</Text>
          </TouchableOpacity>
        </View>

        {/* Big score */}
        <View style={styles.scoreRow}>
          <TeamScoreBlock
            name={SK_LIVE_GAME.homeTeam}
            score={homeScore}
            meta={`${homeTOs} TO · ${homeFouls} fouls`}
            active={possession === 'home'}
            onPlus3={() => addHome(3)}
            onPlus2={() => addHome(2)}
            onPlus1={() => addHome(1)}
            onMinus={() => addHome(-1)}
          />
          <Text style={styles.scoreDash}>—</Text>
          <TeamScoreBlock
            name={SK_LIVE_GAME.awayTeam}
            score={awayScore}
            meta={`${awayTOs} TO · ${awayFouls} fouls`}
            active={possession === 'away'}
            onPlus3={() => addAway(3)}
            onPlus2={() => addAway(2)}
            onPlus1={() => addAway(1)}
            onMinus={() => addAway(-1)}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPossession((p) => (p === 'home' ? 'away' : 'home'))}
          style={styles.possessionBtn}
        >
          <Ionicons name="swap-horizontal" size={15} color={ACCENT} />
          <Text style={styles.possessionBtnText}>
            Possession · {possession === 'home' ? SK_LIVE_GAME.homeTeam : SK_LIVE_GAME.awayTeam}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Fouls + TOs controls */}
      <Text style={styles.kicker}>FOULS & TIMEOUTS</Text>
      <View style={styles.twoCol}>
        <StepperCard
          label={SK_LIVE_GAME.homeTeam}
          rows={[
            { label: 'Team fouls', value: homeFouls, set: setHomeFouls, max: 99 },
            { label: 'Timeouts', value: homeTOs, set: setHomeTOs, max: 7 },
          ]}
          bonus={homeFouls >= 7}
        />
        <StepperCard
          label={SK_LIVE_GAME.awayTeam}
          rows={[
            { label: 'Team fouls', value: awayFouls, set: setAwayFouls, max: 99 },
            { label: 'Timeouts', value: awayTOs, set: setAwayTOs, max: 7 },
          ]}
          bonus={awayFouls >= 7}
        />
      </View>

      {/* Quarter selector */}
      <Text style={styles.kicker}>QUARTER</Text>
      <View style={styles.quartersRow}>
        {[1, 2, 3, 4, 5, 6].map((q) => {
          const active = quarter === q;
          const isOT = q > 4;
          return (
            <TouchableOpacity
              key={q}
              activeOpacity={0.7}
              onPress={() => setQuarter(q)}
              style={[
                styles.quarterPill,
                active && styles.quarterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.quarterPillText,
                  active && styles.quarterPillTextActive,
                ]}
              >
                {isOT ? `OT${q - 4}` : `Q${q}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity activeOpacity={0.85} style={styles.primaryWideBtn}>
        <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />
        <Text style={styles.primaryWideBtnText}>Push to Official Book</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function TeamScoreBlock({
  name,
  score,
  meta,
  active,
  onPlus3,
  onPlus2,
  onPlus1,
  onMinus,
}: {
  name: string;
  score: number;
  meta: string;
  active: boolean;
  onPlus3: () => void;
  onPlus2: () => void;
  onPlus1: () => void;
  onMinus: () => void;
}) {
  return (
    <View style={styles.teamBlock}>
      <View style={styles.teamHeader}>
        {active && <View style={styles.possessionDot} />}
        <Text style={styles.teamName}>{name.toUpperCase()}</Text>
      </View>
      <Text style={[styles.teamScore, !active && { color: 'rgba(255,255,255,0.7)' }]}>
        {score}
      </Text>
      <Text style={styles.teamMeta}>{meta}</Text>
      <View style={styles.scoreBtnRow}>
        <TouchableOpacity activeOpacity={0.7} onPress={onPlus1} style={styles.scoreBtn}>
          <Text style={styles.scoreBtnText}>+1</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={onPlus2} style={styles.scoreBtn}>
          <Text style={styles.scoreBtnText}>+2</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPlus3}
          style={[styles.scoreBtn, styles.scoreBtnAccent]}
        >
          <Text style={[styles.scoreBtnText, { color: ACCENT }]}>+3</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity activeOpacity={0.6} onPress={onMinus} style={styles.undoBtn}>
        <Ionicons name="arrow-undo" size={11} color="rgba(255,255,255,0.6)" />
        <Text style={styles.undoBtnText}>Undo</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepperCard({
  label,
  rows,
  bonus,
}: {
  label: string;
  rows: { label: string; value: number; set: (v: number) => void; max: number }[];
  bonus: boolean;
}) {
  return (
    <View style={styles.stepperCard}>
      <View style={styles.stepperHeader}>
        <Text style={styles.stepperTeam}>{label}</Text>
        {bonus && (
          <View style={styles.bonusPill}>
            <Text style={styles.bonusPillText}>BONUS</Text>
          </View>
        )}
      </View>
      {rows.map((r) => (
        <View key={r.label} style={styles.stepperRow}>
          <Text style={styles.stepperLabel}>{r.label}</Text>
          <View style={styles.stepperCtrls}>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => r.set(Math.max(0, r.value - 1))}
              style={styles.stepperBtn}
            >
              <Ionicons name="remove" size={14} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{r.value}</Text>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => r.set(Math.min(r.max, r.value + 1))}
              style={styles.stepperBtn}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

// ============================================================
// Games tab — assignments
// ============================================================

function GamesTab({ insets }: { insets: number }) {
  const live = SK_ASSIGNMENTS.filter((g) => g.status === 'live');
  const upcoming = SK_ASSIGNMENTS.filter((g) => g.status === 'upcoming');
  const completed = SK_ASSIGNMENTS.filter((g) => g.status === 'completed');

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {live.length > 0 && (
        <>
          <Text style={styles.kicker}>ON THE BOOK · LIVE</Text>
          {live.map((g, i) => (
            <GameRow key={g.id} game={g} delay={i * 60} />
          ))}
        </>
      )}

      <Text style={styles.kicker}>UPCOMING · {upcoming.length}</Text>
      {upcoming.map((g, i) => (
        <GameRow key={g.id} game={g} delay={i * 60} />
      ))}

      <Text style={styles.kicker}>COMPLETED · LAST 7 DAYS</Text>
      {completed.map((g, i) => (
        <GameRow key={g.id} game={g} delay={i * 60} />
      ))}
    </ScrollView>
  );
}

function GameRow({
  game,
  delay,
}: {
  game: typeof SK_ASSIGNMENTS[number];
  delay: number;
}) {
  const borderColor =
    game.status === 'live'
      ? 'rgba(255,68,68,0.35)'
      : game.status === 'completed'
        ? 'rgba(255,255,255,0.05)'
        : CARD_BORDER;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(380)}
      style={[styles.gameCard, { borderColor }]}
    >
      <View style={styles.gameDateCol}>
        <Text style={styles.gameDate}>{game.date}</Text>
        <Text
          style={[
            styles.gameTime,
            game.status === 'live' && { color: '#FF4444' },
            game.status === 'completed' && { color: 'rgba(255,255,255,0.45)' },
          ]}
        >
          {game.status === 'live' ? 'LIVE NOW' : game.tipoff}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.gameMatchup}>{game.matchup}</Text>
        <Text style={styles.gameVenue}>{game.venue} · {game.role}</Text>
      </View>
      <Ionicons
        name={game.status === 'completed' ? 'checkmark-circle' : 'chevron-forward'}
        size={18}
        color={game.status === 'completed' ? '#34C759' : 'rgba(255,255,255,0.35)'}
      />
    </Animated.View>
  );
}

// ============================================================
// Roster tab — per-player tracking
// ============================================================

function RosterTab({ insets }: { insets: number }) {
  const [side, setSide] = React.useState<'home' | 'away'>('home');
  const roster = side === 'home' ? SK_ROSTER_HOME : SK_ROSTER_AWAY;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.sideToggleRow}>
        {(['home', 'away'] as const).map((s) => {
          const active = side === s;
          return (
            <TouchableOpacity
              key={s}
              activeOpacity={0.7}
              onPress={() => setSide(s)}
              style={[styles.sideBtn, active && styles.sideBtnActive]}
            >
              <Text
                style={[
                  styles.sideBtnText,
                  active && styles.sideBtnTextActive,
                ]}
              >
                {s === 'home' ? SK_LIVE_GAME.homeTeam : SK_LIVE_GAME.awayTeam}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statHeaderRow}>
          <Text style={[styles.statHeader, { flex: 1 }]}>PLAYER</Text>
          <Text style={styles.statHeaderCol}>PTS</Text>
          <Text style={styles.statHeaderCol}>REB</Text>
          <Text style={styles.statHeaderCol}>AST</Text>
          <Text style={styles.statHeaderCol}>FLS</Text>
        </View>
        <View style={styles.rosterCard}>
          {roster.map((p, i) => {
            const foulWarn = p.fouls >= 4;
            return (
              <Animated.View
                key={p.num}
                entering={FadeInDown.delay(i * 50).duration(380)}
                style={[styles.rosterRow, i !== roster.length - 1 && styles.rosterDivider]}
              >
                <View style={styles.rosterPlayerCol}>
                  <View
                    style={[
                      styles.rosterNumber,
                      p.onCourt && styles.rosterNumberOn,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rosterNumberText,
                        p.onCourt && { color: ACCENT },
                      ]}
                    >
                      {p.num}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rosterName}>{p.name}</Text>
                    <Text style={styles.rosterPos}>
                      {p.pos} · {p.onCourt ? 'On court' : 'Bench'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.rosterStat}>{p.pts}</Text>
                <Text style={styles.rosterStat}>{p.reb}</Text>
                <Text style={styles.rosterStat}>{p.ast}</Text>
                <Text
                  style={[
                    styles.rosterStat,
                    foulWarn && { color: '#FF4444', fontWeight: '800' },
                  ]}
                >
                  {p.fouls}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================
// Log tab — play-by-play history
// ============================================================

function LogTab({ insets }: { insets: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(300)} style={styles.kickerRow}>
        <Text style={styles.kickerTitle}>{SK_PLAY_LOG.length} plays logged · Q3</Text>
        <Text style={styles.kickerSub}>
          Auto-saved every 2s · {SK_STATS.avgLogEntriesPerGame} avg entries / game
        </Text>
      </Animated.View>

      {SK_PLAY_LOG.map((p, i) => (
        <LogRow key={p.id} p={p} delay={i * 50} />
      ))}

      <View style={styles.logFooter}>
        <Ionicons name="shield-checkmark" size={14} color="#34C759" />
        <Text style={styles.logFooterText}>Book synced to WCAC official · 3s ago</Text>
      </View>
    </ScrollView>
  );
}

function LogRow({ p, delay }: { p: PlayLog; delay: number }) {
  const teamColor =
    p.team === 'home' ? ACCENT : p.team === 'away' ? '#3B82F6' : 'rgba(255,255,255,0.6)';
  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(360)}
      layout={LinearTransition.duration(250)}
      style={styles.logRow}
    >
      <View style={[styles.logDot, { backgroundColor: teamColor }]} />
      <View style={{ width: 64 }}>
        <Text style={styles.logTime}>{p.time}</Text>
      </View>
      <Text style={styles.logIcon}>{p.icon}</Text>
      <Text style={styles.logText}>{p.text}</Text>
    </Animated.View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.35)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF4444' },
  livePillText: {
    fontSize: 10,
    color: '#FF4444',
    letterSpacing: 0.8,
    fontWeight: '700',
  },

  tabRowWrap: { flexGrow: 0, flexShrink: 0 },
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
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderColor: 'rgba(255,111,60,0.4)',
  },
  tabPillText: {
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  tabPillTextActive: { color: '#FFFFFF', fontWeight: '700' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },

  kicker: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 14,
  },

  // Scoreboard card
  scoreboardCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.25)',
    padding: 16,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.35)',
  },
  runBtnActive: {
    backgroundColor: 'rgba(255,68,68,0.12)',
    borderColor: 'rgba(255,68,68,0.35)',
  },
  runBtnText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5 },
  quarterText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
  shotClockPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.35)',
    alignItems: 'center',
  },
  shotClockLabel: { fontSize: 8, color: ACCENT, letterSpacing: 0.8, fontWeight: '800' },
  shotClockValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '800', lineHeight: 16 },

  gameClock: {
    fontSize: 64,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -2,
    textAlign: 'center',
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
  },

  clockButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 14,
  },
  clockBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  clockBtnText: { fontSize: 11.5, color: '#FFFFFF', fontWeight: '700' },

  scoreRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  teamBlock: { flex: 1, alignItems: 'center', gap: 6 },
  teamHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  possessionDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT },
  teamName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  teamScore: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: '800',
    lineHeight: 54,
    fontVariant: ['tabular-nums'],
  },
  teamMeta: { fontSize: 10.5, color: 'rgba(255,255,255,0.4)' },
  scoreBtnRow: { flexDirection: 'row', gap: 5, marginTop: 6 },
  scoreBtn: {
    width: 38,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBtnAccent: {
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderColor: 'rgba(255,111,60,0.35)',
  },
  scoreBtnText: { fontSize: 13, color: '#FFFFFF', fontWeight: '800' },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  undoBtnText: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  scoreDash: { fontSize: 24, color: 'rgba(255,255,255,0.3)', marginTop: 32 },

  possessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.25)',
  },
  possessionBtnText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },

  // Steppers
  twoCol: { flexDirection: 'row', gap: 10 },
  stepperCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 12,
    gap: 10,
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperTeam: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
  bonusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.35)',
  },
  bonusPillText: { color: '#FF4444', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: { fontSize: 11.5, color: 'rgba(255,255,255,0.6)' },
  stepperCtrls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  stepperValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    minWidth: 18,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },

  quartersRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  quarterPill: {
    flex: 1,
    minWidth: 50,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  quarterPillActive: {
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderColor: 'rgba(255,111,60,0.4)',
  },
  quarterPillText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  quarterPillTextActive: { color: '#FFFFFF' },

  primaryWideBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 22,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.4)',
  },
  primaryWideBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Games
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: CARD_BG,
    marginBottom: 8,
  },
  gameDateCol: { alignItems: 'center', minWidth: 66 },
  gameDate: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '700' },
  gameTime: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  gameMatchup: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
  gameVenue: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 },

  // Roster
  sideToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  sideBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  sideBtnActive: {
    backgroundColor: 'rgba(255,111,60,0.14)',
    borderColor: 'rgba(255,111,60,0.4)',
  },
  sideBtnText: { fontSize: 12.5, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  sideBtnTextActive: { color: '#FFFFFF', fontWeight: '800' },

  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  statHeader: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  statHeaderCol: {
    width: 34,
    textAlign: 'center',
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.6,
    fontWeight: '700',
  },

  rosterCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rosterDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rosterPlayerCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rosterNumber: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rosterNumberOn: {
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderColor: 'rgba(255,111,60,0.35)',
  },
  rosterNumberText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  rosterName: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '600' },
  rosterPos: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },
  rosterStat: {
    width: 34,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // Log
  kickerRow: { marginBottom: 12 },
  kickerTitle: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
  kickerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 3 },

  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    marginBottom: 6,
  },
  logDot: { width: 6, height: 6, borderRadius: 3 },
  logTime: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  logIcon: { fontSize: 14 },
  logText: { flex: 1, fontSize: 12.5, color: '#FFFFFF', lineHeight: 17 },

  logFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(52,199,89,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.25)',
  },
  logFooterText: { fontSize: 11.5, color: '#34C759', fontWeight: '700' },
});
