import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redlock, { Lock } from 'redlock';
import Redis from 'ioredis';
import { Effect, Data, pipe } from 'effect';
import { BusinessLogicError } from '../effect/errors';

/**
 * Lock acquisition error
 */
export class LockAcquisitionError extends Data.TaggedError('LockAcquisitionError')<{
  message: string;
  resource: string;
  cause?: unknown;
}> {}

/**
 * Lock release error
 */
export class LockReleaseError extends Data.TaggedError('LockReleaseError')<{
  message: string;
  lockId?: string;
  cause?: unknown;
}> {}

@Injectable()
export class LockService implements OnModuleDestroy {
  private redlock: Redlock;
  private redisClient: Redis;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url') ?? 'redis://localhost:6379';

    // Parse Redis URL
    const parsedUrl = this.parseRedisUrl(redisUrl);

    this.redisClient = new Redis(parsedUrl);

    this.redlock = new Redlock([this.redisClient], {
      // Retry configuration
      retryCount: 3,
      retryDelay: 200, // ms
      retryJitter: 100, // ms
      // Lock drift factor
      driftFactor: 0.01,
      // Automatic lock extension is disabled by default
      automaticExtensionThreshold: 500,
    });

    // Handle Redlock errors
    this.redlock.on('error', (error) => {
      console.error('Redlock error:', error);
    });
  }

  private parseRedisUrl(url: string) {
    if (!url) {
      return { host: 'localhost', port: 6379 };
    }

    try {
      const parsedUrl = new URL(url);
      return {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port ?? '6379', 10),
        password: parsedUrl.password || undefined,
        username: parsedUrl.username || undefined,
      };
    } catch {
      return { host: 'localhost', port: 6379 };
    }
  }

  /**
   * Acquire a distributed lock (Effect version)
   * @param resource - The resource to lock
   * @param ttl - Time to live in milliseconds (default: 5000ms)
   * @returns Effect containing Lock instance
   */
  acquireEffect(resource: string, ttl: number = 5000): Effect.Effect<Lock, LockAcquisitionError> {
    return Effect.tryPromise({
      try: () => this.redlock.acquire([resource], ttl),
      catch: (error) =>
        new LockAcquisitionError({
          message: `Failed to acquire lock for resource: ${resource}`,
          resource,
          cause: error,
        }),
    });
  }

  /**
   * Release a distributed lock (Effect version)
   * @param lock - The lock instance to release
   * @returns Effect indicating success or logged warning
   */
  releaseEffect(lock: Lock): Effect.Effect<void, never> {
    return Effect.tryPromise({
      try: () => lock.release(),
      catch: (error) => {
        // Lock may have already expired, log but don't throw
        console.warn('Failed to release lock:', error);
        return undefined;
      },
    }).pipe(
      Effect.catchAll(() => Effect.succeed(undefined))
    );
  }

  /**
   * Execute a function with a distributed lock (Effect version)
   * @param resource - The resource to lock
   * @param ttl - Time to live in milliseconds
   * @param fn - Effect function to execute while holding the lock
   * @returns Effect containing result of the function execution
   */
  withLockEffect<E, R, A>(
    resource: string,
    ttl: number,
    fn: Effect.Effect<A, E, R>
  ): Effect.Effect<A, E | LockAcquisitionError, R> {
    return pipe(
      this.acquireEffect(resource, ttl),
      Effect.flatMap(lock =>
        pipe(
          fn,
          Effect.ensuring(this.releaseEffect(lock))
        )
      )
    );
  }

  /**
   * Legacy Promise-based acquire method
   * @deprecated Use acquireEffect instead
   */
  async acquire(resource: string, ttl: number = 5000): Promise<Lock> {
    return Effect.runPromise(this.acquireEffect(resource, ttl));
  }

  /**
   * Legacy Promise-based release method
   * @deprecated Use releaseEffect instead
   */
  async release(lock: Lock): Promise<void> {
    return Effect.runPromise(this.releaseEffect(lock));
  }

  /**
   * Legacy Promise-based withLock method
   * @deprecated Use withLockEffect instead
   */
  async withLock<T>(resource: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    return Effect.runPromise(
      this.withLockEffect(
        resource,
        ttl,
        Effect.tryPromise({
          try: fn,
          catch: (error) =>
            new BusinessLogicError({
              message: 'Lock operation failed',
              code: 'LOCK_OPERATION_FAILED',
            }),
        })
      )
    );
  }

  async onModuleDestroy() {
    await this.redlock.quit();
    await this.redisClient.quit();
  }
}
