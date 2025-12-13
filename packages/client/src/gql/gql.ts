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
    "\n  mutation Register($input: RegisterInput!) {\n    register(input: $input) {\n      success\n      message\n    }\n  }\n": typeof types.RegisterDocument,
    "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        avatar\n        emailVerifiedAt\n        createdAt\n        updatedAt\n      }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation Logout {\n    logout\n  }\n": typeof types.LogoutDocument,
    "\n  mutation ForgotPassword($input: ForgotPasswordInput!) {\n    forgotPassword(input: $input)\n  }\n": typeof types.ForgotPasswordDocument,
    "\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input)\n  }\n": typeof types.ResetPasswordDocument,
    "\n  mutation SetPasswordWithToken($input: SetPasswordWithTokenInput!) {\n    setPasswordWithToken(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        avatar\n        emailVerifiedAt\n        createdAt\n        updatedAt\n      }\n    }\n  }\n": typeof types.SetPasswordWithTokenDocument,
    "\n  query CurrentUser {\n    currentUser {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      authProvider\n      emailVerifiedAt\n      preferredLocale\n      preferredCurrency\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.CurrentUserDocument,
    "\n  mutation VerifyEmail($token: String!) {\n    verifyEmail(token: $token) {\n      success\n      message\n    }\n  }\n": typeof types.VerifyEmailDocument,
    "\n  mutation ResendVerificationEmail {\n    resendVerificationEmail {\n      success\n      message\n    }\n  }\n": typeof types.ResendVerificationEmailDocument,
    "\n  query IsOtpEnabled($email: String!) {\n    isOtpEnabled(email: $email)\n  }\n": typeof types.IsOtpEnabledDocument,
    "\n  mutation RequestOtpLogin($email: String!) {\n    requestOtpLogin(email: $email) {\n      success\n      message\n    }\n  }\n": typeof types.RequestOtpLoginDocument,
    "\n  mutation VerifyOtpLogin($email: String!, $code: String!) {\n    verifyOtpLogin(email: $email, code: $code) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        avatar\n        emailVerifiedAt\n        createdAt\n        updatedAt\n      }\n    }\n  }\n": typeof types.VerifyOtpLoginDocument,
    "\n  query MyNotifications($filters: NotificationFiltersInputType) {\n    myNotifications(filters: $filters) {\n      id\n      type\n      title\n      message\n      status\n      readAt\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.MyNotificationsDocument,
    "\n  query UnreadNotificationCount {\n    unreadNotificationCount\n  }\n": typeof types.UnreadNotificationCountDocument,
    "\n  mutation MarkNotificationAsRead($notificationId: ID!) {\n    markNotificationAsRead(notificationId: $notificationId) {\n      id\n      status\n      readAt\n    }\n  }\n": typeof types.MarkNotificationAsReadDocument,
    "\n  mutation MarkAllNotificationsAsRead {\n    markAllNotificationsAsRead\n  }\n": typeof types.MarkAllNotificationsAsReadDocument,
    "\n  mutation DeleteNotification($notificationId: ID!) {\n    deleteNotification(notificationId: $notificationId) {\n      id\n    }\n  }\n": typeof types.DeleteNotificationDocument,
    "\n  subscription NotificationAdded {\n    notificationAdded {\n      id\n      type\n      title\n      message\n      status\n      createdAt\n    }\n  }\n": typeof types.NotificationAddedDocument,
    "\n  mutation UpdateProfile($input: UpdateProfileInputType!) {\n    updateProfile(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      preferredLocale\n      preferredCurrency\n      emailVerifiedAt\n      createdAt\n    }\n  }\n": typeof types.UpdateProfileDocument,
    "\n  mutation ChangePassword($input: ChangePasswordInputType!) {\n    changePassword(input: $input) {\n      success\n      message\n    }\n  }\n": typeof types.ChangePasswordDocument,
    "\n  mutation DeleteAccount($input: DeleteAccountInputType!) {\n    deleteAccount(input: $input) {\n      success\n      message\n    }\n  }\n": typeof types.DeleteAccountDocument,
};
const documents: Documents = {
    "\n  mutation Register($input: RegisterInput!) {\n    register(input: $input) {\n      success\n      message\n    }\n  }\n": types.RegisterDocument,
    "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        avatar\n        emailVerifiedAt\n        createdAt\n        updatedAt\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation Logout {\n    logout\n  }\n": types.LogoutDocument,
    "\n  mutation ForgotPassword($input: ForgotPasswordInput!) {\n    forgotPassword(input: $input)\n  }\n": types.ForgotPasswordDocument,
    "\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input)\n  }\n": types.ResetPasswordDocument,
    "\n  mutation SetPasswordWithToken($input: SetPasswordWithTokenInput!) {\n    setPasswordWithToken(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        avatar\n        emailVerifiedAt\n        createdAt\n        updatedAt\n      }\n    }\n  }\n": types.SetPasswordWithTokenDocument,
    "\n  query CurrentUser {\n    currentUser {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      authProvider\n      emailVerifiedAt\n      preferredLocale\n      preferredCurrency\n      createdAt\n      updatedAt\n    }\n  }\n": types.CurrentUserDocument,
    "\n  mutation VerifyEmail($token: String!) {\n    verifyEmail(token: $token) {\n      success\n      message\n    }\n  }\n": types.VerifyEmailDocument,
    "\n  mutation ResendVerificationEmail {\n    resendVerificationEmail {\n      success\n      message\n    }\n  }\n": types.ResendVerificationEmailDocument,
    "\n  query IsOtpEnabled($email: String!) {\n    isOtpEnabled(email: $email)\n  }\n": types.IsOtpEnabledDocument,
    "\n  mutation RequestOtpLogin($email: String!) {\n    requestOtpLogin(email: $email) {\n      success\n      message\n    }\n  }\n": types.RequestOtpLoginDocument,
    "\n  mutation VerifyOtpLogin($email: String!, $code: String!) {\n    verifyOtpLogin(email: $email, code: $code) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        avatar\n        emailVerifiedAt\n        createdAt\n        updatedAt\n      }\n    }\n  }\n": types.VerifyOtpLoginDocument,
    "\n  query MyNotifications($filters: NotificationFiltersInputType) {\n    myNotifications(filters: $filters) {\n      id\n      type\n      title\n      message\n      status\n      readAt\n      createdAt\n      updatedAt\n    }\n  }\n": types.MyNotificationsDocument,
    "\n  query UnreadNotificationCount {\n    unreadNotificationCount\n  }\n": types.UnreadNotificationCountDocument,
    "\n  mutation MarkNotificationAsRead($notificationId: ID!) {\n    markNotificationAsRead(notificationId: $notificationId) {\n      id\n      status\n      readAt\n    }\n  }\n": types.MarkNotificationAsReadDocument,
    "\n  mutation MarkAllNotificationsAsRead {\n    markAllNotificationsAsRead\n  }\n": types.MarkAllNotificationsAsReadDocument,
    "\n  mutation DeleteNotification($notificationId: ID!) {\n    deleteNotification(notificationId: $notificationId) {\n      id\n    }\n  }\n": types.DeleteNotificationDocument,
    "\n  subscription NotificationAdded {\n    notificationAdded {\n      id\n      type\n      title\n      message\n      status\n      createdAt\n    }\n  }\n": types.NotificationAddedDocument,
    "\n  mutation UpdateProfile($input: UpdateProfileInputType!) {\n    updateProfile(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      preferredLocale\n      preferredCurrency\n      emailVerifiedAt\n      createdAt\n    }\n  }\n": types.UpdateProfileDocument,
    "\n  mutation ChangePassword($input: ChangePasswordInputType!) {\n    changePassword(input: $input) {\n      success\n      message\n    }\n  }\n": types.ChangePasswordDocument,
    "\n  mutation DeleteAccount($input: DeleteAccountInputType!) {\n    deleteAccount(input: $input) {\n      success\n      message\n    }\n  }\n": types.DeleteAccountDocument,
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
export function graphql(source: "\n  mutation Register($input: RegisterInput!) {\n    register(input: $input) {\n      success\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation Register($input: RegisterInput!) {\n    register(input: $input) {\n      success\n      message\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        avatar\n        emailVerifiedAt\n        createdAt\n        updatedAt\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        avatar\n        emailVerifiedAt\n        createdAt\n        updatedAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Logout {\n    logout\n  }\n"): (typeof documents)["\n  mutation Logout {\n    logout\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ForgotPassword($input: ForgotPasswordInput!) {\n    forgotPassword(input: $input)\n  }\n"): (typeof documents)["\n  mutation ForgotPassword($input: ForgotPasswordInput!) {\n    forgotPassword(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input)\n  }\n"): (typeof documents)["\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetPasswordWithToken($input: SetPasswordWithTokenInput!) {\n    setPasswordWithToken(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        avatar\n        emailVerifiedAt\n        createdAt\n        updatedAt\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation SetPasswordWithToken($input: SetPasswordWithTokenInput!) {\n    setPasswordWithToken(input: $input) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        avatar\n        emailVerifiedAt\n        createdAt\n        updatedAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CurrentUser {\n    currentUser {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      authProvider\n      emailVerifiedAt\n      preferredLocale\n      preferredCurrency\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query CurrentUser {\n    currentUser {\n      id\n      email\n      firstName\n      lastName\n      phone\n      role\n      status\n      authProvider\n      emailVerifiedAt\n      preferredLocale\n      preferredCurrency\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifyEmail($token: String!) {\n    verifyEmail(token: $token) {\n      success\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation VerifyEmail($token: String!) {\n    verifyEmail(token: $token) {\n      success\n      message\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ResendVerificationEmail {\n    resendVerificationEmail {\n      success\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation ResendVerificationEmail {\n    resendVerificationEmail {\n      success\n      message\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query IsOtpEnabled($email: String!) {\n    isOtpEnabled(email: $email)\n  }\n"): (typeof documents)["\n  query IsOtpEnabled($email: String!) {\n    isOtpEnabled(email: $email)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestOtpLogin($email: String!) {\n    requestOtpLogin(email: $email) {\n      success\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation RequestOtpLogin($email: String!) {\n    requestOtpLogin(email: $email) {\n      success\n      message\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifyOtpLogin($email: String!, $code: String!) {\n    verifyOtpLogin(email: $email, code: $code) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        avatar\n        emailVerifiedAt\n        createdAt\n        updatedAt\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation VerifyOtpLogin($email: String!, $code: String!) {\n    verifyOtpLogin(email: $email, code: $code) {\n      accessToken\n      refreshToken\n      user {\n        id\n        email\n        firstName\n        lastName\n        role\n        status\n        avatar\n        emailVerifiedAt\n        createdAt\n        updatedAt\n      }\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation UpdateProfile($input: UpdateProfileInputType!) {\n    updateProfile(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      preferredLocale\n      preferredCurrency\n      emailVerifiedAt\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProfile($input: UpdateProfileInputType!) {\n    updateProfile(input: $input) {\n      id\n      email\n      firstName\n      lastName\n      phone\n      preferredLocale\n      preferredCurrency\n      emailVerifiedAt\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ChangePassword($input: ChangePasswordInputType!) {\n    changePassword(input: $input) {\n      success\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation ChangePassword($input: ChangePasswordInputType!) {\n    changePassword(input: $input) {\n      success\n      message\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAccount($input: DeleteAccountInputType!) {\n    deleteAccount(input: $input) {\n      success\n      message\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteAccount($input: DeleteAccountInputType!) {\n    deleteAccount(input: $input) {\n      success\n      message\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;