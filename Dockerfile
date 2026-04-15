# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Enable Corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Accept build-time environment variables for Vite
# These VITE_* variables are embedded into the client bundle at build time
ARG VITE_BETTER_AUTH_URL
ARG VITE_BETTER_UPLOAD_BUCKET_NAME
ARG VITE_BETTER_UPLOAD_BUCKET_REGION
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ORG
ARG VITE_SENTRY_PROJECT
ARG VITE_PUBLIC_POSTHOG_KEY
ARG VITE_PUBLIC_POSTHOG_HOST
ARG VITE_PUBLIC_POSTHOG_DEFAULTS
ARG VITE_HUBSPOT_CLIENT_ID

# Set environment variables for build
ENV VITE_BETTER_AUTH_URL=$VITE_BETTER_AUTH_URL
ENV VITE_BETTER_UPLOAD_BUCKET_NAME=$VITE_BETTER_UPLOAD_BUCKET_NAME
ENV VITE_BETTER_UPLOAD_BUCKET_REGION=$VITE_BETTER_UPLOAD_BUCKET_REGION
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_SENTRY_ORG=$VITE_SENTRY_ORG
ENV VITE_SENTRY_PROJECT=$VITE_SENTRY_PROJECT
ENV VITE_PUBLIC_POSTHOG_KEY=$VITE_PUBLIC_POSTHOG_KEY
ENV VITE_PUBLIC_POSTHOG_HOST=$VITE_PUBLIC_POSTHOG_HOST
ENV VITE_PUBLIC_POSTHOG_DEFAULTS=$VITE_PUBLIC_POSTHOG_DEFAULTS
ENV VITE_HUBSPOT_CLIENT_ID=$VITE_HUBSPOT_CLIENT_ID

# Increase Node.js heap size to prevent OOM during Nitro/Vite build
ENV NODE_OPTIONS=--max-old-space-size=8192

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Enable Corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install ALL dependencies (including devDependencies for drizzle-kit)
RUN pnpm install --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/instrument.server.mjs ./instrument.server.mjs

# Copy drizzle configuration and migration files
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/drizzle ./drizzle

# Copy entire src directory (needed for tsx runtime execution of worker)
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with migrations
CMD ["pnpm", "start:prod"]