# Proposal

## Why

A client that wants to tell a taken email from a wrong password from a hit rate limit has nothing to switch on.
The error formatter of the server keeps `extensions` only for HTTP status 429, and it drops the rest, so a conflict (409), a missing thing (404) and a validation error reach the client as a bare message, and `@nestjs/apollo` names only the statuses 400, 401, 403 and 422 on top of that.
The validation pipe throws a plain `Error` whose message is `Validation failed:` followed by the rejected fields and their values, so a new password that is too short travels back to the client, and into the log, as plain text.
The two web apps therefore show the English message of the server, or a generic text, and the language of the interface plays no part in what the user reads.
The error link of the admin app also never runs: it reads `graphQLErrors` and `networkError` from the options of the handler, and Apollo Client 4 hands over `error`, so the renewal of an expired session and the error toast of the admin app have been dead code since that upgrade.

## What Changes

- Every error of a GraphQL response carries `extensions.code`, one of `BAD_USER_INPUT`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED` and `INTERNAL_SERVER_ERROR`, chosen from the HTTP status that `toHttpException` or a guard gave the exception; an error that GraphQL raises before a resolver runs keeps the code that GraphQL gave it.
- The error keeps the top-level `code` next to `extensions.code`, and `extensions` holds nothing but the code and `retryAfterSeconds` of a rate limit, so no stack trace and no body of the exception is sent.
- The validation pipe throws the existing `ValidationError` through `toHttpException`, so a validation failure becomes `BAD_USER_INPUT` with the first constraint message, which names the field and does not repeat the value; the pipe logs the field names and no longer logs the values.
- The client app and the admin app show a failed request as the text of their catalog for the code, in the language of the interface: a text per code under `apiError.*`, a text of a screen where the screen knows better, the seconds to wait for `RATE_LIMITED`, and a connection text for a failure that did not come from the API.
- The error link of the admin app is rewritten for Apollo Client 4: it renews an expired session once for all the requests that were refused together, repeats them, ends the session when no new token comes, does not renew for a refused sign-in, and shows every other error as the text of its code.

## Capabilities

### New Capabilities

- `error-codes`: the vocabulary of `extensions.code` of the API, the text that the web apps show for each code, and the renewal of an expired session in the admin app.

### Modified Capabilities

- `authentication`: the requirement "A signed-in user changes the password by proving the current one" now says that a new password that is too short fails with `BAD_USER_INPUT` and a message that names the field and does not repeat the password.

## Impact

- Extends `packages/server/src/common/graphql/format-error.ts`, the table that the change "surface-otp-rate-limit" started, with the other statuses; `packages/server/src/app.setup.ts` reuses `ValidationError` and `toHttpException` from `packages/server/src/common/effect/`, so no second error class and no second mapping appear.
- Adds `src/lib/error-message.ts` to `packages/client` and `packages/admin` (one file, the same in both, pinned by `scripts/error-message-mirror.spec.ts` because the two apps share no code besides `@blrplt/ui`) and `src/lib/error-link.ts` to `packages/admin`.
- Adds the group `apiError` to the catalogs of both apps and a few texts of single screens, in English, Czech and Slovak.
- A client of the API that read the message of a validation error as `Validation failed: [...]` now reads a shorter message; the repository's own clients never parsed it.
- The login, one-time-code, registration and set-password screens of the client app show the text of the code, and the admin app shows a toast for GraphQL errors again, so a failed creation of a user is visible there for the first time since the Apollo Client 4 upgrade.
