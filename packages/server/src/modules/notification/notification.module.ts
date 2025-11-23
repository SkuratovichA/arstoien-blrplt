import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationResolver } from './notification.resolver';
import { EmailService } from './email.service';

@Module({
  providers: [NotificationService, NotificationResolver, EmailService],
  exports: [NotificationService, EmailService],
})
export class NotificationModule {}
