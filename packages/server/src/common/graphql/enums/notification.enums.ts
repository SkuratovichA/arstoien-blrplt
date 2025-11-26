import { registerEnumType } from '@nestjs/graphql';

/**
 * Notification types for the application
 */
export enum NotificationType {
  USER_VERIFIED = 'USER_VERIFIED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

/**
 * Notification status
 */
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

// Register enums for GraphQL
registerEnumType(NotificationType, {
  name: 'NotificationType',
  description: 'The type of notification',
});

registerEnumType(NotificationStatus, {
  name: 'NotificationStatus',
  description: 'The status of a notification',
});
