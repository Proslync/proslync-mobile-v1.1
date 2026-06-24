// Cross-screen one-shot trigger so the Settings screen can invoke a profile
// action that must run on the athlete profile screen — which owns the banner
// state (AsyncStorage + ImagePicker) and the inline edit-mode. Settings sets
// the action and navigates to the profile tab; the profile consumes it on
// focus. Consume-once: reading clears it, so a normal tab focus is a no-op and
// the action never re-fires.

export type PendingProfileAction = 'banner' | 'edit';

let pending: PendingProfileAction | null = null;

export function setPendingProfileAction(action: PendingProfileAction): void {
  pending = action;
}

/** Returns the pending action (if any) and clears it. */
export function consumePendingProfileAction(): PendingProfileAction | null {
  const action = pending;
  pending = null;
  return action;
}
