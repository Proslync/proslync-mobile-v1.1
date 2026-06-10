import * as React from "react";
import type { AthleteProfile, UserRole } from "../types/auth.types";
import type { ProfileRole } from "./role-provider";

/**
 * One persona the Backend cockpit can "view as". Bundles both the auth-side
 * role (drives `useAuth().user.role` and any `hasRole()` gates) and the
 * product-side profile role (drives `useRole().role` and the persona
 * switchers in `(tabs)/profile.tsx`).
 *
 * `profileRole = null` for personas that don't have a product persona view
 * (e.g. impersonating a regular `user` only changes role gates, not profile
 * tab content).
 */
export interface ActivePersona {
  key: string;
  label: string;
  userRole: UserRole;
  profileRole: ProfileRole | null;
  athleteProfile?: AthleteProfile;
}

interface ImpersonationContextValue {
  activePersona: ActivePersona | null;
  setPersona: (persona: ActivePersona | null) => void;
  clearPersona: () => void;
}

// Default to no-op so `useAuth()` and `useRole()` keep working even when
// the provider isn't mounted (e.g. tests, storybook).
export const ImpersonationContext = React.createContext<ImpersonationContextValue>({
  activePersona: null,
  setPersona: () => {},
  clearPersona: () => {},
});

export function useImpersonation(): ImpersonationContextValue {
  return React.useContext(ImpersonationContext);
}

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const [activePersona, setActivePersona] = React.useState<ActivePersona | null>(null);

  const value = React.useMemo<ImpersonationContextValue>(
    () => ({
      activePersona,
      setPersona: setActivePersona,
      clearPersona: () => setActivePersona(null),
    }),
    [activePersona],
  );

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
}
