import { graphql } from '../gql';

// Register mutation returns RegisterResponse with success and message only
export const REGISTER = graphql(`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      success
      message
    }
  }
`);

// Login mutation returns AuthResponse with tokens and user
export const LOGIN = graphql(`
  mutation Login($input: LoginInput!) {
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
        avatar
        emailVerifiedAt
        createdAt
        updatedAt
      }
    }
  }
`);

// Logout mutation returns Boolean
export const LOGOUT = graphql(`
  mutation Logout {
    logout
  }
`);

// Forgot password mutation returns Boolean
export const FORGOT_PASSWORD = graphql(`
  mutation ForgotPassword($input: ForgotPasswordInput!) {
    forgotPassword(input: $input)
  }
`);

// Reset password mutation returns Boolean
export const RESET_PASSWORD = graphql(`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`);

// Current user query
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

// Verify email mutation
export const VERIFY_EMAIL = graphql(`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      success
      message
    }
  }
`);

// Resend verification email mutation
export const RESEND_VERIFICATION_EMAIL = graphql(`
  mutation ResendVerificationEmail {
    resendVerificationEmail {
      success
      message
    }
  }
`);

// Verify two-factor authentication
export const VERIFY_TWO_FACTOR = graphql(`
  mutation VerifyTwoFactor($input: VerifyTwoFactorInput!) {
    verifyTwoFactor(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        firstName
        lastName
        role
        status
        emailVerifiedAt
        createdAt
        updatedAt
      }
    }
  }
`);
