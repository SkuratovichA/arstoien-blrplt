import { graphql } from '../gql';

// Update profile mutation
export const UPDATE_PROFILE = graphql(`
  mutation UpdateProfile($input: UpdateProfileInputType!) {
    updateProfile(input: $input) {
      id
      email
      firstName
      lastName
      phone
      preferredLocale
      preferredCurrency
      emailVerifiedAt
      createdAt
    }
  }
`);

// Change password mutation
export const CHANGE_PASSWORD = graphql(`
  mutation ChangePassword($input: ChangePasswordInputType!) {
    changePassword(input: $input) {
      success
      message
    }
  }
`);

// Enable two-factor authentication
export const ENABLE_TWO_FACTOR = graphql(`
  mutation EnableTwoFactor {
    enableTwoFactor {
      secret
      qrCode
      backupCodes
    }
  }
`);

// Confirm two-factor authentication
export const CONFIRM_TWO_FACTOR = graphql(`
  mutation ConfirmTwoFactor($input: ConfirmTwoFactorInputType!) {
    confirmTwoFactor(input: $input) {
      success
      message
    }
  }
`);

// Disable two-factor authentication
export const DISABLE_TWO_FACTOR = graphql(`
  mutation DisableTwoFactor($input: DisableTwoFactorInputType!) {
    disableTwoFactor(input: $input) {
      success
      message
    }
  }
`);

// Delete account mutation
export const DELETE_ACCOUNT = graphql(`
  mutation DeleteAccount($input: DeleteAccountInputType!) {
    deleteAccount(input: $input) {
      success
      message
    }
  }
`);
