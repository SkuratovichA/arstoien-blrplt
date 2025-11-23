# Client Application

The main user-facing client application for the boilerplate.

## Features

- User authentication (email/password, Google OAuth)
- User registration and profile management
- Password reset flow
- Email verification
- 2FA support (TOTP)
- Multi-language support (i18n)
- Currency selection
- Responsive design

## Tech Stack

- React 19
- Vite
- TanStack Router
- Apollo GraphQL Client
- Tailwind CSS
- Radix UI (via @arstoien/shared-ui)
- React Hook Form
- i18next

## Getting Started

1. Install dependencies:
```bash
yarn install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Run development server:
```bash
yarn dev
```

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn typecheck` - Run TypeScript type checking
- `yarn lint:check` - Check linting
- `yarn lint:fix` - Fix linting issues
- `yarn prettier:check` - Check formatting
- `yarn prettier:fix` - Fix formatting
- `yarn codegen` - Generate GraphQL types
- `yarn i18n` - Extract i18n strings