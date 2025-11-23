import { gql } from '@apollo/client';

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
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

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      success
      message
    }
  }
`;

export const ENABLE_TWO_FACTOR = gql`
  mutation EnableTwoFactor {
    enableTwoFactor {
      secret
      qrCode
      backupCodes
    }
  }
`;

export const CONFIRM_TWO_FACTOR = gql`
  mutation ConfirmTwoFactor($input: ConfirmTwoFactorInput!) {
    confirmTwoFactor(input: $input) {
      success
      message
      backupCodes
    }
  }
`;

export const DISABLE_TWO_FACTOR = gql`
  mutation DisableTwoFactor($input: DisableTwoFactorInput!) {
    disableTwoFactor(input: $input) {
      success
      message
    }
  }
`;

export const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($input: DeleteAccountInput!) {
    deleteAccount(input: $input) {
      success
      message
    }
  }
`;
