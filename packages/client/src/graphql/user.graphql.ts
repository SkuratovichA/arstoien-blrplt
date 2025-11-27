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

// Delete account mutation
export const DELETE_ACCOUNT = graphql(`
  mutation DeleteAccount($input: DeleteAccountInputType!) {
    deleteAccount(input: $input) {
      success
      message
    }
  }
`);
