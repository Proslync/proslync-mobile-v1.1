// ── NAVIGATION CONSTANTS ─────────────────────────────────
// Cross-shell numeric constants used by floating layers that
// need to compose with the PastelTabBar's spacing.

/**
 * Visual gap (px) between the PastelTabBar's top edge and the next
 * floating layer above it (FeedNavBar on Home, persona bottom-fades,
 * profile cabinet, screen toolbar). Was previously duplicated as a
 * local `const` inside four files — lifted here so a future tab-bar
 * height tweak only happens in one place.
 */
export const TAB_BAR_TOP_FROM_BOTTOM = 6;

/**
 * Approximate native bottom-tab chrome clearance (px), including the
 * selected glass pill and safe-area composition on current iPhone sims.
 * Use this for overlays that need to sit above the tab bar, not as the
 * small visual gap between already-stacked layers.
 */
export const NATIVE_TAB_BAR_TOP_FROM_BOTTOM = 90;
