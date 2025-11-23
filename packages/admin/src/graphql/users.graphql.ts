import { gql } from '@apollo/client';

export const USERS_QUERY = gql`
  query Users(
    $where: UserWhereInput
    $orderBy: [UserOrderByInput!]
    $skip: Int
    $take: Int
  ) {
    users(where: $where, orderBy: $orderBy, skip: $skip, take: $take) {
      nodes {
        id
        email
        firstName
        lastName
        role
        status
        avatar
        emailVerified
        createdAt
        updatedAt
        lastLoginAt
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      totalCount
    }
  }
`;

export const USER_QUERY = gql`
  query User($id: ID!) {
    user(id: $id) {
      id
      email
      firstName
      lastName
      role
      status
      avatar
      emailVerified
      phoneNumber
      dateOfBirth
      address
      city
      country
      postalCode
      bio
      createdAt
      updatedAt
      lastLoginAt
    }
  }
`;

export const PENDING_USERS_QUERY = gql`
  query PendingUsers($skip: Int, $take: Int) {
    pendingUsers(skip: $skip, take: $take) {
      nodes {
        id
        email
        firstName
        lastName
        avatar
        createdAt
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      totalCount
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $data: UpdateUserInput!) {
    updateUser(id: $id, data: $data) {
      id
      email
      firstName
      lastName
      role
      status
      emailVerified
    }
  }
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
      message
    }
  }
`;

export const APPROVE_USER_MUTATION = gql`
  mutation ApproveUser($id: ID!) {
    approveUser(id: $id) {
      id
      status
      emailVerified
    }
  }
`;

export const REJECT_USER_MUTATION = gql`
  mutation RejectUser($id: ID!, $reason: String) {
    rejectUser(id: $id, reason: $reason) {
      success
      message
    }
  }
`;

export const SUSPEND_USER_MUTATION = gql`
  mutation SuspendUser($id: ID!, $reason: String!) {
    suspendUser(id: $id, reason: $reason) {
      id
      status
    }
  }
`;

export const UNSUSPEND_USER_MUTATION = gql`
  mutation UnsuspendUser($id: ID!) {
    unsuspendUser(id: $id) {
      id
      status
    }
  }
`;

export const UPDATE_USER_ROLE_MUTATION = gql`
  mutation UpdateUserRole($id: ID!, $role: UserRole!) {
    updateUserRole(id: $id, role: $role) {
      id
      role
    }
  }
`;
