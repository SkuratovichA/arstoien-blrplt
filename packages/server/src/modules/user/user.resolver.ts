import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { Effect } from 'effect';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UserObjectType } from './dto/user.object-type';
import { UpdateProfileInputType } from './dto/update-profile.input-type';
import { ChangePasswordInputType } from './dto/change-password.input-type';
import { BasicResponse } from './dto/basic-response.dto';
import { DeleteAccountInputType } from './dto/delete-account.input-type';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, Roles } from '@modules/auth/decorators';

@Resolver(() => UserObjectType)
export class UserResolver {
  private readonly logger = new Logger(UserResolver.name);

  constructor(
    private _userService: UserService,
    private authService: AuthService,
    private prisma: PrismaService
  ) {}

  @Query(() => UserObjectType, {
    nullable: true,
    description: 'Get the currently authenticated user',
  })
  @UseGuards(GqlAuthGuard)
  async currentUser(@CurrentUser() user: User): Promise<UserObjectType | null> {
    if (!user) {
      return null;
    }

    this.logger.debug(`Fetching current user with company: ${user.id}`);

    // Fetch user with company relation included
    const userWithCompany = await Effect.runPromise(
      this._userService.findByIdWithCompany(user.id)
    ).catch((error) => {
      this.logger.error('Failed to fetch user with company:', error);
      return null;
    });

    if (!userWithCompany) {
      this.logger.warn(`User not found: ${user.id}`);
      return null;
    }

    return userWithCompany as UserObjectType;
  }

  @Query(() => UserObjectType, { nullable: true, description: 'Get user by ID (admin only)' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.MODERATOR)
  async user(@Args('id', { type: () => ID }) id: string): Promise<UserObjectType | null> {
    this.logger.debug(`Admin fetching user: ${id}`);

    const userWithCompany = await Effect.runPromise(
      this._userService.findByIdWithCompany(id)
    ).catch((error) => {
      this.logger.error('Failed to fetch user:', error);
      return null;
    });

    if (!userWithCompany) {
      this.logger.warn(`User not found: ${id}`);
      return null;
    }

    return userWithCompany as UserObjectType;
  }

  @Mutation(() => UserObjectType, {
    description: 'Update current user profile (including locale and currency preferences)',
  })
  @UseGuards(GqlAuthGuard)
  async updateProfile(
    @CurrentUser() user: User,
    @Args('input') input: UpdateProfileInputType,
  ): Promise<UserObjectType> {
    this.logger.debug(`Updating profile for user: ${user.id}`);

    const updatedUser = await Effect.runPromise(
      this._userService.updateUser(user.id, input)
    ).catch((error) => {
      this.logger.error('Failed to update user profile:', error);
      throw error;
    });

    return updatedUser as UserObjectType;
  }

  @Mutation(() => BasicResponse, {
    description: 'Change user password',
  })
  @UseGuards(GqlAuthGuard)
  async changePassword(
    @CurrentUser() user: User,
    @Args('input') input: ChangePasswordInputType,
  ): Promise<BasicResponse> {
    this.logger.log(`Password change requested for user: ${user.id}`);

    try {
      // Fetch user with password hash
      const userWithPassword = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!userWithPassword || !userWithPassword.passwordHash) {
        this.logger.error(`User not found or no password set: ${user.id}`);
        return {
          success: false,
          message: 'Unable to change password',
        };
      }

      // Validate current password
      const isPasswordValid = await bcrypt.compare(
        input.currentPassword,
        userWithPassword.passwordHash
      );

      if (!isPasswordValid) {
        this.logger.warn(`Invalid current password for user: ${user.id}`);
        return {
          success: false,
          message: 'Current password is incorrect',
        };
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

      // Update password
      await Effect.runPromise(
        this._userService.updatePassword(user.id, newPasswordHash)
      );

      this.logger.log(`Password changed successfully for user: ${user.id}`);
      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      this.logger.error('Failed to change password:', error);
      return {
        success: false,
        message: 'Failed to change password',
      };
    }
  }

  @Mutation(() => BasicResponse, {
    description: 'Delete user account',
  })
  @UseGuards(GqlAuthGuard)
  async deleteAccount(
    @CurrentUser() user: User,
    @Args('input') input: DeleteAccountInputType,
  ): Promise<BasicResponse> {
    this.logger.log(`Account deletion requested for user: ${user.id}`);

    try {
      // Fetch user with password hash
      const userWithPassword = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!userWithPassword) {
        this.logger.error(`User not found: ${user.id}`);
        return {
          success: false,
          message: 'User not found',
        };
      }

      // If user has password, verify it
      if (userWithPassword.passwordHash) {
        if (!input.password) {
          return {
            success: false,
            message: 'Password is required for account deletion',
          };
        }

        const isPasswordValid = await bcrypt.compare(
          input.password,
          userWithPassword.passwordHash
        );

        if (!isPasswordValid) {
          this.logger.warn(`Invalid password for account deletion: ${user.id}`);
          return {
            success: false,
            message: 'Invalid password',
          };
        }
      }

      // Verify confirmation text
      if (input.confirmText !== 'DELETE MY ACCOUNT') {
        return {
          success: false,
          message: 'Invalid confirmation text',
        };
      }

      // Create audit log entry before deletion
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_ACCOUNT_DELETED',
          entityType: 'User',
          entityId: user.id,
          metadata: {
            email: userWithPassword.email,
            deletedAt: new Date().toISOString(),
            reason: input.reason ?? 'User requested deletion',
          } as Prisma.InputJsonValue,
        },
      });

      // Soft delete or hard delete based on requirements
      // For now, doing soft delete by updating status
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'DELETED',
          email: `deleted_${user.id}_${userWithPassword.email}`, // Preserve uniqueness constraint
          deletedAt: new Date(),
        },
      });

      // Alternative: Hard delete (use with caution)
      // await this.prisma.user.delete({
      //   where: { id: user.id },
      // });

      this.logger.log(`Account deleted successfully for user: ${user.id}`);
      return {
        success: true,
        message: 'Account deleted successfully',
      };
    } catch (error) {
      this.logger.error('Failed to delete account:', error);
      return {
        success: false,
        message: 'Failed to delete account',
      };
    }
  }
}
