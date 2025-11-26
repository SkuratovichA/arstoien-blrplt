import { Module, forwardRef } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminResolver } from './admin.resolver';
import { NotificationModule } from '@modules/notification/notification.module';
import { AuthModule } from '@modules/auth/auth.module';
import { SettingsModule } from '@modules/settings/settings.module';

@Module({
  imports: [NotificationModule, forwardRef(() => AuthModule), SettingsModule],
  providers: [AdminService, AdminResolver],
  exports: [AdminService],
})
export class AdminModule {}
