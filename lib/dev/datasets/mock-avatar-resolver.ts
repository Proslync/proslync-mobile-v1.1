import * as mockRegistry from "../mock-registry";
import { LOCAL_AVATAR_BY_ID } from "./local-avatars";
import { ATHLETE_CATALOG } from "./athlete-catalog";
import { BRAND_CATALOG } from "./brand-catalog";
import { SCHOOL_CATALOG } from "./school-catalog";
import { schoolAssetId } from "./visual-assets";

/**
 * Single source of truth for resolving an avatar across every mock surface
 * (search sheet, messages chat list, chat screen). Returns the same shape
 * the `EntityAvatar` component consumes so the same person/brand renders
 * identically in every place.
 *
 * Resolution order, mirroring `EntityAvatar`'s own priority:
 *   1. visual-assets SVG registry  (via `entityId`)
 *   2. local require()'d PNG       (via `localSource`)
 *   3. initials chip               (via `initials` + `color`)
 */
export interface MockAvatarProps {
  entityId?: string;
  localSource?: any;
  initials: string;
  color: string;
}

const NEUTRAL = "#6B656B";
const CUSE_ORANGE = "#F76900";
const DUKE_BLUE = "#001A57";
const PROSLYNC_COPPER = "#EB621A";

/**
 * Hand-curated overrides for known mock identifiers — chat channel IDs,
 * mock-suggestion userNames, ad-hoc IDs that are not in any catalog.
 * Catalog-driven entities (athletes/brands/schools) resolve from their
 * catalogs automatically — only list outliers here.
 */
const HINTS: Record<string, MockAvatarProps> = {
  // Chat channel IDs (lib/data/mock-chats.ts)
  "mock-agent-rich":      { initials: "RP", color: NEUTRAL },
  "mock-agent-marketing": { initials: "MK", color: "#3B82F6" },
  "mock-deal-desk":       { initials: "PS", color: PROSLYNC_COPPER },
  "mock-jordan":          { entityId: "brand-jordan",      initials: "J",  color: "#111111" },
  "mock-puma":            { entityId: "brand-puma",        initials: "P",  color: "#111111" },
  "mock-celsius":         { initials: "C",  color: "#1E9E5C" },
  "mock-beats":           { entityId: "brand-beats",       initials: "B",  color: "#E03D24" },
  "mock-cuse-gc":         { entityId: "school-syracuse",   initials: "S",  color: CUSE_ORANGE },
  "mock-jj":              { entityId: "at-starling",       initials: "JS", color: CUSE_ORANGE },
  "mock-donnie":          { entityId: "at-freeman",        initials: "DF", color: CUSE_ORANGE },
  "mock-naithan":         { initials: "NG", color: CUSE_ORANGE },
  "mock-lucas":           { initials: "LT", color: CUSE_ORANGE },

  // Search-sheet mock suggestion userNames
  coopflagg:    { entityId: "at-flagg",    initials: "CF", color: DUKE_BLUE },
  richpaul:     { initials: "RP", color: NEUTRAL },
  jj_starling:  { entityId: "at-starling", initials: "JS", color: CUSE_ORANGE },
  dylanharper:  { initials: "DH", color: "#001A57" },
  acebailey:    { initials: "AB", color: CUSE_ORANGE },
  donniefreeman:{ entityId: "at-freeman",  initials: "DF", color: CUSE_ORANGE },
  naithangeorge:{ initials: "NG", color: CUSE_ORANGE },

  // Chat-message sender userIds (lib/data/mock-chats.ts → ChatMessage.userId)
  rp:     { initials: "RP", color: NEUTRAL },
  mk:     { initials: "MK", color: "#3B82F6" },
  desk:   { initials: "PS", color: PROSLYNC_COPPER },
  jb:     { entityId: "brand-jordan",    initials: "J",  color: "#111111" },
  tosan:  { entityId: "brand-puma",      initials: "P",  color: "#111111" },
  cs:     { initials: "C",  color: "#1E9E5C" },
  beats:  { entityId: "brand-beats",     initials: "B",  color: "#E03D24" },
  autry:  { initials: "CA", color: CUSE_ORANGE },
  jj:     { entityId: "at-starling",     initials: "JS", color: CUSE_ORANGE },
  donnie: { entityId: "at-freeman",      initials: "DF", color: CUSE_ORANGE },
  ng:     { initials: "NG", color: CUSE_ORANGE },
  lt:     { initials: "LT", color: CUSE_ORANGE },
};

const ATHLETE_BY_HANDLE = new Map(
  ATHLETE_CATALOG.map((a) => [a.handle.replace(/^@/, "").toLowerCase(), a]),
);
const BRAND_BY_HANDLE = new Map(
  BRAND_CATALOG.map((b) => [b.handle.replace(/^@/, "").toLowerCase(), b]),
);
const ATHLETE_BY_ID = new Map(ATHLETE_CATALOG.map((a) => [a.id, a]));

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Resolve avatar props for any mock identifier — channel id, catalog id,
 * userName, or arbitrary display name. Layers in this order: HINTS overrides
 * first, then the three catalogs, then a derived initials chip as fallback.
 *
 * Pass `displayName` so we can compute initials when nothing matches.
 */
export function resolveMockAvatar(
  id: string | null | undefined,
  displayName?: string | null,
): MockAvatarProps {
  const key = (id ?? "").toLowerCase();
  const hint = HINTS[id ?? ""] ?? HINTS[key];
  const localSource = id ? LOCAL_AVATAR_BY_ID[id] : undefined;

  if (hint) {
    return { ...hint, localSource: localSource ?? hint.localSource };
  }

  // Catalog lookups
  if (id && ATHLETE_BY_ID.has(id)) {
    const a = ATHLETE_BY_ID.get(id)!;
    return { entityId: a.id, localSource, initials: a.initials, color: a.color };
  }
  const athleteByHandle = id ? ATHLETE_BY_HANDLE.get(key) : undefined;
  if (athleteByHandle) {
    return {
      entityId: athleteByHandle.id,
      localSource: LOCAL_AVATAR_BY_ID[athleteByHandle.id],
      initials: athleteByHandle.initials,
      color: athleteByHandle.color,
    };
  }
  const brandByHandle = id ? BRAND_BY_HANDLE.get(key) : undefined;
  if (brandByHandle) {
    return {
      entityId: brandByHandle.logoAssetId,
      initials: brandByHandle.initials,
      color: brandByHandle.color,
    };
  }
  const brandByName = displayName
    ? BRAND_CATALOG.find((b) => b.name.toLowerCase() === displayName.toLowerCase())
    : undefined;
  if (brandByName) {
    return {
      entityId: brandByName.logoAssetId,
      initials: brandByName.initials,
      color: brandByName.color,
    };
  }
  const schoolByName = displayName
    ? SCHOOL_CATALOG.find((s) => s.name.toLowerCase().includes(displayName.toLowerCase()))
    : undefined;
  if (schoolByName) {
    return {
      entityId: schoolAssetId(schoolByName.id),
      initials: schoolByName.initials,
      color: schoolByName.color,
    };
  }

  // Final fallback — derive initials from the display name or id
  const source = displayName?.trim() || id || "?";
  return { initials: deriveInitials(source), color: NEUTRAL, localSource };
}

mockRegistry.register({
  id: "mock-avatar-hints",
  description:
    "Hand-curated avatar overrides for chat channels + search-suggestion userNames not present in any entity catalog",
  load: () => HINTS,
});
