import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

export enum PubSubEvents {
  // Bidding events
  BID_PLACED = 'bidPlaced',
  BID_RETRACTED = 'bidRetracted',
  AUCTION_UPDATED = 'auctionUpdated',
  AUCTION_ENDED = 'auctionEnded',

  // Notification events
  NOTIFICATION_CREATED = 'notificationCreated',

  // Payment events
  PAYMENT_RECEIVED = 'paymentReceived',
  DEPOSIT_CAPTURED = 'depositCaptured',
  DEPOSIT_RELEASED = 'depositReleased',

  // Admin events
  ADMIN_PENDING_COUNTS_CHANGED = 'adminPendingCountsChanged',
}

@Injectable()
export class PubSubService implements OnModuleDestroy {
  private pubSub: RedisPubSub;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url') ?? '';
    const redisOptions = this.parseRedisUrl(redisUrl);

    this.pubSub = new RedisPubSub({
      publisher: new Redis(redisOptions),
      subscriber: new Redis(redisOptions),
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

  async publish(event: PubSubEvents | string, payload: unknown): Promise<void> {
    await this.pubSub.publish(event, payload);
  }

  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return this.pubSub.asyncIterator<T>(triggers);
  }

  async onModuleDestroy() {
    await this.pubSub.close();
  }
}
