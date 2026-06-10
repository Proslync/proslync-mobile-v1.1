// Athlete — Training Log. Week timeline + one-tap convert to Feed/Team/Deal.
// File 01.1 spec: athlete-only surface for sessions, recovery, coach signoff.

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DarkGradientBg } from '@/components/shared/dark-gradient-bg';
import { GlassButton } from '@/components/glass/glass-button';

const TEAL = '#14B8A6';
const ACCENT = '#EB621A';
const YELLOW = '#FFD60A';

type SessionType = 'lift' | 'court' | 'run' | 'film' | 'recovery';

type LogEntry = {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  isToday?: boolean;
  type: SessionType;
  title: string;
  duration: string;
  intensity: number; // 0-100
  attachedDeal?: { brand: string; counter: string };
  posted?: boolean;
};

const ENTRIES: LogEntry[] = [
  { id: 'l-1', day: 'Mon', type: 'lift', title: 'Lower-body strength', duration: '1h 12m', intensity: 78, posted: true },
  { id: 'l-2', day: 'Tue', type: 'court', title: 'Shootaround + 3-spot drill', duration: '1h 30m', intensity: 62 },
  { id: 'l-3', day: 'Wed', type: 'film', title: 'Film — UNC defense', duration: '38m', intensity: 22 },
  { id: 'l-4', day: 'Thu', type: 'lift', title: 'Push day · brand-tagged', duration: '58m', intensity: 84, attachedDeal: { brand: 'Gatorade', counter: '1 of 2 done' }, posted: true },
  { id: 'l-5', day: 'Fri', isToday: true, type: 'court', title: 'Live scrimmage', duration: '1h 45m', intensity: 91 },
  { id: 'l-6', day: 'Sat', type: 'recovery', title: 'Mobility + ice bath', duration: '42m', intensity: 18 },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const ICON_FOR: Record<SessionType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  lift: 'dumbbell',
  court: 'basketball',
  run: 'run-fast',
  film: 'video-outline',
  recovery: 'snowflake',
};

export default function TrainingLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const totalSessions = ENTRIES.length;
  const todayEntry = ENTRIES.find((e) => e.isToday);

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Training Log</Text>
          <Text style={styles.headerSub}>Week of May 5</Text>
        </View>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="add" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak hero */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <View style={styles.streakRow}>
              <Text style={styles.streakNumber}>14</Text>
              <Ionicons name="flame" size={28} color={ACCENT} style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.streakLabel}>day streak</Text>
            <Text style={styles.streakSub}>5 sessions logged this week · keep it alive</Text>
          </View>
          <View style={styles.miniRingRow}>
            <MiniRing label="Sleep" pct={82} />
            <MiniRing label="HRV" pct={68} />
            <MiniRing label="Load" pct={91} />
          </View>
        </Animated.View>

        {/* Day chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChipsRow}>
          {DAYS.map((d) => {
            const isToday = ENTRIES.find((e) => e.day === d)?.isToday;
            const has = ENTRIES.some((e) => e.day === d);
            return (
              <View
                key={d}
                style={[
                  styles.dayChip,
                  isToday && styles.dayChipActive,
                  !has && styles.dayChipEmpty,
                ]}
              >
                <Text style={[styles.dayChipText, isToday && styles.dayChipTextActive]}>{d}</Text>
                {has && <View style={[styles.dayChipDot, isToday && { backgroundColor: '#FFF' }]} />}
              </View>
            );
          })}
        </ScrollView>

        {/* Week timeline */}
        <Text style={styles.sectionLabel}>SESSIONS · {totalSessions}</Text>
        <View style={styles.cardGroup}>
          {ENTRIES.map((e, i) => (
            <Animated.View
              key={e.id}
              entering={FadeInDown.delay(i * 60).duration(380)}
              style={[styles.entryRow, i < ENTRIES.length - 1 && styles.entryBorder]}
            >
              <View style={[styles.entryIconWrap, e.isToday && { borderColor: '#FFF' }]}>
                <MaterialCommunityIcons name={ICON_FOR[e.type]} size={18} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.entryHeadRow}>
                  <Text style={styles.entryDay}>{e.day}{e.isToday ? ' · today' : ''}</Text>
                  {e.posted && (
                    <View style={styles.postedPill}>
                      <Text style={styles.postedPillText}>POSTED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.entryTitle}>{e.title}</Text>
                <View style={styles.entryMetaRow}>
                  <Text style={styles.entryMeta}>{e.duration}</Text>
                  <Text style={styles.entryMetaDot}>·</Text>
                  <View style={styles.intensityBar}>
                    <View style={[styles.intensityFill, { width: `${e.intensity}%` }]} />
                  </View>
                  <Text style={styles.entryMeta}>{e.intensity}</Text>
                </View>
                {e.attachedDeal && (
                  <View style={styles.dealAttached}>
                    <Ionicons name="link" size={12} color={TEAL} />
                    <Text style={styles.dealAttachedText}>
                      {e.attachedDeal.brand} · {e.attachedDeal.counter}
                    </Text>
                  </View>
                )}
                {/* One-tap convert row */}
                <View style={styles.convertRow}>
                  <ConvertChip label="Post" icon="share-outline" />
                  <ConvertChip label="Team" icon="people-outline" />
                  <ConvertChip label="Deal" icon="briefcase-outline" />
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Recovery rail */}
        <Text style={styles.sectionLabel}>RECOVERY · TODAY</Text>
        <View style={styles.recoveryCard}>
          <View style={styles.recoveryRow}>
            <RecoveryStat label="Sleep" value="7h 42m" delta="+0:18" positive />
            <View style={styles.recoveryDivider} />
            <RecoveryStat label="HRV" value="68 ms" delta="−4 vs avg" />
            <View style={styles.recoveryDivider} />
            <RecoveryStat label="Resting HR" value="52 bpm" delta="−2 bpm" positive />
          </View>
        </View>

        {/* Coach signoff */}
        <Text style={styles.sectionLabel}>COACH SIGNOFF</Text>
        <View style={styles.signoffCard}>
          <View style={styles.signoffRow}>
            <View style={[styles.partyAvatar, { backgroundColor: ACCENT }]}>
              <Text style={styles.partyAvatarText}>HW</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.signoffName}>Coach Williams</Text>
              <Text style={styles.signoffMeta}>Last reviewed Wed · 3 sessions pending</Text>
            </View>
            <View style={styles.signoffPending}>
              <Text style={styles.signoffPendingText}>3</Text>
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <GlassButton label="Send week to Coach Williams" onPress={() => undefined} fullWidth />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function MiniRing({ label, pct }: { label: string; pct: number }) {
  return (
    <View style={styles.miniRingWrap}>
      <View style={styles.miniRing}>
        <View
          style={[
            styles.miniRingFill,
            {
              borderTopColor: pct > 60 ? TEAL : YELLOW,
              transform: [{ rotate: `${(pct / 100) * 360}deg` }],
            },
          ]}
        />
        <Text style={styles.miniRingText}>{pct}</Text>
      </View>
      <Text style={styles.miniRingLabel}>{label}</Text>
    </View>
  );
}

function ConvertChip({ label, icon }: { label: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable style={styles.convertChip}>
      <Ionicons name={icon} size={12} color="#FFF" />
      <Text style={styles.convertChipText}>{label}</Text>
    </Pressable>
  );
}

function RecoveryStat({ label, value, delta, positive }: { label: string; value: string; delta: string; positive?: boolean }) {
  return (
    <View style={styles.recoveryStat}>
      <Text style={styles.recoveryLabel}>{label}</Text>
      <Text style={styles.recoveryValue}>{value}</Text>
      <Text style={[styles.recoveryDelta, positive && { color: TEAL }]}>{delta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  content: { paddingTop: 8 },

  heroCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakRow: { flexDirection: 'row', alignItems: 'center' },
  streakNumber: { fontSize: 38, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  streakLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: -4, textTransform: 'uppercase', letterSpacing: 1 },
  streakSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 },

  miniRingRow: { flexDirection: 'row', gap: 8 },
  miniRingWrap: { alignItems: 'center', gap: 4 },
  miniRing: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  miniRingFill: {
    position: 'absolute',
    width: 36, height: 36,
    borderRadius: 18,
    borderWidth: 3, borderTopColor: TEAL,
    borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent',
  },
  miniRingText: { fontSize: 10, color: '#FFF', fontWeight: '800' },
  miniRingLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.6 },

  dayChipsRow: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  dayChip: {
    width: 44, height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    gap: 6,
  },
  dayChipActive: { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: '#FFF' },
  dayChipEmpty: { opacity: 0.4 },
  dayChipText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  dayChipTextActive: { color: '#FFF' },
  dayChipDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: TEAL },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 20, marginTop: 16, marginBottom: 8,
  },

  cardGroup: {
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  entryRow: { flexDirection: 'row', gap: 12, padding: 14 },
  entryBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  entryIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)',
  },
  entryHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryDay: { fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  postedPill: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(20,184,166,0.18)',
  },
  postedPillText: { fontSize: 8, fontWeight: '900', color: TEAL, letterSpacing: 0.6 },
  entryTitle: { fontSize: 14, fontWeight: '700', color: '#FFF', marginTop: 2 },
  entryMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  entryMeta: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  entryMetaDot: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  intensityBar: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden', maxWidth: 80,
  },
  intensityFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 2 },

  dealAttached: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  dealAttachedText: { fontSize: 11, color: TEAL, fontWeight: '600' },

  convertRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  convertChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)',
  },
  convertChipText: { fontSize: 10, fontWeight: '700', color: '#FFF' },

  recoveryCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  recoveryRow: { flexDirection: 'row', alignItems: 'center' },
  recoveryStat: { flex: 1, alignItems: 'center', gap: 4 },
  recoveryDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.08)' },
  recoveryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.6 },
  recoveryValue: { fontSize: 16, color: '#FFF', fontWeight: '800' },
  recoveryDelta: { fontSize: 10, color: 'rgba(255,255,255,0.45)' },

  signoffCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  signoffRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  partyAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  partyAvatarText: { fontSize: 13, fontWeight: '900', color: '#FFF' },
  signoffName: { fontSize: 14, color: '#FFF', fontWeight: '700' },
  signoffMeta: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  signoffPending: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,214,10,0.16)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,214,10,0.4)',
  },
  signoffPendingText: { fontSize: 12, fontWeight: '900', color: YELLOW },
});
