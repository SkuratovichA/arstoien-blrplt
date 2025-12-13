/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Date custom scalar type */
  Date: { input: any; output: any; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: any; output: any; }
};

export type AdminPendingCountsType = {
  __typename?: 'AdminPendingCountsType';
  /** Number of users pending approval */
  pendingUsers: Scalars['Int']['output'];
};

export type AdminStatsType = {
  __typename?: 'AdminStatsType';
  pendingUsers: Scalars['Int']['output'];
  todayRegistrations: Scalars['Int']['output'];
  totalUsers: Scalars['Int']['output'];
};

export type ApproveUserInput = {
  approved: Scalars['Boolean']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['ID']['input'];
};

export type AuditLogObjectType = {
  __typename?: 'AuditLogObjectType';
  action: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  entityId?: Maybe<Scalars['String']['output']>;
  entityType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  ipAddress?: Maybe<Scalars['String']['output']>;
  userAgent?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

/** Authentication provider used by the user */
export enum AuthProvider {
  Email = 'EMAIL',
  Google = 'GOOGLE'
}

export type AuthResponse = {
  __typename?: 'AuthResponse';
  accessToken: Scalars['String']['output'];
  refreshToken: Scalars['String']['output'];
  user: UserResponse;
};

export type BasicResponse = {
  __typename?: 'BasicResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type BulkUpdateOtpInput = {
  enabled: Scalars['Boolean']['input'];
  /** Specific user IDs to update. If not provided, updates all users. */
  userIds?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type BulkUpdateResultType = {
  __typename?: 'BulkUpdateResultType';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  updated: Scalars['Int']['output'];
};

export type ChangePasswordInputType = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};

export type CreateUserInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  password?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
};

export type DeleteAccountInputType = {
  confirmText?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type DeleteUserInput = {
  hardDelete?: InputMaybe<Scalars['Boolean']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
};

export type ForgotPasswordInput = {
  email: Scalars['String']['input'];
};

export type LoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  approveUser: UserObjectType;
  bulkUpdateOtp: BulkUpdateResultType;
  /** Change user password */
  changePassword: BasicResponse;
  createUser: UserObjectType;
  /** Delete user account */
  deleteAccount: BasicResponse;
  /** Delete notification */
  deleteNotification: Notification;
  deleteUser: UserObjectType;
  /** Request password reset email. Returns true even if email does not exist (security). */
  forgotPassword: Scalars['Boolean']['output'];
  /** Login with email and password */
  login: AuthResponse;
  /** Logout user and clear authentication cookies */
  logout: Scalars['Boolean']['output'];
  /** Mark all notifications as read */
  markAllNotificationsAsRead: Scalars['Int']['output'];
  /** Mark notification as read */
  markNotificationAsRead: Notification;
  /** Refresh access token using refresh token from cookies */
  refresh?: Maybe<Scalars['String']['output']>;
  /** User registration with personal details and optional company ICO. Admin approval required. */
  register: RegisterResponse;
  /** Register new user account with password (legacy) */
  registerWithPassword: AuthResponse;
  rejectUser: UserObjectType;
  /** Request OTP code for passwordless login */
  requestOtpLogin: BasicResponse;
  /** Resend email verification link to user */
  resendVerificationEmail: BasicResponse;
  /** Reset password using token from email. Token valid for 30 minutes. */
  resetPassword: Scalars['Boolean']['output'];
  /** Set password for users in FRESHLY_CREATED_REQUIRES_PASSWORD status and return auth tokens */
  setPassword: AuthResponse;
  /** Set password using verification token from email and return auth tokens */
  setPasswordWithToken: AuthResponse;
  /** Update current user profile (including locale and currency preferences) */
  updateProfile: UserObjectType;
  /** Update system settings (admin only) */
  updateSystemSettings: SystemSettingsObjectType;
  updateUser: UserObjectType;
  updateUserStatus: UserObjectType;
  /** Verify email address using token from verification email */
  verifyEmail: BasicResponse;
  /** Verify OTP code and complete login */
  verifyOtpLogin: AuthResponse;
};


export type MutationApproveUserArgs = {
  input: ApproveUserInput;
};


export type MutationBulkUpdateOtpArgs = {
  input: BulkUpdateOtpInput;
};


export type MutationChangePasswordArgs = {
  input: ChangePasswordInputType;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationDeleteAccountArgs = {
  input: DeleteAccountInputType;
};


export type MutationDeleteNotificationArgs = {
  notificationId: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  input: DeleteUserInput;
};


export type MutationForgotPasswordArgs = {
  input: ForgotPasswordInput;
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationMarkNotificationAsReadArgs = {
  notificationId: Scalars['ID']['input'];
};


export type MutationRegisterArgs = {
  input: RegisterInput;
};


export type MutationRegisterWithPasswordArgs = {
  input: RegisterWithPasswordInput;
};


export type MutationRejectUserArgs = {
  input: RejectUserInput;
};


export type MutationRequestOtpLoginArgs = {
  email: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  input: ResetPasswordInput;
};


export type MutationSetPasswordArgs = {
  input: SetPasswordInput;
};


export type MutationSetPasswordWithTokenArgs = {
  input: SetPasswordWithTokenInput;
};


export type MutationUpdateProfileArgs = {
  input: UpdateProfileInputType;
};


export type MutationUpdateSystemSettingsArgs = {
  input: UpdateSystemSettingsInputType;
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
};


export type MutationUpdateUserStatusArgs = {
  input: UpdateUserStatusInput;
};


export type MutationVerifyEmailArgs = {
  token: Scalars['String']['input'];
};


export type MutationVerifyOtpLoginArgs = {
  code: Scalars['String']['input'];
  email: Scalars['String']['input'];
};

export type Notification = {
  __typename?: 'Notification';
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  readAt?: Maybe<Scalars['Date']['output']>;
  status: NotificationStatus;
  title: Scalars['String']['output'];
  type: NotificationType;
  updatedAt: Scalars['Date']['output'];
  user?: Maybe<UserObjectType>;
  userId: Scalars['String']['output'];
};

export type NotificationFiltersInputType = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

/** The status of a notification */
export enum NotificationStatus {
  Archived = 'ARCHIVED',
  Read = 'READ',
  Unread = 'UNREAD'
}

/** The type of notification */
export enum NotificationType {
  SystemAnnouncement = 'SYSTEM_ANNOUNCEMENT',
  UserVerified = 'USER_VERIFIED'
}

export type Query = {
  __typename?: 'Query';
  /** Get counts of pending users for admin notifications */
  adminPendingCounts: AdminPendingCountsType;
  adminStatistics: AdminStatsType;
  auditLogs: Array<AuditLogObjectType>;
  /** Get the currently authenticated user */
  currentUser?: Maybe<UserObjectType>;
  /** Check if OTP authentication is enabled for an email */
  isOtpEnabled: Scalars['Boolean']['output'];
  /** Get current user's notifications */
  myNotifications: Array<Notification>;
  pendingUsers: Array<UserObjectType>;
  recentActivity: Array<RecentActivityType>;
  /** Get system settings (admin only) */
  systemSettings: SystemSettingsObjectType;
  /** Get unread notification count */
  unreadNotificationCount: Scalars['Int']['output'];
  user: UserObjectType;
  userAuditLogs: Array<AuditLogObjectType>;
  userGrowthStats: UserGrowthStatsType;
  users: Array<UserObjectType>;
};


export type QueryAuditLogsArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryIsOtpEnabledArgs = {
  email: Scalars['String']['input'];
};


export type QueryMyNotificationsArgs = {
  filters?: InputMaybe<NotificationFiltersInputType>;
};


export type QueryRecentActivityArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserAuditLogsArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
  entityType?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
  userId: Scalars['String']['input'];
};


export type QueryUserGrowthStatsArgs = {
  months?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUsersArgs = {
  role?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};

export type RecentActivityType = {
  __typename?: 'RecentActivityType';
  action: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  userEmail?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type RegisterInput = {
  companyPhone?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  /** 8-digit Czech company ID (recommended for CZ companies) */
  ico?: InputMaybe<Scalars['String']['input']>;
  lastName: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};

export type RegisterResponse = {
  __typename?: 'RegisterResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type RegisterWithPasswordInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type RejectUserInput = {
  reason: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type ResetPasswordInput = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type SetPasswordInput = {
  password: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type SetPasswordWithTokenInput = {
  password: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  /** Subscribe to real-time updates of pending users counts */
  adminPendingCountsChanged: AdminPendingCountsType;
  /** Subscribe to new notifications */
  notificationAdded: Notification;
};

export type SystemSettingsObjectType = {
  __typename?: 'SystemSettingsObjectType';
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  otpAuthEnabled: Scalars['Boolean']['output'];
  supportEmail: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type UpdateProfileInputType = {
  avatar?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  otpAuthEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  preferredCurrency?: InputMaybe<Scalars['String']['input']>;
  preferredLocale?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSystemSettingsInputType = {
  otpAuthEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  supportEmail?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  otpAuthEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
};

export type UpdateUserStatusInput = {
  status: UserStatus;
  userId: Scalars['ID']['input'];
};

export type UserGrowthDataPoint = {
  __typename?: 'UserGrowthDataPoint';
  activeUsers: Scalars['Int']['output'];
  newUsers: Scalars['Int']['output'];
  pendingUsers: Scalars['Int']['output'];
  period: Scalars['String']['output'];
  totalUsers: Scalars['Int']['output'];
};

export type UserGrowthStatsType = {
  __typename?: 'UserGrowthStatsType';
  data: Array<UserGrowthDataPoint>;
  endDate: Scalars['Date']['output'];
  startDate: Scalars['Date']['output'];
};

export type UserObjectType = {
  __typename?: 'UserObjectType';
  approvedAt?: Maybe<Scalars['Date']['output']>;
  aresCheckedAt?: Maybe<Scalars['Date']['output']>;
  aresError?: Maybe<Scalars['String']['output']>;
  authProvider: AuthProvider;
  avatar?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  documentsRequestedAt?: Maybe<Scalars['Date']['output']>;
  email: Scalars['String']['output'];
  emailVerifiedAt?: Maybe<Scalars['Date']['output']>;
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastLoginAt?: Maybe<Scalars['Date']['output']>;
  lastName: Scalars['String']['output'];
  otpAuthEnabled: Scalars['Boolean']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  preferredCurrency?: Maybe<Scalars['String']['output']>;
  preferredLocale?: Maybe<Scalars['String']['output']>;
  rejectionReason?: Maybe<Scalars['String']['output']>;
  role: UserRole;
  status: UserStatus;
  updatedAt: Scalars['Date']['output'];
};

export type UserResponse = {
  __typename?: 'UserResponse';
  avatar?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  email: Scalars['String']['output'];
  emailVerifiedAt?: Maybe<Scalars['Date']['output']>;
  firstName: Scalars['String']['output'];
  ico?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  role: Scalars['String']['output'];
  status: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
};

/** The role of a user in the system */
export enum UserRole {
  Admin = 'ADMIN',
  Manager = 'MANAGER',
  Moderator = 'MODERATOR',
  SuperAdmin = 'SUPER_ADMIN',
  Support = 'SUPPORT',
  User = 'USER'
}

/** The status of a user account */
export enum UserStatus {
  Active = 'ACTIVE',
  Blocked = 'BLOCKED',
  Deleted = 'DELETED',
  FreshlyCreatedRequiresPassword = 'FRESHLY_CREATED_REQUIRES_PASSWORD',
  PendingApproval = 'PENDING_APPROVAL',
  Rejected = 'REJECTED',
  Suspended = 'SUSPENDED'
}

export type AdminLoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type AdminLoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthResponse', accessToken: string, refreshToken: string, user: { __typename?: 'UserResponse', id: string, email: string, firstName: string, lastName: string, role: string, status: string, createdAt: any } } };

export type AdminLogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type AdminLogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'Query', currentUser?: { __typename?: 'UserObjectType', id: string, email: string, firstName: string, lastName: string, phone?: string | null, role: UserRole, status: UserStatus, authProvider: AuthProvider, emailVerifiedAt?: any | null, preferredLocale?: string | null, preferredCurrency?: string | null, createdAt: any, updatedAt: any } | null };

export type AdminStatisticsQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminStatisticsQuery = { __typename?: 'Query', adminStatistics: { __typename?: 'AdminStatsType', totalUsers: number, pendingUsers: number, todayRegistrations: number } };

export type AdminPendingCountsQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminPendingCountsQuery = { __typename?: 'Query', adminPendingCounts: { __typename?: 'AdminPendingCountsType', pendingUsers: number } };

export type UpdateProfileMutationVariables = Exact<{
  input: UpdateProfileInputType;
}>;


export type UpdateProfileMutation = { __typename?: 'Mutation', updateProfile: { __typename?: 'UserObjectType', id: string, email: string, firstName: string, lastName: string, preferredLocale?: string | null, preferredCurrency?: string | null } };

export type DashboardStatisticsQueryVariables = Exact<{ [key: string]: never; }>;


export type DashboardStatisticsQuery = { __typename?: 'Query', adminStatistics: { __typename?: 'AdminStatsType', totalUsers: number, pendingUsers: number, todayRegistrations: number } };

export type RecentActivityQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type RecentActivityQuery = { __typename?: 'Query', recentActivity: Array<{ __typename?: 'RecentActivityType', id: string, action: string, description: string, createdAt: any, userId?: string | null, userEmail?: string | null }> };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', currentUser?: { __typename?: 'UserObjectType', id: string, email: string, firstName: string, lastName: string, role: UserRole, status: UserStatus, createdAt: any, updatedAt: any } | null };

export type AdminChangePasswordMutationVariables = Exact<{
  input: ChangePasswordInputType;
}>;


export type AdminChangePasswordMutation = { __typename?: 'Mutation', changePassword: { __typename?: 'BasicResponse', success: boolean, message: string } };

export type UserGrowthStatsQueryVariables = Exact<{
  months?: InputMaybe<Scalars['Int']['input']>;
}>;


export type UserGrowthStatsQuery = { __typename?: 'Query', userGrowthStats: { __typename?: 'UserGrowthStatsType', startDate: any, endDate: any, data: Array<{ __typename?: 'UserGrowthDataPoint', period: string, totalUsers: number, activeUsers: number, newUsers: number, pendingUsers: number }> } };

export type AdminPendingCountsChangedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type AdminPendingCountsChangedSubscription = { __typename?: 'Subscription', adminPendingCountsChanged: { __typename?: 'AdminPendingCountsType', pendingUsers: number } };

export type AuditLogsQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AuditLogsQuery = { __typename?: 'Query', auditLogs: Array<{ __typename?: 'AuditLogObjectType', id: string, action: string, entityType: string, entityId?: string | null, userId?: string | null, ipAddress?: string | null, userAgent?: string | null, createdAt: any }> };

export type UserAuditLogsQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
}>;


export type UserAuditLogsQuery = { __typename?: 'Query', userAuditLogs: Array<{ __typename?: 'AuditLogObjectType', id: string, action: string, entityType: string, entityId?: string | null, userId?: string | null, ipAddress?: string | null, userAgent?: string | null, createdAt: any }> };

export type SystemSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type SystemSettingsQuery = { __typename?: 'Query', systemSettings: { __typename?: 'SystemSettingsObjectType', id: string, supportEmail: string, otpAuthEnabled: boolean, createdAt: any, updatedAt: any } };

export type UpdateSystemSettingsMutationVariables = Exact<{
  input: UpdateSystemSettingsInputType;
}>;


export type UpdateSystemSettingsMutation = { __typename?: 'Mutation', updateSystemSettings: { __typename?: 'SystemSettingsObjectType', id: string, supportEmail: string, otpAuthEnabled: boolean, updatedAt: any } };

export type AdminNotificationsQueryVariables = Exact<{
  filters?: InputMaybe<NotificationFiltersInputType>;
}>;


export type AdminNotificationsQuery = { __typename?: 'Query', myNotifications: Array<{ __typename?: 'Notification', id: string, type: NotificationType, title: string, message: string, status: NotificationStatus, readAt?: any | null, createdAt: any, updatedAt: any }> };

export type CreateNotificationMutationVariables = Exact<{
  notificationId: Scalars['ID']['input'];
}>;


export type CreateNotificationMutation = { __typename?: 'Mutation', markNotificationAsRead: { __typename?: 'Notification', id: string, status: NotificationStatus, readAt?: any | null } };

export type SendNotificationMutationVariables = Exact<{ [key: string]: never; }>;


export type SendNotificationMutation = { __typename?: 'Mutation', markAllNotificationsAsRead: number };

export type MyNotificationsQueryVariables = Exact<{
  filters?: InputMaybe<NotificationFiltersInputType>;
}>;


export type MyNotificationsQuery = { __typename?: 'Query', myNotifications: Array<{ __typename?: 'Notification', id: string, type: NotificationType, title: string, message: string, status: NotificationStatus, readAt?: any | null, createdAt: any, updatedAt: any }> };

export type UnreadNotificationCountQueryVariables = Exact<{ [key: string]: never; }>;


export type UnreadNotificationCountQuery = { __typename?: 'Query', unreadNotificationCount: number };

export type MarkNotificationAsReadMutationVariables = Exact<{
  notificationId: Scalars['ID']['input'];
}>;


export type MarkNotificationAsReadMutation = { __typename?: 'Mutation', markNotificationAsRead: { __typename?: 'Notification', id: string, status: NotificationStatus, readAt?: any | null } };

export type MarkAllNotificationsAsReadMutationVariables = Exact<{ [key: string]: never; }>;


export type MarkAllNotificationsAsReadMutation = { __typename?: 'Mutation', markAllNotificationsAsRead: number };

export type DeleteNotificationMutationVariables = Exact<{
  notificationId: Scalars['ID']['input'];
}>;


export type DeleteNotificationMutation = { __typename?: 'Mutation', deleteNotification: { __typename?: 'Notification', id: string } };

export type NotificationAddedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NotificationAddedSubscription = { __typename?: 'Subscription', notificationAdded: { __typename?: 'Notification', id: string, type: NotificationType, title: string, message: string, status: NotificationStatus, createdAt: any } };

export type PendingUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type PendingUsersQuery = { __typename?: 'Query', pendingUsers: Array<{ __typename?: 'UserObjectType', id: string, email: string, firstName: string, lastName: string, phone?: string | null, role: UserRole, status: UserStatus, avatar?: string | null, emailVerifiedAt?: any | null, createdAt: any, updatedAt: any }> };

export type UserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UserQuery = { __typename?: 'Query', user: { __typename?: 'UserObjectType', id: string, email: string, firstName: string, lastName: string, phone?: string | null, role: UserRole, status: UserStatus, authProvider: AuthProvider, emailVerifiedAt?: any | null, preferredLocale?: string | null, preferredCurrency?: string | null, otpAuthEnabled: boolean, avatar?: string | null, bio?: string | null, lastLoginAt?: any | null, approvedAt?: any | null, rejectionReason?: string | null, createdAt: any, updatedAt: any } };

export type ApproveUserMutationVariables = Exact<{
  input: ApproveUserInput;
}>;


export type ApproveUserMutation = { __typename?: 'Mutation', approveUser: { __typename?: 'UserObjectType', id: string, email: string, firstName: string, lastName: string, status: UserStatus, emailVerifiedAt?: any | null, approvedAt?: any | null } };

export type UpdateUserStatusMutationVariables = Exact<{
  input: UpdateUserStatusInput;
}>;


export type UpdateUserStatusMutation = { __typename?: 'Mutation', updateUserStatus: { __typename?: 'UserObjectType', id: string, email: string, firstName: string, lastName: string, status: UserStatus } };

export type UsersQueryVariables = Exact<{
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type UsersQuery = { __typename?: 'Query', users: Array<{ __typename?: 'UserObjectType', id: string, email: string, firstName: string, lastName: string, phone?: string | null, role: UserRole, status: UserStatus, createdAt: any, updatedAt: any }> };

export type UpdateUserMutationVariables = Exact<{
  input: UpdateUserInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'UserObjectType', id: string, email: string, firstName: string, lastName: string, phone?: string | null, otpAuthEnabled: boolean, updatedAt: any } };

export type DeleteUserMutationVariables = Exact<{
  input: DeleteUserInput;
}>;


export type DeleteUserMutation = { __typename?: 'Mutation', deleteUser: { __typename?: 'UserObjectType', id: string, status: UserStatus } };

export type RejectUserMutationVariables = Exact<{
  input: RejectUserInput;
}>;


export type RejectUserMutation = { __typename?: 'Mutation', rejectUser: { __typename?: 'UserObjectType', id: string, status: UserStatus, rejectionReason?: string | null } };

export type CreateUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'UserObjectType', id: string, email: string, firstName: string, lastName: string, phone?: string | null, role: UserRole, status: UserStatus, createdAt: any } };

export type BulkUpdateOtpMutationVariables = Exact<{
  input: BulkUpdateOtpInput;
}>;


export type BulkUpdateOtpMutation = { __typename?: 'Mutation', bulkUpdateOtp: { __typename?: 'BulkUpdateResultType', updated: number, success: boolean, message?: string | null } };


export const AdminLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<AdminLoginMutation, AdminLoginMutationVariables>;
export const AdminLogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminLogout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<AdminLogoutMutation, AdminLogoutMutationVariables>;
export const CurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CurrentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"authProvider"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"preferredLocale"}},{"kind":"Field","name":{"kind":"Name","value":"preferredCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CurrentUserQuery, CurrentUserQueryVariables>;
export const AdminStatisticsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminStatistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminStatistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalUsers"}},{"kind":"Field","name":{"kind":"Name","value":"pendingUsers"}},{"kind":"Field","name":{"kind":"Name","value":"todayRegistrations"}}]}}]}}]} as unknown as DocumentNode<AdminStatisticsQuery, AdminStatisticsQueryVariables>;
export const AdminPendingCountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminPendingCounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminPendingCounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingUsers"}}]}}]}}]} as unknown as DocumentNode<AdminPendingCountsQuery, AdminPendingCountsQueryVariables>;
export const UpdateProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProfileInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"preferredLocale"}},{"kind":"Field","name":{"kind":"Name","value":"preferredCurrency"}}]}}]}}]} as unknown as DocumentNode<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const DashboardStatisticsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DashboardStatistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminStatistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalUsers"}},{"kind":"Field","name":{"kind":"Name","value":"pendingUsers"}},{"kind":"Field","name":{"kind":"Name","value":"todayRegistrations"}}]}}]}}]} as unknown as DocumentNode<DashboardStatisticsQuery, DashboardStatisticsQueryVariables>;
export const RecentActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RecentActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recentActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"}}]}}]}}]} as unknown as DocumentNode<RecentActivityQuery, RecentActivityQueryVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const AdminChangePasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminChangePassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangePasswordInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changePassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<AdminChangePasswordMutation, AdminChangePasswordMutationVariables>;
export const UserGrowthStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserGrowthStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"months"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userGrowthStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"months"},"value":{"kind":"Variable","name":{"kind":"Name","value":"months"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"period"}},{"kind":"Field","name":{"kind":"Name","value":"totalUsers"}},{"kind":"Field","name":{"kind":"Name","value":"activeUsers"}},{"kind":"Field","name":{"kind":"Name","value":"newUsers"}},{"kind":"Field","name":{"kind":"Name","value":"pendingUsers"}}]}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}}]}}]}}]} as unknown as DocumentNode<UserGrowthStatsQuery, UserGrowthStatsQueryVariables>;
export const AdminPendingCountsChangedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"AdminPendingCountsChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminPendingCountsChanged"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingUsers"}}]}}]}}]} as unknown as DocumentNode<AdminPendingCountsChangedSubscription, AdminPendingCountsChangedSubscriptionVariables>;
export const AuditLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuditLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pageSize"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"auditLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"pageSize"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pageSize"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"userAgent"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<AuditLogsQuery, AuditLogsQueryVariables>;
export const UserAuditLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserAuditLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userAuditLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}},{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"entityType"}},{"kind":"Field","name":{"kind":"Name","value":"entityId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"ipAddress"}},{"kind":"Field","name":{"kind":"Name","value":"userAgent"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<UserAuditLogsQuery, UserAuditLogsQueryVariables>;
export const SystemSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SystemSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supportEmail"}},{"kind":"Field","name":{"kind":"Name","value":"otpAuthEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<SystemSettingsQuery, SystemSettingsQueryVariables>;
export const UpdateSystemSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSystemSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSystemSettingsInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSystemSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supportEmail"}},{"kind":"Field","name":{"kind":"Name","value":"otpAuthEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateSystemSettingsMutation, UpdateSystemSettingsMutationVariables>;
export const AdminNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationFiltersInputType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AdminNotificationsQuery, AdminNotificationsQueryVariables>;
export const CreateNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markNotificationAsRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}}]} as unknown as DocumentNode<CreateNotificationMutation, CreateNotificationMutationVariables>;
export const SendNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendNotification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markAllNotificationsAsRead"}}]}}]} as unknown as DocumentNode<SendNotificationMutation, SendNotificationMutationVariables>;
export const MyNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationFiltersInputType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<MyNotificationsQuery, MyNotificationsQueryVariables>;
export const UnreadNotificationCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UnreadNotificationCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unreadNotificationCount"}}]}}]} as unknown as DocumentNode<UnreadNotificationCountQuery, UnreadNotificationCountQueryVariables>;
export const MarkNotificationAsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkNotificationAsRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markNotificationAsRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}}]} as unknown as DocumentNode<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>;
export const MarkAllNotificationsAsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkAllNotificationsAsRead"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markAllNotificationsAsRead"}}]}}]} as unknown as DocumentNode<MarkAllNotificationsAsReadMutation, MarkAllNotificationsAsReadMutationVariables>;
export const DeleteNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteNotificationMutation, DeleteNotificationMutationVariables>;
export const NotificationAddedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"NotificationAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<NotificationAddedSubscription, NotificationAddedSubscriptionVariables>;
export const PendingUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PendingUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<PendingUsersQuery, PendingUsersQueryVariables>;
export const UserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"User"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"authProvider"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"preferredLocale"}},{"kind":"Field","name":{"kind":"Name","value":"preferredCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"otpAuthEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}},{"kind":"Field","name":{"kind":"Name","value":"approvedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UserQuery, UserQueryVariables>;
export const ApproveUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApproveUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ApproveUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approveUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"approvedAt"}}]}}]}}]} as unknown as DocumentNode<ApproveUserMutation, ApproveUserMutationVariables>;
export const UpdateUserStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserStatusInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<UpdateUserStatusMutation, UpdateUserStatusMutationVariables>;
export const UsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Users"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"role"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"Argument","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"role"},"value":{"kind":"Variable","name":{"kind":"Name","value":"role"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UsersQuery, UsersQueryVariables>;
export const UpdateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"otpAuthEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateUserMutation, UpdateUserMutationVariables>;
export const DeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<DeleteUserMutation, DeleteUserMutationVariables>;
export const RejectUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RejectUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RejectUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rejectUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}}]}}]}}]} as unknown as DocumentNode<RejectUserMutation, RejectUserMutationVariables>;
export const CreateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CreateUserMutation, CreateUserMutationVariables>;
export const BulkUpdateOtpDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkUpdateOtp"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BulkUpdateOtpInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkUpdateOtp"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updated"}},{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<BulkUpdateOtpMutation, BulkUpdateOtpMutationVariables>;