#!/usr/bin/env tsx

/**
 * Script to create an admin user from environment variables
 *
 * Usage:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePass123! yarn create:admin
 *
 * Required environment variables:
 *   - ADMIN_EMAIL: Email for the admin user
 *   - ADMIN_PASSWORD: Password for the admin user
 *   - DATABASE_URL: Database connection string
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  // Validate environment variables
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const lastName = process.env.ADMIN_LAST_NAME || 'User';

  if (!email) {
    console.error('❌ Error: ADMIN_EMAIL environment variable is required');
    console.log(
      'Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePass123! yarn create:admin'
    );
    process.exit(1);
  }

  if (!password) {
    console.error('❌ Error: ADMIN_PASSWORD environment variable is required');
    console.log(
      'Usage: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePass123! yarn create:admin'
    );
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Validate password strength
  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    console.log('🔧 Creating admin user...\n');

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        firstName,
        lastName,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
      create: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        authProvider: 'EMAIL',
        emailVerifiedAt: new Date(),
      },
    });

    console.log('✅ Admin user created/updated successfully!\n');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║           Admin User Created               ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║ Email: ${admin.email.padEnd(36)} ║`);
    console.log(`║ Name: ${(`${admin.firstName} ${admin.lastName}`).padEnd(37)} ║`);
    console.log(`║ Role: ${admin.role.padEnd(37)} ║`);
    console.log('╚════════════════════════════════════════════╝');
    console.log('\n🔑 You can now login with the provided credentials.');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
