import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { SettingsResolver } from './settings.resolver.js';
import { SettingsService } from './settings.service.js';

@Module({
  imports: [PrismaModule],
  providers: [SettingsService, SettingsResolver],
  exports: [SettingsService],
})
export class SettingsModule {}
