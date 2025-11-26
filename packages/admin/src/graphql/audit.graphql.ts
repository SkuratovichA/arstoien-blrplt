import { graphql } from '../gql';

// Get audit logs with pagination
export const AUDIT_LOGS_QUERY = graphql(`
  query AuditLogs($page: Int, $pageSize: Int) {
    auditLogs(page: $page, pageSize: $pageSize) {
      id
      action
      entityType
      entityId
      userId
      ipAddress
      userAgent
      createdAt
    }
  }
`);

// Get audit logs for a specific user
export const USER_AUDIT_LOGS_QUERY = graphql(`
  query UserAuditLogs($userId: String!, $skip: Int, $take: Int) {
    userAuditLogs(userId: $userId, skip: $skip, take: $take) {
      id
      action
      entityType
      entityId
      userId
      ipAddress
      userAgent
      createdAt
    }
  }
`);
