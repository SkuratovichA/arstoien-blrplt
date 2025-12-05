import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
  database: 'connected' | 'disconnected';
}

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<HealthCheckResult> {
    let databaseStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch {
      databaseStatus = 'disconnected';
    }

    return {
      status: databaseStatus === 'connected' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      database: databaseStatus,
    };
  }
}
