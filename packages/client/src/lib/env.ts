export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000/graphql',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:4000/graphql',
  appName: import.meta.env.VITE_APP_NAME || 'Arstoien Boilerplate',
} as const;
