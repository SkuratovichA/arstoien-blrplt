import { graphql } from '@/gql';

// Register mutation returns RegisterResponse with success and message
export const REGISTER = graphql(`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      success
      message
    }
  }
`);

// Register customer mutation
export const REGISTER_CUSTOMER = graphql(`
  mutation RegisterCustomer($input: RegisterCustomerInput!) {
    registerCustomer(input: $input) {
      success
      message
    }
  }
`);

// Register carrier mutation
export const REGISTER_CARRIER = graphql(`
  mutation RegisterCarrier($input: RegisterCarrierInput!) {
    registerCarrier(input: $input) {
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

// Set password with token mutation (for new users after admin approval)
export const SET_PASSWORD_WITH_TOKEN = graphql(`
  mutation SetPasswordWithToken($input: SetPasswordWithTokenInput!) {
    setPasswordWithToken(input: $input) {
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

// Check if OTP is enabled for an email
export const CHECK_OTP_ENABLED = graphql(`
  query IsOtpEnabled($email: String!) {
    isOtpEnabled(email: $email)
  }
`);

// Request OTP login code
export const REQUEST_OTP_LOGIN = graphql(`
  mutation RequestOtpLogin($email: String!) {
    requestOtpLogin(email: $email) {
      success
      message
    }
  }
`);

// Verify OTP login code
export const VERIFY_OTP_LOGIN = graphql(`
  mutation VerifyOtpLogin($email: String!, $code: String!) {
    verifyOtpLogin(email: $email, code: $code) {
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
