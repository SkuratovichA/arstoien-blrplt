import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { runEffect } from '../../common/effect/index.js';
import { User, UserRole } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { SystemSettingsObjectType, UpdateSystemSettingsInputType } from './dto/index.js';
import { SettingsService } from './settings.service.js';

@Resolver(() => SystemSettingsObjectType)
export class SettingsResolver {
  constructor(private readonly settingsService: SettingsService) {}

  @Query(() => SystemSettingsObjectType, {
    description: 'Get system settings (admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async systemSettings(): Promise<SystemSettingsObjectType> {
    return runEffect(this.settingsService.getSystemSettings());
  }

  @Mutation(() => SystemSettingsObjectType, {
    description: 'Update system settings (admin only)',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async updateSystemSettings(
    @CurrentUser() user: User,
    @Args('input') input: UpdateSystemSettingsInputType
  ): Promise<SystemSettingsObjectType> {
    return runEffect(this.settingsService.updateSystemSettings(input, user.id));
  }
}
