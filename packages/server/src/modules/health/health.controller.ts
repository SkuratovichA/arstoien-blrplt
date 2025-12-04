import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  checks: {
    database: 'ok' | 'error';
  };
}

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: 'ok',
      },
    };

    // Check database connection
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      result.status = 'error';
      result.checks.database = 'error';
    }

    return result;
  }
}
