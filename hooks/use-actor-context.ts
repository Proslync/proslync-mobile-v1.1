// Standard hook-import convention for the actor-context groundwork.
// Re-exports `useActorContext` and adds tiny convenience selectors.
import { useActorContext } from "@/lib/providers/actor-context-provider";

export { useActorContext };

export function useIsProfessional(): boolean {
  return useActorContext().identity.context === "professional";
}

export function useIsPersonal(): boolean {
  return useActorContext().identity.context === "personal";
}
