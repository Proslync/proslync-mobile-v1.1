// Pickem section — fan score card + prediction cards. Fans-only.
// Single source of truth for Pickem UI; consumed by FanView (legacy),
// (fan-tabs)/pickem (legacy route), and the Triad fans-only bottom.
// Extracted from components/fan/fan-view.tsx during
// fan-content-to-triad-2026-05-12.

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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  FAN_PREDICTIONS,
  FAN_PROFILE,
  type Prediction,
} from '@/lib/data/mock-fan-data';
import {
  FAN_ACCENT,
  FAN_ACCENT_BORDER,
  FAN_ACCENT_SOFT,
} from '@/constants/brand';

const ACCENT = '#EB621A';
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(255,255,255,0.09)';

interface PickemSectionProps {
  bottomInset?: number;
}

export function PickemSection({ bottomInset = 0 }: PickemSectionProps) {
  const [picks, setPicks] = React.useState<Record<string, string | undefined>>(
    Object.fromEntries(FAN_PREDICTIONS.map((p) => [p.id, p.myPick])),
  );

  const setPick = (predId: string, optId: string) => {
    setPicks((prev) => ({ ...prev, [predId]: optId }));
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: bottomInset + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(300)} style={styles.fanScoreCard}>
        <LinearGradient
          colors={['rgba(199,154,165,0.18)', 'rgba(199,154,165,0.02)']}
          style={StyleSheet.absoluteFill}
        />
        <View>
          <Text style={styles.fanScoreLabel}>FAN SCORE · SEASON</Text>
          <Text style={styles.fanScoreValue}>
            {FAN_PROFILE.superfanPoints.toLocaleString()}
          </Text>
          <Text style={styles.fanScoreMeta}>
            #134 on the national leaderboard · up 22 this week
          </Text>
        </View>
        <View style={styles.fanScoreRight}>
          <Text style={styles.accuracyValue}>67%</Text>
          <Text style={styles.accuracyLabel}>accuracy</Text>
        </View>
      </Animated.View>

      {FAN_PREDICTIONS.map((p, i) => (
        <PredictionCard
          key={p.id}
          p={p}
          pick={picks[p.id]}
          onPick={(opt) => !p.locked && setPick(p.id, opt)}
          delay={i * 70}
        />
      ))}
    </ScrollView>
  );
}

function PredictionCard({
  p,
  pick,
  onPick,
  delay,
}: {
  p: Prediction;
  pick: string | undefined;
  onPick: (optId: string) => void;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(380)}
      style={[styles.predCard, p.locked && { opacity: 0.85 }]}
    >
      <View style={styles.predHead}>
        <Text style={styles.predLabel}>{p.label}</Text>
        <View style={[styles.potPill, p.locked && { opacity: 0.6 }]}>
          <Ionicons name="trophy" size={11} color={ACCENT} />
          <Text style={styles.potText}>{p.potPoints} pts</Text>
        </View>
      </View>
      <Text
        style={[
          styles.predDeadline,
          p.locked && { color: '#FF4444', fontWeight: '700' },
        ]}
      >
        {p.deadline}
      </Text>
      <View style={styles.predOpts}>
        {p.options.map((opt) => {
          const selected = pick === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={p.locked ? 1 : 0.7}
              onPress={() => onPick(opt.id)}
              style={[styles.predOpt, selected && styles.predOptSelected]}
            >
              <View style={styles.predOptBarTrack}>
                <View
                  style={[
                    styles.predOptBarFill,
                    {
                      width: `${opt.pct}%`,
                      backgroundColor: selected
                        ? 'rgba(199,154,165,0.35)'
                        : 'rgba(255,255,255,0.07)',
                    },
                  ]}
                />
              </View>
              <View style={styles.predOptContent}>
                <Text
                  style={[
                    styles.predOptText,
                    selected && styles.predOptTextSelected,
                  ]}
                >
                  {opt.text}
                </Text>
                <Text
                  style={[
                    styles.predOptPct,
                    selected && { color: FAN_ACCENT, fontWeight: '800' },
                  ]}
                >
                  {opt.pct}%
                </Text>
              </View>
              {selected && (
                <View style={styles.predMyPick}>
                  <Ionicons name="checkmark-circle" size={12} color={FAN_ACCENT} />
                  <Text style={styles.predMyPickText}>YOUR PICK</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
  fanScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FAN_ACCENT_BORDER,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    marginBottom: 14,
  },
  fanScoreLabel: {
    fontSize: 10,
    color: FAN_ACCENT,
    letterSpacing: 0.8,
    fontWeight: '800',
  },
  fanScoreValue: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginTop: 4 },
  fanScoreMeta: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  fanScoreRight: { alignItems: 'center' },
  accuracyValue: { color: FAN_ACCENT, fontSize: 26, fontWeight: '800' },
  accuracyLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
    marginTop: 2,
    fontWeight: '600',
  },
  predCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    marginBottom: 10,
  },
  predHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  predLabel: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  potPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.3)',
  },
  potText: { color: ACCENT, fontSize: 11, fontWeight: '800' },
  predDeadline: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    marginBottom: 10,
  },
  predOpts: { gap: 6 },
  predOpt: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  predOptSelected: { borderColor: 'rgba(199,154,165,0.5)' },
  predOptBarTrack: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  predOptBarFill: { height: '100%' },
  predOptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  predOptText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  predOptTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  predOptPct: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  predMyPick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  predMyPickText: {
    fontSize: 9.5,
    color: FAN_ACCENT,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
