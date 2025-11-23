import { gql } from '@apollo/client';

export const SYSTEM_SETTINGS_QUERY = gql`
  query SystemSettings {
    systemSettings {
      id
      key
      value
      description
      type
      category
      updatedAt
      updatedBy {
        id
        email
        firstName
        lastName
      }
    }
  }
`;

export const SETTING_QUERY = gql`
  query Setting($key: String!) {
    setting(key: $key) {
      id
      key
      value
      description
      type
      category
      updatedAt
      updatedBy {
        id
        email
        firstName
        lastName
      }
    }
  }
`;

export const UPDATE_SETTING_MUTATION = gql`
  mutation UpdateSetting($key: String!, $value: String!) {
    updateSetting(key: $key, value: $value) {
      id
      key
      value
      updatedAt
    }
  }
`;

export const UPDATE_SETTINGS_MUTATION = gql`
  mutation UpdateSettings($settings: [SettingInput!]!) {
    updateSettings(settings: $settings) {
      id
      key
      value
      updatedAt
    }
  }
`;

export const NOTIFICATIONS_QUERY = gql`
  query Notifications($skip: Int, $take: Int) {
    notifications(skip: $skip, take: $take) {
      nodes {
        id
        title
        message
        type
        priority
        status
        recipientType
        scheduledFor
        sentAt
        createdAt
        createdBy {
          id
          email
          firstName
          lastName
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      totalCount
    }
  }
`;

export const CREATE_NOTIFICATION_MUTATION = gql`
  mutation CreateNotification($data: CreateNotificationInput!) {
    createNotification(data: $data) {
      id
      title
      message
      type
      priority
      status
      recipientType
      scheduledFor
      createdAt
    }
  }
`;

export const SEND_NOTIFICATION_MUTATION = gql`
  mutation SendNotification($id: ID!) {
    sendNotification(id: $id) {
      id
      status
      sentAt
    }
  }
`;

export const DELETE_NOTIFICATION_MUTATION = gql`
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id) {
      success
      message
    }
  }
`;
