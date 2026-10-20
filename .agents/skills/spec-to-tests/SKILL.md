---
name: spec-to-tests
description: Use when a spec or an OpenSpec change has scenarios without tests, when `pnpm spec:check` fails, or when someone asks for tests from a spec.
---

# Spec to tests

A scenario title and a test title are the same string: the test is titled `Scenario: <exact title>`, where the title is copied from the `#### Scenario:` heading in the spec.

`pnpm spec:check` enforces this in every pull request through `.github/workflows/spec-gate.yml`, and a scenario whose test is an `it.todo` or an `it.skip` counts as not covered.

## Steps

1. Run `pnpm spec:check` and read its `uncovered:`, `orphan:` and `duplicate` lines: an uncovered scenario has no test, an orphan test has no scenario, a duplicate is a title used twice.
2. Run `pnpm spec:generate <capability>` to get `it.todo` skeletons, or `pnpm spec:generate --change <id>` for a change that is still open in `openspec/changes/<id>/`. The WHEN, THEN and AND lines arrive as comments above each skeleton.
3. Never type a title by hand. Keep the generated title or copy it from the spec so it matches character for character.
4. Choose the layer for each scenario.
   - Behaviour reachable through HTTP or GraphQL goes into an integration test in `packages/server/test/spec/<capability>.spec.ts`. Read the harness in `packages/server/test/support/` and one existing spec in that folder first, and follow their helpers. The database is real Postgres; the only things replaced are the external senders and the Redis-backed services, which are in-memory fakes.
   - Pure logic (a clock, a limiter, a mapper) goes into a unit test next to the code in `packages/<package>/src/**/*.spec.ts` and carries the same `Scenario: ` title.
5. Turn each WHEN into the arrange and act steps, and each THEN and AND line into one assertion. Drop none of them.
6. See every test fail once before you trust it: write it before the implementation, or break the behaviour on purpose, run the test, read the failure, and restore the behaviour. Note how each test was seen failing.
7. Run the gates and read the exit code of each one: `pnpm spec:validate`, `pnpm spec:check`, `pnpm test`, `pnpm test:integration`, `pnpm typecheck`, `pnpm run ci`.

## Rules

- Never edit a spec to make a test pass. A spec change is its own OpenSpec change in `openspec/changes/<id>/`, archived in the same pull request.
- Never use `it.skip` and never leave an `it.todo` to get green.
- Never mock the database in an integration test.
- Never rename a title in the test only; the spec and the test change together or not at all.

## Report

End with a list, one entry per scenario: the scenario title, the test file and line, the layer (integration or unit), and how the test was seen failing.
