import { Args, Mutation, Query, Resolver, Subscription, ID, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { NotificationService } from './notification.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Notification } from './entities/notification.entity';
import { NotificationStatus, NotificationType } from '@/common/graphql/enums';
import { NotificationFiltersInputType } from './dto/notification-filters.input-type';
import { runEffect } from '@/common/effect';
import { User } from '@prisma/client';

const pubSub = new PubSub();
const NOTIFICATION_ADDED = 'notificationAdded';

@Resolver(() => Notification)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Transform Prisma notification to GraphQL Notification
   */
  private transformNotification(
    notification: { id: string; type: string; title: string; message: string; readAt: Date | null; createdAt: Date; userId: string }
  ): Notification {
    return {
      ...notification,
      type: notification.type as NotificationType,
      readAt: notification.readAt ?? undefined,
      status: notification.readAt ? NotificationStatus.READ : NotificationStatus.UNREAD,
      updatedAt: notification.createdAt, // Use createdAt as fallback since schema doesn't have updatedAt
    };
  }

  /**
   * Transform array of Prisma notifications to GraphQL Notifications
   */
  private transformNotifications(
    notifications: Array<{ id: string; type: string; title: string; message: string; readAt: Date | null; createdAt: Date; userId: string }>
  ): Notification[] {
    return notifications.map((n) => this.transformNotification(n));
  }

  @Query(() => [Notification], { description: "Get current user's notifications" })
  @UseGuards(GqlAuthGuard)
  async myNotifications(
    @CurrentUser() user: User,
    @Args('filters', { nullable: true }) filters?: NotificationFiltersInputType
  ): Promise<Notification[]> {
    const notifications = await runEffect(
      this.notificationService.getUserNotifications(user.id, filters)
    );
    return this.transformNotifications(notifications);
  }

  @Query(() => Int, { description: 'Get unread notification count' })
  @UseGuards(GqlAuthGuard)
  async unreadNotificationCount(@CurrentUser() user: User): Promise<number> {
    return runEffect(this.notificationService.getUnreadCount(user.id));
  }

  @Mutation(() => Notification, { description: 'Mark notification as read' })
  @UseGuards(GqlAuthGuard)
  async markNotificationAsRead(
    @CurrentUser() user: User,
    @Args('notificationId', { type: () => ID }) notificationId: string
  ): Promise<Notification> {
    const notification = await runEffect(
      this.notificationService.markAsRead(notificationId, user.id)
    );
    return this.transformNotification(notification);
  }

  @Mutation(() => Int, { description: 'Mark all notifications as read' })
  @UseGuards(GqlAuthGuard)
  async markAllNotificationsAsRead(@CurrentUser() user: User): Promise<number> {
    const result = await runEffect(this.notificationService.markAllAsRead(user.id));
    return result.count;
  }

  @Mutation(() => Notification, { description: 'Delete notification' })
  @UseGuards(GqlAuthGuard)
  async deleteNotification(
    @CurrentUser() user: User,
    @Args('notificationId', { type: () => ID }) notificationId: string
  ): Promise<Notification> {
    const notification = await runEffect(
      this.notificationService.deleteNotification(notificationId, user.id)
    );
    return this.transformNotification(notification);
  }

  @Subscription(() => Notification, {
    description: 'Subscribe to new notifications',
    filter: (payload, _variables, context) => {
      return payload.notificationAdded.userId === context.userId;
    },
  })
  notificationAdded() {
    return pubSub.asyncIterator(NOTIFICATION_ADDED);
  }
}
