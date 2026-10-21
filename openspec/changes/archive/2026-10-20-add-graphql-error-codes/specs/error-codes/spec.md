## ADDED Requirements

### Requirement: Every error of a response names its kind in extensions.code

The system SHALL give every error of a GraphQL response an extensions.code from the list BAD_USER_INPUT, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, CONFLICT, RATE_LIMITED and INTERNAL_SERVER_ERROR, and SHALL keep the code that GraphQL gave an error it raised before a resolver ran.
The error SHALL repeat the code at its top level, and its extensions SHALL hold nothing but the code and the details that a specification names, so that no stack trace and no body of an exception is sent.

#### Scenario: A user who may not do this is refused as FORBIDDEN

- **WHEN** a signed-in user with the role USER asks for the system settings
- **THEN** the response carries one error with the code FORBIDDEN in extensions.code and at its top level
- **AND** the extensions of the error hold nothing but the code

#### Scenario: Something that does not exist is reported as NOT_FOUND

- **WHEN** a signed-in user marks a notification as read with an id that no notification has
- **THEN** the response carries one error with the code NOT_FOUND in extensions.code and at its top level
- **AND** the extensions of the error hold nothing but the code

#### Scenario: A request that collides with existing data is reported as CONFLICT

- **WHEN** a visitor registers with an email address that an account already uses
- **THEN** the response carries one error with the code CONFLICT in extensions.code and at its top level
- **AND** the extensions of the error hold nothing but the code

#### Scenario: Input that is not valid is reported as BAD_USER_INPUT

- **WHEN** a visitor registers with an email address that is not an address
- **THEN** the response carries one error with the code BAD_USER_INPUT in extensions.code and at its top level
- **AND** the message names the field email and does not repeat the value that was sent
- **AND** no account is created

#### Scenario: A request without a token is reported as UNAUTHENTICATED

- **WHEN** a visitor without a token asks for the notifications of the current user
- **THEN** the response carries one error with the code UNAUTHENTICATED in extensions.code and at its top level
- **AND** the extensions of the error hold nothing but the code

#### Scenario: A query that GraphQL rejects keeps the code that GraphQL gave it

- **WHEN** a visitor sends a query that asks for a field that the schema does not have
- **THEN** the response carries one error with the code GRAPHQL_VALIDATION_FAILED in extensions.code and at its top level
- **AND** the extensions of the error hold nothing but the code

#### Scenario: An unexpected failure is reported as INTERNAL_SERVER_ERROR without its details

- **WHEN** a resolver fails with an error that no rule names, or with an exception of the status 500
- **THEN** the error of the response carries the code INTERNAL_SERVER_ERROR in extensions.code and at its top level
- **AND** the extensions of the error hold nothing but the code

### Requirement: The web apps show the text of their catalog for the code of an error

The client app and the admin app SHALL show a failed request as the text that their translation catalog holds for the extensions.code of the first error, in the language of the interface, and never as the message of the server.
A screen MAY give its own text for a code.
A RATE_LIMITED error SHALL say how many seconds to wait, a failure without an error of the API SHALL be shown as a network problem, and a code that the app does not know as a general failure.

#### Scenario: A code is shown as the text of the catalog in the language of the interface

- **WHEN** a request fails with an error whose code is CONFLICT
- **THEN** the app shows the text of apiError.conflict in the language of the interface
- **AND** it does not show the message of the server

#### Scenario: A screen's own text for a code replaces the text of the catalog

- **WHEN** a screen gives its own text for UNAUTHENTICATED and a request fails with that code
- **THEN** the app shows the text of the screen
- **AND** an error with another code still shows the text of the catalog

#### Scenario: A rate limit tells the seconds to wait

- **WHEN** a request fails with the code RATE_LIMITED and retryAfterSeconds of 42
- **THEN** the app shows a text that names 42 seconds
- **AND** the same error without retryAfterSeconds shows a text without a number

#### Scenario: A failure that did not come from the API is shown as a network problem

- **WHEN** a request fails without any error of the API, for example because the connection is lost
- **THEN** the app shows the network text of the catalog

#### Scenario: A code that the app does not know is shown as a general failure

- **WHEN** a request fails with a code that is not on the list, or with INTERNAL_SERVER_ERROR
- **THEN** the app shows the general text of the catalog

### Requirement: The admin app renews an expired session once and shows the other errors by code

When a request is refused with the code UNAUTHENTICATED while an access token is in use, the admin app SHALL ask for a new access token once, however many requests are refused together, and repeat the refused requests with it.
When no new token comes it SHALL end the session, and when no token is in use, as in a refused sign-in, it SHALL NOT ask for one.
Any other error, and a network failure, SHALL be shown as a toast with the text of the catalog.

#### Scenario: A refused request is repeated once with a renewed access token

- **WHEN** a request is refused with the code UNAUTHENTICATED while an access token is in use and the server issues a new token
- **THEN** the new token is stored and the request is repeated with it
- **AND** the caller receives the result of the repeated request
- **AND** no toast is shown

#### Scenario: Requests refused together share one renewal

- **WHEN** two requests are refused with the code UNAUTHENTICATED while the first renewal is still running
- **THEN** the server is asked for a new token once
- **AND** both requests are repeated with the new token

#### Scenario: A refused sign-in does not ask for a renewal

- **WHEN** a request is refused with the code UNAUTHENTICATED while no access token is in use
- **THEN** the server is not asked for a new token
- **AND** the app shows a toast with the text of apiError.unauthenticated

#### Scenario: A failed renewal ends the session

- **WHEN** a request is refused with the code UNAUTHENTICATED while an access token is in use and the server issues no new token
- **THEN** the session ends
- **AND** the refused request is not repeated and its caller receives the refusal

#### Scenario: An error of another code is shown as the text of its code

- **WHEN** a request fails with the code CONFLICT
- **THEN** the app shows a toast with the text of apiError.conflict
- **AND** the server is not asked for a new token

#### Scenario: A network failure is shown as a connection problem

- **WHEN** a request fails because the connection is lost
- **THEN** the app shows a toast with the network text of the catalog
