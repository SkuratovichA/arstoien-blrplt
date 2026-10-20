## MODIFIED Requirements

### Requirement: Code requests are limited per email

The system SHALL allow one email at most three code requests in a window of fifteen minutes that opens with its first request, and SHALL fail the next request with a rate-limit error that says how many seconds to wait, delivered as an error of the response and not as a plain failure answer.

#### Scenario: The fourth code request within the window is rejected

- **WHEN** an email has made three code requests in the current window and makes a fourth
- **THEN** the request fails with a rate-limit error that carries the seconds until the window ends
- **AND** the three requests before it were accepted

#### Scenario: A rejected code request reaches the client as a rate-limit error

- **WHEN** an email has made three code requests through the requestOtpLogin mutation in the current window and a client makes a fourth
- **THEN** the response carries an error with the code RATE_LIMITED and the seconds to wait in retryAfterSeconds
- **AND** the response does not answer with success set to false
- **AND** only the three accepted requests sent an email
