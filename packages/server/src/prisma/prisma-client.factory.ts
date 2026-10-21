import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

/** Prisma 7 talks to the database through a driver adapter; PrismaService and the scripts connect through this one. */
export function createPrismaAdapter(databaseUrl: string): PrismaPg {
  return new PrismaPg({ connectionString: databaseUrl });
}

/** A client for scripts that run outside Nest and read DATABASE_URL from the environment. */
export function createScriptPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  return new PrismaClient({ adapter: createPrismaAdapter(databaseUrl) });
}
