import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Effect } from 'effect';
import { ExternalApiError } from '../../common/effect';
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
      this.logger.warn('Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables.');
      return;
    }

    this.logger.log('Initializing email transporter...');
    this.logger.log(`Email configuration: host=${emailConfig.host}, port=${emailConfig.port}, from=${emailConfig.from}`);
    this.logger.log(`Authentication: ${emailConfig.user ? 'configured' : 'not configured'}`);

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
    } else {
      this.logger.warn('SMTP authentication not configured. This may cause issues with some email providers.');
    }

    this.transporter = nodemailer.createTransport(transportConfig);

    // Verify connection on startup - make it more visible if it fails
    this.transporter
      .verify()
      .then(() => {
        this.logger.log(`✅ Email transporter verified and ready: ${emailConfig.host}:${emailConfig.port}`);
        this.logger.log(`✅ Emails will be sent from: ${emailConfig.from}`);
      })
      .catch((err) => {
        this.logger.error(`❌ Email transporter verification FAILED: ${err.message}`);
        this.logger.error(`❌ Email service may not work properly. Check your SMTP configuration.`);

        // Log specific error details to help with debugging
        if (err.code === 'ECONNREFUSED') {
          this.logger.error(`Cannot connect to SMTP server at ${emailConfig.host}:${emailConfig.port}`);
          this.logger.error('Possible causes: Wrong host/port, firewall blocking, or server not running.');
        } else if (err.code === 'EAUTH' || err.responseCode === 535) {
          this.logger.error('SMTP authentication failed.');
          this.logger.error('Please verify SMTP_USER and SMTP_PASS environment variables.');
          if (emailConfig.host.includes('amazonaws.com')) {
            this.logger.error('For AWS SES: Ensure you are using SMTP credentials (not IAM credentials).');
          }
        }
      });
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
    } catch (error: any) {
      // Always log the full error for debugging
      this.logger.error(`Failed to send verification email to ${email}: ${error?.message || error}`);

      // In development, log the link so developers can still test
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `Development mode: Verification link for ${email}: ${verificationLink}`
        );
        return;
      }

      // In production, throw the error to notify the calling code
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
    } catch (error: any) {
      // Always log the full error for debugging
      this.logger.error(`Failed to send OTP email to ${email}: ${error?.message || error}`);

      // In development, log the code so developers can still test
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`Development mode: OTP code for ${email}: ${otpCode}`);
        return;
      }

      // In production, throw the error to notify the calling code
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
    this.logger.log(`Attempting to send admin notification to ${to} for user ${data.email}`);
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

    this.logger.debug(`sendTemplatedEmail called: to=${to}, subject=${subject}, template=${templateName}`);

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

        // Prepare email options
        const mailOptions = {
          from: this.configService.get('app.email.from'),
          to,
          subject,
          html,
        };

        this.logger.debug(`Attempting to send email via SMTP to ${to} with subject: ${subject}`);
        this.logger.debug(`SMTP Host: ${this.configService.get('app.email.host')}:${this.configService.get('app.email.port')}`);

        // Send email
        const result = await this.transporter.sendMail(mailOptions);

        this.logger.log(`Email successfully sent to ${to}: ${subject}`);
        this.logger.debug(`SMTP Response - MessageId: ${result.messageId}, Response: ${JSON.stringify(result.response)}, Accepted: ${JSON.stringify(result.accepted)}, Rejected: ${JSON.stringify(result.rejected)}`);
      },
      catch: (error: any) => {
        // Enhanced error logging for AWS SES and SMTP errors
        this.logger.error(`Failed to send email to ${to}: ${error?.message || error}`);

        // Log specific AWS SES error details
        if (error?.code) {
          this.logger.error(`Error code: ${error.code}`);

          // Common AWS SES error codes
          if (error.code === 'MessageRejected') {
            this.logger.error('AWS SES rejected the message. Check if the sender email is verified.');
          } else if (error.code === 'SendingQuotaExceeded') {
            this.logger.error('AWS SES sending quota exceeded.');
          } else if (error.code === 'MaxSendingRateExceeded') {
            this.logger.error('AWS SES maximum sending rate exceeded.');
          } else if (error.code === 'ECONNREFUSED') {
            this.logger.error(`Cannot connect to SMTP server at ${this.configService.get('app.email.host')}:${this.configService.get('app.email.port')}`);
          } else if (error.code === 'EAUTH') {
            this.logger.error('SMTP authentication failed. Check SMTP_USER and SMTP_PASS environment variables.');
          }
        }

        // Log the full error stack for debugging
        if (error?.stack) {
          this.logger.debug(`Error stack: ${error.stack}`);
        }

        // Log response details if available
        if (error?.response) {
          this.logger.error(`SMTP Response: ${error.response}`);
        }

        return new ExternalApiError({
          message: `Failed to send email: ${error?.message || 'Unknown error'}`,
          service: 'Email',
          response: error,
        });
      },
    });

    // In development mode, log errors but don't fail the operation
    if (isDevelopment) {
      return Effect.catchAll(effect, (error) => {
        this.logger.warn(`Development mode: Email sending failed but operation continues`);
        this.logger.warn(`Email error details: ${error?.message || JSON.stringify(error)}`);
        // Still return void to not break the flow, but we've logged the error
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

      this.logger.debug(`Successfully loaded email template: ${templateName}`);
      return template;
    } catch (error: any) {
      this.logger.error(
        `Failed to load template ${templateName} from path: ${templatePath}`,
        error?.message || error
      );

      // Check if file exists
      try {
        await fs.access(templatePath);
        this.logger.error(`Template file exists but cannot be read. Check permissions.`);
      } catch {
        this.logger.error(`Template file does not exist at: ${templatePath}`);
        this.logger.error(`Current working directory: ${process.cwd()}`);

        // Try to list available templates
        const templatesDir = path.dirname(templatePath);
        try {
          const files = await fs.readdir(templatesDir);
          this.logger.error(`Available templates in ${templatesDir}: ${files.join(', ')}`);
        } catch {
          this.logger.error(`Cannot read templates directory: ${templatesDir}`);
        }
      }

      // Return a more intelligent fallback template based on the template name
      const fallbackTemplates: Record<string, string> = {
        'admin-new-user': `
          <html>
            <body>
              <h2>New User Registration</h2>
              <p>A new user has registered and requires approval.</p>
              <p>Email: {{email}}</p>
              <p>Name: {{firstName}} {{lastName}}</p>
            </body>
          </html>
        `,
        'email-verification': `
          <html>
            <body>
              <h2>Email Verification</h2>
              <p>Please verify your email address.</p>
              <p>{{verificationLink}}</p>
            </body>
          </html>
        `,
        'otp-login': `
          <html>
            <body>
              <h2>One-Time Password</h2>
              <p>Your OTP code is: {{otp}}</p>
              <p>This code expires in {{expiresIn}} minutes.</p>
            </body>
          </html>
        `,
      };

      const fallbackHtml = fallbackTemplates[templateName] || `
        <html>
          <body>
            <h2>Email Notification</h2>
            <p>Template loading failed. Please contact support.</p>
            <pre>${JSON.stringify({ templateName, data: '{{data}}' }, null, 2)}</pre>
          </body>
        </html>
      `;

      this.logger.warn(`Using fallback template for: ${templateName}`);
      return handlebars.compile(fallbackHtml);
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