import { gql } from '@apollo/client';

export const AUDIT_LOGS_QUERY = gql`
  query AuditLogs(
    $where: AuditLogWhereInput
    $orderBy: [AuditLogOrderByInput!]
    $skip: Int
    $take: Int
  ) {
    auditLogs(where: $where, orderBy: $orderBy, skip: $skip, take: $take) {
      nodes {
        id
        action
        entity
        entityId
        userId
        user {
          id
          email
          firstName
          lastName
          avatar
        }
        changes
        metadata
        ipAddress
        userAgent
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

export const AUDIT_LOG_QUERY = gql`
  query AuditLog($id: ID!) {
    auditLog(id: $id) {
      id
      action
      entity
      entityId
      userId
      user {
        id
        email
        firstName
        lastName
        avatar
      }
      changes
      metadata
      ipAddress
      userAgent
      createdAt
    }
  }
`;

export const USER_AUDIT_LOGS_QUERY = gql`
  query UserAuditLogs($userId: ID!, $skip: Int, $take: Int) {
    userAuditLogs(userId: $userId, skip: $skip, take: $take) {
      nodes {
        id
        action
        entity
        entityId
        changes
        metadata
        ipAddress
        userAgent
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
