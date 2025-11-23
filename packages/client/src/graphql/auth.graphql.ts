import { gql } from '@apollo/client';

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        email
        firstName
        lastName
        isEmailVerified
        isTwoFactorEnabled
        createdAt
      }
      message
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        firstName
        lastName
        isEmailVerified
        isTwoFactorEnabled
        createdAt
      }
      requiresTwoFactor
      message
    }
  }
`;

export const VERIFY_TWO_FACTOR = gql`
  mutation VerifyTwoFactor($input: VerifyTwoFactorInput!) {
    verifyTwoFactor(input: $input) {
      user {
        id
        email
        firstName
        lastName
        isEmailVerified
        isTwoFactorEnabled
        createdAt
      }
      message
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout {
      success
      message
    }
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($input: ForgotPasswordInput!) {
    forgotPassword(input: $input) {
      success
      message
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      success
      message
    }
  }
`;

export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      success
      message
    }
  }
`;

export const RESEND_VERIFICATION_EMAIL = gql`
  mutation ResendVerificationEmail {
    resendVerificationEmail {
      success
      message
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
      isEmailVerified
      isTwoFactorEnabled
      createdAt
    }
  }
`;
