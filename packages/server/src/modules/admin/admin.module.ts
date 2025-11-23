import { Module, forwardRef } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminResolver } from './admin.resolver';
import { NotificationModule } from '@modules/notification/notification.module';
import { AuthModule } from '@modules/auth/auth.module';
import { CompanyModule } from '@modules/company/company.module';
import { SettingsModule } from '@modules/settings/settings.module';

@Module({
  imports: [NotificationModule, forwardRef(() => AuthModule), CompanyModule, SettingsModule],
  providers: [AdminService, AdminResolver],
  exports: [AdminService],
})
export class AdminModule {}
