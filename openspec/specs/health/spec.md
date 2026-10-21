# health Specification

## Purpose

The route that a load balancer or an uptime monitor calls to learn whether the API is alive and can reach its database.

## Requirements

### Requirement: Health reports the state of the database

The system SHALL answer GET /health with HTTP 200 and a body that holds a status, a timestamp and the database state: ok and connected when a query to the database answers, error and disconnected when it does not.

#### Scenario: Health reports ok while the database answers

- **WHEN** a client calls GET /health and the database answers
- **THEN** the status is 200
- **AND** the body holds status ok, database connected and a timestamp in ISO format

#### Scenario: Health reports an error when the database does not answer

- **WHEN** a client calls GET /health and the query to the database fails
- **THEN** the status is 200
- **AND** the body holds status error and database disconnected
