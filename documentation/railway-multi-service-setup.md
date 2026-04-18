# Railway Multi-Service Setup Guide

## Overview

This application uses two Railway services:

1. **Web Service** - Main application server
2. **Worker Service** - Background job processor for CRM sync

## Service Configuration

### Web Service (Main App)

**Start Command:**

```bash
pnpm start:prod
```

This command:

1. Runs database migrations: `pnpm db:migrate`
2. Starts the application: `pnpm start`

**Environment Variables Required:**

- `DATABASE_URL`
- `REDIS_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `GROQ_API_KEY` (for AI features)
- All other app environment variables

**Railway Service Settings:**

- Service Name: `introhub-web` (or similar)
- Start Command: `pnpm start:prod` (set in service settings OR uses railway.json default)
- Build Command: Uses `railway.json` → `pnpm install && pnpm build`

### Worker Service (Background Jobs)

**Start Command:**

```bash
pnpm start:worker
```

This command:

- Starts the BullMQ worker: `tsx src/workers/sync-worker.ts`
- Does NOT run migrations (web service handles this)

**Environment Variables Required:**

- `DATABASE_URL` (same as web service)
- `REDIS_URL` (same as web service)
- CRM integration variables (HubSpot, etc.)

**Railway Service Settings:**

- Service Name: `introhub-worker` (or similar)
- Start Command: `pnpm start:worker` (MUST be set in service settings to override railway.json)
- Build Command: Uses `railway.json` → `pnpm install && pnpm build`

## How Railway.json Works

The `railway.json` file provides **default** configuration:

```json
{
  "build": {
    "buildCommand": "pnpm install && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm start:prod"
  }
}
```

**Key Points:**

- `buildCommand` applies to ALL services (both web and worker)
- `startCommand` is the DEFAULT for services that don't override it
- Individual services can override `startCommand` in their Railway service settings

## Verifying Your Setup

### Check Web Service

1. Go to Railway dashboard
2. Select your web service
3. Go to Settings → Deploy
4. Verify Start Command is `pnpm start:prod` (or blank to use railway.json default)

### Check Worker Service

1. Go to Railway dashboard
2. Select your worker service
3. Go to Settings → Deploy
4. **IMPORTANT:** Verify Start Command is explicitly set to `pnpm start:worker`

## Migration Strategy

**Only the web service runs migrations** via `pnpm start:prod`:

```bash
# package.json
"start:prod": "pnpm db:migrate && pnpm start"
```

**Why this works:**

1. Web service starts first (or migrations run on first service to start)
2. Migrations are idempotent (safe to run multiple times)
3. Worker service connects to already-migrated database

**If both services start simultaneously:**

- Drizzle Kit handles concurrent migrations safely
- One will succeed, the other will skip (already applied)

## Deployment Process

### When You Push to Main

**Both services rebuild:**

1. Build phase: `pnpm install && pnpm build` (same for both)
2. Deploy phase:
   - Web: `pnpm start:prod` → runs migrations → starts app
   - Worker: `pnpm start:worker` → starts worker (no migrations)

### Manual Deployment

**Deploy web service only:**

```bash
# In Railway dashboard
# Select web service → Deploy → Redeploy
```

**Deploy worker service only:**

```bash
# In Railway dashboard
# Select worker service → Deploy → Redeploy
```

## Troubleshooting

### Worker Service Won't Start

**Symptom:** Worker service fails with "command not found" or similar

**Solution:** Verify start command in Railway service settings:

1. Go to worker service settings
2. Deploy → Start Command
3. Set to: `pnpm start:worker`
4. Redeploy

### Migrations Run Twice

**Symptom:** See duplicate migration logs

**This is normal and safe:**

- Drizzle Kit tracks applied migrations
- Duplicate runs are skipped automatically
- No data corruption occurs

### Worker Can't Connect to Database

**Symptom:** Worker logs show database connection errors

**Solution:**

1. Verify `DATABASE_URL` is set in worker service
2. Ensure it's the same as web service
3. Check database is accessible from worker

## Environment Variable Management

### Shared Variables

These should be identical in both services:

- `DATABASE_URL`
- `REDIS_URL`
- `ENCRYPTION_KEY`
- `BETTER_AUTH_SECRET`

### Service-Specific Variables

- Web service needs: Stripe keys, OAuth credentials, etc.
- Worker service needs: CRM integration keys

### Best Practice

Use Railway's "Shared Variables" feature:

1. Create variables at project level
2. Reference them in both services
3. Update once, applies to both

## Related Documentation

- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT_GUIDE.md)
- [CRM Worker Production Deployment](./crm-worker-production-deployment.md)
- [AI Feature Deployment](./ai-feature-deployment.md)
