import { graphql } from '../gql';

// System settings (minimal - only has supportEmail based on the DTO)
export const SYSTEM_SETTINGS_QUERY = graphql(`
  query SystemSettings {
    systemSettings {
      id
      supportEmail
      createdAt
      updatedAt
    }
  }
`);

export const UPDATE_SYSTEM_SETTINGS_MUTATION = graphql(`
  mutation UpdateSystemSettings($input: UpdateSystemSettingsInputType!) {
    updateSystemSettings(input: $input) {
      id
      supportEmail
      updatedAt
    }
  }
`);

// Alias for UPDATE_SYSTEM_SETTINGS_MUTATION (used in routes/settings.tsx)
export const UPDATE_SETTINGS_MUTATION = UPDATE_SYSTEM_SETTINGS_MUTATION;

// Admin notifications management (use existing user notification queries for now)
export const NOTIFICATIONS_QUERY = graphql(`
  query AdminNotifications($filters: NotificationFiltersInputType) {
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

// TODO: Implement proper admin notification creation
export const CREATE_NOTIFICATION_MUTATION = graphql(`
  mutation CreateNotification($notificationId: ID!) {
    markNotificationAsRead(notificationId: $notificationId) {
      id
      status
      readAt
    }
  }
`);

// TODO: Implement proper notification sending
export const SEND_NOTIFICATION_MUTATION = graphql(`
  mutation SendNotification {
    markAllNotificationsAsRead
  }
`);

// Notifications (user notifications, not system settings)
export const MY_NOTIFICATIONS_QUERY = graphql(`
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

export const UNREAD_NOTIFICATION_COUNT_QUERY = graphql(`
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`);

export const MARK_NOTIFICATION_AS_READ_MUTATION = graphql(`
  mutation MarkNotificationAsRead($notificationId: ID!) {
    markNotificationAsRead(notificationId: $notificationId) {
      id
      status
      readAt
    }
  }
`);

export const MARK_ALL_NOTIFICATIONS_AS_READ_MUTATION = graphql(`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`);

export const DELETE_NOTIFICATION_MUTATION = graphql(`
  mutation DeleteNotification($notificationId: ID!) {
    deleteNotification(notificationId: $notificationId) {
      id
    }
  }
`);

export const NOTIFICATION_ADDED_SUBSCRIPTION = graphql(`
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
