import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { NotificationResolver } from './notification.resolver';
import { NotificationService } from './notification.service';

@Module({
  providers: [NotificationService, NotificationResolver, EmailService],
  exports: [NotificationService, EmailService],
})
export class NotificationModule {}
