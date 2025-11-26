import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding database...\n');

  // Test credentials
  const testUsers = [
    {
      email: 'admin@example.com',
      password: 'Admin123!',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN' as const,
    },
    {
      email: 'moderator@example.com',
      password: 'Moderator123!',
      firstName: 'Moderator',
      lastName: 'User',
      role: 'MODERATOR' as const,
    },
    {
      email: 'user@example.com',
      password: 'User123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER' as const,
    },
  ];

  // eslint-disable-next-line no-console
  console.log('📋 Creating test users with the following credentials:\n');

  for (const userData of testUsers) {
    const passwordHash = await bcrypt.hash(userData.password, 10);

    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        status: 'ACTIVE',
        authProvider: 'EMAIL',
        emailVerifiedAt: new Date(),
      },
    });

    // eslint-disable-next-line no-console
    console.log(`✅ ${userData.role.padEnd(12)} | ${userData.email.padEnd(25)} | Password: ${userData.password}`);
  }

  // eslint-disable-next-line no-console
  console.log('\n🎉 Seeding completed successfully!');
  // eslint-disable-next-line no-console
  console.log('\n💡 You can now login with any of the above credentials.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
