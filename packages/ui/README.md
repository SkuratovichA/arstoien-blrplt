# @blrplt/ui

Shared React components for the client and admin apps: shadcn-style primitives on Radix UI and Tailwind, plus the form building blocks that sit on React Hook Form.

The package is private to this workspace. The apps depend on it as `"@blrplt/ui": "workspace:*"` and import from `@blrplt/ui`; the entry point is the TypeScript source, so Vite compiles it together with the app and there is no build step and no `dist`.

Each app adds `../ui/src/**/*.{ts,tsx}` to the `content` globs of its `tailwind.config.ts`, otherwise Tailwind would not see the class names used inside the components.

Components live in `src/components/ui/`, one file per component, and are re-exported from `src/index.ts`. Add a component by dropping its file there and exporting it from the index.

Commands, run from this directory or with `pnpm -r` from the root:

- `pnpm test` runs the Vitest and Testing Library specs in jsdom.
- `pnpm typecheck` runs `tsc --noEmit`.
- `pnpm ci` runs Biome with warnings as errors.
