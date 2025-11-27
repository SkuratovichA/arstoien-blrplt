import { Injectable, Logger } from '@nestjs/common';
import { Effect } from 'effect';
import { PrismaService } from '@/prisma/prisma.service';
import { DatabaseError, promiseToEffect, ValidationError } from '@/common/effect';
import { SystemSettings } from '@prisma/client';
import { UpdateSystemSettingsInputType } from './dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly DEFAULT_SUPPORT_EMAIL = 'support@auction.com';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get system settings (creates default if doesn't exist)
   */
  getSystemSettings(): Effect.Effect<SystemSettings, DatabaseError | ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      // Try to get existing settings
      const existing = yield* promiseToEffect(() =>
        self.prisma.systemSettings.findFirst()
      );

      if (existing) {
        return existing;
      }

      // Create default settings if none exist
      self.logger.log('No system settings found, creating default settings');
      const created = yield* promiseToEffect(() =>
        self.prisma.systemSettings.create({
          data: {
            supportEmail: self.DEFAULT_SUPPORT_EMAIL,
            otpAuthEnabled: false, // Default OTP disabled
          },
        })
      );

      return created;
    });
  }

  /**
   * Get support email (async wrapper)
   */
  async getSupportEmail(): Promise<string> {
    const settings = await Effect.runPromise(this.getSystemSettings());
    return settings.supportEmail;
  }

  /**
   * Update system settings
   */
  updateSystemSettings(
    input: UpdateSystemSettingsInputType,
    userId?: string
  ): Effect.Effect<SystemSettings, DatabaseError | ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      // Get current settings
      const current = yield* self.getSystemSettings();

      // Build update data - only update fields that are provided
      const updateData: Record<string, string | boolean | undefined> = {
        updatedBy: userId,
      };

      if (input.supportEmail !== undefined) {
        updateData.supportEmail = input.supportEmail;
      }

      if (input.otpAuthEnabled !== undefined) {
        updateData.otpAuthEnabled = input.otpAuthEnabled;
      }

      // Update settings
      const updated = yield* promiseToEffect(() =>
        self.prisma.systemSettings.update({
          where: { id: current.id },
          data: updateData,
        })
      );

      self.logger.log(`System settings updated by user ${userId ?? 'unknown'}`);
      return updated;
    });
  }
}
