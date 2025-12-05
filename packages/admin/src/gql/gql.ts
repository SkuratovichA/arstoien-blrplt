/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation AdminLogin($input: LoginInput!) {\n    login(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        createdAt\n      }\n    }\n  }\n": typeof types.AdminLoginDocument,
    "\n  mutation AdminLogout {\n    logout\n  }\n": typeof types.AdminLogoutDocument,
    "\n  query CurrentUser {\n    currentUser {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      authProvider\n      emailVerifiedAt\n      preferredLocale\n      preferredCurrency\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.CurrentUserDocument,
    "\n  query AdminStatistics {\n    adminStatistics {\n      totalUsers\n      pendingUsers\n      todayRegistrations\n    }\n  }\n": typeof types.AdminStatisticsDocument,
    "\n  query AdminPendingCounts {\n    adminPendingCounts {\n      pendingUsers\n    }\n  }\n": typeof types.AdminPendingCountsDocument,
    "\n  mutation UpdateProfile($input: UpdateProfileInputType!) {\n    updateProfile(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      preferredLocale\n      preferredCurrency\n    }\n  }\n": typeof types.UpdateProfileDocument,
    "\n  query DashboardStatistics {\n    adminStatistics {\n      totalUsers\n      pendingUsers\n      todayRegistrations\n    }\n  }\n": typeof types.DashboardStatisticsDocument,
    "\n  query RecentActivity($limit: Int) {\n    recentActivity(limit: $limit) {\n      id\n      action\n      description\n      createdAt\n      userId\n      userEmail\n    }\n  }\n": typeof types.RecentActivityDocument,
    "\n  query Me {\n    currentUser {\n      id\n      email\n      firstName\n      lastName\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.MeDocument,
    "\n  mutation AdminChangePassword($input: ChangePasswordInputType!) {\n    changePassword(input: $input) {\n      success\n      message\n    }\n  }\n": typeof types.AdminChangePasswordDocument,
    "\n  query UserGrowthStats($months: Int) {\n    userGrowthStats(months: $months) {\n      data {\n        period\n        totalUsers\n        activeUsers\n        newUsers\n        pendingUsers\n      }\n      startDate\n      endDate\n    }\n  }\n": typeof types.UserGrowthStatsDocument,
    "\n  subscription AdminPendingCountsChanged {\n    adminPendingCountsChanged {\n      pendingUsers\n    }\n  }\n": typeof types.AdminPendingCountsChangedDocument,
    "\n  query AuditLogs($page: Int, $pageSize: Int) {\n    auditLogs(page: $page, pageSize: $pageSize) {\n      id\n      action\n      entityType\n      entityId\n      userId\n      ipAddress\n      userAgent\n      createdAt\n    }\n  }\n": typeof types.AuditLogsDocument,
    "\n  query UserAuditLogs($userId: String!, $skip: Int, $take: Int) {\n    userAuditLogs(userId: $userId, skip: $skip, take: $take) {\n      id\n      action\n      entityType\n      entityId\n      userId\n      ipAddress\n      userAgent\n      createdAt\n    }\n  }\n": typeof types.UserAuditLogsDocument,
    "\n  query SystemSettings {\n    systemSettings {\n      id\n      supportEmail\n      otpAuthEnabled\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.SystemSettingsDocument,
    "\n  mutation UpdateSystemSettings($input: UpdateSystemSettingsInputType!) {\n    updateSystemSettings(input: $input) {\n      id\n      supportEmail\n      otpAuthEnabled\n      updatedAt\n    }\n  }\n": typeof types.UpdateSystemSettingsDocument,
    "\n  query AdminNotifications($filters: NotificationFiltersInputType) {\n    myNotifications(filters: $filters) {\n      id\n      type\n      title\n      message\n      status\n      readAt\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.AdminNotificationsDocument,
    "\n  mutation CreateNotification($notificationId: ID!) {\n    markNotificationAsRead(notificationId: $notificationId) {\n      id\n      status\n      readAt\n    }\n  }\n": typeof types.CreateNotificationDocument,
    "\n  mutation SendNotification {\n    markAllNotificationsAsRead\n  }\n": typeof types.SendNotificationDocument,
    "\n  query MyNotifications($filters: NotificationFiltersInputType) {\n    myNotifications(filters: $filters) {\n      id\n      type\n      title\n      message\n      status\n      readAt\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.MyNotificationsDocument,
    "\n  query UnreadNotificationCount {\n    unreadNotificationCount\n  }\n": typeof types.UnreadNotificationCountDocument,
    "\n  mutation MarkNotificationAsRead($notificationId: ID!) {\n    markNotificationAsRead(notificationId: $notificationId) {\n      id\n      status\n      readAt\n    }\n  }\n": typeof types.MarkNotificationAsReadDocument,
    "\n  mutation MarkAllNotificationsAsRead {\n    markAllNotificationsAsRead\n  }\n": typeof types.MarkAllNotificationsAsReadDocument,
    "\n  mutation DeleteNotification($notificationId: ID!) {\n    deleteNotification(notificationId: $notificationId) {\n      id\n    }\n  }\n": typeof types.DeleteNotificationDocument,
    "\n  subscription NotificationAdded {\n    notificationAdded {\n      id\n      type\n      title\n      message\n      status\n      createdAt\n    }\n  }\n": typeof types.NotificationAddedDocument,
    "\n  query PendingUsers {\n    pendingUsers {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      avatar\n      emailVerifiedAt\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.PendingUsersDocument,
    "\n  query User($id: ID!) {\n    user(id: $id) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      authProvider\n      emailVerifiedAt\n      preferredLocale\n      preferredCurrency\n      otpAuthEnabled\n      avatar\n      bio\n      lastLoginAt\n      approvedAt\n      rejectionReason\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.UserDocument,
    "\n  mutation ApproveUser($input: ApproveUserInput!) {\n    approveUser(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      status\n      emailVerifiedAt\n      approvedAt\n    }\n  }\n": typeof types.ApproveUserDocument,
    "\n  mutation UpdateUserStatus($input: UpdateUserStatusInput!) {\n    updateUserStatus(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      status\n    }\n  }\n": typeof types.UpdateUserStatusDocument,
    "\n  query Users($skip: Int, $take: Int, $status: String, $role: String, $search: String) {\n    users(skip: $skip, take: $take, status: $status, role: $role, search: $search) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.UsersDocument,
    "\n  mutation UpdateUser($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      otpAuthEnabled\n      updatedAt\n    }\n  }\n": typeof types.UpdateUserDocument,
    "\n  mutation DeleteUser($input: DeleteUserInput!) {\n    deleteUser(input: $input) {\n      id\n      status\n    }\n  }\n": typeof types.DeleteUserDocument,
    "\n  mutation RejectUser($input: RejectUserInput!) {\n    rejectUser(input: $input) {\n      id\n      status\n      rejectionReason\n    }\n  }\n": typeof types.RejectUserDocument,
    "\n  mutation CreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      createdAt\n    }\n  }\n": typeof types.CreateUserDocument,
    "\n  mutation BulkUpdateOtp($input: BulkUpdateOtpInput!) {\n    bulkUpdateOtp(input: $input) {\n      updated\n      success\n      message\n    }\n  }\n": typeof types.BulkUpdateOtpDocument,
};
const documents: Documents = {
    "\n  mutation AdminLogin($input: LoginInput!) {\n    login(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        createdAt\n      }\n    }\n  }\n": types.AdminLoginDocument,
    "\n  mutation AdminLogout {\n    logout\n  }\n": types.AdminLogoutDocument,
    "\n  query CurrentUser {\n    currentUser {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      authProvider\n      emailVerifiedAt\n      preferredLocale\n      preferredCurrency\n      createdAt\n      updatedAt\n    }\n  }\n": types.CurrentUserDocument,
    "\n  query AdminStatistics {\n    adminStatistics {\n      totalUsers\n      pendingUsers\n      todayRegistrations\n    }\n  }\n": types.AdminStatisticsDocument,
    "\n  query AdminPendingCounts {\n    adminPendingCounts {\n      pendingUsers\n    }\n  }\n": types.AdminPendingCountsDocument,
    "\n  mutation UpdateProfile($input: UpdateProfileInputType!) {\n    updateProfile(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      preferredLocale\n      preferredCurrency\n    }\n  }\n": types.UpdateProfileDocument,
    "\n  query DashboardStatistics {\n    adminStatistics {\n      totalUsers\n      pendingUsers\n      todayRegistrations\n    }\n  }\n": types.DashboardStatisticsDocument,
    "\n  query RecentActivity($limit: Int) {\n    recentActivity(limit: $limit) {\n      id\n      action\n      description\n      createdAt\n      userId\n      userEmail\n    }\n  }\n": types.RecentActivityDocument,
    "\n  query Me {\n    currentUser {\n      id\n      email\n      firstName\n      lastName\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n": types.MeDocument,
    "\n  mutation AdminChangePassword($input: ChangePasswordInputType!) {\n    changePassword(input: $input) {\n      success\n      message\n    }\n  }\n": types.AdminChangePasswordDocument,
    "\n  query UserGrowthStats($months: Int) {\n    userGrowthStats(months: $months) {\n      data {\n        period\n        totalUsers\n        activeUsers\n        newUsers\n        pendingUsers\n      }\n      startDate\n      endDate\n    }\n  }\n": types.UserGrowthStatsDocument,
    "\n  subscription AdminPendingCountsChanged {\n    adminPendingCountsChanged {\n      pendingUsers\n    }\n  }\n": types.AdminPendingCountsChangedDocument,
    "\n  query AuditLogs($page: Int, $pageSize: Int) {\n    auditLogs(page: $page, pageSize: $pageSize) {\n      id\n      action\n      entityType\n      entityId\n      userId\n      ipAddress\n      userAgent\n      createdAt\n    }\n  }\n": types.AuditLogsDocument,
    "\n  query UserAuditLogs($userId: String!, $skip: Int, $take: Int) {\n    userAuditLogs(userId: $userId, skip: $skip, take: $take) {\n      id\n      action\n      entityType\n      entityId\n      userId\n      ipAddress\n      userAgent\n      createdAt\n    }\n  }\n": types.UserAuditLogsDocument,
    "\n  query SystemSettings {\n    systemSettings {\n      id\n      supportEmail\n      otpAuthEnabled\n      createdAt\n      updatedAt\n    }\n  }\n": types.SystemSettingsDocument,
    "\n  mutation UpdateSystemSettings($input: UpdateSystemSettingsInputType!) {\n    updateSystemSettings(input: $input) {\n      id\n      supportEmail\n      otpAuthEnabled\n      updatedAt\n    }\n  }\n": types.UpdateSystemSettingsDocument,
    "\n  query AdminNotifications($filters: NotificationFiltersInputType) {\n    myNotifications(filters: $filters) {\n      id\n      type\n      title\n      message\n      status\n      readAt\n      createdAt\n      updatedAt\n    }\n  }\n": types.AdminNotificationsDocument,
    "\n  mutation CreateNotification($notificationId: ID!) {\n    markNotificationAsRead(notificationId: $notificationId) {\n      id\n      status\n      readAt\n    }\n  }\n": types.CreateNotificationDocument,
    "\n  mutation SendNotification {\n    markAllNotificationsAsRead\n  }\n": types.SendNotificationDocument,
    "\n  query MyNotifications($filters: NotificationFiltersInputType) {\n    myNotifications(filters: $filters) {\n      id\n      type\n      title\n      message\n      status\n      readAt\n      createdAt\n      updatedAt\n    }\n  }\n": types.MyNotificationsDocument,
    "\n  query UnreadNotificationCount {\n    unreadNotificationCount\n  }\n": types.UnreadNotificationCountDocument,
    "\n  mutation MarkNotificationAsRead($notificationId: ID!) {\n    markNotificationAsRead(notificationId: $notificationId) {\n      id\n      status\n      readAt\n    }\n  }\n": types.MarkNotificationAsReadDocument,
    "\n  mutation MarkAllNotificationsAsRead {\n    markAllNotificationsAsRead\n  }\n": types.MarkAllNotificationsAsReadDocument,
    "\n  mutation DeleteNotification($notificationId: ID!) {\n    deleteNotification(notificationId: $notificationId) {\n      id\n    }\n  }\n": types.DeleteNotificationDocument,
    "\n  subscription NotificationAdded {\n    notificationAdded {\n      id\n      type\n      title\n      message\n      status\n      createdAt\n    }\n  }\n": types.NotificationAddedDocument,
    "\n  query PendingUsers {\n    pendingUsers {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      avatar\n      emailVerifiedAt\n      createdAt\n      updatedAt\n    }\n  }\n": types.PendingUsersDocument,
    "\n  query User($id: ID!) {\n    user(id: $id) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      authProvider\n      emailVerifiedAt\n      preferredLocale\n      preferredCurrency\n      otpAuthEnabled\n      avatar\n      bio\n      lastLoginAt\n      approvedAt\n      rejectionReason\n      createdAt\n      updatedAt\n    }\n  }\n": types.UserDocument,
    "\n  mutation ApproveUser($input: ApproveUserInput!) {\n    approveUser(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      status\n      emailVerifiedAt\n      approvedAt\n    }\n  }\n": types.ApproveUserDocument,
    "\n  mutation UpdateUserStatus($input: UpdateUserStatusInput!) {\n    updateUserStatus(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      status\n    }\n  }\n": types.UpdateUserStatusDocument,
    "\n  query Users($skip: Int, $take: Int, $status: String, $role: String, $search: String) {\n    users(skip: $skip, take: $take, status: $status, role: $role, search: $search) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n": types.UsersDocument,
    "\n  mutation UpdateUser($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      otpAuthEnabled\n      updatedAt\n    }\n  }\n": types.UpdateUserDocument,
    "\n  mutation DeleteUser($input: DeleteUserInput!) {\n    deleteUser(input: $input) {\n      id\n      status\n    }\n  }\n": types.DeleteUserDocument,
    "\n  mutation RejectUser($input: RejectUserInput!) {\n    rejectUser(input: $input) {\n      id\n      status\n      rejectionReason\n    }\n  }\n": types.RejectUserDocument,
    "\n  mutation CreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      createdAt\n    }\n  }\n": types.CreateUserDocument,
    "\n  mutation BulkUpdateOtp($input: BulkUpdateOtpInput!) {\n    bulkUpdateOtp(input: $input) {\n      updated\n      success\n      message\n    }\n  }\n": types.BulkUpdateOtpDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminLogin($input: LoginInput!) {\n    login(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        createdAt\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AdminLogin($input: LoginInput!) {\n    login(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        createdAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminLogout {\n    logout\n  }\n"): (typeof documents)["\n  mutation AdminLogout {\n    logout\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CurrentUser {\n    currentUser {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      authProvider\n      emailVerifiedAt\n      preferredLocale\n      preferredCurrency\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query CurrentUser {\n    currentUser {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      authProvider\n      emailVerifiedAt\n      preferredLocale\n      preferredCurrency\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminStatistics {\n    adminStatistics {\n      totalUsers\n      pendingUsers\n      todayRegistrations\n    }\n  }\n"): (typeof documents)["\n  query AdminStatistics {\n    adminStatistics {\n      totalUsers\n      pendingUsers\n      todayRegistrations\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminPendingCounts {\n    adminPendingCounts {\n      pendingUsers\n    }\n  }\n"): (typeof documents)["\n  query AdminPendingCounts {\n    adminPendingCounts {\n      pendingUsers\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProfile($input: UpdateProfileInputType!) {\n    updateProfile(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      preferredLocale\n      preferredCurrency\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProfile($input: UpdateProfileInputType!) {\n    updateProfile(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      preferredLocale\n      preferredCurrency\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DashboardStatistics {\n    adminStatistics {\n      totalUsers\n      pendingUsers\n      todayRegistrations\n    }\n  }\n"): (typeof documents)["\n  query DashboardStatistics {\n    adminStatistics {\n      totalUsers\n      pendingUsers\n      todayRegistrations\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RecentActivity($limit: Int) {\n    recentActivity(limit: $limit) {\n      id\n      action\n      description\n      createdAt\n      userId\n      userEmail\n    }\n  }\n"): (typeof documents)["\n  query RecentActivity($limit: Int) {\n    recentActivity(limit: $limit) {\n      id\n      action\n      description\n      createdAt\n      userId\n      userEmail\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    currentUser {\n      id\n      email\n      firstName\n      lastName\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    currentUser {\n      id\n      email\n      firstName\n      lastName\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminChangePassword($input: ChangePasswordInputType!) {\n    changePassword(input: $input) {\n      success\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation AdminChangePassword($input: ChangePasswordInputType!) {\n    changePassword(input: $input) {\n      success\n      message\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserGrowthStats($months: Int) {\n    userGrowthStats(months: $months) {\n      data {\n        period\n        totalUsers\n        activeUsers\n        newUsers\n        pendingUsers\n      }\n      startDate\n      endDate\n    }\n  }\n"): (typeof documents)["\n  query UserGrowthStats($months: Int) {\n    userGrowthStats(months: $months) {\n      data {\n        period\n        totalUsers\n        activeUsers\n        newUsers\n        pendingUsers\n      }\n      startDate\n      endDate\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription AdminPendingCountsChanged {\n    adminPendingCountsChanged {\n      pendingUsers\n    }\n  }\n"): (typeof documents)["\n  subscription AdminPendingCountsChanged {\n    adminPendingCountsChanged {\n      pendingUsers\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AuditLogs($page: Int, $pageSize: Int) {\n    auditLogs(page: $page, pageSize: $pageSize) {\n      id\n      action\n      entityType\n      entityId\n      userId\n      ipAddress\n      userAgent\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query AuditLogs($page: Int, $pageSize: Int) {\n    auditLogs(page: $page, pageSize: $pageSize) {\n      id\n      action\n      entityType\n      entityId\n      userId\n      ipAddress\n      userAgent\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserAuditLogs($userId: String!, $skip: Int, $take: Int) {\n    userAuditLogs(userId: $userId, skip: $skip, take: $take) {\n      id\n      action\n      entityType\n      entityId\n      userId\n      ipAddress\n      userAgent\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query UserAuditLogs($userId: String!, $skip: Int, $take: Int) {\n    userAuditLogs(userId: $userId, skip: $skip, take: $take) {\n      id\n      action\n      entityType\n      entityId\n      userId\n      ipAddress\n      userAgent\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SystemSettings {\n    systemSettings {\n      id\n      supportEmail\n      otpAuthEnabled\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query SystemSettings {\n    systemSettings {\n      id\n      supportEmail\n      otpAuthEnabled\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateSystemSettings($input: UpdateSystemSettingsInputType!) {\n    updateSystemSettings(input: $input) {\n      id\n      supportEmail\n      otpAuthEnabled\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateSystemSettings($input: UpdateSystemSettingsInputType!) {\n    updateSystemSettings(input: $input) {\n      id\n      supportEmail\n      otpAuthEnabled\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminNotifications($filters: NotificationFiltersInputType) {\n    myNotifications(filters: $filters) {\n      id\n      type\n      title\n      message\n      status\n      readAt\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query AdminNotifications($filters: NotificationFiltersInputType) {\n    myNotifications(filters: $filters) {\n      id\n      type\n      title\n      message\n      status\n      readAt\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateNotification($notificationId: ID!) {\n    markNotificationAsRead(notificationId: $notificationId) {\n      id\n      status\n      readAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateNotification($notificationId: ID!) {\n    markNotificationAsRead(notificationId: $notificationId) {\n      id\n      status\n      readAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendNotification {\n    markAllNotificationsAsRead\n  }\n"): (typeof documents)["\n  mutation SendNotification {\n    markAllNotificationsAsRead\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyNotifications($filters: NotificationFiltersInputType) {\n    myNotifications(filters: $filters) {\n      id\n      type\n      title\n      message\n      status\n      readAt\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query MyNotifications($filters: NotificationFiltersInputType) {\n    myNotifications(filters: $filters) {\n      id\n      type\n      title\n      message\n      status\n      readAt\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UnreadNotificationCount {\n    unreadNotificationCount\n  }\n"): (typeof documents)["\n  query UnreadNotificationCount {\n    unreadNotificationCount\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MarkNotificationAsRead($notificationId: ID!) {\n    markNotificationAsRead(notificationId: $notificationId) {\n      id\n      status\n      readAt\n    }\n  }\n"): (typeof documents)["\n  mutation MarkNotificationAsRead($notificationId: ID!) {\n    markNotificationAsRead(notificationId: $notificationId) {\n      id\n      status\n      readAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MarkAllNotificationsAsRead {\n    markAllNotificationsAsRead\n  }\n"): (typeof documents)["\n  mutation MarkAllNotificationsAsRead {\n    markAllNotificationsAsRead\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteNotification($notificationId: ID!) {\n    deleteNotification(notificationId: $notificationId) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteNotification($notificationId: ID!) {\n    deleteNotification(notificationId: $notificationId) {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  subscription NotificationAdded {\n    notificationAdded {\n      id\n      type\n      title\n      message\n      status\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  subscription NotificationAdded {\n    notificationAdded {\n      id\n      type\n      title\n      message\n      status\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PendingUsers {\n    pendingUsers {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      avatar\n      emailVerifiedAt\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query PendingUsers {\n    pendingUsers {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      avatar\n      emailVerifiedAt\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query User($id: ID!) {\n    user(id: $id) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      authProvider\n      emailVerifiedAt\n      preferredLocale\n      preferredCurrency\n      otpAuthEnabled\n      avatar\n      bio\n      lastLoginAt\n      approvedAt\n      rejectionReason\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query User($id: ID!) {\n    user(id: $id) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      authProvider\n      emailVerifiedAt\n      preferredLocale\n      preferredCurrency\n      otpAuthEnabled\n      avatar\n      bio\n      lastLoginAt\n      approvedAt\n      rejectionReason\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ApproveUser($input: ApproveUserInput!) {\n    approveUser(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      status\n      emailVerifiedAt\n      approvedAt\n    }\n  }\n"): (typeof documents)["\n  mutation ApproveUser($input: ApproveUserInput!) {\n    approveUser(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      status\n      emailVerifiedAt\n      approvedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateUserStatus($input: UpdateUserStatusInput!) {\n    updateUserStatus(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUserStatus($input: UpdateUserStatusInput!) {\n    updateUserStatus(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Users($skip: Int, $take: Int, $status: String, $role: String, $search: String) {\n    users(skip: $skip, take: $take, status: $status, role: $role, search: $search) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query Users($skip: Int, $take: Int, $status: String, $role: String, $search: String) {\n    users(skip: $skip, take: $take, status: $status, role: $role, search: $search) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateUser($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      otpAuthEnabled\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUser($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      otpAuthEnabled\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteUser($input: DeleteUserInput!) {\n    deleteUser(input: $input) {\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteUser($input: DeleteUserInput!) {\n    deleteUser(input: $input) {\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RejectUser($input: RejectUserInput!) {\n    rejectUser(input: $input) {\n      id\n      status\n      rejectionReason\n    }\n  }\n"): (typeof documents)["\n  mutation RejectUser($input: RejectUserInput!) {\n    rejectUser(input: $input) {\n      id\n      status\n      rejectionReason\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  mutation CreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation BulkUpdateOtp($input: BulkUpdateOtpInput!) {\n    bulkUpdateOtp(input: $input) {\n      updated\n      success\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation BulkUpdateOtp($input: BulkUpdateOtpInput!) {\n    bulkUpdateOtp(input: $input) {\n      updated\n      success\n      message\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;