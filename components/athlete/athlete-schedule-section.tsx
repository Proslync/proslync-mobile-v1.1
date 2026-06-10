// Athlete Schedule section — extracted from athlete-view.tsx for the R5 remix.
// Renders the season hero card plus upcoming + recent game rows.
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const STATS_CARD_BG = '#1C1C1E';
const ACCENT = '#EB621A';

type ScheduleGame = {
  id: string;
  date: string;
  opponent: string;
  home: boolean;
  venue: string;
  status: 'upcoming' | 'live' | 'final';
  result?: string;
};

const SCHEDULE: ScheduleGame[] = [
  { id: 's-1', date: 'Tue · Apr 22', opponent: 'Duke', home: true, venue: 'JMA Wireless Dome', status: 'upcoming' },
  { id: 's-2', date: 'Sat · Apr 26', opponent: 'Miami', home: false, venue: 'Watsco Center', status: 'upcoming' },
  { id: 's-3', date: 'Tue · Apr 29', opponent: 'UConn', home: false, venue: 'Madison Square Garden', status: 'upcoming' },
  { id: 's-4', date: 'Sat · May 3', opponent: 'Virginia', home: true, venue: 'JMA Wireless Dome', status: 'upcoming' },
  { id: 's-5', date: 'Wed · May 7', opponent: 'Louisville', home: false, venue: 'KFC Yum! Center', status: 'upcoming' },
  { id: 's-6', date: 'Sat · Apr 19', opponent: 'Georgia Tech', home: true, venue: 'JMA Wireless Dome', status: 'final', result: 'L 65-70' },
  { id: 's-7', date: 'Tue · Apr 15', opponent: 'Virginia Tech', home: true, venue: 'JMA Wireless Dome', status: 'final', result: 'W 78-71' },
];

// Per-school visual identity — color + short monogram. Used to render a
// stylized circular "team logo" tile in each schedule row. (Original UI
// monograms; no real logo artwork.)
const TEAM_VISUALS: Record<string, { color: string; mono: string; ring?: string }> = {
  'Duke':           { color: '#003087', mono: 'D',   ring: '#FFFFFF' },
  'Miami':          { color: '#F47321', mono: 'M',   ring: '#005030' },
  'UConn':          { color: '#0E1A38', mono: 'UC',  ring: '#FFFFFF' },
  'Virginia':       { color: '#232D4B', mono: 'UVA', ring: '#E57200' },
  'Louisville':     { color: '#AD0000', mono: 'L',   ring: '#FFFFFF' },
  'Georgia Tech':   { color: '#B3A369', mono: 'GT',  ring: '#003057' },
  'Virginia Tech':  { color: '#630031', mono: 'VT',  ring: '#CF4420' },
};

function visualFor(school: string) {
  return TEAM_VISUALS[school] ?? { color: '#3A3A3C', mono: school.slice(0, 2).toUpperCase(), ring: '#FFFFFF' };
}

export function AthleteScheduleSection() {
  const upcoming = SCHEDULE.filter((g) => g.status === 'upcoming');
  const past = SCHEDULE.filter((g) => g.status === 'final');

  return (
    <View style={{ gap: 12 }}>
      {/* Hero — slim record header */}
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="calendar-month" size={18} color={ACCENT} />
        </View>
        <View style={styles.heroRecordCol}>
          <Text style={styles.heroRecord}>18–8</Text>
          <Text style={styles.heroEyebrow}>OVERALL</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroSubCol}>
          <Text style={styles.heroSubValue}>10–4</Text>
          <Text style={styles.heroEyebrow}>ACC</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroSubCol}>
          <Text style={styles.heroSubValue}>T-4</Text>
          <Text style={styles.heroEyebrow}>STANDING</Text>
        </View>
      </View>

      {/* UPCOMING section */}
      {upcoming.length > 0 && (
        <>
          <View style={[styles.groupDivider, { marginTop: 0 }]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>UPCOMING</Text>
            <View style={styles.dividerLine} />
          </View>
          <View style={{ gap: 8 }}>
            {upcoming.map((g) => (
              <UpcomingRow key={g.id} game={g} />
            ))}
          </View>
        </>
      )}

      {/* RECENT section */}
      {past.length > 0 && (
        <>
          <View style={styles.groupDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>RECENT</Text>
            <View style={styles.dividerLine} />
          </View>
          <View style={{ gap: 8 }}>
            {past.map((g) => (
              <RecentRow key={g.id} game={g} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function TeamLogo({ school }: { school: string }) {
  const v = visualFor(school);
  return (
    <View style={[styles.logoOuter, { borderColor: v.ring ?? 'rgba(255,255,255,0.18)' }]}>
      <View style={[styles.logoInner, { backgroundColor: v.color }]}>
        <Text style={styles.logoMono} numberOfLines={1}>
          {v.mono}
        </Text>
      </View>
    </View>
  );
}

function UpcomingRow({ game: g }: { game: ScheduleGame }) {
  const [day, num] = g.date.split(' · ');
  return (
    <View style={styles.gameCard}>
      <TeamLogo school={g.opponent} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.opponent}>
          {g.home ? 'vs' : '@'} {g.opponent}
        </Text>
        <Text style={styles.venue} numberOfLines={1}>{g.venue}</Text>
      </View>
      <View style={styles.dateCol}>
        <Text style={styles.dateDay}>{day}</Text>
        <Text style={styles.dateNum}>{num}</Text>
      </View>
      <View
        style={[
          styles.locPill,
          g.home ? styles.locPillHome : styles.locPillAway,
        ]}
      >
        <Text
          style={[
            styles.locPillText,
            { color: g.home ? ACCENT : 'rgba(255,255,255,0.85)' },
          ]}
        >
          {g.home ? 'HOME' : 'AWAY'}
        </Text>
      </View>
    </View>
  );
}

function RecentRow({ game: g }: { game: ScheduleGame }) {
  const win = g.result?.startsWith('W');
  const [day, num] = g.date.split(' · ');
  return (
    <View style={styles.gameCard}>
      <TeamLogo school={g.opponent} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.opponent}>
          {g.home ? 'vs' : '@'} {g.opponent}
        </Text>
        <Text style={styles.venue} numberOfLines={1}>{g.venue}</Text>
      </View>
      <View style={styles.dateCol}>
        <Text style={styles.dateDay}>{day}</Text>
        <Text style={styles.dateNum}>{num}</Text>
      </View>
      <View
        style={[
          styles.resultPill,
          {
            backgroundColor: win
              ? 'rgba(52,199,89,0.16)'
              : 'rgba(255,68,68,0.16)',
          },
        ]}
      >
        <Text
          style={[
            styles.resultPillText,
            { color: win ? '#34C759' : '#FF4444' },
          ]}
        >
          {g.result}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Slim record header
  heroCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  heroIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(235,98,26,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRecordCol: { alignItems: 'flex-start', gap: 1 },
  heroRecord: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  heroSubCol: { flex: 1, alignItems: 'center', gap: 1 },
  heroSubValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginHorizontal: 2,
  },

  // Section divider matching team page style
  groupDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  dividerLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
  },

  // Game card
  gameCard: {
    backgroundColor: STATS_CARD_BG,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  // Team logo (color disk + monogram + outer ring)
  logoOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    flex: 1,
    width: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMono: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  opponent: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  venue: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },

  dateCol: {
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 56,
  },
  dateDay: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  dateNum: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
    marginTop: 1,
  },

  locPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
  locPillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  resultPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resultPillText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
});
