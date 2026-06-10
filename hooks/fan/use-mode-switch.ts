// ── PROSLYNC PHASE 5: useModeSwitch ────────────────────────
// Single hook that both Account screens consume to flip the app
// between the fan shell and the pro shell. Centralising the redirect
// here keeps the (fan-tabs) → (tabs) and (tabs) → (fan-tabs) flips
// symmetric and makes it easy to audit later.
//
// `canSwitchToProMode` is true when the authed fan has an identity
// link with a non-null `proUserId` — i.e. the human has actually
// completed pro signup. The link-pro flow flips this true after a
// successful `linkProRole` response.

import { useRouter } from 'expo-router';
import * as React from 'react';

import { useFanAuth } from '@/lib/providers/fan-auth-provider';
import { useMode } from '@/lib/providers/role-provider';

export interface ModeSwitchHandle {
  switchToProMode: () => void;
  switchToFanMode: () => void;
  /** True if the authed fan has a linked pro user — false otherwise (loading,
   * unauthenticated, or no linked pro role yet). */
  canSwitchToProMode: boolean;
}

export function useModeSwitch(): ModeSwitchHandle {
  const router = useRouter();
  const { setMode } = useMode();
  const { state } = useFanAuth();

  const canSwitchToProMode = React.useMemo(() => {
    if (state.status !== 'authenticated') return false;
    const link = state.identityLink;
    if (link.hasLinkedProUser === true) return true;
    // Fall back to a raw presence check on proUserId (wire shape is
    // number | null; treat anything truthy as linked).
    return link.proUserId != null && link.proUserId !== '' && link.proUserId !== 0;
  }, [state]);

  const switchToProMode = React.useCallback(() => {
    setMode('pro');
    // Replace, don't push — we're swapping shells, not stacking.
    router.replace('/(tabs)');
  }, [router, setMode]);

  const switchToFanMode = React.useCallback(() => {
    setMode('fan');
    router.replace('/(fan-tabs)');
  }, [router, setMode]);

  return { switchToProMode, switchToFanMode, canSwitchToProMode };
}
