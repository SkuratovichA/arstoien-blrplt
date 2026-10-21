import { defineConfig } from 'vitest/config';
import { testEnv } from './test/support/env.js';

// The integration project: a real Nest application against a real PostgreSQL database, built with `prisma migrate deploy`. Only the external senders and the Redis-backed services are replaced (see test/support/fakes.ts).
export default defineConfig({
  oxc: { decorator: { legacy: true, emitDecoratorMetadata: true } },
  test: {
    name: 'integration',
    globals: true,
    include: ['test/spec/**/*.spec.ts'],
    globalSetup: ['test/support/global-setup.ts'],
    env: testEnv,
    // The files share one database; their rows never meet because every test makes its own users, but running them one after another keeps the output readable
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
