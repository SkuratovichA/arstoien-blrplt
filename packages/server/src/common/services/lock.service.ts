import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redlock, { Lock } from 'redlock';
import Redis from 'ioredis';

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
   * Acquire a distributed lock
   * @param resource - The resource to lock (e.g., 'bid:listing:123')
   * @param ttl - Time to live in milliseconds (default: 5000ms)
   * @returns Lock instance
   */
  async acquire(resource: string, ttl: number = 5000): Promise<Lock> {
    try {
      return await this.redlock.acquire([resource], ttl);
    } catch (error) {
      throw new Error(`Failed to acquire lock for resource: ${resource}. ${error}`);
    }
  }

  /**
   * Release a distributed lock
   * @param lock - The lock instance to release
   */
  async release(lock: Lock): Promise<void> {
    try {
      await lock.release();
    } catch (error) {
      // Lock may have already expired, log but don't throw
      console.warn('Failed to release lock:', error);
    }
  }

  /**
   * Execute a function with a distributed lock
   * @param resource - The resource to lock
   * @param ttl - Time to live in milliseconds
   * @param fn - Function to execute while holding the lock
   * @returns Result of the function execution
   */
  async withLock<T>(resource: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const lock = await this.acquire(resource, ttl);
    try {
      return await fn();
    } finally {
      await this.release(lock);
    }
  }

  async onModuleDestroy() {
    await this.redlock.quit();
    await this.redisClient.quit();
  }
}
