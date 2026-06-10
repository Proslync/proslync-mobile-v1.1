// Coach — Practice Plan. Drag-to-reorder drill segments + roster strip.
// File 01.2 spec: today's practice as a single buildable plan.

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
import { MY_ROSTER, MY_TEAM_SUMMARY } from '@/lib/data/mock-coach-data';

const ACCENT = '#EB621A';
const TEAL = '#14B8A6';
const YELLOW = '#FFD60A';

type Segment = {
  id: string;
  title: string;
  duration: number; // min
  category: 'warmup' | 'shooting' | 'defense' | 'scrimmage' | 'film' | 'cool';
  assigned: string[]; // playerIds
  balanceScore?: number;
};

const SEGMENTS: Segment[] = [
  { id: 's-1', title: 'Dynamic warmup', duration: 12, category: 'warmup', assigned: [] },
  { id: 's-2', title: '3-spot shooting · stations', duration: 25, category: 'shooting', assigned: ['pl-23', 'pl-7'], balanceScore: 88 },
  { id: 's-3', title: 'Help-side rotations', duration: 20, category: 'defense', assigned: ['pl-4', 'pl-5'], balanceScore: 76 },
  { id: 's-4', title: 'Live 5v5 scrimmage', duration: 30, category: 'scrimmage', assigned: ['pl-4', 'pl-5', 'pl-7', 'pl-11', 'pl-23'], balanceScore: 92 },
  { id: 's-5', title: 'Film — UNC switch coverage', duration: 12, category: 'film', assigned: [] },
  { id: 's-6', title: 'Cool down + stretch', duration: 8, category: 'cool', assigned: [] },
];

const CAT_ICON: Record<Segment['category'], keyof typeof MaterialCommunityIcons.glyphMap> = {
  warmup: 'run',
  shooting: 'basketball',
  defense: 'shield-half-full',
  scrimmage: 'whistle',
  film: 'video-outline',
  cool: 'snowflake',
};

export default function PracticePlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const totalRuntime = SEGMENTS.reduce((acc, s) => acc + s.duration, 0);
  const hours = Math.floor(totalRuntime / 60);
  const mins = totalRuntime % 60;
  const attendingCount = MY_ROSTER.filter((p) => p.status === 'active' || p.status === 'questionable').length;

  return (
    <View style={styles.container}>
      <DarkGradientBg />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Practice Plan</Text>
          <Text style={styles.headerSub}>{MY_TEAM_SUMMARY.name} · Today</Text>
        </View>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="calendar-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroRuntime}>{hours}h {mins.toString().padStart(2, '0')}m</Text>
            <Text style={styles.heroLabel}>total runtime</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroLeft}>
            <Text style={styles.heroRuntime}>{attendingCount}<Text style={styles.heroSlash}>/{MY_ROSTER.length}</Text></Text>
            <Text style={styles.heroLabel}>attending</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroLeft}>
            <View style={styles.weatherChip}>
              <Ionicons name="partly-sunny-outline" size={14} color={YELLOW} />
              <Text style={styles.weatherText}>72° clear</Text>
            </View>
            <Text style={styles.heroLabel}>weather</Text>
          </View>
        </Animated.View>

        {/* Segment timeline */}
        <Text style={styles.sectionLabel}>TIMELINE · {SEGMENTS.length} SEGMENTS</Text>
        <View style={styles.timelineWrap}>
          {SEGMENTS.map((s, i) => (
            <Animated.View
              key={s.id}
              entering={FadeInDown.delay(i * 60).duration(380)}
              style={styles.segmentRow}
            >
              <View style={styles.segmentSpine}>
                <View style={styles.segmentNode} />
                {i < SEGMENTS.length - 1 && <View style={styles.segmentConnector} />}
              </View>

              <View style={styles.segmentCard}>
                <View style={styles.segmentTopRow}>
                  <View style={styles.segmentIconWrap}>
                    <MaterialCommunityIcons name={CAT_ICON[s.category]} size={16} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.segmentTitle}>{s.title}</Text>
                    <Text style={styles.segmentMeta}>{s.duration} min · {s.category}</Text>
                  </View>
                  <Ionicons name="reorder-three" size={20} color="rgba(255,255,255,0.3)" />
                </View>

                {s.assigned.length > 0 && (
                  <View style={styles.assignedRow}>
                    <View style={styles.assignedDots}>
                      {s.assigned.slice(0, 4).map((id, idx) => {
                        const p = MY_ROSTER.find((r) => r.id === id);
                        if (!p) return null;
                        return (
                          <View
                            key={id}
                            style={[
                              styles.assignedDot,
                              { backgroundColor: p.color, marginLeft: idx === 0 ? 0 : -10, zIndex: 4 - idx },
                            ]}
                          >
                            <Text style={styles.assignedDotText}>{p.initials}</Text>
                          </View>
                        );
                      })}
                      {s.assigned.length > 4 && (
                        <View style={[styles.assignedDot, styles.assignedMore, { marginLeft: -10 }]}>
                          <Text style={styles.assignedDotText}>+{s.assigned.length - 4}</Text>
                        </View>
                      )}
                    </View>
                    {s.balanceScore != null && (
                      <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>BALANCE</Text>
                        <Text style={[styles.balanceScore, { color: s.balanceScore >= 85 ? TEAL : YELLOW }]}>
                          {s.balanceScore}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </Animated.View>
          ))}

          <View style={styles.addSegmentBtn}>
            <Ionicons name="add" size={16} color="rgba(255,255,255,0.6)" />
            <Text style={styles.addSegmentText}>Add drill or segment</Text>
          </View>
        </View>

        {/* Roster strip */}
        <Text style={styles.sectionLabel}>ROSTER · TAP TO ASSIGN</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rosterStripRow}>
          {MY_ROSTER.map((p) => (
            <Pressable key={p.id} style={styles.rosterStripCard}>
              <View style={[styles.rosterStripAvatar, { backgroundColor: p.color }, p.status === 'questionable' && styles.rosterQuestionable]}>
                <Text style={styles.rosterStripInitials}>{p.initials}</Text>
                {p.status === 'questionable' && <View style={styles.statusDotQuestion} />}
              </View>
              <Text style={styles.rosterStripName} numberOfLines={1}>#{p.number} {p.name.split(' ').pop()}</Text>
              <Text style={styles.rosterStripPos}>{p.position}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <GlassButton label="Publish & blast to roster" onPress={() => undefined} fullWidth />
        </View>
      </ScrollView>
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
  },
  heroLeft: { flex: 1, alignItems: 'center', gap: 4 },
  heroDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroRuntime: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.4 },
  heroSlash: { fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: '700' },
  heroLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.6 },
  weatherChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,214,10,0.1)' },
  weatherText: { fontSize: 12, color: '#FFF', fontWeight: '700' },

  sectionLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 20, marginTop: 16, marginBottom: 8,
  },

  timelineWrap: { paddingHorizontal: 16, gap: 0 },
  segmentRow: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
  segmentSpine: { width: 16, alignItems: 'center' },
  segmentNode: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#FFF',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 16,
  },
  segmentConnector: { flex: 1, width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },

  segmentCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
  },
  segmentTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  segmentIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  segmentTitle: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  segmentMeta: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2, textTransform: 'capitalize' },
  assignedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },
  assignedDots: { flexDirection: 'row', flex: 1 },
  assignedDot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#000',
  },
  assignedMore: { backgroundColor: 'rgba(255,255,255,0.15)' },
  assignedDotText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
  balanceRow: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8, color: 'rgba(255,255,255,0.5)' },
  balanceScore: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },

  addSegmentBtn: {
    marginLeft: 28,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)',
    borderStyle: 'dashed',
  },
  addSegmentText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  rosterStripRow: { paddingHorizontal: 16, gap: 10, paddingBottom: 8 },
  rosterStripCard: { width: 76, alignItems: 'center', gap: 6 },
  rosterStripAvatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)',
  },
  rosterQuestionable: { borderColor: YELLOW },
  rosterStripInitials: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  statusDotQuestion: {
    position: 'absolute',
    bottom: -2, right: -2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: YELLOW,
    borderWidth: 2, borderColor: '#000',
  },
  rosterStripName: { fontSize: 11, color: '#FFF', fontWeight: '700' },
  rosterStripPos: { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 0.6 },
});
