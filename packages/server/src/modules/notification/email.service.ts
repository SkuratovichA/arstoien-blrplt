import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Effect } from 'effect';
import { ExternalApiError } from '@/common/effect';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private sesClient: SESClient | null = null;
  private smtpTransporter: nodemailer.Transporter | null = null;
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('app.isProduction') ?? false;

    if (this.isProduction) {
      this.initializeSesClient();
    } else {
      this.initializeSmtpTransporter();
    }
  }

  private initializeSesClient() {
    const awsRegion = this.configService.get('app.aws.region');

    if (!awsRegion) {
      this.logger.warn('AWS region not configured. Email notifications will be disabled.');
      return;
    }

    try {
      // Initialize AWS SES client
      // In App Runner, this will use the instance role for authentication
      this.sesClient = new SESClient({
        region: awsRegion,
      });

      this.logger.log(`AWS SES client initialized for region: ${awsRegion}`);
    } catch (error) {
      this.logger.error('Failed to initialize AWS SES client:', error);
    }
  }

  private initializeSmtpTransporter() {
    const emailConfig = this.configService.get('app.email');

    if (!emailConfig?.host) {
      this.logger.warn('Email configuration not found. Email notifications will be disabled.');
      return;
    }

    const transportConfig: SMTPTransport.Options = {
      host: emailConfig.host,
      port: emailConfig.port,
      // secure: true only for port 465, false for 587 (STARTTLS handles encryption)
      secure: emailConfig.port === 465,
    };

    if (emailConfig.user && emailConfig.pass) {
      transportConfig.auth = {
        user: emailConfig.user,
        pass: emailConfig.pass,
      };
    }

    this.smtpTransporter = nodemailer.createTransport(transportConfig);

    // Verify connection on startup (optional but useful)
    this.smtpTransporter
      .verify()
      .then(() =>
        this.logger.log(`SMTP transporter initialized: ${emailConfig.host}:${emailConfig.port}`)
      )
      .catch((err) => this.logger.warn(`SMTP transporter verification failed: ${err.message}`));
  }

  /**
   * Send user rejected email
   */
  sendUserRejectedEmail(
    to: string,
    data: Record<string, unknown>
  ): Effect.Effect<void, ExternalApiError, never> {
    return this.sendTemplatedEmail(to, 'Váš účet byl zamítnut', 'user-rejected', data);
  }

  /**
   * Send user verified email
   */
  sendUserVerifiedEmail(
    to: string,
    data: Record<string, unknown>
  ): Effect.Effect<void, ExternalApiError, never> {
    return this.sendTemplatedEmail(to, 'Účet byl ověřen', 'user-verified', data);
  }

  /**
   * Send email verification link
   */
  async sendVerificationEmail(email: string, verificationLink: string): Promise<void> {
    try {
      // In development mode or when email is not configured, just log the verification link
      if (!this.sesClient && !this.smtpTransporter) {
        this.logger.warn(
          `Email service not configured. Verification link for ${email}: ${verificationLink}`
        );
        return;
      }

      const effect = this.sendTemplatedEmail(
        email,
        'Email Verification - Boilerplate',
        'email-verification',
        {
          verificationLink,
        }
      );

      // Execute the effect and convert to Promise
      await Effect.runPromise(effect);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      // In development, log the link even if email fails
      if (!this.isProduction) {
        this.logger.warn(
          `Email sending failed in development. Verification link for ${email}: ${verificationLink}`
        );
        return;
      }
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send OTP code for passwordless login
   */
  async sendOtpEmail(email: string, otpCode: string): Promise<void> {
    try {
      // In development mode or when email is not configured, just log the OTP code
      if (!this.sesClient && !this.smtpTransporter) {
        this.logger.warn(`Email service not configured. OTP code for ${email}: ${otpCode}`);
        return;
      }

      const effect = this.sendTemplatedEmail(email, 'Your Login Code - Boilerplate', 'otp-login', {
        otpCode,
        expiryMinutes: 5,
      });

      // Execute the effect and convert to Promise
      await Effect.runPromise(effect);
      this.logger.log(`OTP email sent to ${email}`);
    } catch (error) {
      // In development, log the code even if email fails
      if (!this.isProduction) {
        this.logger.warn(`Email sending failed in development. OTP code for ${email}: ${otpCode}`);
        return;
      }
      this.logger.error(`Failed to send OTP email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send password reset link
   */
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    const effect = this.sendTemplatedEmail(
      email,
      'Obnovení hesla - Aukce Autobusů',
      'password-reset',
      {
        resetLink,
      }
    );

    // Execute the effect and convert to Promise
    await Effect.runPromise(effect).catch((error) => {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    });
  }

  /**
   * Send admin notification for new pending user
   */
  sendAdminNewUserNotification(
    to: string,
    data: Record<string, unknown>
  ): Effect.Effect<void, ExternalApiError, never> {
    return this.sendTemplatedEmail(
      to,
      '[Admin] Nový uživatel čeká na schválení',
      'admin-new-user',
      data
    );
  }

  /**
   * Send templated email using either SES API (production) or SMTP (development)
   */
  private sendTemplatedEmail(
    to: string,
    subject: string,
    templateName: string,
    data: Record<string, unknown>
  ): Effect.Effect<void, ExternalApiError, never> {
    const effect = Effect.tryPromise({
      try: async () => {
        if (!this.sesClient && !this.smtpTransporter) {
          this.logger.warn(
            `Email service not initialized. Skipping email to ${to} with subject: ${subject}`
          );
          // Log important data in development
          if (!this.isProduction) {
            this.logger.debug(`Email data: ${JSON.stringify(data, null, 2)}`);
          }
          return;
        }

        // Load and compile template
        const template = await this.loadTemplate(templateName);
        const html = template(data);

        // Get sender email from config
        const fromEmail = this.configService.get('app.email.from') || 'noreply@blrplt.arstoien.com';

        // Send via SES API in production, SMTP in development
        if (this.isProduction && this.sesClient) {
          await this.sendViaSes(to, fromEmail, subject, html);
        } else if (this.smtpTransporter) {
          await this.sendViaSmtp(to, fromEmail, subject, html);
        } else {
          this.logger.warn('No email transport available');
        }

        this.logger.log(`Email sent to ${to}: ${subject}`);
      },
      catch: (error) => {
        this.logger.error(`Failed to send email to ${to}:`, error);
        return new ExternalApiError({
          message: 'Failed to send email',
          service: 'Email',
          response: error,
        });
      },
    });

    // In development mode, ignore email sending errors
    if (!this.isProduction) {
      return Effect.catchAll(effect, () => {
        this.logger.warn(`Development mode: Email failure ignored`);
        return Effect.void;
      });
    }

    return effect;
  }

  /**
   * Send email via AWS SES API
   */
  private async sendViaSes(to: string, from: string, subject: string, html: string): Promise<void> {
    if (!this.sesClient) {
      throw new Error('SES client not initialized');
    }

    const command = new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const response = await this.sesClient.send(command);
    this.logger.log(`Email sent via SES (MessageId: ${response.MessageId})`);
  }

  /**
   * Send email via SMTP (for local development)
   */
  private async sendViaSmtp(to: string, from: string, subject: string, html: string): Promise<void> {
    if (!this.smtpTransporter) {
      throw new Error('SMTP transporter not initialized');
    }

    await this.smtpTransporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    this.logger.log(`Email sent via SMTP`);
  }

  /**
   * Load and cache Handlebars template
   */
  private async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    // Check cache
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    // Load template file
    // In development: src/modules/notification/templates
    // In production (built): dist/modules/notification/templates
    const basePath = this.isProduction ? 'dist' : 'src';

    const templatePath = path.join(
      process.cwd(),
      basePath,
      'modules',
      'notification',
      'templates',
      `${templateName}.hbs`
    );

    try {
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);

      // Cache template
      this.templateCache.set(templateName, template);

      return template;
    } catch (error) {
      this.logger.error(
        `Failed to load template ${templateName} from path: ${templatePath}`,
        error
      );

      // Return fallback template
      return handlebars.compile(`
        <html>
          <body>
            <h1>{{subject}}</h1>
            <p>{{message}}</p>
          </body>
        </html>
      `);
    }
  }

  /**
   * Send plain email (no template)
   */
  sendPlainEmail(
    to: string,
    subject: string,
    text: string
  ): Effect.Effect<void, ExternalApiError, never> {
    return Effect.tryPromise({
      try: async () => {
        if (!this.sesClient && !this.smtpTransporter) {
          this.logger.warn('Email service not initialized. Skipping email.');
          return;
        }

        const fromEmail = this.configService.get('app.email.from') || 'noreply@blrplt.arstoien.com';

        if (this.isProduction && this.sesClient) {
          const command = new SendEmailCommand({
            Source: fromEmail,
            Destination: {
              ToAddresses: [to],
            },
            Message: {
              Subject: {
                Data: subject,
                Charset: 'UTF-8',
              },
              Body: {
                Text: {
                  Data: text,
                  Charset: 'UTF-8',
                },
              },
            },
          });

          const response = await this.sesClient.send(command);
          this.logger.log(`Plain email sent via SES (MessageId: ${response.MessageId})`);
        } else if (this.smtpTransporter) {
          await this.smtpTransporter.sendMail({
            from: fromEmail,
            to,
            subject,
            text,
          });
          this.logger.log(`Plain email sent via SMTP`);
        }
      },
      catch: (error) => {
        this.logger.error(`Failed to send plain email to ${to}:`, error);
        return new ExternalApiError({
          message: 'Failed to send email',
          service: 'Email',
          response: error,
        });
      },
    });
  }
}
