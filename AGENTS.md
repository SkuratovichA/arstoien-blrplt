# AGENTS.md

This file is the working contract for everyone who changes this repository, people and coding agents alike.

The product is described first, in `openspec/specs/`, and built second. For a change of behaviour the order is: spec, then a failing test, then the implementation.

## Layout

- `packages/server` - NestJS 12 as native ES modules (relative imports end in `.js`), GraphQL code-first on Apollo Server 5 and Express 5, Prisma 7 on PostgreSQL, Effect 4 at the service boundary
- `packages/client` and `packages/admin` - React 19 apps on Vite 8 with TanStack Router and Apollo Client
- `packages/ui` - the shared components, `@blrplt/ui`
- `openspec/specs/<capability>/spec.md` - what the product does today, one directory per capability
- `openspec/changes/<id>/` - a change in flight: proposal, design, tasks and delta specs
- `scripts/spec-scenarios.ts` - the tool that ties scenarios to tests (`check` and `generate`)
- `packages/server/test/spec/` - the integration tests, one file per capability
- `packages/server/test/support/` - the harness: `createTestApp`, `gql`, `seedUser`, `loginAs` and the in-memory fakes
- `.agents/skills/` - the agent skills (the OpenSpec ones and `spec-to-tests`), and `.claude/skills/` mirrors them for Claude Code
- `.github/workflows/` - `ci.yml`, `spec-gate.yml` and the optional `spec-tests-agent.yml`

## Commands

Everything runs from the repository root, with pnpm only. Node is the version in `.nvmrc`.

| Command | What it does |
|---|---|
| `pnpm install --frozen-lockfile` | Installs exactly what the lockfile says |
| `pnpm run ci` | The Biome check, read-only, warnings count as errors; `pnpm ci` is pnpm's own command and reinstalls |
| `pnpm typecheck` | TypeScript in every package, in the server tests and in `scripts/` |
| `pnpm test` | Unit tests of every package and of `scripts/` |
| `pnpm test:integration` | Integration tests of the server, against a real PostgreSQL; needs `DATABASE_URL` |
| `pnpm spec:validate` | OpenSpec validation of every spec, strict |
| `pnpm spec:check` | Every scenario has a test titled `Scenario: <title>`, and every such test has a scenario |
| `pnpm spec:generate <capability>` | Appends `it.todo` skeletons for the scenarios that have no test; `--change <id>` does it for an open change |

`pnpm test:integration` has no default `DATABASE_URL`, because the tests write rows and run `prisma migrate deploy` first. Point it at a database that may be filled, for example an empty one next to the development database: `docker compose exec postgres createdb -U blrplt_user blrplt_test`, then `DATABASE_URL=postgresql://blrplt_user:blrplt_password@localhost:5433/blrplt_test pnpm test:integration`.

A change is done when `pnpm run ci`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm spec:validate` and `pnpm spec:check` all exit 0; read each exit code, not only the output.

## Spec-driven workflow

1. Describe the behaviour. `/opsx:propose <what you want>` creates `openspec/changes/<id>/` with a proposal, a design, tasks and delta specs. A requirement uses SHALL, and each requirement has scenarios under a `#### Scenario: <title>` heading, with WHEN, THEN and AND lines.
2. Get the tests. `pnpm spec:generate --change <id>` appends one `it.todo` skeleton per scenario to `packages/server/test/spec/<capability>.spec.ts`, and the `spec-to-tests` skill turns them into real tests: an integration test where the behaviour is reachable through HTTP or GraphQL, a unit test next to the code where only a double can force it.
3. Build it. `/opsx:apply` works through the tasks until `pnpm test:integration` is green; `/opsx:archive` then folds the delta into `openspec/specs/` in the same pull request as the code.

The rules of the gate, enforced on every pull request by `.github/workflows/spec-gate.yml`:

- The title of a test is `Scenario: ` followed by the exact scenario title, copied from the spec and never typed by hand. A title is unique across all specs and open changes.
- A scenario whose test is an `it.todo` or an `it.skip` counts as uncovered.
- A test titled `Scenario: ...` for a scenario that does not exist is an orphan, and fails the gate as well.
- A spec is never edited to make a test pass. A spec change is its own OpenSpec change.
- Every test is seen failing once, by writing it before the implementation or by breaking the behaviour on purpose, before it is trusted.
- The integration tests use the real database and the real application; only the external senders and the Redis-backed services are replaced, by the in-memory fakes in `packages/server/test/support/fakes.ts`.

## Conventions

- Never `any` and never `as any` in TypeScript. Find the proper type, and narrow instead of asserting.
- Search before writing logic. The repository usually holds the helper, client, mapping or validator already; reuse or extend it, and write a parallel copy only when a layer boundary forces it.
- Server code that can fail returns an Effect with a typed error. Imports in `packages/server` are relative and end in `.js`.
- A schema change needs a migration (`pnpm db:migrate`), because the integration tests and the spec gate build the database from the migration files in `packages/server/prisma/migrations` with `prisma migrate deploy`.
- Biome formats and lints: single quotes, width 100, `import type` for types, and a `console` call is a warning, which fails `pnpm run ci`.
- Conventional commits.
- Write documentation and spec text with one sentence or paragraph per line, without hard wrapping.
