#!/usr/bin/env ts-node

/**
 * Email Service Testing Script
 *
 * This script tests the email service configuration and sends test emails
 * to verify that the SMTP setup is working correctly.
 *
 * Usage:
 *   pnpm ts-node scripts/test-email.ts [recipient-email]
 *
 * For production testing:
 *   NODE_ENV=production pnpm ts-node scripts/test-email.ts [recipient-email]
 */

import 'dotenv/config';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

// Get recipient email from command line or use default
const recipientEmail = process.argv[2] || 'test@example.com';

console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.magenta}           EMAIL SERVICE CONFIGURATION TEST${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

// Display current configuration
console.log(`${colors.yellow}📋 Current Configuration:${colors.reset}`);
console.log(`   Environment: ${colors.magenta}${process.env.NODE_ENV || 'development'}${colors.reset}`);
console.log(`   SMTP Host: ${colors.magenta}${process.env.SMTP_HOST || 'Not set'}${colors.reset}`);
console.log(`   SMTP Port: ${colors.magenta}${process.env.SMTP_PORT || 'Not set'}${colors.reset}`);
console.log(`   SMTP Secure: ${colors.magenta}${process.env.SMTP_SECURE || 'false'}${colors.reset}`);
console.log(`   SMTP User: ${colors.magenta}${process.env.SMTP_USER ? '***' + process.env.SMTP_USER.slice(-4) : 'Not set'}${colors.reset}`);
console.log(`   SMTP Pass: ${colors.magenta}${process.env.SMTP_PASS ? '****' : 'Not set'}${colors.reset}`);
console.log(`   From Email: ${colors.magenta}${process.env.EMAIL_FROM || 'Not set'}${colors.reset}`);
console.log(`   Test Recipient: ${colors.magenta}${recipientEmail}${colors.reset}\n`);

// Check if essential variables are set
const missingVars: string[] = [];
if (!process.env.SMTP_HOST) missingVars.push('SMTP_HOST');
if (!process.env.SMTP_PORT) missingVars.push('SMTP_PORT');
if (!process.env.EMAIL_FROM) missingVars.push('EMAIL_FROM');

if (missingVars.length > 0) {
  console.error(`${colors.red}❌ Missing required environment variables: ${missingVars.join(', ')}${colors.reset}`);
  console.log('\nPlease set these variables in your .env file or environment.\n');

  // Show AWS SES configuration example if host looks like SES
  if (process.env.SMTP_HOST?.includes('amazonaws.com') || !process.env.SMTP_HOST) {
    console.log(`${colors.yellow}📝 For AWS SES, use these settings:${colors.reset}`);
    console.log(`   SMTP_HOST=email-smtp.[region].amazonaws.com`);
    console.log(`   SMTP_PORT=587  ${colors.blue}(or 465 for SSL, 25 for unencrypted)${colors.reset}`);
    console.log(`   SMTP_SECURE=false  ${colors.blue}(STARTTLS for port 587)${colors.reset}`);
    console.log(`   SMTP_USER=[Your AWS SES SMTP username]`);
    console.log(`   SMTP_PASS=[Your AWS SES SMTP password]`);
    console.log(`   EMAIL_FROM=[Verified sender email]\n`);
    console.log(`${colors.yellow}⚠️  Note: Use SES SMTP credentials, not IAM credentials!${colors.reset}\n`);
  }

  if (missingVars.includes('SMTP_HOST') || missingVars.includes('SMTP_PORT')) {
    process.exit(1);
  }
}

async function testEmailService() {
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}🔧 Step 1: Creating SMTP Transporter${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const transportConfig: SMTPTransport.Options = {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  };

  // Add authentication if provided
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transportConfig.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };
    console.log(`✅ Authentication configured`);
  } else {
    console.log(`⚠️  No authentication configured (SMTP_USER/SMTP_PASS not set)`);
  }

  // Create transporter
  const transporter = nodemailer.createTransport(transportConfig);
  console.log(`✅ Transporter created\n`);

  // Step 2: Verify connection
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}🔍 Step 2: Verifying SMTP Connection${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  try {
    await transporter.verify();
    console.log(`${colors.green}✅ SMTP connection verified successfully!${colors.reset}\n`);
  } catch (error: any) {
    console.error(`${colors.red}❌ SMTP connection verification failed:${colors.reset}`);
    console.error(`   Error: ${error.message}\n`);

    // Provide specific troubleshooting for common errors
    if (error.code === 'ECONNREFUSED') {
      console.log(`${colors.yellow}💡 Troubleshooting tips:${colors.reset}`);
      console.log(`   • Check if the SMTP server is running`);
      console.log(`   • Verify the host and port are correct`);
      console.log(`   • Check firewall/security group rules`);
      console.log(`   • For AWS SES, ensure you're using the correct region\n`);
    } else if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.log(`${colors.yellow}💡 Authentication failed. Check:${colors.reset}`);
      console.log(`   • SMTP username and password are correct`);
      console.log(`   • For AWS SES: Use SMTP credentials, not IAM credentials`);
      console.log(`   • Credentials might need to be base64 encoded\n`);
    } else if (error.message.includes('self signed certificate')) {
      console.log(`${colors.yellow}💡 SSL/TLS issue detected:${colors.reset}`);
      console.log(`   • Try setting SMTP_SECURE=false for STARTTLS`);
      console.log(`   • Or add rejectUnauthorized: false to config (dev only)\n`);
    }

    console.log(`Full error details:`);
    console.log(error);
    process.exit(1);
  }

  // Step 3: Send test email
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}📧 Step 3: Sending Test Email${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const testEmail = {
    from: process.env.EMAIL_FROM || 'test@example.com',
    to: recipientEmail,
    subject: `Test Email - ${new Date().toLocaleString()}`,
    html: `
      <h2>Email Service Test</h2>
      <p>This is a test email sent from the email service testing script.</p>
      <hr>
      <p><strong>Configuration Details:</strong></p>
      <ul>
        <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
        <li>SMTP Host: ${process.env.SMTP_HOST}</li>
        <li>SMTP Port: ${process.env.SMTP_PORT}</li>
        <li>Timestamp: ${new Date().toISOString()}</li>
      </ul>
      <hr>
      <p>If you received this email, your email service is configured correctly! 🎉</p>
    `,
    text: `Email Service Test

This is a test email sent from the email service testing script.

Configuration Details:
- Environment: ${process.env.NODE_ENV || 'development'}
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- Timestamp: ${new Date().toISOString()}

If you received this email, your email service is configured correctly!`,
  };

  try {
    console.log(`Sending test email to: ${colors.magenta}${recipientEmail}${colors.reset}`);
    const info = await transporter.sendMail(testEmail);

    console.log(`${colors.green}✅ Email sent successfully!${colors.reset}\n`);
    console.log(`📬 Message Details:`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);

    if (info.accepted && info.accepted.length > 0) {
      console.log(`   Accepted: ${colors.green}${info.accepted.join(', ')}${colors.reset}`);
    }

    if (info.rejected && info.rejected.length > 0) {
      console.log(`   Rejected: ${colors.red}${info.rejected.join(', ')}${colors.reset}`);
    }

    console.log(`\n${colors.green}🎉 Email service is working correctly!${colors.reset}`);

    // AWS SES specific notes
    if (process.env.SMTP_HOST?.includes('amazonaws.com')) {
      console.log(`\n${colors.yellow}📝 AWS SES Notes:${colors.reset}`);
      console.log(`   • Check AWS SES console for delivery status`);
      console.log(`   • In sandbox mode, both sender and recipient must be verified`);
      console.log(`   • Monitor your sending quota and rate limits`);
    }

  } catch (error: any) {
    console.error(`${colors.red}❌ Failed to send test email:${colors.reset}`);
    console.error(`   Error: ${error.message}\n`);

    // AWS SES specific error handling
    if (error.code === 'MessageRejected') {
      console.log(`${colors.yellow}💡 AWS SES Message Rejected:${colors.reset}`);
      console.log(`   • Verify sender email address in SES console`);
      console.log(`   • If in sandbox, verify recipient email too`);
      console.log(`   • Check for suppression list issues\n`);
    } else if (error.message.includes('Email address is not verified')) {
      console.log(`${colors.yellow}💡 Email verification required:${colors.reset}`);
      console.log(`   • Verify the sender email in AWS SES console`);
      console.log(`   • In sandbox mode, verify recipient emails too\n`);
    } else if (error.code === 'SendingQuotaExceeded') {
      console.log(`${colors.yellow}💡 AWS SES quota exceeded:${colors.reset}`);
      console.log(`   • Check your daily sending quota in SES console`);
      console.log(`   • Request a quota increase if needed\n`);
    }

    console.log(`Full error details:`);
    console.log(error);
    process.exit(1);
  }
}

// Run the test
testEmailService().catch((error) => {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
  process.exit(1);
});