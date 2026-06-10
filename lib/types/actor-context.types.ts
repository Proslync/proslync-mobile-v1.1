// ── PROSLYNC ACTOR CONTEXT — TYPES + ROUTE RULES ────────────
// Runtime tag that every write (post / follow / engage / view) is stamped
// with so a single user identity can act either *professionally* (in their
// primary cockpit — Brand HQ, AD audit-defense, NIL Manager queue, etc.)
// or *personally* (in Explore / Fan mode) without the two halves polluting
// each other.
//
// Rule (canonical — see PLAN §0d explore-shell brief):
//
//   • Personal contexts (default):
//       - any route under `/explore`
//       - any route under `/fan/*`
//       - any route a user with `fan` as their primary profile-role hits
//         in their primary surface
//
//   • Professional contexts (default):
//       - any route under `/brand/**`
//       - any route under `/ad/**`
//       - `(tabs)/index` for any non-fan role
//       - `(tabs)/activity`
//       - `(tabs)/deals`
//       - any route under `/nil-manager/**`
//       - any route under `/agent/**`
//       - any route under `/coach/**`
//
//   • Manual override (from a future UI affordance) always wins over both
//     route-derived defaults and explore-shell defaults.
//
// `ACTOR_CONTEXT_ROUTE_RULES` is the data-driven shape — kept here so the
// backend can mirror the same rule set when it's time to stamp `actorContext`
// onto write requests server-side.

import type { ProfileRole } from "../providers/role-provider";

export type ActorContext = "professional" | "personal";

export type ActorContextSource = "route" | "manual" | "explore-default";

export interface ActorIdentity {
  context: ActorContext;
  source: ActorContextSource;
  effectiveRole: ProfileRole;
  isImpersonation: boolean;
  /** ISO-8601 timestamp when this identity was resolved. */
  resolvedAt: string;
}

/**
 * Match strategy for a single route rule. `startsWith` is a path-prefix
 * match against the resolved expo-router pathname (e.g. `/brand/hq`).
 * `regex` is a precompiled `RegExp` (serialized as `source` + `flags` so
 * the backend can rehydrate the same pattern in its own language).
 */
export type ActorContextRouteMatcher =
  | { kind: "startsWith"; value: string }
  | { kind: "exact"; value: string }
  | { kind: "regex"; source: string; flags: string };

export interface ActorContextRouteRule {
  /** Stable id so backend + frontend can refer to the same rule. */
  id: string;
  context: ActorContext;
  source: ActorContextSource;
  matcher: ActorContextRouteMatcher;
  /** Human-readable note for docs / debugging. */
  note: string;
}

/**
 * Data-driven route → context rules. Evaluated top-to-bottom; first match
 * wins. Keep this in sync with the prose rule above. Backend reads the
 * same shape over the wire when it's time to mirror this server-side.
 */
export const ACTOR_CONTEXT_ROUTE_RULES: readonly ActorContextRouteRule[] = [
  // Personal contexts — explore-shell + fan surfaces -----------------
  {
    id: "explore-shell",
    context: "personal",
    source: "explore-default",
    matcher: { kind: "startsWith", value: "/explore" },
    note: "Slot-4 universal explore shell — always personal.",
  },
  {
    id: "fan-tabs",
    context: "personal",
    source: "route",
    matcher: { kind: "startsWith", value: "/(fan-tabs)" },
    note: "Fan-mode bottom-tab group is personal end-to-end.",
  },
  {
    id: "fan-namespace",
    context: "personal",
    source: "route",
    matcher: { kind: "startsWith", value: "/fan" },
    note: "Any /fan/* route is personal.",
  },
  // Professional contexts — primary cockpits -------------------------
  {
    id: "brand-namespace",
    context: "professional",
    source: "route",
    matcher: { kind: "startsWith", value: "/brand" },
    note: "Brand HQ cockpit surface.",
  },
  {
    id: "ad-namespace",
    context: "professional",
    source: "route",
    matcher: { kind: "startsWith", value: "/ad" },
    note: "AD audit-defense cockpit surface.",
  },
  {
    id: "nil-manager-namespace",
    context: "professional",
    source: "route",
    matcher: { kind: "startsWith", value: "/nil-manager" },
    note: "NIL Manager queue + disclosures surface.",
  },
  {
    id: "agent-namespace",
    context: "professional",
    source: "route",
    matcher: { kind: "startsWith", value: "/agent" },
    note: "Agent represented-athlete surface.",
  },
  {
    id: "coach-namespace",
    context: "professional",
    source: "route",
    matcher: { kind: "startsWith", value: "/coach" },
    note: "Coach team / practice surface.",
  },
  {
    id: "tabs-activity",
    context: "professional",
    source: "route",
    matcher: { kind: "regex", source: "^/\\(tabs\\)/activity(/|$)", flags: "" },
    note: "Pro spine — work tab.",
  },
  {
    id: "tabs-deals",
    context: "professional",
    source: "route",
    matcher: { kind: "regex", source: "^/\\(tabs\\)/deals(/|$)", flags: "" },
    note: "Pro spine — deals tab.",
  },
] as const;

/**
 * Hydrate a route rule's matcher into a predicate. Pure helper — exported
 * so both frontend (provider) and tests can use the same matching logic.
 */
export function matchActorContextRoute(
  pathname: string,
  rule: ActorContextRouteRule,
): boolean {
  const { matcher } = rule;
  switch (matcher.kind) {
    case "exact":
      return pathname === matcher.value;
    case "startsWith":
      return pathname === matcher.value || pathname.startsWith(`${matcher.value}/`) || pathname.startsWith(matcher.value);
    case "regex":
      return new RegExp(matcher.source, matcher.flags).test(pathname);
  }
}
