// Set to true to use local backend (requires backend running on your machine)
const USE_LOCAL_BACKEND = false;

// Your machine's local IP address when using local backend
// Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
const LOCAL_IP = '192.168.31.114'; // Update this with your actual IP

export const config = {
  api: {
    baseUrl: USE_LOCAL_BACKEND
      ? `http://${LOCAL_IP}:5050`
      : 'https://status-social-api-dev-699705646196.us-east4.run.app',
    timeout: 10000,
  },
  auth: {
    tokenKey: 'accessToken',
    refreshTokenKey: 'refreshToken',
  },
  stream: {
    apiKey: 'wnyzcwhxkjsf',
  },
} as const;

export type Config = typeof config;
