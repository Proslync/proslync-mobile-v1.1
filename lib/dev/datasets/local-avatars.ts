import * as mockRegistry from "../mock-registry";

/**
 * Hand-picked local-asset avatars for any catalog or mock-contact ID where a
 * curated photo should render instead of a remote URL or initials chip.
 * Resolved by `EntityAvatar` via `localSource` after the visual-assets SVG
 * registry but before any remote URL.
 *
 * The values are RN `require(...)` module IDs (numeric handles in release,
 * objects in dev) — `any` is the standard public type in this codebase.
 */
export type LocalAvatarMap = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const LOCAL_AVATAR_BY_ID: LocalAvatarMap = {
  // Mock chat contacts (messages screen + chat screen)
  "mock-agent-rich": require("@/assets/images/contact-rich-paul.png"),
  "mock-deal-desk": require("@/assets/images/contact-proslync.png"),
  "mock-celsius": require("@/assets/images/contact-celsius.png"),
  "mock-puma": require("@/assets/images/contact-puma.png"),
  "mock-beats": require("@/assets/images/contact-beats.png"),
  "mock-cuse-gc": require("@/assets/images/contact-cuse.png"),
  // Athlete headshots (search screen + chat consistency)
  "at-kiyan": require("@/assets/images/kiyan-avatar.png"),
};

mockRegistry.register({
  id: "local-avatar-by-id",
  description:
    "Local-asset avatar overrides for hand-picked mock chat contacts (messages screen + chat screen)",
  load: (): LocalAvatarMap => LOCAL_AVATAR_BY_ID,
});
