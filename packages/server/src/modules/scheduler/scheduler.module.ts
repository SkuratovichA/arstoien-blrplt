import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { NotificationModule } from '@modules/notification/notification.module';

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
