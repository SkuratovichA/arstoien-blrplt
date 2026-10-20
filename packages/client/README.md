# Client Application

Main user-facing application.

## Features

- Email/password authentication
- OTP (One-Time Password) email-based authentication
- User registration (admin approval workflow)
- Email verification
- Password reset flow
- Password setup (for approved users)
- Profile management (name, email, phone)
- Account deletion
- Multi-language support (Czech, English, Slovak)
- Responsive design

## Tech Stack

- React 19
- Vite
- TanStack Router (file-based routing)
- Apollo GraphQL Client
- Tailwind CSS
- @blrplt/ui (component library, the `packages/ui` workspace package)
- React Hook Form and Zod (forms and validation)
- Zustand (state management)
- i18next (internationalization)
- react-hot-toast (notifications)

## Getting Started

1. Install dependencies from the repository root:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Run development server:
```bash
pnpm dev
```

## Available Routes

- `/` - Landing page
- `/login` - Login (email/password or OTP)
- `/register` - User registration
- `/verify-otp` - OTP code verification
- `/verify-email` - Email verification
- `/forgot-password` - Request password reset
- `/reset-password` - Reset password with token
- `/auth/set-password` - First-time password setup
- `/dashboard` - User dashboard (requires auth + verified email)
- `/profile` - Profile management (requires auth + verified email)

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production (runs `pnpm codegen` first, which reads the schema from the running API on http://localhost:4000/graphql, or from the committed `schema.graphql` when `CI` is set)
- `pnpm preview` - Preview production build
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run the Vitest suite (`pnpm test:watch` to watch, `pnpm test:cov` for coverage)
- `pnpm check` - Lint and check formatting with Biome (`pnpm check:fix` writes the fixes)
- `pnpm run ci` - The Biome check CI runs, which fails on warnings (it needs `run`, because `pnpm ci` is pnpm's own command that cleans and reinstalls)
- `pnpm codegen` - Generate GraphQL types
- `pnpm i18n` - Extract i18n strings