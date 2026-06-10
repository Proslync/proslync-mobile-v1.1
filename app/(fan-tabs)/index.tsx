// Fan HQ — rich fan landing page. Replaces the prior auth-branched
// FanHomeFeed/FanView shell during fan-dashboard-remix-2026-05-12; the
// social-feed surface moved to `(fan-tabs)/dashboard.tsx` (slot-2, "Fan
// Hub"). This Home tab is now a curated single-scroll Fan HQ command page
// with the tier badge, fan score, leaderboard rank, live-athletes strip,
// and inline Pickem + Perks teasers.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AthleteAvatar } from '@/components/explore/sections/athlete-avatar';
import {
  FAN_ACCENT,
  FAN_ACCENT_BORDER,
  FAN_ACCENT_SOFT,
} from '@/constants/brand';
import {
  FAN_FOLLOWING,
  FAN_PERKS,
  FAN_PREDICTIONS,
  FAN_PROFILE,
  type Perk,
  type Prediction,
} from '@/lib/data/mock-fan-data';

const COPPER = '#EB621A';
const PURPLE = '#A855F7';
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(255,255,255,0.09)';

const liveAthletes = FAN_FOLLOWING.filter((a) => a.isLive);

export default function FanHomeTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [picks, setPicks] = React.useState<Record<string, string | undefined>>(
    Object.fromEntries(FAN_PREDICTIONS.map((p) => [p.id, p.myPick])),
  );

  const setPick = (predId: string, optId: string) => {
    setPicks((prev) => ({ ...prev, [predId]: optId }));
  };

  const tierPct =
    (FAN_PROFILE.superfanPoints /
      (FAN_PROFILE.superfanPoints + FAN_PROFILE.pointsToNext)) *
    100;

  const predictionTeasers = FAN_PREDICTIONS.slice(0, 3);
  const perkTeasers = FAN_PERKS.filter((p) => !p.claimed).slice(0, 3);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerKicker}>FAN HQ</Text>
            <Text style={styles.headerTitle}>
              Welcome back, {FAN_PROFILE.firstName}
            </Text>
            <Text style={styles.headerSubtitle}>{FAN_PROFILE.metaPrimary}</Text>
          </View>
          <View style={styles.tierPill}>
            <Ionicons name="diamond" size={11} color={FAN_ACCENT} />
            <Text style={styles.tierPillText}>
              {FAN_PROFILE.superfanTier.toUpperCase()}
            </Text>
          </View>
        </View>

        <Animated.View entering={FadeIn.duration(300)} style={styles.tierCard}>
          <LinearGradient
            colors={['rgba(199,154,165,0.22)', 'rgba(199,154,165,0.02)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.tierTopRow}>
            <View style={styles.tierBadge}>
              <Ionicons name="diamond" size={22} color={FAN_ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tierCurrent}>
                {FAN_PROFILE.superfanTier} Tier
              </Text>
              <Text style={styles.tierPoints}>
                {FAN_PROFILE.superfanPoints.toLocaleString()} pts ·{' '}
                {FAN_PROFILE.stats[1].value} games watched
              </Text>
            </View>
            <View style={styles.tierRight}>
              <Text style={styles.tierToNext}>
                +{FAN_PROFILE.pointsToNext}
              </Text>
              <Text style={styles.tierToNextLabel}>
                to {FAN_PROFILE.nextTier}
              </Text>
            </View>
          </View>
          <View style={styles.tierTrack}>
            <View style={[styles.tierFill, { width: `${tierPct}%` }]} />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(360).delay(60)}
          style={styles.statRow}
        >
          <View style={[styles.statCard, styles.statCardCopper]}>
            <Text style={styles.statKicker}>LEADERBOARD</Text>
            <Text style={styles.statValue}>#134</Text>
            <Text style={styles.statMeta}>
              <Ionicons name="trending-up" size={11} color={COPPER} /> up 22
              this week
            </Text>
          </View>
          <View style={[styles.statCard, styles.statCardPurple]}>
            <Text style={[styles.statKicker, { color: PURPLE }]}>ACCURACY</Text>
            <Text style={styles.statValue}>67%</Text>
            <Text style={styles.statMeta}>
              42 of 63 picks · 2025 season
            </Text>
          </View>
        </Animated.View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>
            LIVE NOW · {liveAthletes.length}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(fan-tabs)/dashboard' as any)}
            accessibilityRole="link"
            accessibilityLabel="See all followed athletes"
          >
            <Text style={styles.sectionLink}>All follows ›</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.liveStrip}
        >
          {FAN_FOLLOWING.slice(0, 10).map((a) => (
            <TouchableOpacity
              key={a.id}
              activeOpacity={0.7}
              style={styles.liveChip}
              accessibilityRole="button"
              accessibilityLabel={`Open ${a.name}`}
            >
              <AthleteAvatar
                size={58}
                color={a.avatarColor}
                initials={a.initials}
                headshotUrl={a.headshotUrl}
                isLive={a.isLive}
                borderWidth={2}
              />
              <Text style={styles.liveChipName} numberOfLines={1}>
                {a.name.split(' ')[0]}
              </Text>
              <Text style={styles.liveChipMeta} numberOfLines={1}>
                {a.isLive ? 'LIVE' : a.school.split(' · ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>
            PICK'EM · {FAN_PREDICTIONS.length} active
          </Text>
          <TouchableOpacity accessibilityRole="link" accessibilityLabel="See all picks">
            <Text style={styles.sectionLink}>See all ›</Text>
          </TouchableOpacity>
        </View>
        {predictionTeasers.map((p, i) => (
          <PredictionCard
            key={p.id}
            p={p}
            pick={picks[p.id]}
            onPick={(opt) => !p.locked && setPick(p.id, opt)}
            delay={i * 70}
          />
        ))}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>
            PERKS · {perkTeasers.length} available
          </Text>
          <TouchableOpacity accessibilityRole="link" accessibilityLabel="See all perks">
            <Text style={styles.sectionLink}>See all ›</Text>
          </TouchableOpacity>
        </View>
        {perkTeasers.map((p, i) => (
          <PerkCard key={p.id} p={p} delay={i * 80} />
        ))}
      </ScrollView>
    </View>
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
          <Ionicons name="trophy" size={11} color={COPPER} />
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
                        ? 'rgba(168,85,247,0.35)'
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
                    selected && { color: PURPLE, fontWeight: '800' },
                  ]}
                >
                  {opt.pct}%
                </Text>
              </View>
              {selected && (
                <View style={styles.predMyPick}>
                  <Ionicons name="checkmark-circle" size={12} color={PURPLE} />
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

function PerkCard({ p, delay }: { p: Perk; delay: number }) {
  const icon: Record<Perk['type'], keyof typeof Ionicons.glyphMap> = {
    tickets: 'ticket',
    merch: 'shirt',
    experience: 'basketball',
    meet: 'people',
  };
  const tierColor: Record<Perk['tier'], string> = {
    Gold: '#F5B400',
    Platinum: '#C0C0C0',
    Diamond: FAN_ACCENT,
  };
  const affordable = FAN_PROFILE.superfanPoints >= p.cost;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(380)}
      style={p.imageUrl ? styles.perkCardWithHero : styles.perkCard}
    >
      {p.imageUrl ? (
        <View style={styles.perkHero}>
          <Image
            source={{ uri: p.imageUrl }}
            style={styles.perkHeroImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
            locations={[0.35, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.perkHeroBadge}>
            <Ionicons name={icon[p.type]} size={20} color="#FFFFFF" />
          </View>
        </View>
      ) : (
        <View style={styles.perkIconBox}>
          <Ionicons name={icon[p.type]} size={22} color={COPPER} />
        </View>
      )}
      <View style={p.imageUrl ? styles.perkBodyBelowHero : { flex: 1 }}>
        <View style={styles.perkTopRow}>
          <View
            style={[
              styles.perkTierPill,
              {
                borderColor: tierColor[p.tier],
                backgroundColor: `${tierColor[p.tier]}1a`,
              },
            ]}
          >
            <Text style={[styles.perkTierText, { color: tierColor[p.tier] }]}>
              {p.tier.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.perkTitle}>{p.title}</Text>
        <Text style={styles.perkAthlete}>{p.athlete}</Text>
        <Text style={styles.perkDesc} numberOfLines={2}>
          {p.description}
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.claimBtn, !affordable && styles.claimBtnDisabled]}
        >
          <Ionicons
            name="diamond-outline"
            size={13}
            color={affordable ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
          />
          <Text
            style={[
              styles.claimBtnText,
              !affordable && { color: 'rgba(255,255,255,0.5)' },
            ]}
          >
            {affordable
              ? 'Claim'
              : `Need ${(p.cost - FAN_PROFILE.superfanPoints).toLocaleString()} more`}
          </Text>
          <Text
            style={[
              styles.claimBtnCost,
              !affordable && { color: 'rgba(255,255,255,0.5)' },
            ]}
          >
            {p.cost.toLocaleString()} pts
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { paddingHorizontal: 16 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  headerKicker: {
    fontSize: 11,
    color: FAN_ACCENT,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: FAN_ACCENT_SOFT,
    borderWidth: 1,
    borderColor: FAN_ACCENT_BORDER,
  },
  tierPillText: {
    fontSize: 10.5,
    color: FAN_ACCENT,
    letterSpacing: 0.8,
    fontWeight: '800',
  },

  tierCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: FAN_ACCENT_BORDER,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    marginBottom: 12,
  },
  tierTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  tierBadge: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: FAN_ACCENT_SOFT,
    borderWidth: 1,
    borderColor: FAN_ACCENT_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierCurrent: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  tierPoints: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 },
  tierRight: { alignItems: 'flex-end' },
  tierToNext: { color: FAN_ACCENT, fontSize: 17, fontWeight: '800' },
  tierToNextLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  tierTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  tierFill: { height: 6, borderRadius: 3, backgroundColor: FAN_ACCENT },

  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: CARD_BG,
  },
  statCardCopper: {
    borderColor: 'rgba(235,98,26,0.30)',
  },
  statCardPurple: {
    borderColor: 'rgba(168,85,247,0.30)',
  },
  statKicker: {
    fontSize: 10,
    color: COPPER,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  statMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 14,
  },

  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  sectionLink: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },

  liveStrip: { gap: 14, paddingBottom: 4, paddingRight: 4 },
  liveChip: { alignItems: 'center', width: 70 },
  liveChipName: {
    color: '#FFFFFF',
    fontSize: 11.5,
    marginTop: 6,
    fontWeight: '700',
  },
  liveChipMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9.5,
    marginTop: 2,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Prediction cards (compact teaser variant — same shape as the Pick'em
  // route had pre-remix; trimmed of header / scroll host).
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
  potText: { color: COPPER, fontSize: 11, fontWeight: '800' },
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
  predOptSelected: { borderColor: 'rgba(168,85,247,0.5)' },
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
    color: PURPLE,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Perks
  perkCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    marginBottom: 10,
  },
  perkCardWithHero: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    marginBottom: 10,
  },
  perkHero: {
    height: 110,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  perkHeroImage: { width: '100%', height: '100%' },
  perkHeroBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkBodyBelowHero: { padding: 14 },
  perkIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,111,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,111,60,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  perkTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  perkTierPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  perkTierText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  perkTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  perkAthlete: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 3 },
  perkDesc: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11.5,
    marginTop: 4,
    lineHeight: 16,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(199,154,165,0.16)',
    borderWidth: 1,
    borderColor: FAN_ACCENT_BORDER,
  },
  claimBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  claimBtnText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  claimBtnCost: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },
});
