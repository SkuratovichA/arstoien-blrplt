## MODIFIED Requirements

### Requirement: A signed-in user changes the password by proving the current one

The system SHALL change the password of the signed-in user only when the current password matches, and SHALL refuse a new password that is shorter than eight characters with the code BAD_USER_INPUT and a message that names the field and does not repeat the password.

#### Scenario: Changing the password with the right current password succeeds

- **WHEN** a signed-in user sends the right current password and a new password of eight characters or more
- **THEN** the response reports success
- **AND** the user can log in with the new password and not with the old one

#### Scenario: Changing the password with a wrong current password is refused

- **WHEN** a signed-in user sends a wrong current password
- **THEN** the response reports failure with the message "Current password is incorrect"
- **AND** the password of the account is unchanged

#### Scenario: A new password shorter than eight characters is refused

- **WHEN** a signed-in user sends the right current password and a new password of seven characters
- **THEN** the request fails with the code BAD_USER_INPUT
- **AND** the message names the field newPassword and does not contain the password that was sent
- **AND** the password of the account is unchanged
