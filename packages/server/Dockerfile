# =============================================================================
# NestJS Server Dockerfile
# =============================================================================
# Multi-stage build for minimal production image
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/

# Copy .npmrc for private packages (NPM_TOKEN must be set as build arg)
COPY .npmrc ./
ARG NPM_TOKEN
ENV NPM_TOKEN=$NPM_TOKEN

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @blrplt/server

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules

# Copy source code
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server ./packages/server

# Generate Prisma client
RUN pnpm --filter @blrplt/server db:generate

# Build
RUN pnpm --filter @blrplt/server build

# -----------------------------------------------------------------------------
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM node:22-alpine AS production

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/server/node_modules ./packages_node_modules

# Copy Prisma files for migrations
COPY --from=builder /app/packages/server/prisma ./prisma
COPY --from=builder /app/packages/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/packages/server/node_modules/@prisma ./node_modules/@prisma

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start server
CMD ["node", "dist/main.js"]
