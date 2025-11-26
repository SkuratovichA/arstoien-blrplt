import {
  BadRequestException,
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Effect } from 'effect';
import { AuditLog, User, UserStatus } from '@prisma/client';
import { EmailService } from '@modules/notification/email.service';
import { runEffect } from '@/common/effect';
import { AuthService } from '@modules/auth/auth.service';
import { PubSubService, PubSubEvents } from '@common/pubsub/pubsub.service';
import { SettingsService } from '@modules/settings/settings.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    private pubSubService: PubSubService,
    private settingsService: SettingsService
  ) {}

  /**
   * Approve or reject user
   * When approved, sends verification email for password setup
   * User status changes to FRESHLY_CREATED_REQUIRES_PASSWORD
   * User becomes ACTIVE after setting password via verification link
   */
  approveUser(userId: string, approved: boolean, reason?: string): Effect.Effect<User, Error> {
    const self = this;
    return Effect.gen(function* (_) {
      const user = yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.findUnique({
              where: { id: userId },
            }),
          catch: (error) => new Error(`Failed to find user: ${error}`),
        })
      );

      if (!user) {
        yield* _(Effect.fail(new NotFoundException('User not found')));
      }

      if (user!.status !== UserStatus.PENDING_APPROVAL) {
        yield* _(Effect.fail(new BadRequestException('User is not pending approval')));
      }

      // When approved: PENDING_APPROVAL → FRESHLY_CREATED_REQUIRES_PASSWORD
      // When rejected: PENDING_APPROVAL → REJECTED
      const newStatus = approved
        ? UserStatus.FRESHLY_CREATED_REQUIRES_PASSWORD
        : UserStatus.REJECTED;

      const updated = yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.update({
              where: { id: userId },
              data: {
                status: newStatus,
                ...(reason && { rejectionReason: reason }),
              },
            }),
          catch: (error) => new Error(`Failed to update user: ${error}`),
        })
      );

      // Send email notification (fire and forget - don't block on email sending)
      if (approved) {
        // Generate verification token and send verification email
        // User will set their password and become ACTIVE
        (async () => {
          try {
            const verificationToken = await self.authService.generateVerificationToken(updated.id);
            await self.authService.sendVerificationEmail(updated.email, verificationToken);
          } catch (error) {
            // Log error but don't fail the approval
            console.error('Failed to send verification email:', error);
          }
        })();
      } else {
        runEffect(
          self.emailService.sendUserRejectedEmail(updated.email, {
            firstName: updated.firstName,
            lastName: updated.lastName,
            reason: reason ?? 'Your account does not meet the platform requirements.',
          })
        ).catch(() => {});
      }

      // Publish pending counts update for admin notifications (fire and forget)
      self.publishPendingCountsUpdate().catch((error) => {
        console.error('Failed to publish pending counts update:', error);
      });

      return updated;
    });
  }

  /**
   * Update user status
   */
  updateUserStatus(userId: string, status: UserStatus): Effect.Effect<User, Error> {
    const self = this;
    return Effect.gen(function* (_) {
      const user = yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.findUnique({
              where: { id: userId },
            }),
          catch: (error) => new Error(`Failed to find user: ${error}`),
        })
      );

      if (!user) {
        yield* _(Effect.fail(new NotFoundException('User not found')));
      }

      return yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.update({
              where: { id: userId },
              data: { status },
            }),
          catch: (error) => new Error(`Failed to update user status: ${error}`),
        })
      );
    });
  }

  /**
   * Get pending users
   */
  getPendingUsers(): Effect.Effect<User[], Error> {
    const self = this;
    return Effect.gen(function* (_) {
      return yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.user.findMany({
              where: { status: UserStatus.PENDING_APPROVAL },
              orderBy: { createdAt: 'desc' },
            }),
          catch: (error) => new Error(`Failed to fetch pending users: ${error}`),
        })
      );
    });
  }

  /**
   * Get statistics for admin dashboard
   */
  getStatistics(): Effect.Effect<
    {
      pendingUsers: number;
      todayRegistrations: number;
      totalUsers: number;
    },
    Error
  > {
    const self = this;
    return Effect.gen(function* (_) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [pendingUsers, todayRegistrations, totalUsers] = yield* _(
        Effect.tryPromise({
          try: () =>
            Promise.all([
              self.prisma.user.count({ where: { status: UserStatus.PENDING_APPROVAL } }),
              self.prisma.user.count({
                where: {
                  createdAt: { gte: todayStart },
                },
              }),
              self.prisma.user.count(),
            ]),
          catch: (error) => new Error(`Failed to fetch statistics: ${error}`),
        })
      );

      return {
        pendingUsers,
        todayRegistrations,
        totalUsers,
      };
    });
  }

  /**
   * Get audit logs
   */
  getAuditLogs(page: number, pageSize: number): Effect.Effect<AuditLog[], Error> {
    const self = this;
    return Effect.gen(function* (_) {
      return yield* _(
        Effect.tryPromise({
          try: () =>
            self.prisma.auditLog.findMany({
              skip: (page - 1) * pageSize,
              take: pageSize,
              orderBy: { createdAt: 'desc' },
            }),
          catch: (error) => new Error(`Failed to fetch audit logs: ${error}`),
        })
      );
    });
  }

  /**
   * Get counts of pending items for admin notifications
   */
  async getPendingCounts(): Promise<{ pendingUsers: number }> {
    const pendingUsers = await this.prisma.user.count({
      where: { status: UserStatus.PENDING_APPROVAL },
    });

    return {
      pendingUsers,
    };
  }

  /**
   * Publish update to pending counts subscription
   */
  private async publishPendingCountsUpdate(): Promise<void> {
    const counts = await this.getPendingCounts();
    await this.pubSubService.publish(PubSubEvents.ADMIN_PENDING_COUNTS_CHANGED, counts);
  }
}
