export { isDevBuild, isDemoMode, isBackendUser } from "./dev-mode";
export { logger, type LogEntry } from "./logger";
export * as flags from "./feature-flags";
export type { FeatureFlags } from "./feature-flags";
export * as mockRegistry from "./mock-registry";
export type { Dataset } from "./mock-registry";
export { DEV_PERSONAS, buildMockUser, devLoginWithBackend, type DevPersona } from "./dev-personas";
