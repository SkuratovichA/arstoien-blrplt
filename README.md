# Arstoien Boilerplate

Production-ready full-stack boilerplate with authentication, user management, and 2FA support.

## Features

### Authentication & Security
- 🔐 Email/password authentication
- 🌐 Google OAuth 2.0
- 🔑 Two-factor authentication (2FA) with TOTP
- 🔄 JWT with refresh token rotation
- 📧 Email verification
- 🔒 Password reset flow
- 👤 Role-based access control (USER, ADMIN, MODERATOR)

### User Management
- 📝 User registration with approval workflow
- 👥 User profile management
- 🏢 Company associations
- 📊 Admin dashboard for user management
- 📋 Audit logging

### Technical Features
- 🎨 Modern UI with Radix UI components
- 🌍 Internationalization (i18n) - CS, EN, SK
- 💱 Currency selection support
- 📱 Responsive design
- 🚀 GraphQL API with subscriptions
- 📤 File uploads to S3/MinIO
- 📨 Email notifications with templates
- 🔄 Real-time updates via WebSocket

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
- **TanStack Router** - Routing
- **Apollo Client** - GraphQL client
- **Tailwind CSS** - Styling
- **@arstoien/shared-ui** - Component library
- **React Hook Form** - Form handling
- **i18next** - Internationalization

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
JWT_REFRESH_EXPIRES_IN="7d"

# OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:4000/auth/google/callback"

# Email
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_SECURE="false"
EMAIL_FROM="noreply@boilerplate.local"

# S3/MinIO (Optional)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="uploads"
S3_REGION="us-east-1"

# Admin
ADMIN_EMAIL="admin@boilerplate.local"
ADMIN_PASSWORD="Admin123!"
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

### Email/Password
1. User registers with email/password
2. Email verification sent
3. User verifies email
4. Admin approves user (optional)
5. User can login

### OAuth (Google)
1. User clicks "Login with Google"
2. Redirected to Google consent
3. Callback creates/updates user
4. Session created
5. User logged in

### 2FA Setup
1. User enables 2FA in settings
2. QR code displayed for TOTP app
3. User enters verification code
4. 2FA enabled for account

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

### Main Queries
```graphql
query CurrentUser {
  currentUser {
    id
    email
    firstName
    lastName
    role
  }
}

query GetUsers {
  users {
    id
    email
    status
    role
  }
}
```

### Main Mutations
```graphql
mutation Login($email: String!, $password: String!) {
  login(loginInput: { email: $email, password: $password }) {
    accessToken
    refreshToken
    user {
      id
      email
    }
  }
}

mutation Register($input: RegisterInput!) {
  register(registerInput: $input) {
    user {
      id
      email
    }
  }
}
```

## Project Dependencies

### NPM Packages Published
- **@arstoien/devtools** - ESLint and Prettier configurations
- **@arstoien/shared-ui** - Shared UI components library

### Repositories
- **arstoien-devtools** - https://github.com/arstoien/arstoien-devtools
- **arstoien-shared-ui** - https://github.com/arstoien/arstoien-shared-ui
- **arstoien-blrplt** - https://github.com/arstoien/arstoien-blrplt

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