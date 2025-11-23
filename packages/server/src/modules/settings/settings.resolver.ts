import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SystemSettingsObjectType, UpdateSystemSettingsInputType } from './dto';
import { GqlAuthGuard } from '@modules/auth/guards/gql-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserRole, User } from '@prisma/client';
import { runEffect } from '@/common/effect';

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
