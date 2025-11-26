import { graphql } from '../gql';

// Get user's notifications with optional filters
export const GET_NOTIFICATIONS = graphql(`
  query MyNotifications($filters: NotificationFiltersInputType) {
    myNotifications(filters: $filters) {
      id
      type
      title
      message
      status
      readAt
      createdAt
      updatedAt
    }
  }
`);

// Get unread notification count
export const UNREAD_NOTIFICATION_COUNT = graphql(`
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`);

// Mark notification as read
export const MARK_NOTIFICATION_AS_READ = graphql(`
  mutation MarkNotificationAsRead($notificationId: ID!) {
    markNotificationAsRead(notificationId: $notificationId) {
      id
      status
      readAt
    }
  }
`);

// Mark all notifications as read (returns count)
export const MARK_ALL_NOTIFICATIONS_AS_READ = graphql(`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`);

// Delete notification
export const DELETE_NOTIFICATION = graphql(`
  mutation DeleteNotification($notificationId: ID!) {
    deleteNotification(notificationId: $notificationId) {
      id
    }
  }
`);

// Notification subscription
export const NOTIFICATION_SUBSCRIPTION = graphql(`
  subscription NotificationAdded {
    notificationAdded {
      id
      type
      title
      message
      status
      createdAt
    }
  }
`);
