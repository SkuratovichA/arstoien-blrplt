# authentication Specification

## Purpose

How a person gets an account and proves who they are: registration, password login, token refresh and logout, password reset and change, and login with a one-time code sent by email. The API is GraphQL at /graphql; tokens come back in the response and in httpOnly cookies.

## Requirements

### Requirement: Registration creates an account that waits for approval

The system SHALL accept a registration made of an email address, a first name, a last name and a phone number, store it as an account in the PENDING_APPROVAL status, and answer without issuing any token.

#### Scenario: Registration creates a pending account

- **WHEN** a visitor registers with an email address that no account uses, a first name, a last name and a phone number
- **THEN** the response reports success and says that an administrator will review the application
- **AND** an account with that email exists in the PENDING_APPROVAL status
- **AND** no cookie is set

#### Scenario: Registration with an email that is taken is refused

- **WHEN** a visitor registers with an email address that an account already uses
- **THEN** the request fails with the message "User with this email already exists"
- **AND** no second account is created

### Requirement: Password login returns tokens and sets cookies

The system SHALL check an email and a password against the stored hash and, when they match an account that is not blocked or suspended, return an access token, a refresh token and the user, set both tokens in httpOnly cookies and record the time of the login. A refusal SHALL not tell a wrong password from an unknown email.

#### Scenario: Login with the right password returns tokens and cookies

- **WHEN** a user with an active account logs in with the right email and password
- **THEN** the response carries an access token, a refresh token and the user
- **AND** the response sets the accessToken and refreshToken cookies as httpOnly
- **AND** the last login time of the account is set

#### Scenario: Login with a wrong password is refused

- **WHEN** a user logs in with the right email and a wrong password
- **THEN** the request fails as unauthenticated with the message "Invalid credentials"
- **AND** no cookie is set

#### Scenario: Login with an unknown email is refused like a wrong password

- **WHEN** a visitor logs in with an email that no account uses
- **THEN** the request fails as unauthenticated with the message "Invalid credentials"

#### Scenario: Login to a blocked account is refused

- **WHEN** a user whose account is BLOCKED logs in with the right email and password
- **THEN** the request fails as unauthenticated with the message "Account is blocked"

#### Scenario: Login to a suspended account is refused

- **WHEN** a user whose account is SUSPENDED logs in with the right email and password
- **THEN** the request fails as unauthenticated with the message "Account is suspended"

### Requirement: A refresh token issues a new access token

The system SHALL verify a refresh token against its secret and its stored record and, when both hold, issue a new access token for its user, return it and set it in the accessToken cookie. A missing or invalid refresh token SHALL clear both cookies and answer null.

#### Scenario: Refresh with a valid refresh token issues an access token

- **WHEN** a client calls refresh with the refreshToken cookie of a logged-in user
- **THEN** the response is an access token
- **AND** that token authenticates the user on the current-user query
- **AND** the accessToken cookie is set

#### Scenario: Refresh without a refresh token answers null and clears the cookies

- **WHEN** a client calls refresh without a refreshToken cookie
- **THEN** the response is null
- **AND** the accessToken and refreshToken cookies are cleared

#### Scenario: Refresh with a revoked refresh token answers null

- **WHEN** a client calls refresh with a refresh token whose stored record was deleted by logout
- **THEN** the response is null
- **AND** the accessToken and refreshToken cookies are cleared

### Requirement: Logout revokes the refresh token

The system SHALL delete the stored record of the refresh token that the client sends and clear both cookies, so that the token cannot be exchanged again.

#### Scenario: Logout deletes the refresh token record and clears the cookies

- **WHEN** a logged-in client calls logout with its refreshToken cookie
- **THEN** the response is true
- **AND** the stored record of that refresh token no longer exists
- **AND** the accessToken and refreshToken cookies are cleared

### Requirement: A forgotten password is reset through an emailed link

The system SHALL, for a known email, store a password-reset token that is valid for thirty minutes and email a link that carries it. For an unknown email it SHALL answer the same way and send nothing. A valid token SHALL set the new password once.

#### Scenario: Forgot password emails a reset link to a known address

- **WHEN** a visitor asks for a password reset for the email of an existing account
- **THEN** the response is true
- **AND** one email goes to that address with a link to the reset-password page that carries a token
- **AND** a PASSWORD_RESET token that expires in thirty minutes is stored for the account

#### Scenario: Forgot password for an unknown address sends nothing

- **WHEN** a visitor asks for a password reset for an email that no account uses
- **THEN** the response is true
- **AND** no email is sent

#### Scenario: Reset password with a valid token sets the new password

- **WHEN** a visitor sends a valid reset token and a new password
- **THEN** the response is true
- **AND** the user can log in with the new password and not with the old one
- **AND** the same token is refused when it is used again

#### Scenario: Reset password with an expired token is refused

- **WHEN** a visitor sends a reset token that is past its expiry together with a new password
- **THEN** the request fails with the message "Reset token has expired"
- **AND** the password of the account is unchanged

### Requirement: A signed-in user changes the password by proving the current one

The system SHALL change the password of the signed-in user only when the current password matches, and SHALL refuse a new password that is shorter than eight characters.

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
- **THEN** the request fails with a validation error
- **AND** the password of the account is unchanged

### Requirement: One-time-code login is available only when both switches are on

The system SHALL offer login with a one-time code only when the system-wide setting and the preference of the user are both on, and SHALL report that state through the isOtpEnabled query.

#### Scenario: OTP is reported as disabled while the system setting is off

- **WHEN** the system-wide OTP setting is off and a client asks whether OTP is enabled for the email of a user whose own preference is on
- **THEN** the answer is false

#### Scenario: OTP is reported as enabled when the system setting and the user preference are on

- **WHEN** the system-wide OTP setting is on and a client asks whether OTP is enabled for the email of a user whose own preference is on
- **THEN** the answer is true

#### Scenario: OTP is reported as disabled for an email that no account uses

- **WHEN** the system-wide OTP setting is on and a client asks whether OTP is enabled for an email that no account uses
- **THEN** the answer is false

### Requirement: A one-time code is emailed and works once

The system SHALL generate a six-digit code that expires after five minutes, email it to the user, accept it once together with the email to log in, and treat a wrong code and an expired code in the same way.

#### Scenario: Requesting a code emails a six-digit code

- **WHEN** a user who may use OTP requests a code for the email of the account
- **THEN** the response reports success
- **AND** one email with a code of six digits goes to that address

#### Scenario: Requesting a code for an unknown email sends nothing

- **WHEN** a visitor requests a code for an email that no account uses
- **THEN** the response reports failure
- **AND** no email is sent

#### Scenario: A valid code logs the user in and cannot be used twice

- **WHEN** a user submits the email and the code that was emailed
- **THEN** the response carries an access token, a refresh token and the user, and the cookies are set
- **AND** submitting the same code again fails with the message "Invalid or expired OTP code"

#### Scenario: A wrong code is refused

- **WHEN** a user submits the email together with a code that was never issued
- **THEN** the request fails as unauthenticated with the message "Invalid or expired OTP code"

#### Scenario: An expired code is refused

- **WHEN** a user submits a code whose five minutes have passed
- **THEN** the request fails as unauthenticated with the message "Invalid or expired OTP code"
- **AND** the code is gone and cannot be tried again

### Requirement: Code requests are limited per email

The system SHALL allow one email at most three code requests in a window of fifteen minutes that opens with its first request, and SHALL fail the next request with a rate-limit error that says how many seconds to wait.

#### Scenario: The fourth code request within the window is rejected

- **WHEN** an email has made three code requests in the current window and makes a fourth
- **THEN** the request fails with a rate-limit error that carries the seconds until the window ends
- **AND** the three requests before it were accepted
