# Server

NestJS backend with GraphQL API, authentication, and user management.

## Features

### Authentication
- Email/password authentication (Passport Local Strategy)
- OTP (One-Time Password) email-based authentication
- JWT access tokens + refresh tokens
- Token refresh mechanism
- Cookie-based token storage (httpOnly)
- Password reset with email tokens
- Email verification

### User Management
- User registration with admin approval workflow
- User statuses: PENDING_APPROVAL, FRESHLY_CREATED_REQUIRES_PASSWORD, ACTIVE, SUSPENDED, BLOCKED, REJECTED, DELETED
- User roles: USER, ADMIN, MODERATOR, SUPER_ADMIN, MANAGER, SUPPORT
- Profile management
- Account deletion (soft/hard delete)
- User approval/rejection by admins

### Admin Features
- Dashboard statistics (total users, active users, pending count)
- User growth analytics (6-month charts)
- Pending user management
- Bulk OTP operations
- Comprehensive audit logging
- Real-time notifications via GraphQL subscriptions

### Email System
- Nodemailer integration
- Handlebars templates
- 7 email templates:
  - email-verification
  - otp-login
  - password-reset
  - user-approved
  - user-rejected
  - user-verified
  - admin-new-user

### File Uploads
- S3/MinIO integration (AWS SDK v3)
- File validation (size, type, dimensions)
- Single and batch uploads
- Signed URL generation

### Other Features
- GraphQL API with subscriptions
- Redis for caching and pub/sub
- Prisma ORM
- Effect-TS for functional error handling
- Permission-based access control
- Comprehensive audit logging

## Tech Stack

- **NestJS 12** - Framework, running as native ES modules on Node.js 26
- **Prisma 7** - ORM (`prisma-client` generator, `pg` driver adapter)
- **Apollo Server 5** - API layer, on Express 5
- **PostgreSQL** - Database
- **Redis** - Caching and pub/sub
- **Passport.js** - Authentication strategies
- **Nodemailer** - Email service
- **AWS SDK v3** - S3/MinIO file storage
- **Effect 4** - Typed errors, the OTP flow and the environment schema
- **bcrypt** - Password hashing
- **Handlebars** - Email templates
- **Vitest** - Tests
- **Biome** - Formatting and linting

## Getting Started

The commands run from the repository root; `pnpm --filter @blrplt/server <script>` runs a script of this package from anywhere.

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp packages/server/.env.example packages/server/.env
```

3. Start PostgreSQL and Redis (via Docker):
```bash
docker-compose up -d postgres redis
```

4. Run database migrations:
```bash
pnpm db:migrate
```

5. Seed database (creates admin user and system settings):
```bash
pnpm db:seed
```

6. Run development server:
```bash
pnpm --filter @blrplt/server dev
```

The server will run on http://localhost:4000

GraphQL Playground: http://localhost:4000/graphql

## Available Scripts

Run from `packages/server`, or with `pnpm --filter @blrplt/server <script>`:

- `pnpm dev` - Build, then recompile on change with `tsc --watch` and restart with `node --watch`
- `pnpm build` - Generate the Prisma client and compile into `dist` for production
- `pnpm start:prod` - Run the production build
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm check` - Biome: check formatting, lint rules and import order
- `pnpm check:fix` - Biome: apply the fixes
- `pnpm test` - Run the Vitest tests
- `pnpm test:watch` - Run the tests on every change
- `pnpm test:cov` - Run the tests with coverage
- `pnpm create:admin` - Create an admin user from `ADMIN_EMAIL` and `ADMIN_PASSWORD`
- `pnpm create:test-users` - Create test users for development (needs `BASE_PWD`)

## Database Scripts

- `pnpm db:generate` - Generate the Prisma client (build, test and typecheck do it on their own)
- `pnpm db:migrate` - Run migrations (dev)
- `pnpm db:push` - Push the schema without a migration
- `pnpm db:seed` - Seed database
- `pnpm db:studio` - Open Prisma Studio

## Docker

The image is built from the repository root: `docker build -f packages/server/Dockerfile -t blrplt-server .`.

The entrypoint (`docker-entrypoint.sh`) creates the database named in `DATABASE_URL` when it does not exist, applies the migrations of `prisma/migrations` with `prisma migrate deploy` and then starts `node dist/main.js`.
`prisma migrate deploy` applies only the migrations that the database has not seen and never drops data.

An empty database needs nothing.
A database that is already live, because an older image filled it with `prisma db push`, holds every table but has no record of the baseline migration `0_init`, so `prisma migrate deploy` refuses it with P3005.
Mark the baseline as applied once, from `packages/server` with `DATABASE_URL` pointing at that database, before the new image starts: `pnpm exec prisma migrate resolve --applied 0_init`.
The schema of `0_init` is the schema that `prisma db push` created (`prisma migrate diff` against `prisma/schema.prisma` is empty), so nothing else changes.

## Project Structure

```
src/
├── common/              # Shared utilities and services
│   ├── decorators/      # Custom decorators
│   ├── effect/          # Effect-TS utilities
│   ├── guards/          # Auth guards
│   ├── pubsub/          # Redis pub/sub service
│   └── services/        # Shared services (S3, audit log)
├── modules/
│   ├── auth/            # Authentication (login, register, OTP, password reset)
│   ├── user/            # User management
│   ├── admin/           # Admin operations
│   ├── settings/        # System settings
│   ├── notification/    # Email and notifications
│   └── refresh-token/   # Token management
├── config/              # Environment schema (validated at start) and app config
└── main.ts              # Application entry point
```

The database schema, the migrations and the seed live next to `src`, in `prisma/`, and `prisma.config.ts` tells the Prisma CLI where they are.

## Authentication Flow

### Registration & Approval
1. User registers → status: PENDING_APPROVAL
2. Admin receives notification
3. Admin approves → status: FRESHLY_CREATED_REQUIRES_PASSWORD
4. Verification email sent with password setup link
5. User sets password → status: ACTIVE

### OTP Login
1. User enters email
2. System checks if OTP enabled (system-wide + per-user)
3. 6-digit code sent via email (5-minute expiry)
4. User enters code
5. Token verified → user logged in
6. Rate limited: 3 attempts per 15 minutes

### Token Management
- Access tokens: configurable expiration (default 7d)
- Refresh tokens: 90-day expiration, stored in database
- Tokens stored in httpOnly cookies + Authorization header support
- Refresh mutation for token renewal

## Environment Variables

See `.env.example` for all available variables. The server decodes its environment with an Effect schema when it starts (`src/config/env.schema.ts`): a missing `DATABASE_URL`, `JWT_SECRET` or `JWT_REFRESH_SECRET`, or a port that is not a number between 1 and 65535, stops the start with one message that lists every problem. An empty value counts as unset.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token signing secret
- `SMTP_HOST`, `SMTP_PORT` - Email configuration
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` - S3/MinIO configuration
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` - Seed admin user
- `SUPPORT_EMAIL` - System support email
- `OTP_AUTH_ENABLED` - Global OTP toggle

## GraphQL Schema

### Main Queries
- `currentUser` - Get current authenticated user
- `users` - List users with filters and pagination
- `pendingUsers` - Get users awaiting approval
- `adminStatistics` - Dashboard statistics
- `userGrowthStats` - Growth analytics
- `auditLogs` - Audit log entries
- `systemSettings` - System configuration

### Main Mutations
- `login`, `register`, `logout`, `refresh`
- `requestOtpLogin`, `verifyOtpLogin`
- `forgotPassword`, `resetPassword`
- `approveUser`, `rejectUser`
- `updateUser`, `deleteUser`
- `bulkUpdateOtp`
- `updateSystemSettings`

### Subscriptions
- `adminPendingCountsChanged` - Real-time pending user count updates

## Permissions

Uses resource-action based permissions:

Resources: USER, ROLE, SETTING, AUDIT_LOG
Actions: CREATE, READ, UPDATE, DELETE, APPROVE, REJECT

Example:
```typescript
@Permissions({ resource: Resource.USER, action: Action.UPDATE })
```

## Audit Logging

All admin actions are logged:
- USER_CREATED, USER_UPDATED, USER_DELETED
- USER_APPROVED, USER_REJECTED
- BULK_UPDATE_OTP_ENABLED/DISABLED
- OTP_LOGIN_SUCCESS

Logs include: userId, action, entityType, entityId, ipAddress, userAgent, metadata
