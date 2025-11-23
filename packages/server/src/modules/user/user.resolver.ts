import { Query, Resolver, Args, ID, Mutation } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { Effect } from 'effect';
import { UserService } from './user.service';
import { UserObjectType } from './dto/user.object-type';
import { UpdateProfileInputType } from './dto/update-profile.input-type';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, Roles } from '@modules/auth/decorators';
import { User, UserRole } from '@prisma/client';

@Resolver(() => UserObjectType)
export class UserResolver {
  private readonly logger = new Logger(UserResolver.name);

  constructor(private _userService: UserService) {}

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
      this._userService.updateUserWithCompany(user.id, input)
    ).catch((error) => {
      this.logger.error('Failed to update user profile:', error);
      throw error;
    });

    return updatedUser as UserObjectType;
  }
}
