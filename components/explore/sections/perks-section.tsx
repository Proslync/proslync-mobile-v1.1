// Perks section — membership card + available/claimed perk cards. Fans-only.
// Points/score gamification removed (charter FAN CUT LIST: no points,
// leaderboards, or "X pts to claim" — tier NAMES are identity, not currency).
// Extracted from components/fan/fan-view.tsx during
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  FAN_PERKS,
  FAN_PROFILE,
  type Perk,
} from '@/lib/data/mock-fan-data';
import {
  FAN_ACCENT,
  FAN_ACCENT_BORDER,
  FAN_ACCENT_SOFT,
} from '@/constants/brand';

const ACCENT = '#EB621A';
const CARD_BG = 'rgba(255,255,255,0.05)';
const CARD_BORDER = 'rgba(255,255,255,0.09)';

interface PerksSectionProps {
  bottomInset?: number;
}

export function PerksSection({ bottomInset = 0 }: PerksSectionProps) {
  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: bottomInset + 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Membership identity — tier NAME + tenure, no points/progress ladder */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.tierCard}>
        <LinearGradient
          colors={['rgba(199,154,165,0.22)', 'rgba(199,154,165,0.02)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tierRow}>
          <View style={styles.tierBadge}>
            <Ionicons name="diamond" size={22} color={FAN_ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tierCurrent}>
              {FAN_PROFILE.superfanTier} Member
            </Text>
            <Text style={styles.tierPoints}>
              Supporter since {FAN_PROFILE.supporterSince}
            </Text>
          </View>
        </View>
      </Animated.View>

      <Text style={styles.kicker}>
        AVAILABLE · {FAN_PERKS.filter((p) => !p.claimed).length}
      </Text>
      {FAN_PERKS.filter((p) => !p.claimed).map((p, i) => (
        <PerkCard key={p.id} p={p} delay={i * 70} />
      ))}

      <Text style={styles.kicker}>
        CLAIMED · {FAN_PERKS.filter((p) => p.claimed).length}
      </Text>
      {FAN_PERKS.filter((p) => p.claimed).map((p, i) => (
        <PerkCard key={p.id} p={p} delay={i * 70} />
      ))}
    </ScrollView>
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

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(380)}
      style={[
        p.imageUrl ? styles.perkCardWithHero : styles.perkCard,
        p.claimed && { opacity: 0.55 },
      ]}
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
          <Ionicons name={icon[p.type]} size={22} color={ACCENT} />
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
          {p.claimed && (
            <View style={styles.claimedPill}>
              <Ionicons name="checkmark" size={11} color="#34C759" />
              <Text style={styles.claimedText}>CLAIMED</Text>
            </View>
          )}
        </View>
        <Text style={styles.perkTitle}>{p.title}</Text>
        <Text style={styles.perkAthlete}>{p.athlete}</Text>
        <Text style={styles.perkDesc}>{p.description}</Text>
        {!p.claimed && (
          <TouchableOpacity activeOpacity={0.85} style={styles.claimBtn}>
            <Ionicons name="diamond-outline" size={13} color="#FFFFFF" />
            <Text style={styles.claimBtnText}>Claim</Text>
            <Text style={styles.claimBtnCost}>{p.tier} perk</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
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
  tierCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FAN_ACCENT_BORDER,
    backgroundColor: CARD_BG,
    overflow: 'hidden',
    marginBottom: 10,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  tierBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: FAN_ACCENT_SOFT,
    borderWidth: 1,
    borderColor: FAN_ACCENT_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierCurrent: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  tierPoints: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  tierToNext: {
    color: FAN_ACCENT,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  tierTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  tierFill: { height: 6, borderRadius: 3, backgroundColor: FAN_ACCENT },
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
  perkHeroImage: {
    width: '100%',
    height: '100%',
  },
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
  perkBodyBelowHero: {
    padding: 14,
  },
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
  claimedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.3)',
  },
  claimedText: {
    color: '#34C759',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
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
  claimBtnText: { flex: 1, color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  claimBtnCost: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },
});
