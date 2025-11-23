import { gql } from '@apollo/client';

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($limit: Int, $offset: Int) {
    notifications(limit: $limit, offset: $offset) {
      id
      type
      title
      message
      isRead
      createdAt
    }
  }
`;

export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id) {
      id
      isRead
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead {
      success
      message
    }
  }
`;

export const NOTIFICATION_SUBSCRIPTION = gql`
  subscription OnNotificationCreated {
    notificationCreated {
      id
      type
      title
      message
      isRead
      createdAt
    }
  }
`;
