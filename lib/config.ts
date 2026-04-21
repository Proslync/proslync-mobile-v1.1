// Environment-based configuration
// All public env vars must be prefixed with EXPO_PUBLIC_

// Local development override
// Set to true to use local backend (requires backend running on your machine)
const USE_LOCAL_BACKEND = false;
const LOCAL_IP = "34.86.150.27"; // GCE dev VM

// API URLs
const PROD_API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://status-social-api-dev-699705646196.us-east4.run.app";
const PROD_WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ||
  "wss://status-social-api-dev-699705646196.us-east4.run.app";

// Feature flags — disable features that require backend endpoints
// not yet deployed to the official Cloud Run backend
export const features = {
  channels: USE_LOCAL_BACKEND, // new /api/channels/* endpoints
};

export const config = {
  api: {
    baseUrl: USE_LOCAL_BACKEND ? `http://${LOCAL_IP}:5000` : PROD_API_URL,
    timeout: 10000,
  },
  websocket: {
    url: USE_LOCAL_BACKEND ? `ws://${LOCAL_IP}:5000` : PROD_WS_URL,
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
