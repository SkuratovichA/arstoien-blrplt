# Arstoien Boilerplate

Production-ready full-stack boilerplate with authentication, user management, and OTP support.

## Features

### Authentication & Security
- Email/password authentication
- OTP (One-Time Password) email-based authentication
- JWT with refresh token rotation
- Email verification
- Password reset flow
- Role-based access control (USER, ADMIN, MODERATOR, SUPER_ADMIN, MANAGER, SUPPORT)
- Permission-based access control

### User Management
- User registration with admin approval workflow
- User profile management (name, email, phone)
- Admin dashboard with statistics and analytics
- Audit logging system
- User status management (PENDING_APPROVAL, FRESHLY_CREATED_REQUIRES_PASSWORD, ACTIVE, SUSPENDED, BLOCKED, REJECTED, DELETED)
- Bulk operations (OTP enable/disable)
- User growth analytics with charts

### Technical Features
- Radix UI components from the in-repo `@blrplt/ui` workspace package
- Internationalization (Czech, English, Slovak)
- Currency selection (backend only)
- Responsive design
- GraphQL API with subscriptions
- File uploads to S3/MinIO
- Email notifications with Handlebars templates
- Real-time admin notifications
- Effect-TS for functional error handling

## Tech Stack

### Backend
- **NestJS 12** - Node.js framework, running as native ES modules
- **Prisma 7** - ORM for PostgreSQL (`prisma-client` generator and the `pg` driver adapter)
- **Apollo Server 5** - GraphQL API layer, on Express 5
- **Effect 4** - Typed errors, the OTP flow and the schema-validated environment
- **Redis** - Caching and pub/sub
- **Passport.js** - Authentication
- **Nodemailer** - Email service
- **MinIO/S3** - File storage

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **TanStack Router** - File-based routing
- **Apollo Client** - GraphQL client
- **Tailwind CSS** - Styling
- **@blrplt/ui** - Component library (Radix UI + Tailwind, a workspace package in `packages/ui`)
- **React Hook Form + Zod** - Forms and validation
- **Zustand** - State management
- **i18next** - Internationalization
- **react-hot-toast** - Notifications
- **Recharts** - Charts

### Infrastructure
- **PostgreSQL 15** - Primary database
- **Redis 7** - Cache and sessions
- **Docker** - Containerization
- **Node.js 26** - Runtime for the server and for every tool
- **pnpm 12** - Package management, with a shared dependency catalog in `pnpm-workspace.yaml`
- **TypeScript 7** - Type safety with the native compiler; the server is compiled by `tsc` itself, so it uses relative imports and no path aliases
- **Biome** - Formatting and linting in one tool (`biome.json` at the root)
- **Vitest** - Unit tests in every package, and the integration tests of the server against a real PostgreSQL
- **OpenSpec** - The specs in `openspec/specs`, each scenario tied to a test by `pnpm spec:check`

## Project Structure

```
arstoien-blrplt/
├── packages/
│   ├── server/         # NestJS backend (test/ holds the integration tests and their harness)
│   ├── client/         # React client app
│   ├── admin/          # React admin panel
│   └── ui/             # Shared React components (@blrplt/ui)
├── openspec/           # Specs of the product (specs/) and the changes in flight (changes/)
├── scripts/            # The tool that ties spec scenarios to tests
├── .agents/            # Agent skills (.claude/skills mirrors them)
├── .github/workflows/  # CI, the spec gate and the optional spec-tests agent
├── AGENTS.md           # Working contract for people and agents
├── docker-compose.yml  # Development services
├── package.json        # Root workspace config
└── init.sql           # Database initialization
```

## Getting Started

### Prerequisites

- Node.js 26+
- pnpm 12 (the root `package.json` pins the exact version in `packageManager`)
- Docker & Docker Compose
- PostgreSQL 15 (or use Docker)
- Redis 7 (or use Docker)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/arstoien/arstoien-blrplt.git
cd arstoien-blrplt
```

2. **Install pnpm**
```bash
# Node.js 25 and later no longer bundle Corepack, so take the pinned version from npm
npm install --global pnpm@12.14.0
```

3. **Install dependencies**
```bash
pnpm install
```

4. **Start Docker services**
```bash
docker-compose up -d
```

5. **Setup environment variables**
```bash
# Copy example files
cp packages/server/.env.example packages/server/.env
cp packages/client/.env.example packages/client/.env
cp packages/admin/.env.example packages/admin/.env

# Edit .env files with your configuration
```

6. **Setup database**
```bash
# Generate Prisma client (build, test and typecheck of the server do this on their own)
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database (optional)
pnpm db:seed
```

7. **Start development servers**
```bash
# Start all services
pnpm dev

# Or start individually:
pnpm --filter @blrplt/server dev    # Backend on :4000
pnpm --filter @blrplt/client dev    # Client on :3000
pnpm --filter @blrplt/admin dev     # Admin on :5173
```

## Environment Configuration

### Server (.env)
```env
# Database
DATABASE_URL="postgresql://blrplt_user:blrplt_password@localhost:5432/blrplt_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="90d"

# Email (Nodemailer)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_SECURE="false"
SMTP_USER="" # Optional
SMTP_PASS="" # Optional
EMAIL_FROM="noreply@boilerplate.local"

# S3/MinIO (Optional)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="uploads"
S3_REGION="us-east-1"

# Admin Seed Data
ADMIN_EMAIL="admin@boilerplate.local"
ADMIN_PASSWORD="Admin123!"
ADMIN_FIRST_NAME="Admin"
ADMIN_LAST_NAME="User"

# System Settings
SUPPORT_EMAIL="support@boilerplate.local"
OTP_AUTH_ENABLED="true"
```

### Client/Admin (.env)
```env
VITE_API_URL=http://localhost:4000
VITE_GRAPHQL_URL=http://localhost:4000/graphql
VITE_WS_URL=ws://localhost:4000/graphql
```

## Available Scripts

### Root Level
- `pnpm dev` - Start all services in development
- `pnpm build` - Build all packages
- `pnpm test` - Run all unit tests with Vitest
- `pnpm test:scripts` - Run only the tests of the tools in `scripts/`
- `pnpm test:integration` - Run the integration tests of the server against a real PostgreSQL; it needs `DATABASE_URL`, see [Spec-driven workflow](#spec-driven-workflow)
- `pnpm spec:validate` - OpenSpec: validate every spec and change in `openspec/`
- `pnpm spec:check` - Check that every scenario in `openspec/specs` has a test titled `Scenario: <title>`, and the reverse
- `pnpm spec:generate <capability>` - Append `it.todo` skeletons for the scenarios that have no test; `--change <id>` does it for a change in flight
- `pnpm typecheck` - TypeScript checking
- `pnpm check` - Biome: check formatting, lint rules and import order
- `pnpm check:fix` - Biome: apply the fixes
- `pnpm lint` - Biome: lint rules only
- `pnpm format` - Biome: write the formatting
- `pnpm run ci` - The Biome check that CI runs (read-only, warnings count as errors). It needs `run`, because `pnpm ci` is pnpm's own command that cleans and reinstalls

### Database
- `pnpm db:generate` - Generate the Prisma client
- `pnpm db:migrate` - Run migrations
- `pnpm db:migrate:prod` - Apply the migrations in production
- `pnpm db:push` - Push schema changes
- `pnpm db:seed` - Seed database
- `pnpm db:studio` - Open Prisma Studio
- `pnpm --filter @blrplt/server create:admin` - Create admin user (requires env vars)
- `pnpm --filter @blrplt/server create:test-users` - Create test users for development

### Code Generation
- `pnpm codegen` - Generate GraphQL types
- `pnpm i18n` - Extract i18n strings

## Production Database Setup

### Prerequisites
- AWS CLI configured with proper credentials
- Database connection details (from Terraform outputs)
- Admin credentials ready

### Step 1: Make RDS Database Accessible

For security, production RDS databases are typically not publicly accessible. To connect:

```bash
# 1. Temporarily make RDS publicly accessible
aws rds modify-db-instance \
  --db-instance-identifier blrplt-postgres \
  --publicly-accessible \
  --apply-immediately \
  --region eu-central-1

# 2. Wait for the modification to complete
aws rds wait db-instance-available \
  --db-instance-identifier blrplt-postgres \
  --region eu-central-1

# 3. Add your IP to the security group
MY_IP=$(curl -s ifconfig.me)
echo "Your IP: $MY_IP"

aws ec2 authorize-security-group-ingress \
  --group-id <your-security-group-id> \
  --protocol tcp \
  --port 5432 \
  --cidr $MY_IP/32 \
  --region eu-central-1
```

### Step 2: Check Database Connection

```bash
# Export database URL (get from Terraform outputs or AWS console)
export DATABASE_URL="postgresql://username:password@host:5432/database"

# Test connection with psql
psql $DATABASE_URL -c "SELECT version();"

# Or check via the application
cd packages/server
pnpm db:studio  # Opens Prisma Studio to view data
```

### Step 3: Run Migrations

```bash
cd packages/server

# Generate Prisma client
pnpm db:generate

# Run production migrations
pnpm db:migrate:prod
```

### Step 4: Create Admin User

The application requires an admin user to manage the system. Create one using environment variables:

```bash
cd packages/server

# Set required environment variables
export DATABASE_URL="postgresql://username:password@host:5432/database"
export ADMIN_EMAIL="admin@yourdomain.com"
export ADMIN_PASSWORD="YourSecurePassword123!"
export ADMIN_FIRST_NAME="Admin"  # Optional
export ADMIN_LAST_NAME="User"     # Optional

# Create the admin user
pnpm create:admin
```

### Step 5: Create Test Users (Development Only)

For development/staging environments, you can create test users:

```bash
cd packages/server

# Set required environment variables
export DATABASE_URL="postgresql://username:password@host:5432/database"
export BASE_PWD="YourBasePassword"  # Required - base password for test users

# This creates several test accounts with different roles
pnpm create:test-users
```

Test users created (passwords are BASE_PWD + suffix):
- `moderator@example.com` / `${BASE_PWD}_moderator123!` (MODERATOR)
- `john.doe@example.com` / `${BASE_PWD}_user123!` (USER)
- `jane.smith@example.com` / `${BASE_PWD}_user123!` (USER)
- `test.user@example.com` / `${BASE_PWD}_test123!` (USER)
- `demo@example.com` / `${BASE_PWD}_demo123!` (USER)

⚠️ **Warning**: Never run `create:test-users` in production!

### Step 6: Secure Database Access

After setup, always revert the security changes:

```bash
# 1. Make RDS private again
aws rds modify-db-instance \
  --db-instance-identifier blrplt-postgres \
  --no-publicly-accessible \
  --apply-immediately \
  --region eu-central-1

# 2. Remove your IP from security group
aws ec2 revoke-security-group-ingress \
  --group-id <your-security-group-id> \
  --protocol tcp \
  --port 5432 \
  --cidr $MY_IP/32 \
  --region eu-central-1
```

### Alternative: Connect via App Runner

If direct connection is not possible, you can run commands through your App Runner service:

```bash
# Update App Runner start command temporarily
aws apprunner update-service \
  --service-arn <your-app-runner-arn> \
  --region eu-central-1 \
  --source-configuration '{
    "ImageRepository": {
      "ImageConfiguration": {
        "StartCommand": "sh -c \"./node_modules/.bin/prisma migrate deploy && node dist/scripts/create-admin.js && node dist/main.js\""
      }
    }
  }'
```

## Development Workflow

1. **Make changes** to code
2. **Run type checking**: `pnpm typecheck`
3. **Check formatting and lint rules**: `pnpm run ci` (`pnpm check:fix` applies the fixes)
4. **Run tests**: `pnpm test`, and `pnpm test:integration` when the server changed
5. **Generate types** (if GraphQL changed): `pnpm codegen`
6. **Run migrations** (if schema changed): `pnpm db:migrate`
7. **Check the specs**: `pnpm spec:validate` and `pnpm spec:check`

## Spec-driven workflow

The behaviour of the product is written down in `openspec/specs/<capability>/spec.md`, and every `#### Scenario:` in those files is proved by a test titled `Scenario: <exact scenario title>`.

`pnpm spec:check` compares the two, and the Spec Gate workflow (`.github/workflows/spec-gate.yml`) runs it on every pull request together with the spec validation, the unit tests and the integration tests, so a scenario without a test, a test without a scenario and a red test each fail the pull request.

The starter specs describe authentication, the user profile and health; the integration tests start the real application against a real PostgreSQL, with the schema built by `prisma migrate deploy` and only the external senders replaced by in-memory fakes.

A new feature goes in three steps.

1. **Describe it.** In Claude Code, `/opsx:propose subscribe to a newsletter` writes `openspec/changes/add-newsletter/` with a proposal, a design, tasks and a delta spec such as:

   ```markdown
   ## ADDED Requirements

   ### Requirement: A signed-in user can subscribe to the newsletter once

   The system SHALL let a signed-in user subscribe to the newsletter, and SHALL refuse a second subscription of the same user.

   #### Scenario: A signed-in user subscribes

   - **WHEN** a signed-in user runs the subscribeToNewsletter mutation
   - **THEN** the answer is true

   #### Scenario: A second subscription is refused

   - **WHEN** a subscribed user runs the subscribeToNewsletter mutation again
   - **THEN** the request fails with the message "Already subscribed"
   ```

2. **Get the failing tests.** `pnpm spec:generate --change add-newsletter` appends one skeleton per scenario to `packages/server/test/spec/newsletter.spec.ts`:

   ```ts
   // WHEN a signed-in user runs the subscribeToNewsletter mutation
   // THEN the answer is true
   it.todo('Scenario: A signed-in user subscribes');
   ```

   The `spec-to-tests` skill (`.agents/skills/spec-to-tests/SKILL.md`) turns each skeleton into a real test with the helpers in `packages/server/test/support/`. An `it.todo` still counts as uncovered, so `pnpm spec:check` stays red until every skeleton is a real test.

3. **Build it, then archive it.** `/opsx:apply` works through the tasks until `pnpm test:integration` is green, and `/opsx:archive` folds the delta into `openspec/specs/` in the same pull request as the code.

The integration tests have no default database, because they write rows: set `DATABASE_URL` to an empty database that may be filled, for example `docker compose exec postgres createdb -U blrplt_user blrplt_test` and then `DATABASE_URL=postgresql://blrplt_user:blrplt_password@localhost:5433/blrplt_test pnpm test:integration`. The schema is created by `prisma migrate deploy` on the first run.

The baseline migration `packages/server/prisma/migrations/0_init` is the schema as it was before the first migration. An empty database needs nothing, but a database that was filled earlier by `prisma db push` (the Docker entrypoint still does that) already holds every table, so `prisma migrate deploy` refuses it with P3005 until the baseline is marked as applied once: `cd packages/server && pnpm exec prisma migrate resolve --applied 0_init`.

Spec Gate is a workflow of its own and is not part of the `ci-success` job of `ci.yml`: to let it block a merge, add the Spec Gate job as a required status check in the branch protection rules.

`.github/workflows/spec-tests-agent.yml` is an optional workflow that lets an agent write the missing tests: when the repository variable `SPEC_TESTS_AGENT` is `true` and the secret `ANTHROPIC_API_KEY` is set, adding the label `spec-tests` to a pull request from this repository runs the `spec-to-tests` skill and commits the tests to the branch. It is off by default, it never edits a spec, and the skill has to be on the base branch of the pull request before the action can use it.

`AGENTS.md` holds the same rules for people and agents who work in the repository.

## Authentication Flow

### Registration & Approval
1. User registers with email + personal info (no password yet)
2. User status: `PENDING_APPROVAL`
3. Admin receives notification
4. Admin approves/rejects user
5. On approval:
   - User status → `FRESHLY_CREATED_REQUIRES_PASSWORD`
   - Verification email sent with password setup link
6. User sets password via email link
7. User status → `ACTIVE`
8. User can now login

### Email/Password Login
1. User enters email
2. System checks if OTP enabled for user
3. If OTP disabled: password field shown → traditional login
4. If OTP enabled: redirected to OTP flow

### OTP (One-Time Password) Login
1. User enters email
2. System checks if OTP enabled (system-wide + per-user)
3. 6-digit code sent via email (5-minute expiry)
4. User enters OTP code
5. Code verified → user logged in
6. Email automatically verified on successful OTP login
7. Rate limited: 3 attempts per 15 minutes

### Password Reset
1. User clicks "Forgot Password"
2. Enters email → reset link sent
3. Token valid for 30 minutes
4. User sets new password via link
5. Can login with new password

## Deployment

### Docker Deployment

The server image is built from the repository root, because the pnpm workspace and the lockfile live there. The container creates the database if needed, pushes the schema and starts `node dist/main.js`; the client and the admin panel are static builds.

```bash
docker build -f packages/server/Dockerfile -t blrplt-server .
```

### Manual Deployment
```bash
# Build all packages
pnpm build

# Server
cd packages/server
node dist/main.js

# Client (serve static files)
cd packages/client
npx serve -s dist

# Admin (serve static files)
cd packages/admin
npx serve -s dist
```

## API Documentation

GraphQL Playground available at: `http://localhost:4000/graphql`

### Authentication Queries
```graphql
query CurrentUser {
  currentUser {
    id
    email
    firstName
    lastName
    role
    status
    emailVerifiedAt
    otpAuthEnabled
  }
}

query IsOtpEnabled($email: String!) {
  isOtpEnabled(email: $email)
}
```

### Authentication Mutations
```graphql
# Traditional Login
mutation Login($input: LoginInput!) {
  login(loginInput: $input) {
    accessToken
    refreshToken
    user {
      id
      email
      firstName
      lastName
    }
  }
}

# Register (No Password)
mutation Register($input: RegisterInput!) {
  register(registerInput: $input) {
    user {
      id
      email
      status
    }
  }
}

# OTP Flow
mutation RequestOtpLogin($email: String!) {
  requestOtpLogin(email: $email) {
    success
    message
  }
}

mutation VerifyOtpLogin($input: VerifyOtpInput!) {
  verifyOtpLogin(input: $input) {
    accessToken
    refreshToken
    user {
      id
      email
    }
  }
}

# Password Management
mutation SetPasswordWithToken($input: SetPasswordWithTokenInput!) {
  setPasswordWithToken(input: $input) {
    success
    message
  }
}

mutation ForgotPassword($email: String!) {
  forgotPassword(email: $email) {
    success
    message
  }
}

mutation ResetPassword($input: ResetPasswordInput!) {
  resetPassword(input: $input) {
    success
    message
  }
}
```

### Admin Queries
```graphql
query PendingUsers {
  pendingUsers {
    id
    email
    firstName
    lastName
    createdAt
  }
}

query Users($filters: UserFiltersInput, $pagination: PaginationInput) {
  users(filters: $filters, pagination: $pagination) {
    users {
      id
      email
      role
      status
    }
    total
    page
    limit
  }
}

query AdminStatistics {
  adminStatistics {
    pendingUsersCount
    todayRegistrationsCount
    totalUsersCount
  }
}

query UserGrowthStats($months: Int) {
  userGrowthStats(months: $months) {
    period
    totalUsers
    activeUsers
    newUsers
    pendingUsers
  }
}

query AuditLogs($pagination: PaginationInput) {
  auditLogs(pagination: $pagination) {
    logs {
      id
      action
      entityType
      userId
      ipAddress
      createdAt
    }
    total
  }
}
```

### Admin Mutations
```graphql
mutation ApproveUser($id: String!) {
  approveUser(id: $id) {
    id
    status
  }
}

mutation RejectUser($id: String!, $reason: String!) {
  rejectUser(id: $id, reason: $reason) {
    id
    status
  }
}

mutation UpdateUser($id: String!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    email
    role
    status
  }
}

mutation BulkUpdateOtp($input: BulkUpdateOtpInput!) {
  bulkUpdateOtp(input: $input) {
    updated
    success
    message
  }
}

mutation DeleteUser($id: String!, $permanent: Boolean) {
  deleteUser(id: $id, permanent: $permanent) {
    success
    message
  }
}
```

### Subscriptions
```graphql
subscription AdminPendingCountsChanged {
  adminPendingCountsChanged {
    pendingUsersCount
    pendingApprovalsCount
  }
}
```

## Workspace Packages

- **@blrplt/server** - NestJS API
- **@blrplt/client** - React client app
- **@blrplt/admin** - React admin panel
- **@blrplt/ui** - React components (Radix UI + Tailwind) shared by the client and the admin panel

Everything the template needs lives in this repository, so `pnpm install` works without a registry token.

## Tooling Migration

Earlier versions of this template linted with ESLint, formatted with Prettier and tested with Jest. Biome now does the first two jobs from the single `biome.json` at the root (`pnpm check`, `pnpm check:fix`), and Vitest runs the tests of every package (`pnpm test`). Nothing in the repository configures the old tools any more, and the generated files (the route trees and `src/gql`) are skipped by Biome. The one remaining mention is the dependency `@testing-library/jest-dom`: the name belongs to the DOM matchers package, and its `/vitest` entry point is what the test setup of the client, the admin panel and `@blrplt/ui` imports.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT

## Support

For issues and questions, please use the GitHub issues page.

## Acknowledgments

Built with inspiration from best practices in modern full-stack development.