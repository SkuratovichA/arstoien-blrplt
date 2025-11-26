import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * SchedulerService - Background jobs for system maintenance
 *
 * Handles:
 * - Cleanup tasks
 * - System maintenance
 */
@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.logger.log('SchedulerService initialized - Background jobs started');
  }

  /**
   * Cleanup old notifications
   * Runs daily at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 'cleanup-old-notifications',
  })
  async cleanupOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
          readAt: {
            not: null,
          },
        },
      });

      this.logger.log(
        `✅ Cleaned up ${result.count} old read notification(s) (older than 30 days)`
      );
    } catch (error) {
      this.logger.error(
        `Error in cleanupOldNotifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
    }
  }
}
