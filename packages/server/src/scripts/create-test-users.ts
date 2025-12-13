#!/usr/bin/env tsx

/**
 * Script to create test users for development/testing
 *
 * Usage:
 *   yarn create:test-users
 *
 * This will create several test users with different roles
 */

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const basePwd: string | undefined = process.env.BASE_PWD
if (!basePwd) {
  throw new Error('Base password should be specified')
}

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

const testUsers: TestUser[] = [
  {
    email: 'moderator@example.com',
    password: basePwd + '_moderator123!',
    firstName: 'Moderator',
    lastName: 'Example',
    role: 'MODERATOR',
  },
  {
    email: 'john.doe@example.com',
    password: basePwd + '_user123!',
    firstName: 'John',
    lastName: 'Doe',
    role: 'CUSTOMER',
  },
  {
    email: 'jane.smith@example.com',
    password: basePwd + '_user123!',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'CUSTOMER',
  },
  {
    email: 'test.user@example.com',
    password: basePwd + '_test123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'CUSTOMER',
  },
  {
    email: 'demo@example.com',
    password: basePwd + '_demo123!',
    firstName: 'Demo',
    lastName: 'Account',
    role: 'CUSTOMER',
  },
  {
    email: 'carrier@example.com',
    password: basePwd + '_carrier123!',
    firstName: 'Carrier',
    lastName: 'Company',
    role: 'CARRIER',
  },
];

async function createTestUsers() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Check if in production - warn user
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: You are about to create test users in PRODUCTION!');
    console.warn('This is typically not recommended. Press Ctrl+C to cancel.\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  try {
    console.log('🌱 Creating test users...\n');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                        Test Users Creation                        ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');

    for (const userData of testUsers) {
      const passwordHash = await bcrypt.hash(userData.password, 10);

      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
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

      // Create profile for customer or carrier
      if (userData.role === 'CUSTOMER') {
        await prisma.customerProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
          },
        });
      } else if (userData.role === 'CARRIER') {
        await prisma.carrierProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            companyName: userData.firstName + ' Transport Co.',
            contactPerson: userData.firstName + ' ' + userData.lastName,
            operatingRegion: 'Czechia',
            identificationNumber: '12345678',
            identificationNumberType: 'ICO',
          },
        });
      }

      const roleEmoji = userData.role === 'SUPER_ADMIN' ? '👑' :
                        userData.role === 'MODERATOR' ? '🛡️' :
                        userData.role === 'CARRIER' ? '🚚' :
                        userData.role === 'CUSTOMER' ? '🛒' : '👤';

      console.log(`║ ${roleEmoji} ${userData.role.padEnd(12)} │ ${userData.email.padEnd(25)} │ ${userData.password.padEnd(15)} ║`);
    }

    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('\n✅ Test users created successfully!');
    console.log('🔐 You can now login with any of the above credentials.');
    console.log('\n⚠️  Remember: These are TEST credentials only. Never use in production!');
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
