// Asset manifest for school + brand logos sourced from open / CC-licensed
// repositories. Generated 2026-05-11; trimmed same day to demo-scope only.
//
// Scope decision (2026-05-11): the original asset-sourcing pass over-provisioned
// 76 schools and 45 brands. This manifest now lists only the schools tied to
// real-nil-deals.json athletes, and only brands with an unambiguous, current
// open-licensed mark on disk. Everything else falls back to the colored
// initial bubble (brandInitial + brandColor) used in mock fixtures.
//
// Each entry is either:
//   - { path, source, license } when the asset is on disk in assets/images
//   - null when no openly-licensed mark could be found at trim time
//
// Provenance:
//   - School marks: Wikimedia Commons (per-file license; typical mix of
//     CC BY-SA 4.0, PD-textlogo, PD-ineligible, CC0).
//   - Brand marks: Wikimedia Commons + gilbarbara/logos (MIT) + SimpleIcons (CC0).
//
// Bundler note: PNG path is preferred for Metro `require()`. SVGs are kept
// raw when they were already PNG-rasterised by ImageMagick; otherwise SVGs
// are bundled via react-native-svg-transformer at the call site.

export type AssetManifestEntry = {
  /** Project-root-relative path used by Image source or require(). */
  path: string;
  /** Where the file was downloaded from (URL or repo identifier). */
  source: string;
  /** Short SPDX-ish license tag from the upstream source page. */
  license: string;
};

const WIKI = "Wikimedia Commons (per-file license; see source URL)";

// ── School athletics marks ────────────────────────────────────────────────────
//
// Limited to schools referenced by athletes in real-nil-deals.json.
// iowa, colorado, uconn are kept as null because the only marks the open
// repositories surfaced were either a conference-logo-in-school-colors
// fallback (visually misleading) or not present at all. The UI should fall
// back to the school initial bubble for those three.

export const SCHOOL_LOGOS: Record<
  string,
  AssetManifestEntry | null
> = {
  colorado: null, // Conference-logo-in-CU-colors fallback rejected 2026-05-11
  duke: {
    path: "assets/images/schools/duke.png",
    source: "https://commons.wikimedia.org/wiki/File:Duke_Athletics_logo.svg",
    license: WIKI,
  },
  iowa: null, // Conference-logo-in-Iowa-colors fallback rejected 2026-05-11
  lsu: {
    path: "assets/images/schools/lsu.png",
    source: "https://commons.wikimedia.org/wiki/File:LSU_Athletics_logo.svg",
    license: WIKI,
  },
  "notre-dame": {
    path: "assets/images/schools/notre-dame.png",
    source: "https://commons.wikimedia.org/wiki/File:Notre_Dame_Fighting_Irish_logo.svg",
    license: WIKI,
  },
  rutgers: {
    path: "assets/images/schools/rutgers.png",
    source: "https://commons.wikimedia.org/wiki/File:Rutgers_Scarlet_Knights_logo.svg",
    license: WIKI,
  },
  syracuse: {
    path: "assets/images/schools/syracuse.png",
    source: "https://commons.wikimedia.org/wiki/File:Syracuse_Orange_logo.svg",
    license: WIKI,
  },
  texas: {
    path: "assets/images/schools/texas.png",
    source: "https://commons.wikimedia.org/wiki/File:Texas_Longhorns_logo.svg",
    license: WIKI,
  },
  uconn: null, // No open-licensed athletics mark sourced as of 2026-05-11
  usc: {
    path: "assets/images/schools/usc.png",
    source: "https://commons.wikimedia.org/wiki/File:USC_Trojans_logo.svg",
    license: WIKI,
  },
};

// ── Brand marks ───────────────────────────────────────────────────────────────
//
// Sources by license tier:
//   * SimpleIcons   — CC0 1.0 (public-domain dedication)
//   * gilbarbara    — MIT license, github.com/gilbarbara/logos
//   * Wikimedia     — per-file license (typically PD-textlogo, PD-ineligible,
//                     CC BY-SA 4.0). Confirm at the source URL.

const MIT_GILBARBARA = "MIT — github.com/gilbarbara/logos";
const CC0_SIMPLEICONS = "CC0 1.0 — simpleicons.org";

export const BRAND_LOGOS: Record<
  string,
  AssetManifestEntry | null
> = {
  // Footwear / apparel
  nike: {
    path: "assets/images/brands/nike.svg",
    source: "https://cdn.simpleicons.org/nike",
    license: CC0_SIMPLEICONS,
  },
  adidas: {
    path: "assets/images/brands/adidas.svg",
    source: "https://cdn.simpleicons.org/adidas",
    license: CC0_SIMPLEICONS,
  },
  puma: {
    path: "assets/images/brands/puma.svg",
    source: "https://cdn.simpleicons.org/puma",
    license: CC0_SIMPLEICONS,
  },
  reebok: {
    path: "assets/images/brands/reebok.svg",
    source: "https://cdn.simpleicons.org/reebok",
    license: CC0_SIMPLEICONS,
  },
  "new-balance": {
    path: "assets/images/brands/new-balance.svg",
    source: "https://cdn.simpleicons.org/newbalance",
    license: CC0_SIMPLEICONS,
  },
  jordan: {
    path: "assets/images/brands/jordan.svg",
    source: "https://cdn.simpleicons.org/jordan",
    license: CC0_SIMPLEICONS,
  },
  champion: {
    path: "assets/images/brands/champion.svg",
    source: "https://commons.wikimedia.org/wiki/File:Champion_USA_logo.svg",
    license: WIKI,
  },
  crocs: {
    path: "assets/images/brands/crocs.svg",
    source: "https://commons.wikimedia.org/wiki/File:Crocs_wordmark.svg",
    license: WIKI,
  },
  lululemon: {
    path: "assets/images/brands/lululemon.svg",
    source: "https://commons.wikimedia.org/wiki/File:Lululemon_Athletica_logo.svg",
    license: WIKI,
  },
  "american-eagle": {
    path: "assets/images/brands/american-eagle.svg",
    source: "https://commons.wikimedia.org/wiki/File:American_Eagle_Outfitters_wordmark.svg",
    license: WIKI,
  },

  // Audio / electronics
  beats: {
    path: "assets/images/brands/beats.svg",
    source: "https://raw.githubusercontent.com/gilbarbara/logos/main/logos/beats.svg",
    license: MIT_GILBARBARA,
  },
  bose: {
    path: "assets/images/brands/bose.svg",
    source: "https://cdn.simpleicons.org/bose",
    license: CC0_SIMPLEICONS,
  },

  // Beverage / hydration
  gatorade: {
    path: "assets/images/brands/gatorade.svg",
    source: "https://commons.wikimedia.org/wiki/File:Gatorade_logo.svg",
    license: WIKI,
  },
  "red-bull": {
    path: "assets/images/brands/red-bull.svg",
    source: "https://cdn.simpleicons.org/redbull",
    license: CC0_SIMPLEICONS,
  },
  celsius: {
    path: "assets/images/brands/celsius.png",
    source: "https://commons.wikimedia.org/wiki/File:Celsius_Energy_Drink_logo.png",
    license: WIKI,
  },
  bodyarmor: {
    path: "assets/images/brands/bodyarmor.svg",
    source: "https://commons.wikimedia.org/wiki/File:BodyArmor_wordmark_(2025).svg",
    license: WIKI,
  },

  // Telecom / tech / consumer
  att: {
    path: "assets/images/brands/att.svg",
    source: "https://commons.wikimedia.org/wiki/File:AT%26T_logo_2016.svg",
    license: WIKI,
  },
  verizon: {
    path: "assets/images/brands/verizon.svg",
    source: "https://cdn.simpleicons.org/verizon",
    license: CC0_SIMPLEICONS,
  },
  spotify: {
    path: "assets/images/brands/spotify.svg",
    source: "https://raw.githubusercontent.com/gilbarbara/logos/main/logos/spotify.svg",
    license: MIT_GILBARBARA,
  },

  // Automotive
  "mercedes-benz": {
    path: "assets/images/brands/mercedes-benz.svg",
    source: "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_Logo_2010.svg",
    license: WIKI,
  },
  honda: {
    path: "assets/images/brands/honda.svg",
    source: "https://cdn.simpleicons.org/honda",
    license: CC0_SIMPLEICONS,
  },

  // Insurance / restaurant / retail / gaming / cards / entertainment
  "state-farm": {
    path: "assets/images/brands/state-farm.svg",
    source: "https://commons.wikimedia.org/wiki/File:State_Farm_logo.svg",
    license: WIKI,
  },
  kfc: {
    path: "assets/images/brands/kfc.svg",
    source: "https://cdn.simpleicons.org/kfc",
    license: CC0_SIMPLEICONS,
  },
  "outback-steakhouse": {
    path: "assets/images/brands/outback-steakhouse.png",
    source: "https://commons.wikimedia.org/wiki/File:OutbackLogo.png",
    license: WIKI,
  },
  wilson: {
    path: "assets/images/brands/wilson.svg",
    source: "https://commons.wikimedia.org/wiki/File:Wilson_logo.svg",
    license: WIKI,
  },
  fanatics: {
    path: "assets/images/brands/fanatics.svg",
    source: "https://commons.wikimedia.org/wiki/File:Fanatics_company_logo.svg",
    license: WIKI,
  },
  panini: {
    path: "assets/images/brands/panini.png",
    source: "https://commons.wikimedia.org/wiki/File:Panini_group_logo.png",
    license: WIKI,
  },
  "ea-sports": {
    path: "assets/images/brands/ea-sports.svg",
    source: "https://cdn.simpleicons.org/ea",
    license: CC0_SIMPLEICONS,
  },
  marvel: {
    path: "assets/images/brands/marvel.svg",
    source: "https://raw.githubusercontent.com/gilbarbara/logos/main/logos/marvel.svg",
    license: MIT_GILBARBARA,
  },

  // Sports agencies / NIL infrastructure
  "klutch-sports": {
    path: "assets/images/brands/klutch-sports.png",
    source: "https://commons.wikimedia.org/wiki/File:Black_Klutch_Wordmark.png",
    license: WIKI,
  },
};

/** Convenience getter — returns null when the asset is not on disk. */
export function getSchoolLogo(slug: string): AssetManifestEntry | null {
  return SCHOOL_LOGOS[slug] ?? null;
}

/** Convenience getter — returns null when the asset is not on disk. */
export function getBrandLogo(slug: string): AssetManifestEntry | null {
  return BRAND_LOGOS[slug] ?? null;
}
