import { graphql } from '@/gql';

// Get pending users awaiting approval
export const PENDING_USERS_QUERY = graphql(`
  query PendingUsers {
    pendingUsers {
      id
      email
      firstName
      lastName
      phone
      role
      status
      avatar
      emailVerifiedAt
      createdAt
      updatedAt
    }
  }
`);

// Get user by ID (admin only)
export const USER_QUERY = graphql(`
  query User($id: ID!) {
    user(id: $id) {
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
      otpAuthEnabled
      avatar
      bio
      lastLoginAt
      approvedAt
      rejectionReason
      createdAt
      updatedAt
    }
  }
`);

// Approve or reject user
export const APPROVE_USER_MUTATION = graphql(`
  mutation ApproveUser($input: ApproveUserInput!) {
    approveUser(input: $input) {
      id
      email
      firstName
      lastName
      status
      emailVerifiedAt
      approvedAt
    }
  }
`);

// Update user status (suspend, block, etc.)
export const UPDATE_USER_STATUS_MUTATION = graphql(`
  mutation UpdateUserStatus($input: UpdateUserStatusInput!) {
    updateUserStatus(input: $input) {
      id
      email
      firstName
      lastName
      status
    }
  }
`);

// Get all users with filters
export const USERS_QUERY = graphql(`
  query Users($skip: Int, $take: Int, $status: String, $role: String, $search: String) {
    users(skip: $skip, take: $take, status: $status, role: $role, search: $search) {
      id
      email
      firstName
      lastName
      phone
      role
      status
      createdAt
      updatedAt
    }
  }
`);

// Update user details
export const UPDATE_USER_MUTATION = graphql(`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      email
      firstName
      lastName
      phone
      otpAuthEnabled
      updatedAt
    }
  }
`);

// Delete user
export const DELETE_USER_MUTATION = graphql(`
  mutation DeleteUser($input: DeleteUserInput!) {
    deleteUser(input: $input) {
      id
      status
    }
  }
`);

// Reject pending user
export const REJECT_USER_MUTATION = graphql(`
  mutation RejectUser($input: RejectUserInput!) {
    rejectUser(input: $input) {
      id
      status
      rejectionReason
    }
  }
`);

// Create new user
export const CREATE_USER_MUTATION = graphql(`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      firstName
      lastName
      phone
      role
      status
      createdAt
    }
  }
`);

// Bulk update OTP settings
export const BULK_UPDATE_OTP_MUTATION = graphql(`
  mutation BulkUpdateOtp($input: BulkUpdateOtpInput!) {
    bulkUpdateOtp(input: $input) {
      updated
      success
      message
    }
  }
`);
