import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { AdminResolver } from './admin.resolver.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [NotificationModule, forwardRef(() => AuthModule), SettingsModule],
  providers: [AdminService, AdminResolver],
  exports: [AdminService],
})
export class AdminModule {}
