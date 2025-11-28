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
- **Yarn 4** - Package management
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
- Yarn 4.0.2
- Docker & Docker Compose
- PostgreSQL 15 (or use Docker)
- Redis 7 (or use Docker)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/arstoien/arstoien-blrplt.git
cd arstoien-blrplt
```

2. **Install Yarn**
```bash
corepack enable
corepack prepare yarn@4.0.2 --activate
```

3. **Install dependencies**
```bash
yarn install
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
yarn workspace @blrplt/server prisma generate

# Run migrations
yarn workspace @blrplt/server prisma migrate dev

# Seed database (optional)
yarn workspace @blrplt/server prisma db seed
```

7. **Start development servers**
```bash
# Start all services
yarn dev

# Or start individually:
yarn workspace @blrplt/server dev    # Backend on :4000
yarn workspace @blrplt/client dev    # Client on :3000
yarn workspace @blrplt/admin dev     # Admin on :5173
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
- `yarn dev` - Start all services in development
- `yarn build` - Build all packages
- `yarn test` - Run all tests
- `yarn typecheck` - TypeScript checking
- `yarn lint:check` - Check linting
- `yarn lint:fix` - Fix linting issues
- `yarn prettier:check` - Check formatting
- `yarn prettier:fix` - Fix formatting

### Database
- `yarn db:migrate` - Run migrations
- `yarn db:push` - Push schema changes
- `yarn db:seed` - Seed database
- `yarn db:studio` - Open Prisma Studio

### Code Generation
- `yarn codegen` - Generate GraphQL types
- `yarn i18n` - Extract i18n strings

## Development Workflow

1. **Make changes** to code
2. **Run type checking**: `yarn typecheck`
3. **Run linting**: `yarn lint:check`
4. **Run tests**: `yarn test`
5. **Generate types** (if GraphQL changed): `yarn codegen`
6. **Run migrations** (if schema changed): `yarn db:migrate`

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