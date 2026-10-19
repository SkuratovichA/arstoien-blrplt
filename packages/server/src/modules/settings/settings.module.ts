import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsResolver } from './settings.resolver';
import { SettingsService } from './settings.service';

@Module({
  imports: [PrismaModule],
  providers: [SettingsService, SettingsResolver],
  exports: [SettingsService],
})
export class SettingsModule {}
