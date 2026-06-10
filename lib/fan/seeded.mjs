// Seeded determinism for the masonry fan feed: every post id maps to the same
// abstract art + card aspect forever. Pure JS (.mjs) so node:test can run it
// without a TS toolchain; Metro bundles .mjs fine.

/** 32-bit string hash (Java-style). */
export function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

/** Tiny seeded PRNG → () => float in [0,1). */
export function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Card aspect (width/height) for a post id, uniform in [0.62, 1.45]. */
export function seededAspect(id) {
  const rand = mulberry32(hashCode(`aspect:${id}`));
  return 0.62 + rand() * (1.45 - 0.62);
}

/** Stable integer pick in [0, n) for a post id (recipe selection etc.). */
export function seededPick(id, n) {
  const rand = mulberry32(hashCode(`pick:${id}`));
  return Math.floor(rand() * n);
}
