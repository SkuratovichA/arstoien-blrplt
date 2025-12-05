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

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;


export type RegisterMutation = { __typename?: 'Mutation', register: { __typename?: 'RegisterResponse', success: boolean, message: string } };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthResponse', accessToken: string, refreshToken: string, user: { __typename?: 'UserResponse', id: string, email: string, firstName: string, lastName: string, role: string, status: string, avatar?: string | null, emailVerifiedAt?: any | null, createdAt: any, updatedAt: any } } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type ForgotPasswordMutationVariables = Exact<{
  input: ForgotPasswordInput;
}>;


export type ForgotPasswordMutation = { __typename?: 'Mutation', forgotPassword: boolean };

export type ResetPasswordMutationVariables = Exact<{
  input: ResetPasswordInput;
}>;


export type ResetPasswordMutation = { __typename?: 'Mutation', resetPassword: boolean };

export type SetPasswordWithTokenMutationVariables = Exact<{
  input: SetPasswordWithTokenInput;
}>;


export type SetPasswordWithTokenMutation = { __typename?: 'Mutation', setPasswordWithToken: { __typename?: 'AuthResponse', accessToken: string, refreshToken: string, user: { __typename?: 'UserResponse', id: string, email: string, firstName: string, lastName: string, role: string, status: string, avatar?: string | null, emailVerifiedAt?: any | null, createdAt: any, updatedAt: any } } };

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'Query', currentUser?: { __typename?: 'UserObjectType', id: string, email: string, firstName: string, lastName: string, phone?: string | null, role: UserRole, status: UserStatus, authProvider: AuthProvider, emailVerifiedAt?: any | null, preferredLocale?: string | null, preferredCurrency?: string | null, createdAt: any, updatedAt: any } | null };

export type VerifyEmailMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type VerifyEmailMutation = { __typename?: 'Mutation', verifyEmail: { __typename?: 'BasicResponse', success: boolean, message: string } };

export type ResendVerificationEmailMutationVariables = Exact<{ [key: string]: never; }>;


export type ResendVerificationEmailMutation = { __typename?: 'Mutation', resendVerificationEmail: { __typename?: 'BasicResponse', success: boolean, message: string } };

export type IsOtpEnabledQueryVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type IsOtpEnabledQuery = { __typename?: 'Query', isOtpEnabled: boolean };

export type RequestOtpLoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type RequestOtpLoginMutation = { __typename?: 'Mutation', requestOtpLogin: { __typename?: 'BasicResponse', success: boolean, message: string } };

export type VerifyOtpLoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  code: Scalars['String']['input'];
}>;


export type VerifyOtpLoginMutation = { __typename?: 'Mutation', verifyOtpLogin: { __typename?: 'AuthResponse', accessToken: string, refreshToken: string, user: { __typename?: 'UserResponse', id: string, email: string, firstName: string, lastName: string, role: string, status: string, avatar?: string | null, emailVerifiedAt?: any | null, createdAt: any, updatedAt: any } } };

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

export type UpdateProfileMutationVariables = Exact<{
  input: UpdateProfileInputType;
}>;


export type UpdateProfileMutation = { __typename?: 'Mutation', updateProfile: { __typename?: 'UserObjectType', id: string, email: string, firstName: string, lastName: string, phone?: string | null, preferredLocale?: string | null, preferredCurrency?: string | null, emailVerifiedAt?: any | null, createdAt: any } };

export type ChangePasswordMutationVariables = Exact<{
  input: ChangePasswordInputType;
}>;


export type ChangePasswordMutation = { __typename?: 'Mutation', changePassword: { __typename?: 'BasicResponse', success: boolean, message: string } };

export type DeleteAccountMutationVariables = Exact<{
  input: DeleteAccountInputType;
}>;


export type DeleteAccountMutation = { __typename?: 'Mutation', deleteAccount: { __typename?: 'BasicResponse', success: boolean, message: string } };


export const RegisterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Register"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RegisterInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"register"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<RegisterMutation, RegisterMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const ForgotPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ForgotPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ForgotPasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"forgotPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ForgotPasswordMutation, ForgotPasswordMutationVariables>;
export const ResetPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResetPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ResetPasswordInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ResetPasswordMutation, ResetPasswordMutationVariables>;
export const SetPasswordWithTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetPasswordWithToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetPasswordWithTokenInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setPasswordWithToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<SetPasswordWithTokenMutation, SetPasswordWithTokenMutationVariables>;
export const CurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CurrentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"authProvider"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"preferredLocale"}},{"kind":"Field","name":{"kind":"Name","value":"preferredCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CurrentUserQuery, CurrentUserQueryVariables>;
export const VerifyEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<VerifyEmailMutation, VerifyEmailMutationVariables>;
export const ResendVerificationEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ResendVerificationEmail"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resendVerificationEmail"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<ResendVerificationEmailMutation, ResendVerificationEmailMutationVariables>;
export const IsOtpEnabledDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"IsOtpEnabled"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isOtpEnabled"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]} as unknown as DocumentNode<IsOtpEnabledQuery, IsOtpEnabledQueryVariables>;
export const RequestOtpLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestOtpLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestOtpLogin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<RequestOtpLoginMutation, RequestOtpLoginMutationVariables>;
export const VerifyOtpLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyOtpLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyOtpLogin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"avatar"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<VerifyOtpLoginMutation, VerifyOtpLoginMutationVariables>;
export const MyNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationFiltersInputType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<MyNotificationsQuery, MyNotificationsQueryVariables>;
export const UnreadNotificationCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UnreadNotificationCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unreadNotificationCount"}}]}}]} as unknown as DocumentNode<UnreadNotificationCountQuery, UnreadNotificationCountQueryVariables>;
export const MarkNotificationAsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkNotificationAsRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markNotificationAsRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}}]} as unknown as DocumentNode<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>;
export const MarkAllNotificationsAsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkAllNotificationsAsRead"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markAllNotificationsAsRead"}}]}}]} as unknown as DocumentNode<MarkAllNotificationsAsReadMutation, MarkAllNotificationsAsReadMutationVariables>;
export const DeleteNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteNotificationMutation, DeleteNotificationMutationVariables>;
export const NotificationAddedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"NotificationAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationAdded"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<NotificationAddedSubscription, NotificationAddedSubscriptionVariables>;
export const UpdateProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateProfileInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"phone"}},{"kind":"Field","name":{"kind":"Name","value":"preferredLocale"}},{"kind":"Field","name":{"kind":"Name","value":"preferredCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerifiedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const ChangePasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangePassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangePasswordInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changePassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<ChangePasswordMutation, ChangePasswordMutationVariables>;
export const DeleteAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteAccountInputType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<DeleteAccountMutation, DeleteAccountMutationVariables>;