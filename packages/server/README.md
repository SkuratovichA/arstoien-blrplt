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

- **NestJS** - Framework
- **Prisma** - ORM
- **Apollo GraphQL** - API layer
- **PostgreSQL** - Database
- **Redis** - Caching and pub/sub
- **Passport.js** - Authentication strategies
- **Nodemailer** - Email service
- **AWS SDK v3** - S3/MinIO file storage
- **Effect-TS** - Functional programming
- **bcrypt** - Password hashing
- **Handlebars** - Email templates

## Getting Started

1. Install dependencies:
```bash
yarn install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Start PostgreSQL and Redis (via Docker):
```bash
docker-compose up -d postgres redis
```

4. Run database migrations:
```bash
yarn prisma migrate dev
```

5. Seed database (creates admin user and system settings):
```bash
yarn prisma db seed
```

6. Run development server:
```bash
yarn dev
```

The server will run on http://localhost:4000

GraphQL Playground: http://localhost:4000/graphql

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start:prod` - Run production build
- `yarn typecheck` - Run TypeScript type checking
- `yarn lint:check` - Check linting
- `yarn lint:fix` - Fix linting issues
- `yarn prettier:check` - Check formatting
- `yarn prettier:fix` - Fix formatting
- `yarn test` - Run tests
- `yarn test:e2e` - Run end-to-end tests

## Database Scripts

- `yarn prisma generate` - Generate Prisma client
- `yarn prisma migrate dev` - Run migrations (dev)
- `yarn prisma migrate deploy` - Run migrations (production)
- `yarn prisma db seed` - Seed database
- `yarn prisma studio` - Open Prisma Studio

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
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Database migrations
│   └── seed.ts          # Database seeding
└── main.ts              # Application entry point
```

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
- Access tokens: configurable expiration (default 15m)
- Refresh tokens: 90-day expiration, stored in database
- Tokens stored in httpOnly cookies + Authorization header support
- Refresh mutation for token renewal

## Environment Variables

See `.env.example` for all available variables.

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
