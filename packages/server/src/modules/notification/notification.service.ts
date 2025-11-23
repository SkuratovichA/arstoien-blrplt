import { Injectable, Logger } from '@nestjs/common';
import { Effect } from 'effect';
import { PrismaService } from '@/prisma/prisma.service';
import {
  NotFoundError,
  ExternalApiError,
  DatabaseError,
  ValidationError,
  promiseToEffect,
} from '@/common/effect';
import { CrudService } from '@/common/services';
import { Prisma } from '@prisma/client';
import { EmailService } from './email.service';
import { NotificationFiltersInputType } from './dto/notification-filters.input-type';
import { NotificationType } from '@/common/graphql/enums';

type Notification = {
  id: string;
  createdAt: Date;
  title: string;
  type: string;
  data: Prisma.JsonValue;
  message: string;
  userId: string;
  readAt: Date | null;
};

@Injectable()
export class NotificationService extends CrudService<PrismaService['notification']> {
  protected readonly logger = new Logger(NotificationService.name);
  protected readonly modelName = 'Notification';

  constructor(
    prisma: PrismaService,
    private readonly emailService: EmailService
  ) {
    super(prisma);
  }

  protected getDelegate() {
    return this.prisma.notification;
  }

  /**
   * Send notification (both database record and email)
   */
  sendNotification(
    userId: string,
    type: NotificationType,
    data: Record<string, unknown>
  ): Effect.Effect<Notification, ExternalApiError | DatabaseError | ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      // Create notification record
      const notification = yield* self.create({
        data: {
          type: type as string,
          title: self.getNotificationTitle(type),
          message: self.getNotificationMessage(type, data),
          data: data as Prisma.InputJsonValue,
          user: { connect: { id: userId } },
        },
      });

      // Send email notification (fire and forget)
      yield* self.sendEmailNotification(userId, type, data).pipe(
        Effect.catchAll((error) => {
          self.logger.error(`Failed to send email notification: ${error}`);
          return Effect.succeed(undefined);
        })
      );

      return notification;
    });
  }

  /**
   * Send bulk notifications
   */
  sendBulkNotifications(
    userIds: string[],
    type: NotificationType,
    data: Record<string, unknown>
  ): Effect.Effect<Notification[], DatabaseError, never> {
    const self = this;
    return Effect.gen(function* () {
      const notifications: Notification[] = [];

      for (const userId of userIds) {
        const notification = yield* self.sendNotification(userId, type, data).pipe(
          Effect.catchAll((error) => {
            self.logger.error(`Failed to send notification to user ${userId}: ${error}`);
            return Effect.succeed(null as Notification | null);
          })
        );

        if (notification) {
          notifications.push(notification);
        }
      }

      return notifications;
    });
  }

  /**
   * Get user's notifications
   */
  getUserNotifications(
    userId: string,
    filters?: NotificationFiltersInputType
  ): Effect.Effect<Notification[], DatabaseError, never> {
    const where: Prisma.NotificationWhereInput = { userId };

    if (filters?.type) {
      where.type = filters.type as string;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    return this.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    }) as Effect.Effect<Notification[], DatabaseError, never>;
  }

  /**
   * Mark notification as read
   */
  markAsRead(
    notificationId: string,
    userId: string
  ): Effect.Effect<Notification, NotFoundError | DatabaseError, never> {
    const self = this;
    return Effect.gen(function* () {
      const notification = yield* self.findById(notificationId) as Effect.Effect<
        Notification,
        NotFoundError | DatabaseError,
        never
      >;

      // Verify ownership
      if (notification.userId !== userId) {
        return yield* Effect.fail(
          new NotFoundError({
            message: 'Notification not found',
            resource: 'Notification',
            id: notificationId,
          })
        );
      }

      return yield* self.update(notificationId, {
        data: {
          readAt: new Date(),
        },
      }) as Effect.Effect<Notification, DatabaseError, never>;
    });
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(
    userId: string
  ): Effect.Effect<{ count: number }, ValidationError | DatabaseError, never> {
    return promiseToEffect(() =>
      this.prisma.notification.updateMany({
        where: {
          userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      })
    );
  }

  /**
   * Delete notification
   */
  deleteNotification(
    notificationId: string,
    userId: string
  ): Effect.Effect<Notification, NotFoundError | DatabaseError, never> {
    const self = this;
    return Effect.gen(function* () {
      const notification = yield* self.findById(notificationId) as Effect.Effect<
        Notification,
        NotFoundError | DatabaseError,
        never
      >;

      // Verify ownership
      if (notification.userId !== userId) {
        return yield* Effect.fail(
          new NotFoundError({
            message: 'Notification not found',
            resource: 'Notification',
            id: notificationId,
          })
        );
      }

      return yield* self.delete(notificationId) as Effect.Effect<
        Notification,
        DatabaseError,
        never
      >;
    });
  }

  /**
   * Get unread count
   */
  getUnreadCount(userId: string): Effect.Effect<number, ValidationError | DatabaseError, never> {
    return this.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  /**
   * Send email notification
   */
  private sendEmailNotification(
    userId: string,
    type: NotificationType,
    data: Record<string, unknown>
  ): Effect.Effect<void, ValidationError | ExternalApiError | DatabaseError, never> {
    const self = this;
    return Effect.gen(function* () {
      // Get user email
      const user = yield* promiseToEffect(() =>
        self.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstName: true, lastName: true },
        })
      );

      if (!user) {
        return;
      }

      // Send email based on notification type
      switch (type) {
        case NotificationType.BID_PLACED:
          yield* self.emailService.sendBidPlacedEmail(user.email, {
            userName: `${user.firstName} ${user.lastName}`,
            ...data,
          });
          break;

        case NotificationType.BID_OUTBID:
          yield* self.emailService.sendOutbidEmail(user.email, {
            userName: `${user.firstName} ${user.lastName}`,
            ...data,
          });
          break;

        case NotificationType.AUCTION_WON:
          yield* self.emailService.sendAuctionWonEmail(user.email, {
            userName: `${user.firstName} ${user.lastName}`,
            ...data,
          });
          break;

        case NotificationType.AUCTION_ENDED:
          yield* self.emailService.sendAuctionEndedEmail(user.email, {
            userName: `${user.firstName} ${user.lastName}`,
            ...data,
          });
          break;

        case NotificationType.LISTING_APPROVED:
          yield* self.emailService.sendListingApprovedEmail(user.email, {
            userName: `${user.firstName} ${user.lastName}`,
            ...data,
          });
          break;

        case NotificationType.LISTING_REJECTED:
          yield* self.emailService.sendListingRejectedEmail(user.email, {
            userName: `${user.firstName} ${user.lastName}`,
            ...data,
          });
          break;

        case NotificationType.PAYMENT_RECEIVED:
          yield* self.emailService.sendPaymentReceivedEmail(user.email, {
            userName: `${user.firstName} ${user.lastName}`,
            ...data,
          });
          break;

        case NotificationType.PAYMENT_REMINDER:
          yield* self.emailService.sendPaymentReminderEmail(user.email, {
            userName: `${user.firstName} ${user.lastName}`,
            ...data,
          });
          break;

        case NotificationType.USER_VERIFIED:
          yield* self.emailService.sendUserVerifiedEmail(user.email, {
            userName: `${user.firstName} ${user.lastName}`,
            ...data,
          });
          break;

        default:
          self.logger.warn(`No email template for notification type: ${type}`);
      }
    });
  }

  /**
   * Get notification title
   */
  private getNotificationTitle(type: NotificationType): string {
    const titles: Record<NotificationType, string> = {
      [NotificationType.BID_PLACED]: 'New Bid on Your Listing',
      [NotificationType.BID_OUTBID]: 'You Have Been Outbid',
      [NotificationType.AUCTION_WON]: 'Congratulations! You Won the Auction',
      [NotificationType.AUCTION_ENDED]: 'Auction Has Ended',
      [NotificationType.LISTING_STARTED]: 'Auction Started',
      [NotificationType.LISTING_APPROVED]: 'Your Listing Has Been Approved',
      [NotificationType.LISTING_REJECTED]: 'Your Listing Has Been Rejected',
      [NotificationType.PAYMENT_RECEIVED]: 'Payment Received',
      [NotificationType.PAYMENT_REMINDER]: 'Payment Reminder',
      [NotificationType.USER_VERIFIED]: 'Your Account Has Been Verified',
      [NotificationType.SYSTEM_ANNOUNCEMENT]: 'System Announcement',
    };

    return titles[type] ?? 'Notification';
  }

  /**
   * Get notification message
   */
  private getNotificationMessage(type: NotificationType, data: Record<string, unknown>): string {
    switch (type) {
      case NotificationType.BID_PLACED:
        return `A new bid of ${data.amount} ${data.currency} was placed on your listing "${data.listingTitle}".`;

      case NotificationType.BID_OUTBID:
        return `You have been outbid on "${data.listingTitle}". The current highest bid is ${data.amount} ${data.currency}.`;

      case NotificationType.AUCTION_WON:
        return `Congratulations! You won the auction for "${data.listingTitle}" with a bid of ${data.amount} ${data.currency}.`;

      case NotificationType.AUCTION_ENDED:
        return `The auction for "${data.listingTitle}" has ended.`;

      case NotificationType.LISTING_APPROVED:
        return `Your listing "${data.listingTitle}" has been approved and is now active.`;

      case NotificationType.LISTING_REJECTED:
        return `Your listing "${data.listingTitle}" has been rejected. Reason: ${data.reason ?? 'Not specified'}.`;

      case NotificationType.PAYMENT_RECEIVED:
        return `Payment of ${data.amount} ${data.currency} has been received for "${data.listingTitle}".`;

      case NotificationType.PAYMENT_REMINDER:
        return `Reminder: Payment for "${data.listingTitle}" is due.`;

      case NotificationType.USER_VERIFIED:
        return 'Your account has been verified. You can now start buying and selling.';

      case NotificationType.SYSTEM_ANNOUNCEMENT:
        return (data.message as string) ?? 'System announcement';

      default:
        return 'You have a new notification';
    }
  }
}
