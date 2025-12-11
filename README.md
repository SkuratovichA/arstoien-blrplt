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
- Radix UI components via @arstoien/shared-ui
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
- **NestJS** - Node.js framework
- **Prisma** - ORM for PostgreSQL
- **Apollo GraphQL** - API layer
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
- **@arstoien/shared-ui** - Component library
- **@arstoien/former** - Form library
- **React Hook Form** - Form handling
- **Zustand** - State management
- **i18next** - Internationalization
- **react-hot-toast** - Notifications
- **Recharts** - Charts

### Infrastructure
- **PostgreSQL 15** - Primary database
- **Redis 7** - Cache and sessions
- **Docker** - Containerization
- **pnpm** - Package management
- **TypeScript** - Type safety

## Project Structure

```
arstoien-blrplt/
├── packages/
│   ├── server/         # NestJS backend
│   ├── client/         # React client app
│   └── admin/          # React admin panel
├── docker-compose.yml  # Development services
├── package.json        # Root workspace config
└── init.sql           # Database initialization
```

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9.14.2
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
corepack enable
corepack prepare pnpm@9.14.2 --activate
# Or install globally
npm install -g pnpm
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
# Generate Prisma client
pnpm --filter @blrplt/server prisma generate

# Run migrations
pnpm --filter @blrplt/server prisma migrate dev

# Seed database (optional)
pnpm --filter @blrplt/server prisma db seed
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
- `pnpm test` - Run all tests
- `pnpm typecheck` - TypeScript checking
- `pnpm lint:check` - Check linting
- `pnpm lint:fix` - Fix linting issues
- `pnpm prettier:check` - Check formatting
- `pnpm prettier:fix` - Fix formatting

### Database
- `pnpm db:migrate` - Run migrations
- `pnpm db:push` - Push schema changes
- `pnpm db:seed` - Seed database
- `pnpm db:studio` - Open Prisma Studio
- `pnpm create:admin` - Create admin user (requires env vars)
- `pnpm create:test-users` - Create test users for development

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
        "StartCommand": "sh -c \"npx prisma migrate deploy && node src/scripts/create-admin.js && npm start\""
      }
    }
  }'
```

## Development Workflow

1. **Make changes** to code
2. **Run type checking**: `pnpm typecheck`
3. **Run linting**: `pnpm lint:check`
4. **Run tests**: `pnpm test`
5. **Generate types** (if GraphQL changed): `pnpm codegen`
6. **Run migrations** (if schema changed): `pnpm db:migrate`

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
```bash
# Build images
docker build -t blrplt-server ./packages/server
docker build -t blrplt-client ./packages/client
docker build -t blrplt-admin ./packages/admin

# Run with docker-compose
docker-compose -f docker-compose.production.yml up
```

### Manual Deployment
```bash
# Build all packages
yarn build

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

## Project Dependencies

### NPM Packages
- **@arstoien/devtools** - ESLint and Prettier configurations
- **@arstoien/shared-ui** - Component library (Radix UI + Tailwind)
- **@arstoien/former** - Form library with dynamic forms

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