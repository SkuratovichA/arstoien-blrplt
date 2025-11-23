import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation AdminLogin($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        firstName
        lastName
        role
        avatar
      }
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
      role
      avatar
      createdAt
      updatedAt
    }
  }
`;

export const DASHBOARD_STATS_QUERY = gql`
  query DashboardStats {
    dashboardStats {
      totalUsers
      activeUsers
      pendingUsers
      totalRevenue
      monthlyRevenue
      newUsersThisMonth
      userGrowth
      revenueGrowth
    }
  }
`;

export const RECENT_ACTIVITY_QUERY = gql`
  query RecentActivity($limit: Int = 10) {
    recentActivity(limit: $limit) {
      id
      type
      description
      userId
      user {
        id
        email
        firstName
        lastName
        avatar
      }
      createdAt
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($data: UpdateProfileInput!) {
    updateProfile(data: $data) {
      id
      email
      firstName
      lastName
      avatar
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      success
      message
    }
  }
`;
