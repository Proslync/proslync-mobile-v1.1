// Environment-based configuration
// All public env vars must be prefixed with EXPO_PUBLIC_

type ApiMode = "mock" | "fallback" | "live";

const explicitApiBaseUrl =
  process.env.EXPO_PUBLIC_PROSLYNC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "";
const requestedApiMode = process.env.EXPO_PUBLIC_PROSLYNC_API_MODE?.toLowerCase();
const localApiBaseUrl = "http://localhost:3020";
const shouldUseLocalBackend = requestedApiMode === "local";
const apiMode: ApiMode =
  requestedApiMode === "live"
    ? "live"
    : requestedApiMode === "fallback" || shouldUseLocalBackend || explicitApiBaseUrl
      ? "fallback"
      : "mock";

const PROD_API_URL =
  explicitApiBaseUrl ||
  (shouldUseLocalBackend ? localApiBaseUrl : "https://status-social-api-dev-699705646196.us-east4.run.app");
const PROD_WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ||
  "wss://status-social-api-dev-699705646196.us-east4.run.app";

const explicitFanBaseUrl =
  process.env.EXPO_PUBLIC_PROSLYNC_FAN_API_BASE_URL || "";
const fanBaseUrl = explicitFanBaseUrl || localApiBaseUrl;

const explicitProBaseUrl =
  process.env.EXPO_PUBLIC_PROSLYNC_PRO_API_BASE_URL || "";
const proBaseUrl = explicitProBaseUrl || localApiBaseUrl;

export const features = {
  channels: apiMode !== "mock",
};

export const config = {
  api: {
    baseUrl: PROD_API_URL,
    fanBaseUrl,
    proBaseUrl,
    timeout: 10000,
    mode: apiMode,
    networkEnabled: apiMode !== "mock",
    fallbackToMock: apiMode !== "live",
  },
  websocket: {
    url: shouldUseLocalBackend ? "ws://localhost:3020" : PROD_WS_URL,
    enabled: false,
  },
  auth: {
    tokenKey: "accessToken",
    refreshTokenKey: "refreshToken",
  },
  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  },
  mapbox: {
    accessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "",
  },
  livekit: {
    serverUrl: process.env.EXPO_PUBLIC_LIVEKIT_URL || "wss://status-test-c1ki6pp2.livekit.cloud",
  },
} as const;

export type Config = typeof config;
