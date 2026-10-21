# user-profile Specification

## Purpose

What a signed-in user can read and change about their own account: the current user, the profile fields and the deletion of the account. A user is signed in by the access token, sent in the Authorization header or in the accessToken cookie.

## Requirements

### Requirement: The current user query returns the signed-in user

The system SHALL answer the current-user query with the account of the access token, and SHALL refuse the query when no valid access token is sent.

#### Scenario: Current user returns the profile of the signed-in user

- **WHEN** a client with a valid access token asks for the current user
- **THEN** the answer holds the email, the first name, the last name and the status of that account

#### Scenario: Current user without a token is refused

- **WHEN** a client without an access token asks for the current user
- **THEN** the request fails as unauthenticated

### Requirement: A profile update changes only the fields that were sent

The system SHALL change the profile fields that the update names and leave the others as they were, and SHALL refuse a first name longer than 100 characters.

#### Scenario: Updating the profile changes only the fields that were sent

- **WHEN** a signed-in user updates the first name and the bio
- **THEN** the answer holds the new first name and the new bio
- **AND** the last name of the account is unchanged
- **AND** the stored account holds the new values

#### Scenario: Updating the profile with a first name over 100 characters is refused

- **WHEN** a signed-in user updates the first name with 101 characters
- **THEN** the request fails with a validation error
- **AND** the stored first name is unchanged

### Requirement: Account deletion needs the password and an exact confirmation

The system SHALL delete an account only after the password of the account and the confirmation text DELETE MY ACCOUNT are right. The deletion SHALL be soft: the status becomes DELETED, the deletion time is set, the email is prefixed so that it can be used again, and an audit record is written.

#### Scenario: Deleting the account with the wrong confirmation text is refused

- **WHEN** a signed-in user sends the right password and a confirmation text other than DELETE MY ACCOUNT
- **THEN** the response reports failure with the message "Invalid confirmation text"
- **AND** the account keeps its status

#### Scenario: Deleting the account marks it deleted and keeps an audit record

- **WHEN** a signed-in user sends the right password and the confirmation text DELETE MY ACCOUNT
- **THEN** the response reports success
- **AND** the account is in the DELETED status with a deletion time and an email that starts with deleted_
- **AND** an audit record USER_ACCOUNT_DELETED exists for the account
