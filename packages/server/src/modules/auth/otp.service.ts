import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Effect } from 'effect';
import * as crypto from 'crypto';

interface OtpGenerationResult {
  code: string;
  expiresAt: Date;
}

interface OtpAttempt {
  email: string;
  attempts: number;
  firstAttemptAt: Date;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_EXPIRATION_MINUTES = 5;
  private readonly MAX_ATTEMPTS_PER_WINDOW = 3;
  private readonly ATTEMPT_WINDOW_MINUTES = 15;

  // In-memory rate limiting store (in production, use Redis)
  private otpAttempts = new Map<string, OtpAttempt>();

  constructor(private prisma: PrismaService) {
    // Clean up expired attempts every 5 minutes
    setInterval(() => this.cleanupExpiredAttempts(), 5 * 60 * 1000);
  }

  /**
   * Generate a 6-digit OTP code
   */
  private generateOtpCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Check if user has exceeded rate limit for OTP requests
   */
  private checkRateLimit(email: string): boolean {
    const attempt = this.otpAttempts.get(email);

    if (!attempt) {
      return true; // No previous attempts
    }

    const now = new Date();
    const windowEnd = new Date(attempt.firstAttemptAt);
    windowEnd.setMinutes(windowEnd.getMinutes() + this.ATTEMPT_WINDOW_MINUTES);

    // If outside the window, reset attempts
    if (now > windowEnd) {
      this.otpAttempts.delete(email);
      return true;
    }

    // Check if exceeded max attempts
    return attempt.attempts < this.MAX_ATTEMPTS_PER_WINDOW;
  }

  /**
   * Record an OTP attempt for rate limiting
   */
  private recordAttempt(email: string): void {
    const attempt = this.otpAttempts.get(email);
    const now = new Date();

    if (!attempt) {
      this.otpAttempts.set(email, {
        email,
        attempts: 1,
        firstAttemptAt: now,
      });
    } else {
      const windowEnd = new Date(attempt.firstAttemptAt);
      windowEnd.setMinutes(windowEnd.getMinutes() + this.ATTEMPT_WINDOW_MINUTES);

      if (now > windowEnd) {
        // Reset if outside window
        this.otpAttempts.set(email, {
          email,
          attempts: 1,
          firstAttemptAt: now,
        });
      } else {
        // Increment attempts
        attempt.attempts++;
        this.otpAttempts.set(email, attempt);
      }
    }
  }

  /**
   * Clean up expired rate limit attempts
   */
  private cleanupExpiredAttempts(): void {
    const now = new Date();

    for (const [email, attempt] of this.otpAttempts.entries()) {
      const windowEnd = new Date(attempt.firstAttemptAt);
      windowEnd.setMinutes(windowEnd.getMinutes() + this.ATTEMPT_WINDOW_MINUTES);

      if (now > windowEnd) {
        this.otpAttempts.delete(email);
      }
    }
  }

  /**
   * Generate and store OTP for a user
   */
  generateOtp(userId: string, email: string): Effect.Effect<OtpGenerationResult, Error> {
    const self = this;
    return Effect.gen(function* () {
      // Check rate limit
      if (!self.checkRateLimit(email)) {
        const remainingTime = self.ATTEMPT_WINDOW_MINUTES;
        throw new Error(
          `Too many OTP requests. Please try again in ${remainingTime} minutes.`
        );
      }

      // Record this attempt
      self.recordAttempt(email);

      // Delete any existing OTP tokens for this user
      yield* Effect.tryPromise(async () =>
        self.prisma.verificationToken.deleteMany({
          where: {
            userId,
            type: 'OTP_LOGIN',
          },
        })
      );

      // Generate new OTP
      const code = self.generateOtpCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + self.OTP_EXPIRATION_MINUTES);

      // Store OTP token
      yield* Effect.tryPromise(async () =>
        self.prisma.verificationToken.create({
          data: {
            token: code,
            userId,
            type: 'OTP_LOGIN',
            expiresAt,
          },
        })
      );

      self.logger.log(`Generated OTP for user ${userId}`);

      return {
        code,
        expiresAt,
      };
    });
  }

  /**
   * Validate OTP code for a user
   */
  validateOtp(userId: string, code: string): Effect.Effect<boolean, Error> {
    const self = this;
    return Effect.gen(function* () {
      // Find the OTP token
      const token = yield* Effect.tryPromise(async () =>
        self.prisma.verificationToken.findFirst({
          where: {
            userId,
            token: code,
            type: 'OTP_LOGIN',
          },
        })
      );

      if (!token) {
        self.logger.warn(`Invalid OTP attempt for user ${userId}`);
        return false;
      }

      // Check if expired
      const now = new Date();
      if (token.expiresAt < now) {
        self.logger.warn(`Expired OTP attempt for user ${userId}`);

        // Delete expired token
        yield* Effect.tryPromise(async () =>
          self.prisma.verificationToken.delete({
            where: { id: token.id },
          })
        );

        return false;
      }

      // Delete the token after successful validation (one-time use)
      yield* Effect.tryPromise(async () =>
        self.prisma.verificationToken.delete({
          where: { id: token.id },
        })
      );

      self.logger.log(`Valid OTP for user ${userId}`);
      return true;
    });
  }

  /**
   * Get remaining attempts for an email
   */
  getRemainingAttempts(email: string): number {
    const attempt = this.otpAttempts.get(email);

    if (!attempt) {
      return this.MAX_ATTEMPTS_PER_WINDOW;
    }

    const now = new Date();
    const windowEnd = new Date(attempt.firstAttemptAt);
    windowEnd.setMinutes(windowEnd.getMinutes() + this.ATTEMPT_WINDOW_MINUTES);

    if (now > windowEnd) {
      return this.MAX_ATTEMPTS_PER_WINDOW;
    }

    return Math.max(0, this.MAX_ATTEMPTS_PER_WINDOW - attempt.attempts);
  }

  /**
   * Clean up all OTP tokens for a user
   */
  cleanupUserOtpTokens(userId: string): Effect.Effect<void, Error> {
    const self = this;
    return Effect.gen(function* () {
      yield* Effect.tryPromise(async () =>
        self.prisma.verificationToken.deleteMany({
          where: {
            userId,
            type: 'OTP_LOGIN',
          },
        })
      );

      self.logger.log(`Cleaned up OTP tokens for user ${userId}`);
    });
  }
}