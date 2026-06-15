// Shared helpers for home masonry tiles — used by the home grid and the
// card detail page so slot naming and storage stay in lockstep.

export const TILE_MEDIA_STORAGE_KEY = 'proslync:home:tileMedia:v1';

/** Filesystem/manifest-safe slot name for a tile id like "ncaab:ncaab-7". */
export function tileSlot(id: string): string {
  return `tile-${id.replace(/[^a-zA-Z0-9-]/g, '-')}`;
}

export type TileLocalMedia = { uri: string; type: 'image' | 'video' };

// ───── Card / section types (single source of truth) ─────
// Moved here from app/(tabs)/index.tsx so the home grid, the section "View all"
// page, and the card detail page all share one definition and one param builder.
// index.tsx re-exports these so existing imports keep working.

export type MatchupCard = {
  id: string;
  variant: 'matchup';
  status: 'LIVE' | 'FINAL' | 'PRE';
  statusLabel: string;
  away: { abbr: string; color: string; score?: number };
  home: { abbr: string; color: string; score?: number };
  meta?: string;
};

export type PlayerCard = {
  id: string;
  variant: 'player';
  topPill: string;
  topPillTone: 'gold' | 'orange' | 'teal' | 'neutral';
  name: string;
  team: string;
  stat: string;
  initial: string;
  color: string;
  usePhoto?: boolean;
};

export type DealCard = {
  id: string;
  variant: 'deal';
  value: string;
  athlete: string;
  athleteInitial: string;
  athleteColor: string;
  brand: string;
  brandColor: string;
  duration: string;
  /** Bridges this NIL tile to a real Brand HQ deal-detail packet (d-1…d-6). */
  dealId?: string;
};

export type AnyCard = MatchupCard | PlayerCard | DealCard;

export type Section = {
  id: string;
  title: string;
  subtitle: string;
  iconLabel: string;
  iconColor: string;
  accent: string;
  cards: AnyCard[];
  awardGroups?: { award: string; nominees: PlayerCard[] }[];
  bgImage?: any;
};

/** Params passed to /card/[id] for a real card tile. */
export type TileParams = {
  id: string;
  caption: string;
  subtitle: string;
  sectionId: string;
  dealId?: string;
};

// ───── Tile params: single source of truth for card → /card/[id] routing ─────
// Produces EXACTLY what the home feed builds inline, so a section card routes
// identically to the same card on the home feed (same id → same tile-media slot,
// same onward routing to /game/[id] or /deal/[id]).
export function tileParamsFromCard(
  card: AnyCard,
  section: { id: string; title: string; subtitle?: string },
): TileParams {
  const id = `${section.id}:${card.id}`;
  if (card.variant === 'matchup') {
    return {
      id,
      caption: `${card.away.abbr} @ ${card.home.abbr}`,
      subtitle: `${section.title} · ${card.statusLabel}${card.meta ? ' · ' + card.meta : ''}`,
      sectionId: section.id,
    };
  }
  if (card.variant === 'player') {
    return {
      id,
      caption: card.name,
      subtitle: card.topPill
        ? `${section.title} · ${card.topPill} · ${card.team}`
        : `${section.title} · ${card.team}`,
      sectionId: section.id,
    };
  }
  // deal
  return {
    id,
    caption: `${card.athlete} × ${card.brand}`,
    subtitle: `NIL Deal · ${card.value} · ${card.duration}`,
    sectionId: section.id,
    dealId: card.dealId,
  };
}
