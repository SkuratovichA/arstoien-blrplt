import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Effect } from 'effect';
import { ExternalApiError } from '@/common/effect';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
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

    this.transporter = nodemailer.createTransport(transportConfig);

    // Verify connection on startup (optional but useful)
    this.transporter
      .verify()
      .then(() =>
        this.logger.log(`Email transporter initialized: ${emailConfig.host}:${emailConfig.port}`)
      )
      .catch((err) => this.logger.warn(`Email transporter verification failed: ${err.message}`));
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
      if (!this.transporter) {
        this.logger.warn(
          `Email transporter not configured. Verification link for ${email}: ${verificationLink}`
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
      if (process.env.NODE_ENV !== 'production') {
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
      if (!this.transporter) {
        this.logger.warn(`Email transporter not configured. OTP code for ${email}: ${otpCode}`);
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
      if (process.env.NODE_ENV !== 'production') {
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
   * Send templated email
   */
  private sendTemplatedEmail(
    to: string,
    subject: string,
    templateName: string,
    data: Record<string, unknown>
  ): Effect.Effect<void, ExternalApiError, never> {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    const effect = Effect.tryPromise({
      try: async () => {
        if (!this.transporter) {
          this.logger.warn(
            `Email transporter not initialized. Skipping email to ${to} with subject: ${subject}`
          );
          // Log important data in development
          if (isDevelopment) {
            this.logger.debug(`Email data: ${JSON.stringify(data, null, 2)}`);
          }
          return;
        }

        // Load and compile template
        const template = await this.loadTemplate(templateName);
        const html = template(data);

        // Send email
        await this.transporter.sendMail({
          from: this.configService.get('app.email.from'),
          to,
          subject,
          html,
        });

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
    if (isDevelopment) {
      return Effect.catchAll(effect, () => {
        this.logger.warn(`Development mode: Email failure ignored`);
        return Effect.void;
      });
    }

    return effect;
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
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const basePath = isDevelopment ? 'src' : 'dist';

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
        if (!this.transporter) {
          this.logger.warn('Email transporter not initialized. Skipping email.');
          return;
        }

        await this.transporter.sendMail({
          from: this.configService.get('app.email.from'),
          to,
          subject,
          text,
        });

        this.logger.log(`Plain email sent to ${to}: ${subject}`);
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
