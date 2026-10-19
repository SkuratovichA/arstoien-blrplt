import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from '../notification/notification.module.js';
import { SchedulerService } from './scheduler.service.js';

/**
 * SchedulerModule - Background jobs for auction lifecycle
 *
 * Provides scheduled tasks for:
 * - Listing activation (SCHEDULED → ACTIVE)
 * - Auction ending (ACTIVE → ENDED)
 * - Cleanup tasks
 */
@Module({
  imports: [ScheduleModule.forRoot(), NotificationModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
