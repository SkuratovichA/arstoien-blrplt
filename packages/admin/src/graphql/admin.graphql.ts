import { graphql } from '../gql';

// Auth mutations
export const LOGIN_MUTATION = graphql(`
  mutation AdminLogin($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        firstName
        lastName
        role
        status
        createdAt
      }
    }
  }
`);

export const LOGOUT_MUTATION = graphql(`
  mutation AdminLogout {
    logout
  }
`);

// User queries
export const CURRENT_USER_QUERY = graphql(`
  query CurrentUser {
    currentUser {
      id
      email
      firstName
      lastName
      phone
      role
      status
      authProvider
      emailVerifiedAt
      preferredLocale
      preferredCurrency
      createdAt
      updatedAt
    }
  }
`);

// Admin statistics
export const ADMIN_STATS_QUERY = graphql(`
  query AdminStatistics {
    adminStatistics {
      totalUsers
      pendingUsers
      todayRegistrations
    }
  }
`);

export const ADMIN_PENDING_COUNTS_QUERY = graphql(`
  query AdminPendingCounts {
    adminPendingCounts {
      pendingUsers
    }
  }
`);

// Audit logs (removed - use from audit.graphql.ts instead to avoid duplication)

// Update profile
export const UPDATE_PROFILE_MUTATION = graphql(`
  mutation UpdateProfile($input: UpdateProfileInputType!) {
    updateProfile(input: $input) {
      id
      email
      firstName
      lastName
      preferredLocale
      preferredCurrency
    }
  }
`);

// Dashboard statistics (same as ADMIN_STATS_QUERY)
export const DASHBOARD_STATS_QUERY = graphql(`
  query DashboardStatistics {
    adminStatistics {
      totalUsers
      pendingUsers
      todayRegistrations
    }
  }
`);

// Recent activity query
export const RECENT_ACTIVITY_QUERY = graphql(`
  query RecentActivity($limit: Int) {
    recentActivity(limit: $limit) {
      id
      action
      description
      createdAt
      userId
      userEmail
    }
  }
`);

// Get current admin user
export const ME_QUERY = graphql(`
  query Me {
    currentUser {
      id
      email
      firstName
      lastName
      role
      status
      createdAt
      updatedAt
    }
  }
`);

// Change password mutation (for admin users)
export const CHANGE_PASSWORD_MUTATION = graphql(`
  mutation AdminChangePassword($input: ChangePasswordInputType!) {
    changePassword(input: $input) {
      success
      message
    }
  }
`);

// User growth statistics
export const USER_GROWTH_STATS_QUERY = graphql(`
  query UserGrowthStats($months: Int) {
    userGrowthStats(months: $months) {
      data {
        period
        totalUsers
        activeUsers
        newUsers
        pendingUsers
      }
      startDate
      endDate
    }
  }
`);

// Subscription
export const ADMIN_PENDING_COUNTS_SUBSCRIPTION = graphql(`
  subscription AdminPendingCountsChanged {
    adminPendingCountsChanged {
      pendingUsers
    }
  }
`);
