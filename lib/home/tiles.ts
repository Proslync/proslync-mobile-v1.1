// Shared helpers for home masonry tiles — used by the home grid and the
// card detail page so slot naming and storage stay in lockstep.

export const TILE_MEDIA_STORAGE_KEY = 'proslync:home:tileMedia:v1';

/** Filesystem/manifest-safe slot name for a tile id like "ncaab:ncaab-7". */
export function tileSlot(id: string): string {
  return `tile-${id.replace(/[^a-zA-Z0-9-]/g, '-')}`;
}

export type TileLocalMedia = { uri: string; type: 'image' | 'video' };
