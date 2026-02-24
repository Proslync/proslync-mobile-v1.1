// Environment-based configuration
// All public env vars must be prefixed with EXPO_PUBLIC_

// Local development override
// Set to true to use local backend (requires backend running on your machine)
const USE_LOCAL_BACKEND = false;
const LOCAL_IP = "192.168.101.32"; // Update with your IP: ifconfig (Mac) or ipconfig (Windows)

// API URLs
const PROD_API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://status-social-api-dev-699705646196.us-east4.run.app";
const PROD_WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ||
  "wss://status-social-api-dev-699705646196.us-east4.run.app";

export const config = {
  api: {
    baseUrl: USE_LOCAL_BACKEND ? `http://${LOCAL_IP}:5001` : PROD_API_URL,
    timeout: 10000,
  },
  websocket: {
    url: USE_LOCAL_BACKEND ? `ws://${LOCAL_IP}:5001` : PROD_WS_URL,
    enabled: true,
  },
  auth: {
    tokenKey: "accessToken",
    refreshTokenKey: "refreshToken",
  },
  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    terminalLocationId: process.env.EXPO_PUBLIC_STRIPE_TERMINAL_LOCATION_ID || "",
  },
  stream: {
    apiKey: process.env.EXPO_PUBLIC_STREAM_API_KEY || "wnyzcwhxkjsf",
  },
  mapbox: {
    accessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "",
  },
} as const;

export type Config = typeof config;
