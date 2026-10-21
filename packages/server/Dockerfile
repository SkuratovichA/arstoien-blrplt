# =============================================================================
# NestJS Server Dockerfile
# =============================================================================
# Multi-stage build for a minimal production image.
# Build it from the repository root: docker build -f packages/server/Dockerfile .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base
# -----------------------------------------------------------------------------
FROM node:26-alpine AS base

WORKDIR /app

# Package manifests of every workspace package, so that the lockfile resolves
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/
COPY packages/admin/package.json ./packages/admin/
COPY packages/ui/package.json ./packages/ui/

# Node.js 25 and later no longer bundle Corepack, so pnpm comes from npm at the version that the root package.json pins in "packageManager"
RUN npm install --global "pnpm@$(node -p "require('./package.json').packageManager.split('@')[1].split('+')[0]")"

# -----------------------------------------------------------------------------
# Stage 2: Dependencies for the build (everything the server needs, dev tools included)
# -----------------------------------------------------------------------------
FROM base AS dev-deps

RUN pnpm install --frozen-lockfile --filter @blrplt/server...

# -----------------------------------------------------------------------------
# Stage 3: Production dependencies of the server
# -----------------------------------------------------------------------------
FROM base AS prod-deps

# prisma is a regular dependency of the server because the entrypoint runs "prisma migrate deploy" when the container starts
RUN pnpm install --frozen-lockfile --prod --filter @blrplt/server...

# -----------------------------------------------------------------------------
# Stage 4: Builder
# -----------------------------------------------------------------------------
FROM dev-deps AS builder

# packages/server/tsconfig.json extends the tsconfig.json of the repository root
COPY tsconfig.json ./
COPY packages/server ./packages/server

# The build generates the Prisma client into src/generated and compiles the server with the TypeScript 7 compiler into dist
RUN pnpm --filter @blrplt/server build

# -----------------------------------------------------------------------------
# Stage 5: Production
# -----------------------------------------------------------------------------
FROM node:26-alpine AS production

# PostgreSQL client for the database creation in the entrypoint
RUN apk add --no-cache postgresql-client

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# The workspace layout stays as it is in the repository, because the packages of packages/server/node_modules are symlinks into node_modules/.pnpm at the root
WORKDIR /app/packages/server

COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules /app/node_modules
COPY --from=prod-deps --chown=nestjs:nodejs /app/packages/server/node_modules ./node_modules

# The compiled application; package.json is needed at runtime for "type": "module"
COPY --from=builder --chown=nestjs:nodejs /app/packages/server/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/server/package.json ./package.json

# Prisma schema, migrations and config for "prisma migrate deploy"
COPY --from=builder --chown=nestjs:nodejs /app/packages/server/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/packages/server/prisma.config.ts ./prisma.config.ts

# Entrypoint script
COPY --chown=nestjs:nodejs packages/server/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nestjs

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start server with migrations
CMD ["./docker-entrypoint.sh"]
