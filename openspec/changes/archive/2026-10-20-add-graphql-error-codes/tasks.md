# Tasks

## 1. Spec

- [x] 1.1 Add the capability `error-codes` in `specs/error-codes/spec.md` of this change: the vocabulary of `extensions.code`, the text of the catalog for a code in the web apps, and the renewal of the session in the admin app
- [x] 1.2 Modify the requirement "A signed-in user changes the password by proving the current one" in `specs/authentication/spec.md` of this change

## 2. Failing tests

- [x] 2.1 Generate the skeletons with `pnpm spec:generate --change add-graphql-error-codes` and write the server scenarios of `error-codes` in `packages/server/test/spec/error-codes.spec.ts` against the requirement "Every error of a response names its kind in extensions.code", and see them fail on the current formatter
- [x] 2.2 Change the scenario "A new password shorter than eight characters is refused" in `packages/server/test/spec/authentication-password.spec.ts` to the code and the message of the delta, and see it fail on the current pipe
- [x] 2.3 Write the unit tests of the formatter in `packages/server/src/common/graphql/format-error.spec.ts`, among them `Scenario: An unexpected failure is reported as INTERNAL_SERVER_ERROR without its details`
- [x] 2.4 Write `packages/client/src/lib/error-message.test.ts` for the requirement "The web apps show the text of their catalog for the code of an error", and see it fail without the helper
- [x] 2.5 Write `packages/admin/src/lib/error-link.test.ts` for the requirement "The admin app renews an expired session once and shows the other errors by code", and see it fail without the link
- [x] 2.6 Write `scripts/error-message-mirror.spec.ts`, which fails when the helper of the client and the helper of the admin differ

## 3. Implementation

- [x] 3.1 Complete the table of `packages/server/src/common/graphql/format-error.ts` and build `extensions` from the code and `retryAfterSeconds` only
- [x] 3.2 Make the `exceptionFactory` of the validation pipe in `packages/server/src/app.setup.ts` return `toHttpException(new ValidationError(...))` and log the field names without the values
- [x] 3.3 Add `src/lib/error-message.ts` to `packages/client` and `packages/admin` and the `apiError` group to the three catalogs of each, with real Czech and Slovak texts
- [x] 3.4 Use the helper on the login, one-time-code, registration and set-password screens of `packages/client`, with the texts of the screens for the codes that mean more there than in general
- [x] 3.5 Add `packages/admin/src/lib/error-link.ts` and wire it in `packages/admin/src/lib/apollo-client.ts`; the sign-in page only logs and `add-user-modal.tsx` shows its fixed text, because the link has shown the error already
- [x] 3.6 Read the errors of `packages/client/src/lib/apollo-client.ts` through `CombinedGraphQLErrors` instead of a cast, so its log shows the code again

## 4. Review and archive

- [x] 4.1 Run `pnpm run ci`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm spec:validate` and `pnpm spec:check`
- [x] 4.2 Archive the change in the same pull request with `openspec archive add-graphql-error-codes`
