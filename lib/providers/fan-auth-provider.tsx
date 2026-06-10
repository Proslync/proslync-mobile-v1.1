// ── PROSLYNC FAN AUTH PROVIDER ─────────────────────────────
// Phase 2 — independent of the pro `AuthProvider`. The two providers
// run side by side: a fan signin never changes pro state and vice
// versa. The mode-switcher UI in Phase 3 will read both states to
// decide which spine to show; for now consumers in `(fan-tabs)`
// only care about this one.
//
// Verified: fan-side mutations only touch data/proslync-fan.db; pro-side
// mutations only touch data/proslync.db. Cross-DB only happens via
// identity-link signup. Phase 5 audit pass on 2026-05-10.
//
// Audit trace (proslync-backend):
//   • src/services/fan/{posts,follows,feed,profiles,reports,identity-links}
//     all import exclusively from `@/db/fan-client` (fanDb). None import
//     the pro `@/db/client`. `grep -rn fanDb src/services/fan` confirms.
//   • Pro write paths (deals, applications, approvals) live under
//     src/services/* and import `@/db/client`; none import fanDb.
//   • The single cross-DB touch is `linkProRole` in src/services/auth.ts,
//     which under one transaction (a) inserts a new pro `users` row and
//     (b) writes `identity_links.pro_user_id` in the fan DB. This is the
//     intended bridge and is gated by `requireFanAuth`.
//   • Brand-admin fan posts therefore can never leak into the pro Brand HQ
//     pipeline: the fan-side routes do not call any service that touches
//     proDb. Conversely a fan-mode session has no pro-side bearer attached,
//     so even if a pro route were called it would 401 at requireAuth.

import * as React from 'react';

import { fanAuthedApi } from '@/lib/api/fan/authed';
import { fanTokens, type FanTokenPair } from '@/lib/storage/fan-tokens';
import type { FanUser, IdentityLink } from '@/lib/types/fan.types';

export type FanAuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | {
      status: 'authenticated';
      fanUser: FanUser;
      identityLink: IdentityLink;
    };

interface FanAuthContextValue {
  state: FanAuthState;
  /** Called by the signin/signup screens after a successful verifyOtp. */
  signIn: (
    tokens: FanTokenPair,
    fanUser: FanUser,
    identityLink: IdentityLink,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  /** Force-revalidate the fan session against /me. Used after profile
   * mutations that may have changed handle/displayName. */
  refresh: () => Promise<void>;
  /** Dev-only synthetic session — wired by the dev-login sheet so picking a
   * persona that owns the `fan` allowedRole lands the fan-tabs Account page
   * on `<FanProfile />` instead of the unauth sign-in card. No tokens are
   * persisted; a cold reload reverts to the real `/me` hydrate path. */
  __devSignIn: (fanUser: FanUser, identityLink: IdentityLink) => void;
}

const FanAuthContext = React.createContext<FanAuthContextValue | null>(null);

export function useFanAuth(): FanAuthContextValue {
  const ctx = React.useContext(FanAuthContext);
  if (!ctx) {
    throw new Error('useFanAuth must be used within a FanAuthProvider');
  }
  return ctx;
}

interface FanAuthProviderProps {
  children: React.ReactNode;
}

export function FanAuthProvider({ children }: FanAuthProviderProps): React.JSX.Element {
  const [state, setState] = React.useState<FanAuthState>({ status: 'loading' });

  const hydrate = React.useCallback(async () => {
    const stored = await fanTokens.get();
    if (!stored) {
      setState({ status: 'unauthenticated' });
      return;
    }
    // Validate the token by hitting /me. The authedFetch layer will
    // try refresh once on 401 and clear tokens on a second failure,
    // so a `null` here means the session is dead.
    const me = await fanAuthedApi.me();
    if (!me) {
      await fanTokens.clear();
      setState({ status: 'unauthenticated' });
      return;
    }
    setState({
      status: 'authenticated',
      fanUser: me.fanUser,
      identityLink: me.identityLink,
    });
  }, []);

  React.useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const signIn = React.useCallback(
    async (
      tokens: FanTokenPair,
      fanUser: FanUser,
      identityLink: IdentityLink,
    ) => {
      await fanTokens.set(tokens);
      setState({ status: 'authenticated', fanUser, identityLink });
    },
    [],
  );

  const signOut = React.useCallback(async () => {
    try {
      await fanAuthedApi.logout();
    } catch {
      // ignore — we're about to drop the tokens anyway
    }
    await fanTokens.clear();
    setState({ status: 'unauthenticated' });
  }, []);

  const refresh = React.useCallback(async () => {
    const me = await fanAuthedApi.me();
    if (!me) {
      await fanTokens.clear();
      setState({ status: 'unauthenticated' });
      return;
    }
    setState({
      status: 'authenticated',
      fanUser: me.fanUser,
      identityLink: me.identityLink,
    });
  }, []);

  const __devSignIn = React.useCallback(
    (fanUser: FanUser, identityLink: IdentityLink) => {
      setState({ status: 'authenticated', fanUser, identityLink });
    },
    [],
  );

  const value = React.useMemo<FanAuthContextValue>(
    () => ({ state, signIn, signOut, refresh, __devSignIn }),
    [state, signIn, signOut, refresh, __devSignIn],
  );

  return (
    <FanAuthContext.Provider value={value}>{children}</FanAuthContext.Provider>
  );
}
