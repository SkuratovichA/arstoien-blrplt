import { Injectable, Logger } from '@nestjs/common';
import { Effect } from 'effect';
import { PrismaService } from '@/prisma/prisma.service';
import { RefreshToken, User } from '@prisma/client';
import { DatabaseError } from '@/common/effect';

type RefreshTokenWithUser = RefreshToken & { user: User };

type CreateRefreshTokenDto = {
  token: string;
  userId: string;
  expiresAt: Date;
};

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get a valid refresh token with its associated user
   * Returns null if token doesn't exist, is expired, or is invalid
   */
  getValidTokenWithUser(
    token: string
  ): Effect.Effect<RefreshTokenWithUser | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        this.logger.debug(`Looking up refresh token: ${token.substring(0, 10)}...`);

        const refreshToken = await this.prisma.refreshToken.findUnique({
          where: { token },
          include: { user: true },
        });

        if (!refreshToken) {
          this.logger.debug('Refresh token not found');
          return null;
        }

        // Check if token is expired
        if (refreshToken.expiresAt < new Date()) {
          this.logger.debug('Refresh token expired');
          return null;
        }

        this.logger.debug(`Valid refresh token found for user: ${refreshToken.userId}`);
        return refreshToken;
      },
      catch: (error) => {
        this.logger.error('Failed to get refresh token:', error);
        return new DatabaseError({
          message: 'Failed to get refresh token',
          operation: 'getValidTokenWithUser',
          error,
        });
      },
    });
  }

  /**
   * Save a new refresh token to the database
   */
  save(dto: CreateRefreshTokenDto): Effect.Effect<RefreshToken, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        this.logger.debug(`Saving refresh token for user: ${dto.userId}`);

        const refreshToken = await this.prisma.refreshToken.create({
          data: {
            token: dto.token,
            userId: dto.userId,
            expiresAt: dto.expiresAt,
          },
        });

        this.logger.debug(`Refresh token saved with id: ${refreshToken.id}`);
        return refreshToken;
      },
      catch: (error) => {
        this.logger.error('Failed to save refresh token:', error);
        return new DatabaseError({
          message: 'Failed to save refresh token',
          operation: 'save',
          error,
        });
      },
    });
  }

  /**
   * Delete a specific refresh token
   */
  deleteToken(token: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        this.logger.debug(`Deleting refresh token: ${token.substring(0, 10)}...`);

        await this.prisma.refreshToken.deleteMany({
          where: { token },
        });

        this.logger.debug('Refresh token deleted');
      },
      catch: (error) => {
        this.logger.error('Failed to delete refresh token:', error);
        return new DatabaseError({
          message: 'Failed to delete refresh token',
          operation: 'deleteToken',
          error,
        });
      },
    });
  }

  /**
   * Delete all refresh tokens for a specific user (used for logout all devices)
   */
  deleteAllUserTokens(userId: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        this.logger.debug(`Deleting all refresh tokens for user: ${userId}`);

        const result = await this.prisma.refreshToken.deleteMany({
          where: { userId },
        });

        this.logger.debug(`Deleted ${result.count} refresh tokens for user: ${userId}`);
      },
      catch: (error) => {
        this.logger.error('Failed to delete user refresh tokens:', error);
        return new DatabaseError({
          message: 'Failed to delete user refresh tokens',
          operation: 'deleteAllUserTokens',
          error,
        });
      },
    });
  }

  /**
   * Delete expired tokens (can be run periodically for cleanup)
   */
  deleteExpiredTokens(): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        this.logger.debug('Deleting expired refresh tokens');

        const result = await this.prisma.refreshToken.deleteMany({
          where: {
            expiresAt: {
              lt: new Date(),
            },
          },
        });

        this.logger.debug(`Deleted ${result.count} expired refresh tokens`);
        return result.count;
      },
      catch: (error) => {
        this.logger.error('Failed to delete expired refresh tokens:', error);
        return new DatabaseError({
          message: 'Failed to delete expired refresh tokens',
          operation: 'deleteExpiredTokens',
          error,
        });
      },
    });
  }

  /**
   * Count active tokens for a user (useful for limiting concurrent sessions)
   */
  countUserTokens(userId: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const count = await this.prisma.refreshToken.count({
          where: {
            userId,
            expiresAt: {
              gt: new Date(),
            },
          },
        });

        this.logger.debug(`User ${userId} has ${count} active tokens`);
        return count;
      },
      catch: (error) => {
        this.logger.error('Failed to count user tokens:', error);
        return new DatabaseError({
          message: 'Failed to count user tokens',
          operation: 'countUserTokens',
          error,
        });
      },
    });
  }
}
