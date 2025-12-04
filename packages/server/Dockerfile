# =============================================================================
# Server Dockerfile - Multi-stage build for NestJS application
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Enable corepack for yarn
RUN corepack enable && corepack prepare yarn@4.0.2 --activate

# Copy workspace configuration
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Copy package.json files for all workspaces
COPY packages/server/package.json ./packages/server/

# Install dependencies
RUN yarn install --immutable

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare yarn@4.0.2 --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules

# Copy source code
COPY package.json yarn.lock .yarnrc.yml ./
COPY tsconfig.json ./
COPY packages/server ./packages/server

# Generate Prisma client
RUN yarn workspace @blrplt/server db:generate

# Build the application
RUN yarn workspace @blrplt/server build

# -----------------------------------------------------------------------------
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM node:22-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Install production dependencies only
RUN apk add --no-cache libc6-compat

RUN corepack enable && corepack prepare yarn@4.0.2 --activate

# Copy necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./
COPY --from=builder /app/.yarnrc.yml ./
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/packages/server/package.json ./packages/server/
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/server/prisma ./packages/server/prisma
COPY --from=builder /app/packages/server/node_modules ./packages/server/node_modules
COPY --from=builder /app/node_modules ./node_modules

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start the application
CMD ["node", "packages/server/dist/main.js"]
