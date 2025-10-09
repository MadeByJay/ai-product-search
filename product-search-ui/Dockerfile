# -------- Base image with PNPM --------
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# -------- Dependencies layer --------
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# -------- Build layer --------
FROM base AS build
WORKDIR /app

# Install deps for building (dev deps included)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the whole project (use .dockerignore to keep this lean)
COPY . .

# If your client bundles read NEXT_PUBLIC_* at build time, pass it as a build arg
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

# Important for standalone output:
# Ensure next.config.* contains { output: 'standalone' }
RUN pnpm build

# -------- Runtime layer (Next standalone) --------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
  PORT=3000 \
  NEXT_TELEMETRY_DISABLED=1

# Copy the standalone server and static assets emitted by Next
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]

