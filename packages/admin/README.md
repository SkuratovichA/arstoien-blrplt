# Admin Panel

Administrative dashboard for managing users and system settings.

## Features

- Dashboard with statistics and growth charts
- User management (list, view, edit, delete)
- User approval/rejection workflow
- Pending users management
- Role management (USER, MODERATOR, ADMIN)
- Status management (ACTIVE, PENDING, SUSPENDED, BLOCKED, REJECTED, DELETED)
- OTP authentication toggle (per-user and system-wide)
- Bulk operations (enable/disable OTP for all users)
- Audit logs with filtering
- Recent activity feed
- System settings (support email, OTP toggle)
- Admin profile management

## Tech Stack

- React 19
- Vite
- TanStack Router (file-based routing)
- TanStack Table (data tables)
- Apollo GraphQL Client
- Tailwind CSS
- @blrplt/ui (component library, the `packages/ui` workspace package)
- React Hook Form and Zod (forms and validation)
- Zustand (state management)
- Recharts (charts)
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

The admin panel will run on http://localhost:5173

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

## Access Control

Only users with ADMIN or MODERATOR roles can access the admin panel.

## Main Sections

1. **Dashboard** - System statistics, user growth charts, recent activity
2. **Users** - Full user management with filters (role, status, search)
3. **Pending Users** - Approval/rejection workflow for new registrations
4. **Audit Logs** - System-wide activity tracking with filters
5. **Notifications** - Admin notification management
6. **Settings** - Support email and OTP authentication toggle
7. **Profile** - Admin profile and password management

## User Statuses

- `ACTIVE` - Fully active users
- `PENDING_APPROVAL` - Awaiting admin approval
- `FRESHLY_CREATED_REQUIRES_PASSWORD` - Approved, needs password setup
- `SUSPENDED` - Temporarily suspended
- `BLOCKED` - Blocked users
- `REJECTED` - Rejected by admin
- `DELETED` - Soft-deleted users