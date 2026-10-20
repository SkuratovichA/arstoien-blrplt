import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const serverRoot = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Builds the schema the way the Docker entrypoint does, with the committed migrations, so the tests run against the database the server will really see.
 */
export default function setup(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'test:integration needs DATABASE_URL: point it at a PostgreSQL database the tests may fill with rows'
    );
  }

  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: serverRoot,
    env: process.env,
    stdio: 'inherit',
  });
}
