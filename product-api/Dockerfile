# -------- Base image with PNPM --------
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm" \
  NODE_ENV=production
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# -------- Dependencies layer --------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# -------- Build layer (needs dev deps) --------
FROM base AS build
WORKDIR /app
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig*.json ./
COPY src ./src

# Include any scripts 
COPY scripts ./scripts
RUN pnpm build

# -------- Production layer --------
FROM base AS prod
WORKDIR /app
# Copy only production node_modules
COPY --from=deps /app/node_modules ./node_modules
# Copy compiled dist and scripts output
COPY --from=build /app/dist ./dist
# Minimal runtime env - override via compose
ENV NEST_API_PORT=3001
EXPOSE 3001

# Ensure dist/scripts/migrate.js has been compiled from build step
CMD ["sh", "-c", "\
  node dist/scripts/migrate.js || echo 'migration failed (continuing)'; \
  if [ \"$SEED_ON_START\" = \"true\" ]; then node dist/scripts/seed.js || echo 'seed failed (continuing)'; fi; \
  node dist/src/main.js;"]
