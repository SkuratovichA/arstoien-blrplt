import * as crypto from 'node:crypto';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Clock, Data, Duration, Effect, ManagedRuntime } from 'effect';
import {
  type DatabaseError,
  promiseToEffect,
  type RateLimitError,
  type ValidationError,
} from '../../common/effect/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { OtpRateLimiter } from './otp-rate-limiter.js';

const OTP_TOKEN_TYPE = 'OTP_LOGIN';
const OTP_EXPIRATION = Duration.minutes(5);

type RateLimiter = (typeof OtpRateLimiter)['Service'];

interface OtpGenerationResult {
  code: string;
  expiresAt: Date;
}

/**
 * No OTP token of the user matches the code
 */
export class OtpInvalidError extends Data.TaggedError('OtpInvalidError')<{
  message: string;
}> {}

/**
 * The OTP token matches the code, but it is past its expiry
 */
export class OtpExpiredError extends Data.TaggedError('OtpExpiredError')<{
  message: string;
}> {}

@Injectable()
export class OtpService implements OnModuleDestroy {
  private readonly logger = new Logger(OtpService.name);

  // The runtime builds the rate limiter layer once and keeps its state for the life of the application
  private readonly runtime = ManagedRuntime.make(OtpRateLimiter.layer);

  constructor(private prisma: PrismaService) {}

  /**
   * Closes the scope of the rate limiter layer, which stops its cleanup fiber
   */
  async onModuleDestroy(): Promise<void> {
    await this.runtime.dispose();
  }

  /**
   * Generate a 6-digit OTP code
   */
  private generateOtpCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Run a rate limiter operation with the service that the runtime built
   */
  private withRateLimiter<A, E>(
    use: (limiter: RateLimiter) => Effect.Effect<A, E>
  ): Effect.Effect<A, E> {
    return Effect.flatMap(this.runtime.contextEffect, (context) =>
      OtpRateLimiter.use(use).pipe(Effect.provideContext(context))
    );
  }

  /**
   * Generate and store OTP for a user
   */
  generateOtp(
    userId: string,
    email: string
  ): Effect.Effect<OtpGenerationResult, RateLimitError | DatabaseError | ValidationError> {
    return Effect.gen({ self: this }, function* () {
      // Fails with RateLimitError after too many requests of the email
      yield* this.withRateLimiter((limiter) => limiter.consume(email));

      // Delete any existing OTP tokens for this user
      yield* promiseToEffect(() =>
        this.prisma.verificationToken.deleteMany({
          where: { userId, type: OTP_TOKEN_TYPE },
        })
      );

      // Generate new OTP
      const code = this.generateOtpCode();
      const now = yield* Clock.currentTimeMillis;
      const expiresAt = new Date(now + Duration.toMillis(OTP_EXPIRATION));

      // Store OTP token
      yield* promiseToEffect(() =>
        this.prisma.verificationToken.create({
          data: { token: code, userId, type: OTP_TOKEN_TYPE, expiresAt },
        })
      );

      this.logger.log(`Generated OTP for user ${userId}`);

      return { code, expiresAt };
    });
  }

  /**
   * Validate OTP code for a user. Succeeds when the code is valid; a token is single use, so it is deleted whether it was valid or expired.
   */
  validateOtp(
    userId: string,
    code: string
  ): Effect.Effect<void, OtpInvalidError | OtpExpiredError | DatabaseError | ValidationError> {
    return Effect.gen({ self: this }, function* () {
      const token = yield* promiseToEffect(() =>
        this.prisma.verificationToken.findFirst({
          where: { userId, token: code, type: OTP_TOKEN_TYPE },
        })
      );

      if (!token) {
        this.logger.warn(`Invalid OTP attempt for user ${userId}`);
        return yield* new OtpInvalidError({ message: 'Invalid OTP code' });
      }

      yield* promiseToEffect(() =>
        this.prisma.verificationToken.delete({ where: { id: token.id } })
      );

      const now = yield* Clock.currentTimeMillis;
      if (token.expiresAt.getTime() < now) {
        this.logger.warn(`Expired OTP attempt for user ${userId}`);
        return yield* new OtpExpiredError({ message: 'Expired OTP code' });
      }

      this.logger.log(`Valid OTP for user ${userId}`);
    });
  }

  /**
   * Get remaining attempts for an email
   */
  getRemainingAttempts(email: string): Effect.Effect<number> {
    return this.withRateLimiter((limiter) => limiter.remaining(email));
  }

  /**
   * Clean up all OTP tokens for a user
   */
  cleanupUserOtpTokens(userId: string): Effect.Effect<void, DatabaseError | ValidationError> {
    return Effect.gen({ self: this }, function* () {
      yield* promiseToEffect(() =>
        this.prisma.verificationToken.deleteMany({
          where: { userId, type: OTP_TOKEN_TYPE },
        })
      );

      this.logger.log(`Cleaned up OTP tokens for user ${userId}`);
    });
  }
}
