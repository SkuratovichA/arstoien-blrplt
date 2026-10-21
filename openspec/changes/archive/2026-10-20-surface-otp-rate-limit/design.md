# Design

## Context

`OtpRateLimiter.consume` fails with the typed `RateLimitError` (`retryAfterSeconds` inside), `AuthService.requestOtpLogin` passes it on, `requestOtpLoginAsync` runs the Effect through `runEffect`, and `toHttpException` in `effect-adapter.ts` turns it into an `HttpException` with status 429 and the body `{ message, retryAfterSeconds }`.
The resolver then catches everything and answers `{ success: false, message: 'Failed to send OTP code' }`, which is also the answer for an unknown email and for an email that may not use OTP, and the specification and the tests of those two cases rely on it.
Past the resolver, `formatError` in `app.module.ts` reduces every error to `{ message, code, path }`, and the code comes from `@nestjs/apollo`, which names only the statuses 400, 401, 403 and 422; any other status, 429 included, reaches the client as `INTERNAL_SERVER_ERROR`.

## Goals / Non-Goals

**Goals:**

- The rate limit reaches the client as an error with `extensions.code = RATE_LIMITED` and `extensions.retryAfterSeconds`.
- Every other failure of the mutation answers as before.
- The mechanism that names the code is the one the whole API will use.

**Non-Goals:**

- Codes for the other statuses (404, 409 and the validation errors) and the client side of all codes; the change that adds error codes to the API does both.
- A limit on `verifyOtpLogin` or any other change to the limiter.

## Decisions

The resolver rethrows an exception of status 429 and keeps the catch-all for the rest.
The status is the contract between the adapter and the formatter, so the resolver asks for the status and not for a class; a defect or a failure of another kind still lands in the catch-all.
Rejected: running the Effect in the resolver and catching `RateLimitError` by tag, because a defect (an exception that is not a typed error) would then escape the catch-all that the other cases rely on.

```ts
} catch (error) {
  if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
    throw error;
  }
  this.logger.error('Failed to request OTP login:', error);
  return { success: false, message: 'Failed to send OTP code' };
}
```

The code is named in the formatter from the status of the original `HttpException`, in a table keyed by status (`format-error.ts`), and the details the client needs (`retryAfterSeconds`) are read from the body that `toHttpException` already builds.
Keyed by status, because `toHttpException` is the single place that gives a typed error its status, and exceptions that guards and services throw directly carry the same statuses, so one table covers both.
Rejected: a Nest exception filter, because errors of a GraphQL resolver go through `formatError`, and a filter would be a second place that shapes the response.

The table starts with one entry, 429, and the formatter leaves every other error exactly as `formatError` shaped it before, so no other response changes in this change.

## Risks / Trade-offs

- A client of `requestOtpLogin` that only reads `data.requestOtpLogin.success` now also gets an error when the limit is hit. The repository's clients treat any error of the mutation as a generic failure, so their behaviour does not change until the client change maps the code.
- The response keeps the top-level `code` next to `extensions.code`, so no existing reader of the response breaks.
