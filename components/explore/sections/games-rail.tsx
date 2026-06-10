// Games rail — LIVE / UPCOMING / FINAL TODAY game cards.
// Powered by mock FAN_GAMES; backend wiring (/api/explore/games) is a
// follow-up. Universal. Extracted from components/fan/fan-view.tsx during
// fan-content-to-triad-2026-05-12.

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { FAN_GAMES, type LiveGame } from '@/lib/data/mock-fan-data';
import {
  FAN_ACCENT,
  FAN_ACCENT_BORDER,
  FAN_ACCENT_SOFT,
} from '@/constants/brand';
import { getSchoolLogo } from '@/lib/data/school-logos';

const ACCENT = '#EB621A';
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(255,255,255,0.09)';

interface GamesRailProps {
  bottomInset?: number;
  /** Top inset (safe-area) so the scroll content clears the status bar / notch. */
  topInset?: number;
}

export function GamesRail({ bottomInset = 0, topInset = 0 }: GamesRailProps) {
  const live = FAN_GAMES.filter((g) => g.status === 'live');
  const upcoming = FAN_GAMES.filter((g) => g.status === 'upcoming');
  const finals = FAN_GAMES.filter((g) => g.status === 'final');

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: bottomInset + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {live.length > 0 && (
        <>
          <Text style={styles.kicker}>LIVE · {live.length}</Text>
          {live.map((g, i) => (
            <GameCard key={g.id} g={g} delay={i * 60} />
          ))}
        </>
      )}

      <Text style={styles.kicker}>UPCOMING</Text>
      {upcoming.map((g, i) => (
        <GameCard key={g.id} g={g} delay={i * 60} />
      ))}

      <Text style={styles.kicker}>FINAL · TODAY</Text>
      {finals.map((g, i) => (
        <GameCard key={g.id} g={g} delay={i * 60} />
      ))}
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
            <Ionicons name="star" size={9} color={FAN_ACCENT} />
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
        <TeamColumn
          name={g.away}
          score={g.awayScore}
          leading={isLive && (g.awayScore ?? 0) > (g.homeScore ?? 0)}
        />
        <Text style={styles.gameAt}>@</Text>
        <TeamColumn
          name={g.home}
          score={g.homeScore}
          leading={isLive && (g.homeScore ?? 0) > (g.awayScore ?? 0)}
        />
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

function TeamColumn({
  name,
  score,
  leading,
}: {
  name: string;
  score: number | undefined;
  leading: boolean;
}) {
  const logo = getSchoolLogo(name);
  return (
    <View style={styles.gameTeamBlock}>
      <View style={styles.teamHead}>
        {logo ? (
          <Image
            source={logo}
            style={styles.teamLogo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={styles.teamLogoFallback}>
            <Text style={styles.teamLogoInitial}>
              {(name?.[0] ?? '?').toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.gameTeam} numberOfLines={1}>
          {name}
        </Text>
      </View>
      {score !== undefined && (
        <Text style={[styles.gameScore, leading && styles.gameScoreLeading]}>
          {score}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
  kicker: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 14,
  },
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
  livePillText: {
    color: '#FF4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  gameStatusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  followedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: FAN_ACCENT_SOFT,
    borderWidth: 1,
    borderColor: FAN_ACCENT_BORDER,
  },
  followedChipText: {
    color: FAN_ACCENT,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
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
  gameTeamBlock: { flex: 1, alignItems: 'center', gap: 4 },
  teamHead: { alignItems: 'center', gap: 4 },
  teamLogo: {
    width: 36,
    height: 36,
    marginBottom: 2,
  },
  teamLogoFallback: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  teamLogoInitial: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontWeight: '800',
  },
  gameTeam: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: 0.3,
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
});
