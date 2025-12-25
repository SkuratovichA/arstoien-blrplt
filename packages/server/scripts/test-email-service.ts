#!/usr/bin/env ts-node

/**
 * Test the actual EmailService class from the application
 *
 * This script tests the EmailService directly, including template rendering
 * and all the methods we've fixed.
 *
 * Usage:
 *   pnpm ts-node scripts/test-email-service.ts [test-type] [recipient-email]
 *
 * Test types:
 *   - admin: Test admin notification email
 *   - verification: Test email verification
 *   - otp: Test OTP email
 *   - password: Test password reset email
 *   - verified: Test user verified notification
 *   - all: Test all email types
 *
 * Example:
 *   pnpm ts-node scripts/test-email-service.ts admin admin@example.com
 *   NODE_ENV=production pnpm ts-node scripts/test-email-service.ts all test@example.com
 */

import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { EmailService } from '../src/modules/notification/email.service';
import { Effect } from 'effect';

const testType = process.argv[2] || 'all';
const recipientEmail = process.argv[3] || 'test@example.com';

// Color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

async function createEmailService() {
  // Create a minimal module for testing
  const { Module } = await import('@nestjs/common');
  const { ConfigModule } = await import('@nestjs/config');
  const { appConfig } = await import('../src/config/app.config');

  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [appConfig],
      }),
    ],
    providers: [EmailService],
  })
  class TestModule {}

  const app = await NestFactory.createApplicationContext(TestModule);
  return app.get(EmailService);
}

async function testAdminNotification(emailService: EmailService, email: string) {
  console.log(`\n${colors.yellow}Testing Admin Notification Email...${colors.reset}`);

  const testData = {
    userId: 'test-user-123',
    email: 'newuser@example.com',
    firstName: 'John',
    lastName: 'Doe',
    registeredAt: new Date(),
  };

  try {
    const effect = emailService.sendAdminNewUserNotification(email, testData);
    await Effect.runPromise(effect);
    console.log(`${colors.green}✅ Admin notification sent successfully to ${email}${colors.reset}`);
  } catch (error: any) {
    console.error(`${colors.red}❌ Failed to send admin notification: ${error?.message || error}${colors.reset}`);
    throw error;
  }
}

async function testVerificationEmail(emailService: EmailService, email: string) {
  console.log(`\n${colors.yellow}Testing Verification Email...${colors.reset}`);

  const verificationLink = 'https://example.com/verify?token=test-token-123';

  try {
    await emailService.sendVerificationEmail(email, verificationLink);
    console.log(`${colors.green}✅ Verification email sent successfully to ${email}${colors.reset}`);
  } catch (error: any) {
    console.error(`${colors.red}❌ Failed to send verification email: ${error?.message || error}${colors.reset}`);
    throw error;
  }
}

async function testOtpEmail(emailService: EmailService, email: string) {
  console.log(`\n${colors.yellow}Testing OTP Email...${colors.reset}`);

  const otpCode = '123456';

  try {
    await emailService.sendOtpEmail(email, otpCode);
    console.log(`${colors.green}✅ OTP email sent successfully to ${email}${colors.reset}`);
  } catch (error: any) {
    console.error(`${colors.red}❌ Failed to send OTP email: ${error?.message || error}${colors.reset}`);
    throw error;
  }
}

async function testPasswordResetEmail(emailService: EmailService, email: string) {
  console.log(`\n${colors.yellow}Testing Password Reset Email...${colors.reset}`);

  const resetLink = 'https://example.com/reset-password?token=reset-token-123';

  try {
    await emailService.sendPasswordResetEmail(email, resetLink);
    console.log(`${colors.green}✅ Password reset email sent successfully to ${email}${colors.reset}`);
  } catch (error: any) {
    console.error(`${colors.red}❌ Failed to send password reset email: ${error?.message || error}${colors.reset}`);
    throw error;
  }
}

async function testUserVerifiedEmail(emailService: EmailService, email: string) {
  console.log(`\n${colors.yellow}Testing User Verified Email...${colors.reset}`);

  const testData = {
    firstName: 'John',
    loginUrl: 'https://example.com/login',
  };

  try {
    const effect = emailService.sendUserVerifiedEmail(email, testData);
    await Effect.runPromise(effect);
    console.log(`${colors.green}✅ User verified email sent successfully to ${email}${colors.reset}`);
  } catch (error: any) {
    console.error(`${colors.red}❌ Failed to send user verified email: ${error?.message || error}${colors.reset}`);
    throw error;
  }
}

async function main() {
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.magenta}           EMAIL SERVICE CLASS TEST${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  console.log(`Environment: ${colors.magenta}${process.env.NODE_ENV || 'development'}${colors.reset}`);
  console.log(`Test Type: ${colors.magenta}${testType}${colors.reset}`);
  console.log(`Recipient: ${colors.magenta}${recipientEmail}${colors.reset}`);

  console.log(`\n${colors.yellow}Initializing Email Service...${colors.reset}`);

  let emailService: EmailService;
  try {
    emailService = await createEmailService();
    console.log(`${colors.green}✅ Email service initialized${colors.reset}`);
  } catch (error: any) {
    console.error(`${colors.red}❌ Failed to initialize email service: ${error?.message || error}${colors.reset}`);
    process.exit(1);
  }

  // Wait a moment for the transporter to verify
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}Running Email Tests${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

  const errors: string[] = [];

  try {
    switch (testType) {
      case 'admin':
        await testAdminNotification(emailService, recipientEmail);
        break;

      case 'verification':
        await testVerificationEmail(emailService, recipientEmail);
        break;

      case 'otp':
        await testOtpEmail(emailService, recipientEmail);
        break;

      case 'password':
        await testPasswordResetEmail(emailService, recipientEmail);
        break;

      case 'verified':
        await testUserVerifiedEmail(emailService, recipientEmail);
        break;

      case 'all':
        // Test all email types
        const tests = [
          () => testAdminNotification(emailService, recipientEmail),
          () => testVerificationEmail(emailService, recipientEmail),
          () => testOtpEmail(emailService, recipientEmail),
          () => testPasswordResetEmail(emailService, recipientEmail),
          () => testUserVerifiedEmail(emailService, recipientEmail),
        ];

        for (const test of tests) {
          try {
            await test();
          } catch (error: any) {
            errors.push(error?.message || 'Unknown error');
          }
        }
        break;

      default:
        console.error(`${colors.red}Invalid test type: ${testType}${colors.reset}`);
        console.log('\nAvailable test types: admin, verification, otp, password, verified, all');
        process.exit(1);
    }

    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

    if (errors.length > 0) {
      console.log(`${colors.red}❌ Some tests failed:${colors.reset}`);
      errors.forEach((error) => console.log(`   - ${error}`));
      console.log(`\n${colors.yellow}Check the logs above for detailed error messages.${colors.reset}`);
    } else {
      console.log(`${colors.green}🎉 All email tests completed successfully!${colors.reset}`);

      console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
      console.log(`1. Check your email inbox (${recipientEmail}) for the test emails`);
      console.log(`2. Review the server logs for detailed SMTP communication`);
      console.log(`3. If using AWS SES, check the SES console for delivery status`);
    }

  } catch (error: any) {
    console.error(`\n${colors.red}Test failed with error:${colors.reset}`);
    console.error(error);
    process.exit(1);
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});