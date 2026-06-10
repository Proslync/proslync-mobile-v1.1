// ── PROSLYNC ACTOR CONTEXT PROVIDER ─────────────────────────
// Resolves the runtime `actor_context` tag (professional | personal) for
// every write the user might initiate. The provider derives a default
// from the current pathname + impersonated/effective role, but a manual
// override (from a future UI affordance) always wins.
//
// Front-end only groundwork — no backend writes consume this yet. Lands
// the convention before the first dependent surface so every later write
// site can read `useActorContext().identity.context` from day one.
import { usePathname } from "expo-router";
import * as React from "react";

import {
  ACTOR_CONTEXT_ROUTE_RULES,
  matchActorContextRoute,
  type ActorContext,
  type ActorContextSource,
  type ActorIdentity,
} from "../types/actor-context.types";
import { useImpersonation } from "./impersonation-provider";
import { useRole, type ProfileRole } from "./role-provider";

interface ActorContextValue {
  identity: ActorIdentity;
  override: ActorContext | null;
  setOverride: (ctx: ActorContext | null) => void;
  clearOverride: () => void;
}

const ActorContextReactContext = React.createContext<ActorContextValue | null>(
  null,
);

/**
 * Pure: derive an `ActorContext` from a pathname using the canonical rule
 * set. Returns `{ context, source }` so callers can attribute *why* the
 * context resolved the way it did (route match vs. fan-role fallback vs.
 * explore-default).
 *
 * Exported so the backend can mirror the same rule when stamping
 * `actorContext` on incoming writes server-side.
 */
export function routeToContext(
  pathname: string,
  effectiveRole: ProfileRole,
): { context: ActorContext; source: ActorContextSource } {
  for (const rule of ACTOR_CONTEXT_ROUTE_RULES) {
    if (matchActorContextRoute(pathname, rule)) {
      return { context: rule.context, source: rule.source };
    }
  }
  // Fall-throughs after the rule list:
  //   • Fan as primary profile-role → personal everywhere not otherwise
  //     resolved (Explore lives in slot 4; Fan-primary users' "home" is
  //     also a personal surface).
  //   • Any other role → professional default.
  if (effectiveRole === "fan") {
    return { context: "personal", source: "route" };
  }
  return { context: "professional", source: "route" };
}

interface ActorContextProviderProps {
  children: React.ReactNode;
  /**
   * Test / storybook hook: pin the pathname instead of reading from
   * expo-router. When omitted, the provider reads `usePathname()`.
   */
  pathnameOverride?: string;
}

export function ActorContextProvider({
  children,
  pathnameOverride,
}: ActorContextProviderProps) {
  const routerPathname = usePathname();
  const pathname = pathnameOverride ?? routerPathname ?? "/";

  const { role: effectiveRole } = useRole();
  const { activePersona } = useImpersonation();
  const isImpersonation = Boolean(activePersona);

  const [override, setOverrideState] = React.useState<ActorContext | null>(
    null,
  );

  const setOverride = React.useCallback((ctx: ActorContext | null) => {
    setOverrideState(ctx);
  }, []);

  const clearOverride = React.useCallback(() => {
    setOverrideState(null);
  }, []);

  // Memoize on the primitive inputs only so we don't allocate a new
  // identity object on every render. `resolvedAt` updates whenever any
  // input changes — that's correct (the identity *did* re-resolve), but
  // pure renders without an input change reuse the same object.
  const identity = React.useMemo<ActorIdentity>(() => {
    if (override !== null) {
      return {
        context: override,
        source: "manual",
        effectiveRole,
        isImpersonation,
        resolvedAt: new Date().toISOString(),
      };
    }
    const { context, source } = routeToContext(pathname, effectiveRole);
    return {
      context,
      source,
      effectiveRole,
      isImpersonation,
      resolvedAt: new Date().toISOString(),
    };
  }, [override, pathname, effectiveRole, isImpersonation]);

  const value = React.useMemo<ActorContextValue>(
    () => ({
      identity,
      override,
      setOverride,
      clearOverride,
    }),
    [identity, override, setOverride, clearOverride],
  );

  return (
    <ActorContextReactContext.Provider value={value}>
      {children}
    </ActorContextReactContext.Provider>
  );
}

export function useActorContext(): ActorContextValue {
  const ctx = React.useContext(ActorContextReactContext);
  if (!ctx) {
    throw new Error(
      "useActorContext must be used within an ActorContextProvider",
    );
  }
  return ctx;
}
