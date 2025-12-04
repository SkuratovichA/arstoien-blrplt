# =============================================================================
# Admin Dockerfile - Multi-stage build for React/Vite application
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files
COPY packages/admin/package.json ./packages/admin/

# Install dependencies
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_GRAPHQL_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/admin/node_modules ./packages/admin/node_modules

# Copy source code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY packages/admin ./packages/admin

# Build the application
RUN pnpm --filter @blrplt/admin build

# -----------------------------------------------------------------------------
# Stage 3: Production - Nginx
# -----------------------------------------------------------------------------
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY packages/admin/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/packages/admin/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
