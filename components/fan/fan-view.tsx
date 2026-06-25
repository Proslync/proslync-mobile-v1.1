import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FanHomeFeed } from '@/components/fan/fan-home-feed';
import { PerkSheet, type SheetPerk } from '@/components/fan/perk-sheet';
import { RoleSwitcherSheet } from '@/components/shared/role-switcher-menu';
import { FloatingTabPill, useTabCollapse } from '@/components/shared/floating-tab-pill';

import {
  FAN_PERKS,
  FAN_PROFILE,
  type Perk,
} from '@/lib/data/mock-fan-data';

import {
  ACCENT,
  CANVAS,
  HAIRLINE,
  RADIUS_CARD,
  RADIUS_LG,
  RADIUS_SM,
  SIGNAL_POSITIVE,
  SP_LG,
  SP_MD,
  SP_SM,
  SP_XS,
  SURFACE,
  SURFACE_SUBTLE,
  TEXT,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  WEIGHT,
} from '@/components/shared/ui-kit/tokens';

// PURPLE is the fan role's identity accent — kept throughout (not copper)
const PURPLE = '#A855F7';

const TAB_BAR_TOP_FROM_BOTTOM = 90; // iOS 26 floating glass tab bar — top edge from screen bottom (incl. safe area)

// "Play & Perks" surface (the legacy fan dashboard). This is NOT a second home:
// `index.tsx` owns Fan HQ. Two pills: "Feed" (the live FanHomeFeed) + "Perks".
// REMOVED (charter FAN CUT LIST): the Pick'em tab — a performance-contingent
// predictions game with a Fan Score leaderboard. Fans buy content + perks,
// never outcomes; spend leaderboards are the whale-toxicity pattern.
const FAN_TABS = ['Feed', 'Perks'] as const;
type FanTabLabel = (typeof FAN_TABS)[number];

type TabKey = 'feed' | 'perks';

function tabLabelToKey(label: FanTabLabel): TabKey {
  if (label === 'Feed') return 'feed';
  return 'perks';
}
function tabKeyToLabel(key: TabKey): FanTabLabel {
  if (key === 'feed') return 'Feed';
  return 'Perks';
}

export function FanView() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = React.useState<TabKey>('feed');
  const [roleSheetVisible, setRoleSheetVisible] = React.useState(false);
  const { collapsed, onScroll } = useTabCollapse();

  const topPad = insets.top + SP_LG;
  const bottomPad = insets.bottom + 120;

  return (
    <View style={styles.container}>
      {activeTab === 'feed' && <FanHomeFeed topInset={topPad} onScroll={onScroll} />}
      {activeTab === 'perks' && <PerksTab topPad={topPad} bottomPad={bottomPad} onScroll={onScroll} />}

      {/* Top fade */}
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
        locations={[0, 0.5, 1]}
        style={[styles.topFade, { height: insets.top + 28 }]}
        pointerEvents="none"
      />

      {/* Bottom fade */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomFade, { bottom: 0, height: TAB_BAR_TOP_FROM_BOTTOM + 110 }]}
        pointerEvents="none"
      />

      {/* Floating bottom pill — Feed + Perks */}
      <FloatingTabPill
        tabs={FAN_TABS}
        activeKey={tabKeyToLabel(activeTab)}
        onSelect={(label) => setActiveTab(tabLabelToKey(label))}
        collapsed={collapsed}
        bottomInset={insets.bottom}
      />

      <RoleSwitcherSheet visible={roleSheetVisible} onClose={() => setRoleSheetVisible(false)} />
    </View>
  );
}

// (Pick'em tab removed — charter FAN CUT LIST: no performance-contingent
//  predictions, no Fan Score leaderboard.)

// ============================================================
// Perks
// ============================================================

// Map a FAN_PERKS row → the PerkSheet's shape. Available perks are claimable;
// already-claimed perks are read-only fulfillment status.
function perkToSheet(p: Perk): SheetPerk {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    source: p.athlete,
    tier: p.tier,
    kind: p.claimed ? 'status' : 'claimable',
    fulfillment: p.claimed
      ? 'Claimed — fulfillment complete.'
      : `Included with your ${p.tier} membership · fulfilled by the athlete's team after claim.`,
    delivered: p.claimed,
  };
}

function PerksTab({ topPad, bottomPad, onScroll }: { topPad: number; bottomPad: number; onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void }) {
  const [sheetPerk, setSheetPerk] = React.useState<SheetPerk | null>(null);
  const openPerk = React.useCallback((p: Perk) => setSheetPerk(perkToSheet(p)), []);

  return (
    <>
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingTop: topPad, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {/* Membership identity — tier NAME + supporter tenure. No points, no
          progress-to-next-tier ladder (charter FAN CUT LIST: no points
          gamification / leaderboards). Tier is identity, not a score. */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.tierCard}>
        <LinearGradient
          colors={['rgba(168,85,247,0.22)', 'rgba(168,85,247,0.02)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tierRow}>
          <View style={styles.tierBadge}>
            <Ionicons name="diamond" size={22} color={PURPLE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tierCurrent}>{FAN_PROFILE.superfanTier} Member</Text>
            <Text style={styles.tierPoints}>Supporter since {FAN_PROFILE.supporterSince}</Text>
          </View>
        </View>
      </Animated.View>

      <Text style={styles.kicker}>AVAILABLE · {FAN_PERKS.filter((p) => !p.claimed).length}</Text>
      {FAN_PERKS.filter((p) => !p.claimed).map((p, i) => (
        <PerkCard key={p.id} p={p} delay={i * 70} onOpen={openPerk} />
      ))}

      <Text style={styles.kicker}>CLAIMED · {FAN_PERKS.filter((p) => p.claimed).length}</Text>
      {FAN_PERKS.filter((p) => p.claimed).map((p, i) => (
        <PerkCard key={p.id} p={p} delay={i * 70} onOpen={openPerk} />
      ))}
    </ScrollView>

    <PerkSheet perk={sheetPerk} visible={sheetPerk != null} onClose={() => setSheetPerk(null)} />
    </>
  );
}

function PerkCard({ p, delay, onOpen }: { p: Perk; delay: number; onOpen: (p: Perk) => void }) {
  const icon: Record<Perk['type'], keyof typeof Ionicons.glyphMap> = {
    tickets: 'ticket',
    merch: 'shirt',
    experience: 'basketball',
    meet: 'people',
  };

  const tierColor: Record<Perk['tier'], string> = {
    Gold: '#F5B400',
    Platinum: '#C0C0C0',
    Diamond: PURPLE,
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(380)}
      style={[styles.perkCard, p.claimed && { opacity: 0.55 }]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onOpen(p)}
        style={styles.perkIconBox}
        accessibilityRole="button"
        accessibilityLabel={`View perk ${p.title}`}
      >
        <Ionicons name={icon[p.type]} size={22} color={ACCENT} />
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onOpen(p)}
        style={{ flex: 1 }}
        accessibilityRole="button"
        accessibilityLabel={`View perk ${p.title}`}
      >
        <View style={styles.perkTopRow}>
          <View style={[styles.perkTierPill, { borderColor: tierColor[p.tier], backgroundColor: `${tierColor[p.tier]}1a` }]}>
            <Text style={[styles.perkTierText, { color: tierColor[p.tier] }]}>
              {p.tier.toUpperCase()}
            </Text>
          </View>
          {p.claimed && (
            <View style={styles.claimedPill}>
              <Ionicons name="checkmark" size={11} color={SIGNAL_POSITIVE} />
              <Text style={styles.claimedText}>CLAIMED</Text>
            </View>
          )}
        </View>
        <Text style={styles.perkTitle}>{p.title}</Text>
        <Text style={styles.perkAthlete}>{p.athlete}</Text>
        <Text style={styles.perkDesc}>{p.description}</Text>
        {!p.claimed && (
          <View style={styles.claimBtn}>
            <Ionicons name="diamond-outline" size={13} color={TEXT_PRIMARY} />
            <Text style={styles.claimBtnText}>Claim</Text>
            <Text style={styles.claimBtnCost}>{p.tier} perk</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CANVAS },

  // Top fade behind the status bar — kept (still rendered in FanView).
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 99 },

  scrollContent: { paddingHorizontal: SP_LG, paddingTop: SP_XS },

  kicker: {
    fontSize: TEXT.caption,
    color: TEXT_TERTIARY,
    letterSpacing: 0.8,
    fontWeight: WEIGHT.bold,
    marginBottom: SP_SM,
    marginTop: 14,
  },

  // Pick'em
  fanScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SP_LG,
    borderRadius: RADIUS_LG,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
    backgroundColor: SURFACE,
    overflow: 'hidden',
    marginBottom: 14,
  },
  fanScoreLabel: { fontSize: TEXT.caption, color: PURPLE, letterSpacing: 0.8, fontWeight: WEIGHT.bold },
  fanScoreValue: { color: TEXT_PRIMARY, fontSize: 32, fontWeight: WEIGHT.bold, marginTop: SP_XS },
  fanScoreMeta: { fontSize: TEXT.caption, color: TEXT_SECONDARY, marginTop: SP_XS },
  fanScoreRight: { alignItems: 'center' },
  accuracyValue: { color: PURPLE, fontSize: 26, fontWeight: WEIGHT.bold },
  accuracyLabel: {
    fontSize: TEXT.caption,
    color: TEXT_TERTIARY,
    letterSpacing: 0.5,
    marginTop: 2,
    fontWeight: WEIGHT.semibold,
  },

  predCard: {
    padding: 14,
    borderRadius: RADIUS_CARD,
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: SURFACE,
    marginBottom: SP_SM,
  },
  predHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SP_SM,
  },
  predLabel: { flex: 1, color: TEXT_PRIMARY, fontSize: TEXT.body, fontWeight: WEIGHT.bold },
  potPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_XS,
    paddingHorizontal: SP_SM,
    paddingVertical: 3,
    borderRadius: RADIUS_SM,
    backgroundColor: `${ACCENT}1F`,
    borderWidth: 1,
    borderColor: `${ACCENT}4D`,
  },
  potText: { color: ACCENT, fontSize: TEXT.caption, fontWeight: WEIGHT.bold },
  predDeadline: {
    fontSize: TEXT.caption,
    color: TEXT_TERTIARY,
    marginTop: SP_XS,
    marginBottom: SP_SM,
  },
  predOpts: { gap: 6 },
  predOpt: {
    borderRadius: RADIUS_SM,
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: SURFACE_SUBTLE,
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
    paddingHorizontal: SP_MD,
    paddingVertical: SP_SM,
  },
  predOptText: {
    color: TEXT_SECONDARY,
    fontSize: TEXT.label,
    fontWeight: WEIGHT.semibold,
  },
  predOptTextSelected: { color: TEXT_PRIMARY, fontWeight: WEIGHT.bold },
  predOptPct: {
    color: TEXT_SECONDARY,
    fontSize: TEXT.label,
    fontWeight: WEIGHT.bold,
    fontVariant: ['tabular-nums'],
  },
  predMyPick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_XS,
    paddingHorizontal: SP_SM,
    paddingBottom: SP_SM,
  },
  predMyPickText: {
    fontSize: 9.5,
    color: PURPLE,
    fontWeight: WEIGHT.bold,
    letterSpacing: 0.5,
  },

  // Perks
  tierCard: {
    padding: SP_LG,
    borderRadius: RADIUS_LG,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
    backgroundColor: SURFACE,
    overflow: 'hidden',
    marginBottom: SP_SM,
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
    borderRadius: RADIUS_CARD,
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierCurrent: { color: TEXT_PRIMARY, fontSize: TEXT.title, fontWeight: WEIGHT.bold },
  tierPoints: { color: TEXT_SECONDARY, fontSize: TEXT.caption, marginTop: 2 },
  tierToNext: {
    color: PURPLE,
    fontSize: TEXT.caption,
    fontWeight: WEIGHT.bold,
    textAlign: 'right',
  },
  tierTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: SURFACE_SUBTLE,
    overflow: 'hidden',
  },
  tierFill: { height: 6, borderRadius: 3, backgroundColor: PURPLE },

  perkCard: {
    flexDirection: 'row',
    gap: SP_MD,
    padding: 14,
    borderRadius: RADIUS_CARD,
    borderWidth: 1,
    borderColor: HAIRLINE,
    backgroundColor: SURFACE,
    marginBottom: SP_SM,
  },
  perkIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS_CARD,
    backgroundColor: `${ACCENT}1F`,
    borderWidth: 1,
    borderColor: `${ACCENT}4D`,
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
  perkTierText: { fontSize: 9, fontWeight: WEIGHT.bold, letterSpacing: 0.5 },
  claimedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP_XS,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: `${SIGNAL_POSITIVE}1F`,
    borderWidth: 1,
    borderColor: `${SIGNAL_POSITIVE}4D`,
  },
  claimedText: { color: SIGNAL_POSITIVE, fontSize: 9, fontWeight: WEIGHT.bold, letterSpacing: 0.5 },
  perkTitle: { color: TEXT_PRIMARY, fontSize: TEXT.body, fontWeight: WEIGHT.bold },
  perkAthlete: { color: TEXT_TERTIARY, fontSize: TEXT.caption, marginTop: 3 },
  perkDesc: { color: TEXT_TERTIARY, fontSize: TEXT.caption, marginTop: SP_XS, lineHeight: 16 },

  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SP_SM,
    paddingHorizontal: SP_MD,
    paddingVertical: 9,
    borderRadius: RADIUS_SM,
    backgroundColor: 'rgba(168,85,247,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.4)',
  },
  claimBtnDisabled: {
    backgroundColor: SURFACE_SUBTLE,
    borderColor: HAIRLINE,
  },
  claimBtnText: { flex: 1, color: TEXT_PRIMARY, fontSize: TEXT.label, fontWeight: WEIGHT.bold },
  claimBtnCost: { color: TEXT_PRIMARY, fontSize: TEXT.label, fontWeight: WEIGHT.bold },

  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
});
