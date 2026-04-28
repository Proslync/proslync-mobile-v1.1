import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';

const TAB_BAR_TOP_FROM_BOTTOM = 90;

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
    kind: 'staff' | 'roster';
  }>();

  const isRoster = params.kind === 'roster';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 64,
          paddingBottom: TAB_BAR_TOP_FROM_BOTTOM + 60,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBlock}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: params.color || '#F76900' },
            ]}
          >
            <Text style={styles.avatarText}>{params.initial}</Text>
          </View>
          <Text style={styles.name}>{params.name}</Text>
          <Text style={styles.role}>{params.role}</Text>
          {params.tag ? (
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{params.tag}</Text>
            </View>
          ) : null}
        </View>

        {isRoster ? <RosterDetailSections /> : <StaffDetailSections />}
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

function RosterDetailSections() {
  return (
    <View style={{ gap: 16, marginTop: 24 }}>
      <Section title="STATS THIS SEASON">
        <View style={styles.statRow}>
          <Stat label="PPG" value="14.2" />
          <Stat label="RPG" value="3.6" />
          <Stat label="APG" value="3.1" />
          <Stat label="FG%" value="46.1" />
        </View>
      </Section>

      <Section title="RECENT GAMES">
        {[
          { vs: 'vs Duke', line: '21 PTS · 4 REB · 3 AST', result: 'W 78-71' },
          { vs: '@ Miami', line: '12 PTS · 2 REB', result: 'W 65-58' },
          { vs: '@ UConn', line: '18 PTS · 5 AST', result: 'L 64-72' },
        ].map((g, i, a) => (
          <View
            key={i}
            style={[styles.row, i !== a.length - 1 && styles.rowDivider]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{g.vs}</Text>
              <Text style={styles.rowSub}>{g.line}</Text>
            </View>
            <Text
              style={[
                styles.result,
                {
                  color: g.result.startsWith('W') ? '#34C759' : '#FF4444',
                },
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

function StaffDetailSections() {
  return (
    <View style={{ gap: 16, marginTop: 24 }}>
      <Section title="TENURE">
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.rowSub}>Joined Syracuse 2022 · 3 seasons</Text>
        </View>
      </Section>

      <Section title="BACKGROUND">
        <Text style={styles.bodyText}>
          15+ years coaching at the Division I level. Specializes in player
          development, defensive schemes, and recruiting. Player development
          architect for the program's last three All-ACC selections.
        </Text>
      </Section>

      <Section title="CURRENT FOCUS">
        {[
          'Backcourt development',
          'Half-court offense',
          'Recruiting Class of 2026',
        ].map((t, i, a) => (
          <View
            key={i}
            style={[styles.row, i !== a.length - 1 && styles.rowDivider]}
          >
            <Text style={styles.rowTitle}>{t}</Text>
          </View>
        ))}
      </Section>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 40, fontWeight: '700' },
  name: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowTitle: { color: '#FFF', fontSize: 15, fontWeight: '500' },
  rowSub: { color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 2 },
  result: { fontSize: 13, fontWeight: '700' },
  bodyText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 20,
    padding: 14,
  },
  statRow: { flexDirection: 'row', padding: 14, gap: 8 },
  statCol: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    letterSpacing: 0.6,
  },
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
});
