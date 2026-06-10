import { config } from "../config";
import type { User } from "../types/auth.types";

/**
 * True when the binary was built with __DEV__ (Metro/dev-client).
 */
export function isDevBuild(): boolean {
  return __DEV__;
}

/**
 * True when the app is serving mock data instead of a live backend.
 * While the websocket gate is off, the api client is in mock mode.
 */
export function isDemoMode(): boolean {
  return !config.websocket.enabled;
}

/**
 * True when the user has Proslync staff/backend privileges.
 *
 * `staffFlags.isBackend` is server-granted and orthogonal to the product
 * `role` enum — a backend user can impersonate any role without changing
 * their record.
 */
export function isBackendUser(user: User | null | undefined): boolean {
  return user?.staffFlags?.isBackend === true;
}
