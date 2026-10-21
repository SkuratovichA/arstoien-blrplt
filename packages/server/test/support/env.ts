/**
 * The environment of the integration tests. DATABASE_URL is not here on purpose: the tests write rows, so the database is always chosen by whoever runs them (a CI service container, a throwaway local database).
 */
export const testEnv = {
  NODE_ENV: 'local',
  JWT_SECRET: 'integration-test-jwt-secret',
  JWT_REFRESH_SECRET: 'integration-test-jwt-refresh-secret',
  FRONTEND_URL: 'http://localhost:3000',
  // The Redis-backed services are replaced by in-memory fakes, so nothing connects to this address
  REDIS_URL: 'redis://127.0.0.1:6379',
  // The email sender is replaced by an in-memory fake, so nothing connects to this address either
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: '1025',
} satisfies Record<string, string>;
