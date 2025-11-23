import { registerEnumType } from '@nestjs/graphql';

/**
 * Notification types for the application
 */
export enum NotificationType {
  BID_PLACED = 'BID_PLACED',
  BID_OUTBID = 'BID_OUTBID',
  AUCTION_WON = 'AUCTION_WON',
  AUCTION_ENDED = 'AUCTION_ENDED',
  LISTING_STARTED = 'LISTING_STARTED',
  LISTING_APPROVED = 'LISTING_APPROVED',
  LISTING_REJECTED = 'LISTING_REJECTED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
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
