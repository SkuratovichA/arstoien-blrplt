# Proposal

## Why

The `requestOtpLogin` mutation catches every failure of a code request and answers `success: false` with the message "Failed to send OTP code".
The rate limit of three requests per fifteen minutes is one of those failures, so a client cannot tell "wait" from "this email cannot get a code", and it never learns how long to wait, although the specification says that the request fails with a rate-limit error that carries the seconds to wait.
The limiter already fails with a typed `RateLimitError` that the adapter turns into HTTP 429, but the resolver swallows it, and the GraphQL error formatter would flatten it into `INTERNAL_SERVER_ERROR` anyway, because Apollo has no name for status 429.

## What Changes

- A code request that the rate limit rejects fails with an error whose `extensions.code` is `RATE_LIMITED` and whose `extensions.retryAfterSeconds` is the number of seconds until the window ends.
- Every other failure of a code request keeps answering `success: false` with the message "Failed to send OTP code".
- The GraphQL error formatter of the server gets the first entry of its table of error codes: HTTP status 429 becomes `RATE_LIMITED`. The other statuses join the table in the change that adds error codes to the whole API.

## Capabilities

### New Capabilities

### Modified Capabilities

- `authentication`: the requirement "Code requests are limited per email" now says what the client receives when the limit is hit.

## Impact

- Extends `requestOtpLogin` in `packages/server/src/modules/auth/auth.resolver.ts`, `formatError` in `packages/server/src/app.module.ts`, and the existing `RateLimitError` and `toHttpException` in `packages/server/src/common/effect/`; no second error class or mapping is introduced.
- Adds `packages/server/src/common/graphql/format-error.ts`, the home of the error-code table that the next change completes.
- Adds one scenario to `openspec/specs/authentication/spec.md` through the delta of this change; the existing scenario "The fourth code request within the window is rejected" and its unit test in `otp-rate-limiter.spec.ts` stay as they are.
- A client that reads `requestOtpLogin` now has to expect an error besides the `success` flag; the repository's own clients show a generic failure for any error of that mutation, so they keep working.
