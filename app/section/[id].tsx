// Full list of cards for one home-page section. Reached via "View all" on a
// section card. Renders matchup / player / deal cards in a vertical list.

import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlassView } from 'expo-glass-effect';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';

import {
  SECTIONS,
  VideoCover,
  type AnyCard,
  type MatchupCard,
  type PlayerCard,
  type DealCard,
} from '@/app/(tabs)/index';
import { healLocalMediaUri, type LocalMedia } from '@/lib/media/local-media';
import { resolveSlotMedia } from '@/lib/media/resolve-media';

type CoverMedia = LocalMedia;
const COVER_STORAGE_KEY = 'proslync:home:coverMedia:v2';
const LOGO_STORAGE_KEY = 'proslync:home:customLogos:v1';
const SCREEN_W = Dimensions.get('window').width;
const HERO_H = Math.round(SCREEN_W * 0.62);

const PAGE_OUTER_PAD = 16;
const GROUP_INNER_PAD = 12;
const CARD_GAP = 10;
const PAGE_W = SCREEN_W - PAGE_OUTER_PAD * 2 - GROUP_INNER_PAD * 2;
const PAGE_CARD_W = (PAGE_W - CARD_GAP) / 2;
const PAGE_CARD_H = Math.round(PAGE_CARD_W / 1.3);
const CARDS_PER_PAGE = 2;
const PAGE_H = PAGE_CARD_H;

const ACCENT = '#FF6F3C';

function statusPillTone(card: AnyCard): { bg: string; fg: string } {
  if (card.variant === 'matchup') {
    if (card.status === 'LIVE') return { bg: 'rgba(239,68,68,0.15)', fg: '#FF4444' };
    if (card.status === 'PRE') return { bg: 'rgba(255,255,255,0.08)', fg: 'rgba(255,255,255,0.85)' };
    return { bg: 'rgba(255,255,255,0.06)', fg: 'rgba(255,255,255,0.55)' };
  }
  if (card.variant === 'player') {
    if (card.topPillTone === 'gold') return { bg: 'rgba(255,214,10,0.18)', fg: '#FFD60A' };
    if (card.topPillTone === 'orange') return { bg: 'rgba(255,111,60,0.18)', fg: '#FF6F3C' };
    if (card.topPillTone === 'teal') return { bg: 'rgba(20,184,166,0.18)', fg: '#14B8A6' };
    return { bg: 'rgba(255,255,255,0.08)', fg: '#FFF' };
  }
  return { bg: 'rgba(20,184,166,0.18)', fg: '#14B8A6' };
}

export default function SectionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const section = SECTIONS.find((s) => s.id === id);
  const [cover, setCover] = React.useState<CoverMedia | null>(null);
  const [customLogo, setCustomLogo] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      AsyncStorage.getItem(COVER_STORAGE_KEY),
      AsyncStorage.getItem(LOGO_STORAGE_KEY),
    ])
      .then(async ([coversRaw, logosRaw]) => {
        if (cancelled || !id) return;
        if (coversRaw) {
          try {
            const map = JSON.parse(coversRaw) as Record<string, CoverMedia>;
            const entry = map[id];
            if (entry) {
              const healed = await healLocalMediaUri(entry.uri);
              if (healed && !cancelled) setCover(healed !== entry.uri ? { ...entry, uri: healed } : entry);
            }
          } catch {}
        }
        if (logosRaw) {
          try {
            const map = JSON.parse(logosRaw) as Record<string, string>;
            const uri = map[id];
            if (uri) {
              const healed = await healLocalMediaUri(uri);
              if (healed && !cancelled) setCustomLogo(healed);
            }
          } catch {}
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  const resolvedCover = React.useMemo(
    () => resolveSlotMedia(`cover-${id}`, cover),
    [id, cover],
  );
  const coverVideoUri =
    resolvedCover.kind !== 'none' && resolvedCover.type === 'video' ? resolvedCover.uri : null;
  const bgSource =
    resolvedCover.kind === 'local' && resolvedCover.type === 'image'
      ? { uri: resolvedCover.uri }
      : resolvedCover.kind === 'curated-image'
        ? resolvedCover.source
        : null; // null for curated-video (VideoCover renders it) and for local videos;
              // 'none' falls back to the iconColor tint default below.

  const resolvedLogo = React.useMemo(
    () => resolveSlotMedia(`logo-${id}`, customLogo ? { uri: customLogo, type: 'image' } : null),
    [id, customLogo],
  );
  const logoSource =
    resolvedLogo.kind === 'local'
      ? { uri: resolvedLogo.uri }
      : resolvedLogo.kind === 'curated-image'
        ? resolvedLogo.source
        : null;

  if (!section) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60, paddingHorizontal: 16 }]}>
        <Text style={styles.notFound}>Section not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.notFoundBtn}>
          <Text style={styles.notFoundBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // Group cards. Awards section has explicit per-award groups; matchup
  // sections group by status; everything else is one flat group.
  const groups = React.useMemo(() => {
    if (section.awardGroups && section.awardGroups.length) {
      return section.awardGroups.map((g) => ({
        label: g.award,
        cards: g.nominees as AnyCard[],
      }));
    }
    if (section.cards.length === 0 || section.cards[0].variant !== 'matchup') {
      return [{ label: '', cards: section.cards }];
    }
    const live: AnyCard[] = [];
    const upcoming: AnyCard[] = [];
    const final: AnyCard[] = [];
    for (const c of section.cards) {
      if (c.variant !== 'matchup') continue;
      if (c.status === 'LIVE') live.push(c);
      else if (c.status === 'PRE') upcoming.push(c);
      else final.push(c);
    }
    const out: { label: string; cards: AnyCard[] }[] = [];
    if (live.length) out.push({ label: `Live · ${live.length}`, cards: live });
    if (upcoming.length) out.push({ label: `Upcoming · ${upcoming.length}`, cards: upcoming });
    if (final.length) out.push({ label: `Final · ${final.length}`, cards: final });
    return out;
  }, [section]);

  const heroH = HERO_H + insets.top;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — cover photo/video that fades into the page bg */}
        <View style={[styles.hero, { height: heroH }]}>
          {coverVideoUri ? (
            <VideoCover uri={coverVideoUri} style={StyleSheet.absoluteFill} />
          ) : bgSource ? (
            <Image source={bgSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: section.iconColor + '26' }]} />
          )}
          {/* Subtle overall tint */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.18)' }]} pointerEvents="none" />
          {/* Bottom fade into the page bg */}
          <LinearGradient
            colors={[
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0.05)',
              'rgba(0,0,0,0.18)',
              'rgba(0,0,0,0.42)',
              'rgba(0,0,0,0.70)',
              'rgba(0,0,0,0.92)',
              '#000',
            ]}
            locations={[0, 0.32, 0.5, 0.66, 0.8, 0.92, 1]}
            style={[StyleSheet.absoluteFill, { top: '40%' }]}
            pointerEvents="none"
          />
          {/* Bottom-anchored title overlay */}
          <View style={[styles.heroFooter, { paddingHorizontal: 16, paddingBottom: 16 }]}>
            <View
              style={[
                styles.headerIcon,
                logoSource
                  ? { backgroundColor: '#000', borderColor: 'rgba(255,255,255,0.18)' }
                  : { backgroundColor: `${section.iconColor}26`, borderColor: `${section.iconColor}55` },
              ]}
            >
              {logoSource ? (
                <Image source={logoSource} style={styles.headerIconImage} />
              ) : (
                <Text style={styles.headerIconText}>{section.iconLabel}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{section.title}</Text>
              <Text style={styles.headerSub}>{section.subtitle}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentArea}>
        {groups.map((group, gi) => {
          const pages: AnyCard[][] = [];
          for (let i = 0; i < group.cards.length; i += CARDS_PER_PAGE) {
            pages.push(group.cards.slice(i, i + CARDS_PER_PAGE));
          }
          return (
            <Animated.View
              key={gi}
              style={styles.groupContainer}
              entering={FadeInDown.delay(60 + gi * 60).duration(280)}
            >
              {group.label !== '' && (
                <Text style={styles.groupLabel}>{group.label.toUpperCase()}</Text>
              )}
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                style={{ width: PAGE_W, height: PAGE_H }}
              >
                {pages.map((page, pi) => (
                  <View
                    key={pi}
                    style={{
                      width: PAGE_W,
                      height: PAGE_H,
                      flexDirection: 'row',
                      gap: CARD_GAP,
                    }}
                  >
                    <View style={{ width: PAGE_CARD_W, height: PAGE_CARD_H }}>
                      <FullCard card={page[0]} />
                    </View>
                    <View style={{ width: PAGE_CARD_W, height: PAGE_CARD_H }}>
                      {page[1] && <FullCard card={page[1]} />}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </Animated.View>
          );
        })}
        </View>
      </ScrollView>

      {/* Floating back chevron */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backBtn, { bottom: insets.bottom + 20 }]}
        accessibilityLabel="Back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}

function FullCard({ card }: { card: AnyCard }) {
  const tone = statusPillTone(card);
  const topPillText =
    card.variant === 'player' ? card.topPill :
    card.variant === 'deal' ? card.value :
    null;

  return (
    <View style={styles.card}>
      <GlassView
        glassEffectStyle="clear"
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />
      {isLiquidGlassSupported && (
        <LiquidGlassView
          effect="clear"
          tintColor="rgba(255,255,255,0.04)"
          style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        />
      )}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 16 }]}
        pointerEvents="none"
      />
      <View style={styles.cardInner}>
        {topPillText !== null && (
          <View style={[styles.topPill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.topPillText, { color: tone.fg }]} numberOfLines={1}>{topPillText}</Text>
          </View>
        )}

        {card.variant === 'matchup' && <MatchupBody card={card} />}
        {card.variant === 'player' && <PlayerBody card={card} />}
        {card.variant === 'deal' && <DealBody card={card} />}
      </View>
    </View>
  );
}

function MatchupBody({ card }: { card: MatchupCard }) {
  const awayWin = card.status === 'FINAL' && (card.away.score ?? 0) > (card.home.score ?? 0);
  const homeWin = card.status === 'FINAL' && (card.home.score ?? 0) > (card.away.score ?? 0);
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.teamRow}>
        <View style={[styles.teamLogo, { backgroundColor: card.away.color }]}>
          <Text style={styles.teamLogoText}>{card.away.abbr.charAt(0)}</Text>
        </View>
        <Text style={styles.teamAbbr} numberOfLines={1}>{card.away.abbr}</Text>
        <Text style={[styles.teamScore, !awayWin && card.status === 'FINAL' && styles.teamScoreDim]}>
          {card.away.score ?? '—'}
        </Text>
      </View>
      <View style={[styles.teamRow, { marginTop: 6 }]}>
        <View style={[styles.teamLogo, { backgroundColor: card.home.color }]}>
          <Text style={styles.teamLogoText}>{card.home.abbr.charAt(0)}</Text>
        </View>
        <Text style={styles.teamAbbr} numberOfLines={1}>{card.home.abbr}</Text>
        <Text style={[styles.teamScore, !homeWin && card.status === 'FINAL' && styles.teamScoreDim]}>
          {card.home.score ?? '—'}
        </Text>
      </View>
      <View style={{ marginTop: 16 }}>
        {card.meta && <Text style={styles.meta} numberOfLines={1}>{card.meta}</Text>}
        <Text style={styles.metaStatus} numberOfLines={1}>{card.statusLabel}</Text>
      </View>
    </View>
  );
}

function PlayerBody({ card }: { card: PlayerCard }) {
  return (
    <View style={styles.playerBody}>
      {card.usePhoto ? (
        <Image source={require('@/assets/images/kiyan-avatar.png')} style={styles.playerAvatar} />
      ) : (
        <View style={[styles.playerAvatar, { backgroundColor: card.color, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={styles.playerInitial}>{card.initial}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.playerName}>{card.name}</Text>
        <Text style={styles.playerTeam}>{card.team}</Text>
        <Text style={styles.playerStat}>{card.stat}</Text>
      </View>
    </View>
  );
}

function DealBody({ card }: { card: DealCard }) {
  return (
    <View style={styles.dealBody}>
      <View style={styles.dealLogos}>
        <View style={[styles.dealLogoCircle, { backgroundColor: card.athleteColor }]}>
          <Text style={styles.dealLogoText}>{card.athleteInitial}</Text>
        </View>
        <Text style={styles.dealCross}>×</Text>
        <View style={[styles.dealLogoCircle, { backgroundColor: card.brandColor }]}>
          <Text style={styles.dealLogoText}>{card.brand.charAt(0)}</Text>
        </View>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.dealAthlete}>{card.athlete}</Text>
        <Text style={styles.dealBrand}>× {card.brand}</Text>
        <Text style={styles.dealDuration}>{card.duration}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { paddingHorizontal: 16, gap: 8 },
  hero: {
    width: '100%',
    backgroundColor: '#0F1012',
    overflow: 'hidden',
    position: 'relative',
  },
  heroFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contentArea: { paddingHorizontal: 16, marginTop: 12 },
  notFound: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 16 },
  notFoundBtn: { backgroundColor: ACCENT, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start' },
  notFoundBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  headerIconText: { fontSize: 20 },
  headerIconImage: { width: '100%', height: '100%' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', letterSpacing: -0.4 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  countPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  countPillText: { color: '#FFF', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },

  groupContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.4,
    color: '#FFF',
    marginBottom: 10, paddingHorizontal: 2,
  },

  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  cardInner: {
    flex: 1,
    padding: 12,
  },
  topPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  topPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF4444' },

  // Matchup
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamLogo: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  teamLogoText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  teamAbbr: { color: '#FFF', fontSize: 13, fontWeight: '700', flex: 1 },
  teamScore: { color: '#FFF', fontSize: 18, fontWeight: '900', fontVariant: ['tabular-nums'] },
  teamScoreDim: { color: 'rgba(255,255,255,0.45)' },
  meta: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  metaStatus: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700', marginTop: 2 },

  // Player
  playerBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  playerAvatar: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  playerInitial: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  playerName: { color: '#FFF', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  playerTeam: { color: 'rgba(255,255,255,0.55)', fontSize: 10, textAlign: 'center' },
  playerStat: { color: 'rgba(255,255,255,0.85)', fontSize: 10, textAlign: 'center', marginTop: 2 },

  // Deal
  dealBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  dealLogos: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dealLogoCircle: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)',
  },
  dealLogoText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  dealCross: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '700' },
  dealAthlete: { color: '#FFF', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  dealBrand: { color: 'rgba(255,255,255,0.6)', fontSize: 10, textAlign: 'center' },
  dealDuration: { color: 'rgba(255,255,255,0.45)', fontSize: 9, letterSpacing: 0.3, textAlign: 'center' },

  backBtn: {
    position: 'absolute', left: 14,
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
});
