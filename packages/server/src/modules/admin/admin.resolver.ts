import { Args, Context, ID, Int, Mutation, Query, Resolver, Subscription, } from '@nestjs/graphql';
import { Logger, UseGuards } from '@nestjs/common';
import { Action, CurrentUser, Permissions, RequireAuditLogAccess, RequireStatisticsAccess, Resource, } from '@modules/auth/decorators';
import { AdminService } from './admin.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { AuditLog, Prisma, User } from '@prisma/client';
import { AdminPendingCountsType, AdminStatsType, ApproveUserInput, AuditLogObjectType, CreateUserInput, DeleteUserInput, RecentActivityType, RejectUserInput, UpdateUserInput, UpdateUserStatusInput, UserGrowthDataPoint, UserGrowthStatsType, } from '@modules/admin/dto';
import { UserObjectType } from '@modules/user/dto/user.object-type';
import { Effect } from 'effect';
import { PubSubEvents, PubSubService } from '@common/pubsub/pubsub.service';
import { PrismaService } from '@prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Resolver()
export class AdminResolver {
  private readonly logger = new Logger(AdminResolver.name);

  constructor(
    private adminService: AdminService,
    private pubSubService: PubSubService,
    private prisma: PrismaService
  ) {}

  @Query(() => [UserObjectType], { name: 'pendingUsers' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({ resource: Resource.USER, action: Action.READ })
  async getPendingUsers(): Promise<User[]> {
    const result = await Effect.runPromise(this.adminService.getPendingUsers());
    return result;
  }

  @Query(() => UserObjectType, { name: 'user' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({ resource: Resource.USER, action: Action.READ })
  async getUser(@Args('id', { type: () => ID }) id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error(`User not found: ${id}`);
    }

    return user;
  }

  @Query(() => AdminPendingCountsType, {
    name: 'adminPendingCounts',
    description: 'Get counts of pending users for admin notifications',
  })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({ resource: Resource.USER, action: Action.READ })
  async getAdminPendingCounts(): Promise<AdminPendingCountsType> {
    return this.adminService.getPendingCounts();
  }

  @Query(() => AdminStatsType, { name: 'adminStatistics' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @RequireStatisticsAccess()
  async getStatistics(): Promise<AdminStatsType> {
    const result = await Effect.runPromise(this.adminService.getStatistics());
    return result;
  }

  @Query(() => UserGrowthStatsType, { name: 'userGrowthStats' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @RequireStatisticsAccess()
  async getUserGrowthStats(
    @Args('months', { type: () => Int, nullable: true, defaultValue: 6 })
    months?: number
  ): Promise<UserGrowthStatsType> {
    const monthsToFetch = months ?? 6;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsToFetch);

    // Get all users created within the date range
    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get total users before the start date
    const usersBeforeStart = await this.prisma.user.count({
      where: {
        createdAt: {
          lt: startDate,
        },
      },
    });

    // Generate data points for each month
    const dataPoints: UserGrowthDataPoint[] = [];

    for (let i = 0; i < monthsToFetch; i++) {
      const periodStart = new Date(startDate);
      periodStart.setMonth(periodStart.getMonth() + i);

      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      // Count users created up to this period (cumulative)
      const usersUpToPeriod = users.filter(u =>
        new Date(u.createdAt) < periodEnd
      );

      // Count new users in this specific period
      const newUsersInPeriod = users.filter(u => {
        const createdAt = new Date(u.createdAt);
        return createdAt >= periodStart && createdAt < periodEnd;
      });

      // Count active users (not suspended, blocked, or deleted)
      const activeUsersInPeriod = usersUpToPeriod.filter(u =>
        u.status === 'ACTIVE' || u.status === 'PENDING_APPROVAL' || u.status === 'FRESHLY_CREATED_REQUIRES_PASSWORD'
      );

      // Count pending users
      const pendingUsersInPeriod = usersUpToPeriod.filter(u =>
        u.status === 'PENDING_APPROVAL' || u.status === 'FRESHLY_CREATED_REQUIRES_PASSWORD'
      );

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const periodLabel = `${monthNames[periodStart.getMonth()]}`;

      dataPoints.push({
        period: periodLabel,
        totalUsers: usersBeforeStart + usersUpToPeriod.length,
        activeUsers: activeUsersInPeriod.length,
        newUsers: newUsersInPeriod.length,
        pendingUsers: pendingUsersInPeriod.length,
      });
    }

    return {
      data: dataPoints,
      startDate,
      endDate,
    };
  }

  @Query(() => [AuditLogObjectType], { name: 'auditLogs' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @RequireAuditLogAccess()
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
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({ resource: Resource.USER, action: Action.APPROVE })
  async approveUser(@Args('input') input: ApproveUserInput): Promise<User> {
    const result = await Effect.runPromise(
      this.adminService.approveUser(input.userId, input.approved, input.reason)
    );
    return result;
  }

  @Mutation(() => UserObjectType, { name: 'updateUserStatus' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({ resource: Resource.USER, action: Action.UPDATE })
  async updateUserStatus(@Args('input') input: UpdateUserStatusInput): Promise<User> {
    const result = await Effect.runPromise(
      this.adminService.updateUserStatus(input.userId, input.status)
    );
    return result;
  }

  @Query(() => [UserObjectType], { name: 'users' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({ resource: Resource.USER, action: Action.READ })
  async getUsers(
    @Args('skip', { type: () => Int, nullable: true, defaultValue: 0 }) skip?: number,
    @Args('take', { type: () => Int, nullable: true, defaultValue: 50 }) take?: number,
    @Args('status', { nullable: true }) status?: string,
    @Args('role', { nullable: true }) role?: string,
    @Args('search', { nullable: true }) search?: string
  ): Promise<User[]> {
    const where: any = {};

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Add role filter
    if (role) {
      where.role = role;
    }

    // Add search filter (searches email, firstName, lastName)
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Exclude deleted users by default
    if (!status || status !== 'DELETED') {
      where.NOT = { status: 'DELETED' };
    }

    return this.prisma.user.findMany({
      where,
      skip: skip ?? 0,
      take: take ?? 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Query(() => [RecentActivityType], { name: 'recentActivity' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @RequireAuditLogAccess()
  async getRecentActivity(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit?: number
  ): Promise<RecentActivityType[]> {
    const auditLogs = await this.prisma.auditLog.findMany({
      take: limit ?? 10,
      orderBy: { createdAt: 'desc' },
    });

    // Fetch user emails for audit logs with userIds
    const userIds = auditLogs.filter(log => log.userId).map(log => log.userId) as string[];
    const users = userIds.length > 0 ? await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    }) : [];

    const userMap = new Map(users.map(u => [u.id, u.email]));

    return auditLogs.map((log) => {
      // Create a more descriptive message based on the action
      let description = log.action;

      if (log.entityType) {
        description = `${log.action} on ${log.entityType}`;
      }

      if (log.entityId) {
        description += ` (${log.entityId})`;
      }

      // Add metadata context if available
      if (log.metadata && typeof log.metadata === 'object') {
        const metadata = log.metadata as Record<string, unknown>;
        if (metadata.email && typeof metadata.email === 'string') {
          description += ` - ${metadata.email}`;
        } else if (metadata.reason && typeof metadata.reason === 'string') {
          description += ` - ${metadata.reason}`;
        }
      }

      return {
        id: log.id,
        action: log.action,
        description,
        createdAt: log.createdAt,
        userId: log.userId ?? undefined,
        userEmail: log.userId ? userMap.get(log.userId) : undefined,
      };
    });
  }

  @Query(() => [AuditLogObjectType], { name: 'userAuditLogs' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @RequireAuditLogAccess()
  async getUserAuditLogs(
    @Args('userId') userId: string,
    @Args('skip', { type: () => Int, nullable: true, defaultValue: 0 }) skip?: number,
    @Args('take', { type: () => Int, nullable: true, defaultValue: 20 }) take?: number,
    @Args('action', { nullable: true }) action?: string,
    @Args('entityType', { nullable: true }) entityType?: string
  ): Promise<AuditLog[]> {
    const where: any = {
      OR: [
        { userId }, // Actions performed by the user
        { entityId: userId, entityType: 'User' }, // Actions performed on the user
      ],
    };

    // Add action filter
    if (action) {
      where.action = action;
    }

    // Add entity type filter if provided and not searching for User entity
    if (entityType && entityType !== 'User') {
      where.entityType = entityType;
      where.OR = [{ userId }]; // Only show actions by user, not on user
    }

    return this.prisma.auditLog.findMany({
      where,
      skip: skip ?? 0,
      take: take ?? 20,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Mutation(() => UserObjectType, { name: 'rejectUser' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({ resource: Resource.USER, action: Action.REJECT })
  async rejectUser(
    @Args('input') input: RejectUserInput,
    @CurrentUser() currentUser: User
  ): Promise<User> {
    this.logger.log(`User rejection requested for userId: ${input.userId}`);

    try {
      // Get the user to be rejected
      const userToReject = await this.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!userToReject) {
        throw new Error(`User not found: ${input.userId}`);
      }

      // Update user status to REJECTED
      const rejectedUser = await this.prisma.user.update({
        where: { id: input.userId },
        data: {
          status: 'REJECTED',
          rejectionReason: input.reason,
        },
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'USER_REJECTED',
          entityType: 'User',
          entityId: input.userId,
          oldValue: { status: userToReject.status } as Prisma.InputJsonValue,
          newValue: { status: 'REJECTED', reason: input.reason } as Prisma.InputJsonValue,
          metadata: {
            rejectedUserEmail: userToReject.email,
            reason: input.reason,
            rejectedBy: currentUser.email,
          } as Prisma.InputJsonValue,
        },
      });

      // Send notification to the rejected user (if email service is configured)
      // await this.emailService.sendRejectionEmail(rejectedUser.email, input.reason);

      this.logger.log(`User rejected successfully: ${input.userId}`);
      return rejectedUser;
    } catch (error) {
      this.logger.error(`Failed to reject user: ${input.userId}`, error);
      throw error;
    }
  }

  @Mutation(() => UserObjectType, { name: 'createUser' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({ resource: Resource.USER, action: Action.CREATE })
  async createUser(
    @Args('input') input: CreateUserInput,
    @CurrentUser() currentUser: User
  ): Promise<User> {
    this.logger.log(`User creation requested by: ${currentUser.email}`);

    try {
      // Check if email is already taken
      const existingUser = await this.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new Error(`Email already in use: ${input.email}`);
      }

      // Hash password if provided
      let hashedPassword: string | undefined;
      if (input.password) {
        hashedPassword = await bcrypt.hash(input.password, 10);
      }

      // Create user with ACTIVE status (admin-created users are pre-verified)
      const newUser = await this.prisma.user.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          role: input.role ?? 'USER',
          passwordHash: hashedPassword,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(), // Admin-created users are pre-verified
        },
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: newUser.id,
          newValue: {
            email: newUser.email,
            role: newUser.role,
            status: newUser.status,
          } as Prisma.InputJsonValue,
          metadata: {
            createdUserEmail: newUser.email,
            createdBy: currentUser.email,
            hasPassword: !!input.password,
          } as Prisma.InputJsonValue,
        },
      });

      this.logger.log(`User created successfully: ${newUser.id}`);
      return newUser;
    } catch (error) {
      this.logger.error(`Failed to create user`, error);
      throw error;
    }
  }

  @Mutation(() => UserObjectType, { name: 'updateUser' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({ resource: Resource.USER, action: Action.UPDATE })
  async updateUser(
    @Args('input') input: UpdateUserInput,
    @CurrentUser() currentUser: User
  ): Promise<User> {
    this.logger.log(`User update requested for userId: ${input.userId}`);

    try {
      // Get the current user data for audit log
      const currentUserData = await this.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!currentUserData) {
        throw new Error(`User not found: ${input.userId}`);
      }

      // Build update data
      const updateData: Record<string, unknown> = {};
      const changedFields: Record<string, unknown> = {};

      // Validate and prepare email update
      if (input.email && input.email !== currentUserData.email) {
        // Check if email is already taken
        const existingUser = await this.prisma.user.findUnique({
          where: { email: input.email },
        });
        if (existingUser) {
          throw new Error(`Email already in use: ${input.email}`);
        }
        updateData.email = input.email;
        updateData.emailVerifiedAt = null; // Reset email verification
        changedFields.email = { from: currentUserData.email, to: input.email };
      }

      // Prepare other field updates
      if (input.firstName && input.firstName !== currentUserData.firstName) {
        updateData.firstName = input.firstName;
        changedFields.firstName = { from: currentUserData.firstName, to: input.firstName };
      }

      if (input.lastName && input.lastName !== currentUserData.lastName) {
        updateData.lastName = input.lastName;
        changedFields.lastName = { from: currentUserData.lastName, to: input.lastName };
      }

      if (input.phone && input.phone !== currentUserData.phone) {
        updateData.phone = input.phone;
        changedFields.phone = { from: currentUserData.phone, to: input.phone };
      }

      if (input.role && input.role !== currentUserData.role) {
        updateData.role = input.role;
        changedFields.role = { from: currentUserData.role, to: input.role };
      }

      if (input.status && input.status !== currentUserData.status) {
        updateData.status = input.status;
        changedFields.status = { from: currentUserData.status, to: input.status };
      }

      if (input.otpAuthEnabled !== undefined && input.otpAuthEnabled !== currentUserData.otpAuthEnabled) {
        updateData.otpAuthEnabled = input.otpAuthEnabled;
        changedFields.otpAuthEnabled = { from: currentUserData.otpAuthEnabled, to: input.otpAuthEnabled };
      }

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        this.logger.log(`No changes for user: ${input.userId}`);
        return currentUserData;
      }

      // Update the user
      const updatedUser = await this.prisma.user.update({
        where: { id: input.userId },
        data: updateData,
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'USER_UPDATED',
          entityType: 'User',
          entityId: input.userId,
          oldValue: currentUserData as Prisma.InputJsonValue,
          newValue: updatedUser as Prisma.InputJsonValue,
          metadata: {
            changedFields,
            updatedBy: currentUser.email,
          } as Prisma.InputJsonValue,
        },
      });

      this.logger.log(`User updated successfully: ${input.userId}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user: ${input.userId}`, error);
      throw error;
    }
  }

  @Mutation(() => UserObjectType, { name: 'deleteUser' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({ resource: Resource.USER, action: Action.DELETE })
  async deleteUser(
    @Args('input') input: DeleteUserInput,
    @CurrentUser() currentUser: User
  ): Promise<User> {
    this.logger.log(`User deletion requested for userId: ${input.userId}`);

    try {
      // Get the user to be deleted
      const userToDelete = await this.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!userToDelete) {
        throw new Error(`User not found: ${input.userId}`);
      }

      // Prevent self-deletion
      if (userToDelete.id === currentUser.id) {
        throw new Error('Cannot delete your own account');
      }

      // Prevent deletion of super admins by non-super admins
      if (userToDelete.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
        throw new Error('Only super admins can delete other super admins');
      }

      let deletedUser: User;

      if (input.hardDelete) {
        // Hard delete - permanently remove from database
        // First, create an audit log before deletion
        await this.prisma.auditLog.create({
          data: {
            userId: currentUser.id,
            action: 'USER_HARD_DELETED',
            entityType: 'User',
            entityId: input.userId,
            oldValue: userToDelete as Prisma.InputJsonValue,
            newValue: Prisma.JsonNull,
            metadata: {
              deletedUserEmail: userToDelete.email,
              reason: input.reason,
              deletedBy: currentUser.email,
              hardDelete: true,
            } as Prisma.InputJsonValue,
          },
        });

        // Perform hard delete
        deletedUser = await this.prisma.user.delete({
          where: { id: input.userId },
        });
      } else {
        // Soft delete - mark as deleted
        deletedUser = await this.prisma.user.update({
          where: { id: input.userId },
          data: {
            status: 'DELETED',
            email: `deleted_${input.userId}_${userToDelete.email}`, // Preserve uniqueness
            deletedAt: new Date(),
            rejectionReason: input.reason, // Store deletion reason
          },
        });

        // Create audit log
        await this.prisma.auditLog.create({
          data: {
            userId: currentUser.id,
            action: 'USER_SOFT_DELETED',
            entityType: 'User',
            entityId: input.userId,
            oldValue: { status: userToDelete.status } as Prisma.InputJsonValue,
            newValue: { status: 'DELETED', deletedAt: new Date() } as Prisma.InputJsonValue,
            metadata: {
              deletedUserEmail: userToDelete.email,
              reason: input.reason,
              deletedBy: currentUser.email,
              softDelete: true,
            } as Prisma.InputJsonValue,
          },
        });
      }

      this.logger.log(`User deleted successfully: ${input.userId} (${input.hardDelete ? 'hard' : 'soft'})`);
      return deletedUser;
    } catch (error) {
      this.logger.error(`Failed to delete user: ${input.userId}`, error);
      throw error;
    }
  }

  @Subscription(() => AdminPendingCountsType, {
    name: 'adminPendingCountsChanged',
    description: 'Subscribe to real-time updates of pending users counts',
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
}
