import { Module } from '@nestjs/common';
import { EmailService } from './email.service.js';
import { NotificationResolver } from './notification.resolver.js';
import { NotificationService } from './notification.service.js';

@Module({
  providers: [NotificationService, NotificationResolver, EmailService],
  exports: [NotificationService, EmailService],
})
export class NotificationModule {}
