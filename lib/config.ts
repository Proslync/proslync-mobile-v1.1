// Set to true to use local backend (requires backend running on your machine)
const USE_LOCAL_BACKEND = true;

// Your machine's local IP address when using local backend
// Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
const LOCAL_IP = '192.168.31.112'; // Update this with your actual IP

export const config = {
  api: {
    baseUrl: USE_LOCAL_BACKEND
      ? `http://${LOCAL_IP}:5050`
      : 'https://status-social-api-dev-699705646196.us-east4.run.app',
    timeout: 10000,
  },
  websocket: {
    // WebSocket uses same base but different protocol
    url: USE_LOCAL_BACKEND
      ? `ws://${LOCAL_IP}:5050`
      : 'wss://status-social-api-dev-699705646196.us-east4.run.app',
    enabled: true,
  },
  auth: {
    tokenKey: 'accessToken',
    refreshTokenKey: 'refreshToken',
  },
  stream: {
    apiKey: '869wu8z8cz2y',
  },
} as const;

export type Config = typeof config;
