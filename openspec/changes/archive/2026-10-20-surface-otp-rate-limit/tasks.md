# Tasks

## 1. Spec

- [x] 1.1 Modify the requirement "Code requests are limited per email" in `specs/authentication/spec.md` of this change and add the scenario "A rejected code request reaches the client as a rate-limit error"

## 2. Failing tests

- [x] 2.1 Write `Scenario: A rejected code request reaches the client as a rate-limit error` in `packages/server/test/spec/authentication-otp.spec.ts` against the requirement "Code requests are limited per email", and see it fail on the current resolver
- [x] 2.2 Write the unit test of the error formatter in `packages/server/src/common/graphql/format-error.spec.ts`: status 429 becomes `RATE_LIMITED` with `retryAfterSeconds`, every other error keeps its shape

## 3. Implementation

- [x] 3.1 Add `packages/server/src/common/graphql/format-error.ts` with the table of codes by status and use it in `formatError` of `packages/server/src/app.module.ts`
- [x] 3.2 Rethrow the exception of status 429 in `requestOtpLogin` of `packages/server/src/modules/auth/auth.resolver.ts` and keep the catch-all for every other failure (`Scenario: Requesting a code for an unknown email sends nothing` stays green)

## 4. Review and archive

- [x] 4.1 Run `pnpm run ci`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm spec:validate` and `pnpm spec:check`
- [x] 4.2 Archive the change in the same pull request with `openspec archive surface-otp-rate-limit`
