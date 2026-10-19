import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User, UserRole } from '@prisma/client';
import { runEffect } from '../../common/effect';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SystemSettingsObjectType, UpdateSystemSettingsInputType } from './dto';
import { SettingsService } from './settings.service';

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
