# Admin Panel

Administrative dashboard for managing users and system settings.

## Features

- User management (list, view, edit, block/unblock)
- Role management (assign roles to users)
- User approval workflows
- Audit logs viewer
- System settings management
- Dashboard with statistics
- Email notifications management

## Tech Stack

- React 19
- Vite
- TanStack Router
- TanStack Table
- Apollo GraphQL Client
- Tailwind CSS
- Radix UI (via @arstoien/shared-ui)
- React Hook Form
- Recharts (for dashboard charts)
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

The admin panel will run on http://localhost:5173

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

## Access Control

Only users with ADMIN or MODERATOR roles can access the admin panel.

## Main Sections

1. **Dashboard** - Overview of system statistics
2. **Users** - User management and approval
3. **Audit Logs** - System activity tracking
4. **Settings** - System configuration