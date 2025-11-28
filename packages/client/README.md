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
- @arstoien/shared-ui (component library)
- @arstoien/former (form library)
- React Hook Form
- Zustand (state management)
- i18next (internationalization)
- react-hot-toast (notifications)

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