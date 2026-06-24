// Card detail — rich content page for a single home masonry tile.
// Receives: id, caption, subtitle, sectionId (all strings from search params).
// Shows: hero media, title, subtitle, context paragraph, stats/meta row,
//        2-3 related rows, and a contextual primary CTA.

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as React from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AbstractArt } from '@/components/fan/abstract-art';
import { AthleteDetailSheet } from '@/components/athlete/athlete-detail-sheet';
import { getBrandDealDetail } from '@/lib/data/mock-brand-data';
import { TILE_MEDIA_STORAGE_KEY, tileSlot, type TileLocalMedia } from '@/lib/home/tiles';
import { healLocalMediaUri } from '@/lib/media/local-media';
import { resolveSlotMedia } from '@/lib/media/resolve-media';
import {
  CANVAS, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY,
  SURFACE, SURFACE_SUBTLE, HAIRLINE, HAIRLINE_SUBTLE,
  RADIUS_SM, RADIUS_CARD, RADIUS_LG, RADIUS_PILL,
  ACCENT, SP_XS, SP_SM, SP_MD, SP_LG,
} from '@/components/shared/ui-kit/tokens';

const SCREEN_W = Dimensions.get('window').width;
const HERO_H = Math.round(SCREEN_W * 1.05);
const COPPER = '#EB621A';

// ─────────────────────────────────────────────────────────────────────────────
// Hero video
// ─────────────────────────────────────────────────────────────────────────────

function HeroVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  React.useEffect(() => {
    try { player.play(); } catch {}
    const sub = player.addListener('playingChange', (e: any) => {
      if (!e?.isPlaying) { try { player.play(); } catch {} }
    });
    return () => { try { sub.remove(); } catch {} };
  }, [player, uri]);
  return (
    <VideoView
      player={player}
      style={{ width: SCREEN_W, height: HERO_H }}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card-variant content derivation
// ─────────────────────────────────────────────────────────────────────────────

type CardKind = 'matchup' | 'deal' | 'player' | 'hub' | 'generic';

type CardContent = {
  kind: CardKind;
  title: string;
  subtitle: string;
  context: string;
  metaRows: { label: string; value: string }[];
  related: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string; route?: string }[];
  ctaLabel: string;
  ctaSectionId: string | null;
  /** When set, the primary CTA + (for routed rows) navigation pushes this
   *  pathname with { id: tileId } instead of opening the section. */
  ctaRoute?: string;
};

/** Slugify a display name into a roster-id candidate (e.g. "Cooper Flagg" →
 *  "cooper-flagg"). Used to bridge a player/award card into the shared
 *  AthleteDetailSheet; the sheet degrades gracefully when the slug doesn't
 *  resolve a demo-roster fixture. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Parse the tileId and params to derive richer content without needing the
 *  full SECTIONS array at runtime (keeps this file self-contained). */
function deriveContent(
  tileId: string,
  caption: string,
  subtitle: string,
  sectionId: string,
  dealId?: string,
): CardContent {
  const isHub = tileId.endsWith(':hub');

  // Deal cards
  if (sectionId === 'nil' && !isHub) {
    // caption = "Athlete × Brand", subtitle = "NIL Deal · $X · duration"
    const parts = caption.split(' × ');
    const athlete = parts[0] ?? caption;
    const brand = parts[1] ?? '';
    const subParts = subtitle.split(' · ');
    const value = subParts[1] ?? '';
    const duration = subParts[2] ?? '';
    // When the tile is bridged to a real Brand HQ deal packet, route the
    // primary CTA + the valuation/deal rows into the live deal-detail page
    // (`/deal/[id]`) instead of falling through to `/section/nil`. `__id`
    // overrides the default tileId so `pushRoute` targets the real deal.
    const dealRoute = dealId
      ? `/deal/[id]?role=athlete&__id=${dealId}`
      : undefined;
    // Derive the status + narrative from the SAME packet the tile routes to,
    // so the card detail never claims a deal is "closed/executed" when the
    // deal-detail page still shows Negotiate / Sent / Draft. Falls back to a
    // stage-neutral line when the tile isn't bridged to a real packet.
    const packet = dealId ? getBrandDealDetail(dealId) : undefined;
    const stageLabel = packet?.stage.label ?? null;
    const stageDescription = packet?.stage.description ?? null;
    const statusValue = stageLabel
      ? `${stageLabel} · on Proslync`
      : 'On Proslync';
    const context = stageDescription
      ? `${athlete} × ${brand} — a ${duration} NIL partnership valued at ${value}. ${stageDescription} Track terms, money split, and compliance in the full deal packet on Proslync.`
      : `${athlete} and ${brand} are working a ${duration} NIL partnership valued at ${value}. The deal covers merchandise, social media activations, and branded content on the Proslync marketplace.`;
    return {
      kind: 'deal',
      title: caption,
      subtitle: `NIL Deal · ${value}`,
      context,
      metaRows: [
        { label: 'Athlete', value: athlete },
        { label: 'Brand', value: brand },
        { label: 'Value', value: value },
        { label: 'Term', value: duration },
        { label: 'Status', value: statusValue },
      ],
      related: [
        { icon: 'trending-up-outline', title: 'NIL Valuation', sub: `${athlete}'s market rate vs peers`, route: dealRoute },
        { icon: 'briefcase-outline', title: `More from ${brand}`, sub: 'Other college partnerships' },
        { icon: 'people-outline', title: 'Full deal packet', sub: 'Terms, money split, compliance', route: dealRoute },
      ],
      ctaLabel: 'View full deal',
      ctaSectionId: 'nil',
      ctaRoute: dealRoute,
    };
  }

  // Matchup cards — sectionId is ncaab, nba, mlb, nhl, wnba
  if (['ncaab', 'nba', 'mlb', 'nhl', 'wnba'].includes(sectionId) && !isHub) {
    // caption = "AWAY @ HOME", subtitle = "Section · StatusLabel · Venue"
    const subParts = subtitle.split(' · ');
    const league = subParts[0] ?? sectionId.toUpperCase();
    const status = subParts[1] ?? '';
    const venue = subParts[2] ?? '';
    const leagueLabel =
      sectionId === 'ncaab' ? 'NCAA Basketball' :
      sectionId === 'nba' ? 'NBA' :
      sectionId === 'mlb' ? 'MLB' :
      sectionId === 'nhl' ? 'NHL' :
      sectionId === 'wnba' ? 'WNBA' : league;
    const isLive = status.includes('LIVE');
    const isFinal = status.toLowerCase().includes('final');
    const contextLine = isLive
      ? `${caption} is in progress right now at ${venue || 'the arena'}. ${status}. Fans following this matchup on Proslync are streaming the live feed — track every play, stat update, and highlight in real time.`
      : isFinal
        ? `${caption} is in the books. Final score above. Catch the full box score, top plays, and post-game analysis in the ${leagueLabel} section.`
        : `${caption} tips off ${status}${venue ? ' at ' + venue : ''}. Set a reminder, track player stats, and join thousands of fans watching on Proslync.`;
    return {
      kind: 'matchup',
      title: caption,
      subtitle: `${leagueLabel} · ${status}`,
      context: contextLine,
      metaRows: [
        { label: 'League', value: leagueLabel },
        { label: 'Status', value: status },
        ...(venue ? [{ label: 'Venue', value: venue }] : []),
      ],
      // Single door into the game page — Box Score / Highlights / Schedule are
      // tabs you switch between in-place once inside (no repetition on the card).
      related: [],
      ctaLabel: 'View game',
      ctaSectionId: sectionId,
      ctaRoute: '/game/[id]?tab=box-score',
    };
  }

  // Player / Award cards
  if (['awards', 'portal'].includes(sectionId) && !isHub) {
    // caption = athlete name, subtitle = "Section · pill · Team"
    const subParts = subtitle.split(' · ');
    const category = subParts[1] ?? '';
    const team = subParts[2] ?? '';
    const sportLabel = sectionId === 'portal' ? 'Transfer Portal' : 'Award Watch';
    const contextLine = sectionId === 'portal'
      ? `${caption} has entered the transfer portal${team ? `, departing ${team.split(' → ')[0]}` : ''}. ${category ? category + ' prospect. ' : ''}Track their recruitment in real time — visit, offer, and commitment updates live on Proslync.`
      : `${caption}${team ? ' (' + team + ')' : ''} is a top contender in the ${category || 'award'} race this season. Track the leaderboard, compare stats, and follow every week's voting update in the Award Watch section.`;
    return {
      kind: 'player',
      title: caption,
      subtitle: `${sportLabel}${team ? ' · ' + team : ''}`,
      context: contextLine,
      metaRows: [
        ...(team ? [{ label: 'School', value: team }] : []),
        ...(category ? [{ label: 'Category', value: category }] : []),
        { label: 'Section', value: sportLabel },
      ],
      related: [
        { icon: 'person-outline', title: `${caption}'s Profile`, sub: 'Stats, NIL, highlights' },
        { icon: 'trophy-outline', title: 'Award Leaderboard', sub: 'Full rankings this week' },
        { icon: 'trending-up-outline', title: 'NIL Valuation', sub: 'Market rate + deal history' },
      ],
      ctaLabel: 'View Award Watch',
      ctaSectionId: sectionId,
    };
  }

  // Hub tiles (one per section)
  if (isHub) {
    const leagueLabel = caption;
    return {
      kind: 'hub',
      title: leagueLabel,
      subtitle: subtitle,
      context: `${leagueLabel} — follow every live game, final score, and standings update in one place. Tap "Open section" to see the full card feed with live matchups, player spotlights, and NIL activity.`,
      metaRows: [
        { label: 'Section', value: leagueLabel },
        { label: 'Updates', value: subtitle },
      ],
      related: [
        { icon: 'notifications-outline', title: 'Follow Section', sub: 'Get alerts for new activity' },
        { icon: 'star-outline', title: 'Top Performers', sub: 'Best players this week' },
        { icon: 'calendar-outline', title: 'Schedule', sub: 'Upcoming games & events' },
      ],
      ctaLabel: 'Open section',
      ctaSectionId: sectionId === 'ncaab:hub' ? 'ncaab' : sectionId.replace(':hub', ''),
    };
  }

  // Generic fallback
  return {
    kind: 'generic',
    title: caption || 'Card',
    subtitle: subtitle,
    context: `Explore more about ${caption} — tap the button below to view the full section on Proslync.`,
    metaRows: [],
    related: [
      { icon: 'grid-outline', title: 'View Section', sub: 'Full card feed' },
    ],
    ctaLabel: 'Open section',
    ctaSectionId: sectionId || null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Related row component
// ─────────────────────────────────────────────────────────────────────────────

function RelatedRow({
  icon,
  title,
  sub,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={rStyles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={rStyles.iconWrap}>
        <Ionicons name={icon} size={18} color={TEXT_SECONDARY} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={rStyles.rowTitle}>{title}</Text>
        <Text style={rStyles.rowSub} numberOfLines={1}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={TEXT_TERTIARY} />
    </Pressable>
  );
}

const rStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: SP_MD,
    paddingHorizontal: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HAIRLINE_SUBTLE,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS_SM,
    backgroundColor: SURFACE_SUBTLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '700' },
  rowSub: { color: TEXT_TERTIARY, fontSize: 12, marginTop: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function CardDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, caption, subtitle, sectionId, dealId } = useLocalSearchParams<{
    id: string;
    caption?: string;
    subtitle?: string;
    sectionId?: string;
    dealId?: string;
  }>();
  const tileId = id ?? '';

  const content = React.useMemo(
    () => deriveContent(
      tileId,
      caption ?? '',
      subtitle ?? '',
      sectionId ?? '',
      dealId,
    ),
    [tileId, caption, subtitle, sectionId, dealId],
  );

  // Award AND portal cards both derive `kind: 'player'`, so both open the
  // shared, role-neutral AthleteDetailSheet from their "{name}'s Profile" row.
  // The sheet hydrates name/sport/school + reach via the demo-roster bridge
  // (slugified caption → roster entry → reachId). Charter-safe: it shows
  // public reach/updates only and never moves money in the demo.
  const [athleteSheet, setAthleteSheet] = React.useState(false);

  // Local user-uploaded media for this tile (healed), else curated, else art.
  const [local, setLocal] = React.useState<TileLocalMedia | null>(null);
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(TILE_MEDIA_STORAGE_KEY);
        if (cancelled || !raw) return;
        const map = JSON.parse(raw) as Record<string, TileLocalMedia>;
        const entry = map[tileId];
        if (!entry) return;
        const healed = await healLocalMediaUri(entry.uri);
        if (!cancelled && healed) setLocal({ uri: healed, type: entry.type });
      } catch {
        // ignore corrupt storage
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, [tileId]);

  const resolved = React.useMemo(
    () => resolveSlotMedia(tileSlot(tileId), local),
    [tileId, local],
  );

  let hero: React.ReactNode;
  if (resolved.kind !== 'none' && resolved.type === 'video') {
    hero = <HeroVideo uri={resolved.uri} />;
  } else if (resolved.kind === 'local' && resolved.type === 'image') {
    hero = (
      <Image
        source={{ uri: resolved.uri }}
        style={{ width: SCREEN_W, height: HERO_H }}
        resizeMode="cover"
      />
    );
  } else if (resolved.kind === 'curated-image') {
    hero = (
      <Image
        source={resolved.source as ImageSourcePropType}
        style={{ width: SCREEN_W, height: HERO_H }}
        resizeMode="cover"
      />
    );
  } else {
    hero = <AbstractArt seed={tileId} width={SCREEN_W} height={HERO_H} />;
  }

  // Wait one beat for hydration so a local video doesn't flash the art first.
  const showHero = hydrated || local !== null;

  // Routes may carry a `?tab=...` query (e.g. the single game page). Split it
  // off so we push the typed pathname with the tab as a navigation param.
  const pushRoute = React.useCallback(
    (route: string) => {
      const [pathname, query] = route.split('?');
      const params: Record<string, string> = { id: tileId };
      if (query) {
        for (const pair of query.split('&')) {
          const [k, v] = pair.split('=');
          if (!k || v === undefined) continue;
          // `__id` overrides the dynamic-route id (e.g. bridge a NIL tile to a
          // real deal id) without leaking the tileId into the target route.
          if (k === '__id') params.id = v;
          else params[k] = v;
        }
      }
      router.push({ pathname, params } as any);
    },
    [router, tileId],
  );

  const handleCta = React.useCallback(() => {
    if (content.ctaRoute) {
      pushRoute(content.ctaRoute);
      return;
    }
    if (content.ctaSectionId) {
      router.push({ pathname: '/section/[id]', params: { id: content.ctaSectionId } } as any);
    }
  }, [router, pushRoute, content.ctaRoute, content.ctaSectionId]);

  const goRelated = React.useCallback(
    (route?: string) => {
      if (route) {
        pushRoute(route);
        return;
      }
      handleCta();
    },
    [pushRoute, handleCta],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 56 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <View style={[styles.heroWrap, { height: HERO_H }]}>
          {showHero ? hero : <View style={{ width: SCREEN_W, height: HERO_H, backgroundColor: SURFACE }} />}
          {/* Bottom fade into the page */}
          <View style={styles.heroFade} pointerEvents="none" />
        </View>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <View style={styles.body}>
          {/* Title + subtitle */}
          <View style={styles.titleBlock}>
            {content.subtitle ? (
              <Text style={styles.eyebrow} numberOfLines={2}>{content.subtitle}</Text>
            ) : null}
            <Text style={styles.title}>{content.title}</Text>
          </View>

          {/* Context paragraph */}
          <Text style={styles.context}>{content.context}</Text>

          {/* Stats/meta row */}
          {content.metaRows.length > 0 && (
            <View style={styles.metaCard}>
              {content.metaRows.map((row, i) => (
                <React.Fragment key={row.label}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>{row.label}</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>{row.value}</Text>
                  </View>
                  {i < content.metaRows.length - 1 && (
                    <View style={styles.metaDivider} />
                  )}
                </React.Fragment>
              ))}
            </View>
          )}

          {/* Primary CTA */}
          {content.ctaSectionId && (
            <Pressable
              style={styles.cta}
              onPress={handleCta}
              accessibilityRole="button"
              accessibilityLabel={content.ctaLabel}
            >
              <View style={styles.ctaBar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaEyebrow}>GO TO</Text>
                <Text style={styles.ctaTitle}>{content.ctaLabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={TEXT_SECONDARY} />
            </Pressable>
          )}

          {/* Related rows */}
          {content.related.length > 0 && (
            <View style={styles.relatedBlock}>
              <Text style={styles.relatedHeader}>EXPLORE MORE</Text>
              <View style={styles.relatedCard}>
                {content.related.map((r) => {
                  // Player/award "{name}'s Profile" row → shared athlete sheet.
                  const isProfileRow =
                    content.kind === 'player' && r.title === `${caption ?? ''}'s Profile`;
                  return (
                    <RelatedRow
                      key={r.title}
                      icon={r.icon}
                      title={r.title}
                      sub={r.sub}
                      onPress={
                        isProfileRow
                          ? () => setAthleteSheet(true)
                          : r.route
                            ? () => goRelated(r.route)
                            : content.ctaSectionId
                              ? handleCta
                              : undefined
                      }
                    />
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating back button */}
      <Pressable
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={22} color="#FFF" />
      </Pressable>

      {/* Shared athlete sheet — opened from a player/award card's Profile row.
          `rosterId` slug bridges into the demo roster (which carries the
          `reachId` bridge); the sheet degrades gracefully when reach is
          absent. `sport`/`school` are derived from the card context so the
          sheet's identity line is always coherent even when the roster slug
          doesn't resolve. */}
      {content.kind === 'player' ? (
        <AthleteDetailSheet
          athlete={{
            id: tileId,
            name: caption ?? content.title,
            sport: sectionId === 'portal' ? 'Football' : 'College Athlete',
            school: (subtitle ?? '').split(' · ')[2] || undefined,
            rosterId: slugify(caption ?? content.title),
          }}
          visible={athleteSheet}
          onClose={() => setAthleteSheet(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CANVAS },
  heroWrap: { width: SCREEN_W, backgroundColor: SURFACE, overflow: 'hidden' },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: 'transparent',
  },
  body: { paddingHorizontal: SP_LG, paddingTop: SP_LG, gap: SP_LG },

  // Title block
  titleBlock: { gap: SP_XS },
  eyebrow: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: TEXT_PRIMARY,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 32,
  },

  // Context
  context: {
    color: TEXT_SECONDARY,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },

  // Meta card
  metaCard: {
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    borderRadius: RADIUS_CARD,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SP_MD,
    gap: 8,
  },
  metaLabel: {
    color: TEXT_TERTIARY,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 0,
  },
  metaValue: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  metaDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: HAIRLINE_SUBTLE,
  },

  // Primary CTA
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${ACCENT}1F`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${ACCENT}4D`,
    borderRadius: RADIUS_CARD,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  ctaBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
  ctaEyebrow: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ctaTitle: {
    color: TEXT_PRIMARY,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 2,
  },

  // Related
  relatedBlock: { gap: SP_SM },
  relatedHeader: {
    color: TEXT_TERTIARY,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  relatedCard: {
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    borderRadius: RADIUS_CARD,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },

  // Back button
  backBtn: {
    position: 'absolute',
    left: 14,
    width: 40,
    height: 40,
    borderRadius: RADIUS_PILL,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14,14,16,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
});
