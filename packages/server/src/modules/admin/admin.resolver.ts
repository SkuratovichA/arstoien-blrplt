import {
  Args,
  Context,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators';
import { AuditLog, Listing, User, UserRole } from '@prisma/client';
import {
  AdminPendingCountsType,
  AdminStatsType,
  ApproveListingInput,
  ApproveUserInput,
  AuditLogObjectType,
  UpdatePendingUserInput,
  UpdateUserStatusInput,
  RequestDocumentsResponseType,
} from '@modules/admin/dto';
import { UserObjectType } from '@modules/user/dto/user.object-type';
import { ListingObjectType } from '@modules/listing/dto/listing.object-type';
import { Effect } from 'effect';
import { PubSubService, PubSubEvents } from '@common/pubsub/pubsub.service';
import { PrismaService } from '@prisma/prisma.service';

@Resolver(() => ListingObjectType)
export class AdminResolver {
  constructor(
    private adminService: AdminService,
    private pubSubService: PubSubService,
    private prisma: PrismaService
  ) {}

  @Query(() => [UserObjectType], { name: 'pendingUsers' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.MODERATOR)
  async getPendingUsers(): Promise<User[]> {
    const result = await Effect.runPromise(this.adminService.getPendingUsers());
    return result;
  }

  @Query(() => [ListingObjectType], { name: 'pendingListings' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.MODERATOR)
  async getPendingListings(): Promise<Listing[]> {
    const result = await Effect.runPromise(this.adminService.getPendingListings());
    return result;
  }

  @Query(() => AdminPendingCountsType, {
    name: 'adminPendingCounts',
    description: 'Get counts of pending users and listings for admin notifications',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.MODERATOR)
  async getAdminPendingCounts(): Promise<AdminPendingCountsType> {
    return this.adminService.getPendingCounts();
  }

  @Query(() => AdminStatsType, { name: 'adminStatistics' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.MODERATOR, UserRole.SUPPORT)
  async getStatistics(): Promise<AdminStatsType> {
    const result = await Effect.runPromise(this.adminService.getStatistics());
    return result;
  }

  @Query(() => [AuditLogObjectType], { name: 'auditLogs' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async getAuditLogs(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 })
    page?: number,
    @Args('pageSize', { type: () => Int, nullable: true, defaultValue: 50 })
    pageSize?: number
  ): Promise<AuditLog[]> {
    const result = await Effect.runPromise(
      this.adminService.getAuditLogs(page ?? 1, pageSize ?? 50)
    );
    return result;
  }

  @Mutation(() => UserObjectType, { name: 'approveUser' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.MODERATOR)
  async approveUser(@Args('input') input: ApproveUserInput): Promise<User> {
    const result = await Effect.runPromise(
      this.adminService.approveUser(input.userId, input.approved, input.reason)
    );
    return result;
  }

  @Mutation(() => ListingObjectType, { name: 'approveListing' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.MODERATOR)
  async approveListing(@Args('input') input: ApproveListingInput): Promise<Listing> {
    const result = await Effect.runPromise(
      this.adminService.approveListing(input.listingId, input.approved, input.reason)
    );
    return result;
  }

  @Mutation(() => UserObjectType, { name: 'updateUserStatus' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async updateUserStatus(@Args('input') input: UpdateUserStatusInput): Promise<User> {
    const result = await Effect.runPromise(
      this.adminService.updateUserStatus(input.userId, input.status)
    );
    return result;
  }

  @Mutation(() => UserObjectType, {
    name: 'updatePendingUser',
    description: 'Update pending user company contact information before approval',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.MODERATOR)
  async updatePendingUser(@Args('input') input: UpdatePendingUserInput): Promise<User> {
    const result = await Effect.runPromise(
      this.adminService.updatePendingUser(
        input.userId,
        input.companyPhone,
        input.companyEmail,
        input.companyWebsite
      )
    );
    return result;
  }

  @Mutation(() => UserObjectType, {
    name: 'retryAresLookup',
    description: 'Retry ARES API lookup for a user with ARES error',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.MODERATOR)
  async retryAresLookup(@Args('userId') userId: string): Promise<User> {
    const result = await Effect.runPromise(this.adminService.retryAresLookup(userId));
    return result;
  }

  @Mutation(() => RequestDocumentsResponseType, {
    name: 'requestUserDocuments',
    description:
      'Request document verification from user via email to support team. Used when user registered without ICO or ARES lookup failed.',
  })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.MODERATOR)
  async requestUserDocuments(
    @Args('userId') userId: string
  ): Promise<RequestDocumentsResponseType> {
    const result = await Effect.runPromise(this.adminService.requestUserDocuments(userId));
    return result;
  }

  @Subscription(() => AdminPendingCountsType, {
    name: 'adminPendingCountsChanged',
    description: 'Subscribe to real-time updates of pending users and listings counts',
    filter: (
      payload: AdminPendingCountsType,
      variables: Record<string, unknown>,
      context: Record<string, unknown>
    ): boolean => {
      // Only send to authenticated admin users
      const user = (context as { req?: { user?: { role?: string } } }).req?.user;
      return Boolean(user && ['SUPER_ADMIN', 'MANAGER', 'MODERATOR'].includes(user.role ?? ''));
    },
  })
  adminPendingCountsChanged(@Context() _context: Record<string, unknown>) {
    return this.pubSubService.asyncIterator<AdminPendingCountsType>(
      PubSubEvents.ADMIN_PENDING_COUNTS_CHANGED
    );
  }

  @ResolveField(() => UserObjectType)
  async seller(@Parent() listing: Listing & { seller?: User }): Promise<User> {
    // If seller is already loaded by Prisma include, return it
    if (listing.seller) {
      return listing.seller;
    }

    // Otherwise, fetch it from database
    const result = await this.prisma.user.findUnique({
      where: { id: listing.sellerId },
    });

    if (!result) {
      throw new Error(`Seller not found for listing ${listing.id}`);
    }

    return result;
  }
}
