/**
 * Single import surface for all demo datasets. Importing this module triggers
 * each dataset's `mockRegistry.register(...)` side effect exactly once
 * (ES modules cache, so re-importing is a no-op).
 *
 * App startup imports this from `app/_layout.tsx` so the Backend cockpit's
 * mock-registry browser sees every dataset on first paint.
 */
export * from "./brand-catalog";
export * from "./athlete-catalog";
export * from "./school-catalog";
export * from "./local-avatars";
export * from "./mock-avatar-resolver";
export * from "./api-fixtures";
export * from "./seeds";
export * from "./canonical-roster";
