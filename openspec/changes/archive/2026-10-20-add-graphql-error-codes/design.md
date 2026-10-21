# Design

## Context

A resolver fails with a typed error (`NotFoundError`, `ConflictError`, `ValidationError` and the others in `common/effect/errors.ts`), `runEffect` turns it into an `HttpException` through `toHttpException`, and a guard or a service may throw an `HttpException` directly.
`@nestjs/apollo` then names a code, but only for an exception whose body carries a `statusCode`, which is the case when the exception was built from a string, and only for the statuses 400, 401, 403 and 422.
An exception built from an object, such as `NotFoundException({ message, resource, id })` or `ConflictException({ message, field })`, keeps `INTERNAL_SERVER_ERROR`, and a 400 from a string becomes `BAD_REQUEST`.
`formatGraphqlError` in `common/graphql/format-error.ts` then drops `extensions` for every status except 429, so the client sees the top-level `code` at best.
The global `ValidationPipe` in `app.setup.ts` throws `new Error('Validation failed: ' + JSON.stringify(fields))` with the rejected values inside, and logs the same values twice with `console.error`.
In the web apps, `packages/client` shows `error.message` of the server on the login, one-time-code and set-password screens, and `packages/admin` shows `err.message` from its error link.
That link reads `graphQLErrors` and `networkError` from the options of the handler, which Apollo Client 4 does not pass (it passes `error`, `result`, `operation` and `forward`), so none of its branches has run since that upgrade.

## Goals / Non-Goals

**Goals:**

- Every error of a response names its kind in `extensions.code`, from a short fixed list, and carries no stack trace and no body of the exception.
- The validation pipe fails through the error class and the adapter that exist, and stops sending and logging the rejected values.
- Both web apps show the text of their catalog for the code, in the language of the interface, and a screen can give its own text for a code.
- The admin app renews an expired session again, once for all the requests that were refused together, without looping on a refused sign-in.

**Non-Goals:**

- A code per error class, or codes such as `ACCOUNT_BLOCKED` for the three reasons that a login is refused as unauthenticated; the list names the kind of failure, and the specifications and the messages of the server keep the detail.
- Field-level errors for the forms (`extensions.fields`); the first constraint message is enough for the single message that the apps show.
- A language switcher in the client app; its catalogs for Czech and Slovak stay unreachable from the interface as before.

## Decisions

The table of `format-error.ts` is completed, not replaced: it is keyed by HTTP status because `toHttpException` is the single place that gives a typed error its status and the guards throw the same statuses, so one table covers both.
The status 400 and the status 422 are `BAD_USER_INPUT`, the name that Apollo itself uses for input that is not valid, and `BAD_REQUEST` of `@nestjs/apollo` goes away for exceptions.

```ts
const CODE_BY_STATUS: ReadonlyMap<number, ErrorCode> = new Map([
  [HttpStatus.BAD_REQUEST, ErrorCode.BadUserInput],
  [HttpStatus.UNAUTHORIZED, ErrorCode.Unauthenticated],
  [HttpStatus.FORBIDDEN, ErrorCode.Forbidden],
  [HttpStatus.NOT_FOUND, ErrorCode.NotFound],
  [HttpStatus.CONFLICT, ErrorCode.Conflict],
  [HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.BadUserInput],
  [HttpStatus.TOO_MANY_REQUESTS, ErrorCode.RateLimited],
]);
```

An exception whose status is not in the table, and an error that is not an `HttpException`, keep the code that Apollo gave them (`GRAPHQL_VALIDATION_FAILED`, `GRAPHQL_PARSE_FAILED` and the like for what GraphQL rejects before a resolver runs), and `INTERNAL_SERVER_ERROR` when there is none.
`extensions` is built from the code and `retryAfterSeconds`, never spread from what Apollo hands over, because that object holds the stack trace outside production and the body of the exception.
Rejected: a Nest exception filter, because errors of a resolver go through `formatError` and a filter would be a second place that shapes the response.
Rejected: a code per error class, because the client needs the kind of failure to write a message, and ten classes map onto the seven kinds through their statuses anyway.

The validation pipe reuses `ValidationError` and `toHttpException`, which already turn the first field message into a 400:

```ts
exceptionFactory: (errors) => {
  const failures = errors.flatMap(({ property, constraints }) =>
    Object.values(constraints ?? {}).map((message) => ({ field: property, message }))
  );
  logger.warn(`Validation failed for ${failures.map(({ field }) => field).join(', ')}`);
  return toHttpException(new ValidationError({ message: 'Validation failed', errors: failures }));
},
```

The message of a constraint, such as "newPassword must be longer than or equal to 8 characters", names the field and not the value, and the log line names the fields only.
Rejected: keeping the factory and only changing the class it returns, because its JSON of the rejected values is the leak.

The web apps get one helper each, `src/lib/error-message.ts`, with the same content in both: `errorCodeOf(error)` reads `extensions.code` of the first GraphQL error through `CombinedGraphQLErrors.is`, and `errorMessageOf(error, t, own)` returns the text of the screen for the code when the screen gave one, else the text of the catalog.
The texts are written with `t('apiError.…')` calls whose keys are string literals, so the check of the catalogs sees them; a table of keys by code would need a call with a variable key, which that check refuses.

```ts
export function errorMessageOf(error: unknown, t: TFunction, own: OwnTexts = {}): string {
  const graphqlError = CombinedGraphQLErrors.is(error) ? error.errors[0] : undefined;
  if (graphqlError === undefined) {
    return t('apiError.network');
  }
  const code = codeOf(graphqlError);
  const ownText = code === undefined ? undefined : own[code];
  if (ownText !== undefined) {
    return ownText;
  }
  switch (code) {
    case 'CONFLICT':
      return t('apiError.conflict');
    case 'RATE_LIMITED':
      return rateLimitedText(graphqlError, t);
    // BAD_USER_INPUT, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND likewise
    default:
      return t('apiError.internal');
  }
}
```

The two apps share no code besides `@blrplt/ui`, which is a package of components without Apollo or i18next, and both already keep their own `apollo-client.ts` and `i18n.ts`; so the helper exists twice, the tests live in `packages/client`, and `scripts/error-message-mirror.spec.ts` fails when the two files differ, the way `scripts/skill-mirror.spec.ts` does for the skill.

The error link of the admin app moves to `src/lib/error-link.ts` as a function of its collaborators (the token in use, the request for a new token, the storage of the token, the end of the session, the toast and the translation), so that a test can drive it with a fake terminating link and a real `ApolloClient`.
The renewal is one promise that every refused request waits for, which replaces the list of pending callbacks that never settled when the renewal failed:

```ts
let renewal: Promise<string> | null = null;
const renew = (): Promise<string> =>
  (renewal ??= deps.renewToken().finally(() => {
    renewal = null;
  }));
```

A refused request is renewed only while an access token is in use, because a refused sign-in has none, and the error of a wrong password must reach the user and not start a renewal that ends with a redirect to the page that the user is already on.
The retried request goes straight to the observer, so a second refusal reaches the caller and cannot loop.

The screens of the admin app that caught the rejection of a mutation to show a text of their own, the sign-in page and the dialog that adds a user, no longer show the text of the error.
The default error policy of the admin client is `all`, so a failed mutation resolves with `error` and the link has already shown it; the sign-in page only logs, and the dialog keeps its fixed text for a failure that is not a response of the API.

## Risks / Trade-offs

- `UNAUTHENTICATED` stands for a wrong password, a blocked account, a suspended account, a wrong one-time code and a missing token, so the login screen of the client app shows one text for the first three, which says that the account may be blocked or suspended.
- A client that matched the message `Validation failed: ...` breaks; the repository has none, and the specification pins the new shape.
- The admin app shows a toast for GraphQL errors again, including those of queries, so a role that lacks a permission sees `FORBIDDEN` text where it saw nothing; this is the behaviour the link was written for.
- The response keeps the top-level `code` next to `extensions.code`, so the readers of the response that predate `extensions.code` keep working.
- The helper exists twice; the mirror test is the price, and a third consumer would be the moment to move it into a shared package.
