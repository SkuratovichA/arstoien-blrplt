import { AuthModule } from '@modules/auth/auth.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { SettingsModule } from '@modules/settings/settings.module';
import { forwardRef, Module } from '@nestjs/common';
import { AdminResolver } from './admin.resolver';
import { AdminService } from './admin.service';

@Module({
  imports: [NotificationModule, forwardRef(() => AuthModule), SettingsModule],
  providers: [AdminService, AdminResolver],
  exports: [AdminService],
})
export class AdminModule {}
