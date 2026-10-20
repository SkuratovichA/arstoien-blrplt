import bcrypt from 'bcrypt';
import { createUser } from '../../src/common/testing/fixtures.js';
import type { User } from '../../src/generated/prisma/client.js';
import type { PrismaService } from '../../src/prisma/prisma.service.js';

/** The password of every seeded user unless the test picks another one */
export const DEFAULT_PASSWORD = 'Str0ng-Passw0rd!';

let counter = 0;

/** An address no other test, run or process uses, so tests share one database without cleaning it */
export function uniqueEmail(label = 'user'): string {
  counter += 1;
  return `${label}-${process.pid}-${Date.now().toString(36)}-${counter}@example.test`;
}

/**
 * Inserts a user with a hashed password. The defaults are those of the unit-test fixture (an active, verified user); the test overrides the columns it cares about.
 */
export async function seedUser(
  prisma: PrismaService,
  overrides: Partial<User> & { password?: string } = {}
): Promise<User> {
  const { password = DEFAULT_PASSWORD, ...columns } = overrides;
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...data
  } = createUser({
    email: uniqueEmail(),
    // Cost 4 is the lowest bcrypt allows; the application compares against any cost
    passwordHash: await bcrypt.hash(password, 4),
    ...columns,
  });

  return prisma.user.create({ data });
}
