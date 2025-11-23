import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    // Fallback to process.env.DATABASE_URL for tests where ConfigModule might not be fully initialized
    const databaseUrl = configService.get('database.url') ?? process.env.DATABASE_URL;

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log:
        configService.get('nodeEnv') === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
