# Production Deployment Changes for CRM Integration

## ⚠️ IMPORTANT: New Worker Process Required

The CRM sync functionality requires a **separate background worker process** to run alongside your web server. This is a **new requirement** for your production deployment.

---

## What Changed

### Before (Old Deployment)

```bash
# Single process
pnpm start:prod
```

### After (New Deployment)

```bash
# Two processes running simultaneously:
# 1. Web server
pnpm start:prod

# 2. Worker process (NEW!)
pnpm start:worker
```

---

## Required Changes to Your Production Setup

### Option 1: Using PM2 (Recommended) ✅

**What I've Added:**

- ✅ `ecosystem.config.js` - PM2 configuration file
- ✅ `pnpm start:worker` - Production worker script
- ✅ `pnpm build` - Now builds both web and worker

**What You Need to Do:**

1. **Install PM2** (if not already installed):

```bash
npm install -g pm2
```

2. **Update your deployment script** to use PM2:

**OLD deployment:**

```bash
pnpm build
pnpm db:migrate
pnpm start:prod
```

**NEW deployment:**

```bash
pnpm build
pnpm db:migrate
pm2 start ecosystem.config.js
```

3. **That's it!** PM2 will now manage both processes:
   - `introhub-web` - Your web server
   - `introhub-worker` - The CRM sync worker

**Useful PM2 Commands:**

```bash
# View status
pm2 status

# View logs
pm2 logs

# Restart everything
pm2 restart all

# Stop everything
pm2 stop all

# Monitor
pm2 monit
```

---

### Option 2: Manual Process Management

If you don't want to use PM2, you need to run two separate processes:

**Terminal 1 (Web Server):**

```bash
pnpm start:prod
```

**Terminal 2 (Worker):**

```bash
pnpm start:worker
```

⚠️ **Not recommended** - processes won't auto-restart on failure.

---

### Option 3: Docker/Docker Compose

If you're using Docker, update your `docker-compose.yml`:

**Add this service:**

```yaml
worker:
  build:
    context: .
    dockerfile: Dockerfile
  environment:
    - NODE_ENV=production
    - DATABASE_URL=${DATABASE_URL}
    - REDIS_URL=${REDIS_URL}
    # ... other env vars
  depends_on:
    - redis
    - postgres
  command: pnpm start:worker
  restart: unless-stopped
```

Then deploy:

```bash
docker-compose up -d
```

---

## Environment Variables

### New Required Variables

Add these to your production environment:

```env
# Redis (required for worker)
REDIS_URL=redis://your-redis-host:6379

# HubSpot OAuth (if not already set)
HUBSPOT_CLIENT_ID=your-client-id
HUBSPOT_CLIENT_SECRET=your-client-secret
HUBSPOT_REDIRECT_URI=https://yourdomain.com/api/crm/hubspot/callback

# Encryption (if not already set)
ENCRYPTION_KEY=your-64-character-key
```

**Generate encryption key:**

```bash
openssl rand -hex 32
```

---

## Infrastructure Requirements

### Redis Server

The worker requires Redis to be running. You have two options:

**Option A: Use existing Redis from docker-compose.yml**

```bash
# Already configured in your docker-compose.yml
podman-compose up -d redis
```

**Option B: Use managed Redis service**

- Upstash (recommended for serverless)
- Redis Cloud
- AWS ElastiCache
- DigitalOcean Managed Redis

Update `REDIS_URL` to point to your Redis instance.

---

## Deployment Checklist

- [ ] Redis is running and accessible
- [ ] Environment variables are set (especially `REDIS_URL`)
- [ ] PM2 is installed (if using Option 1)
- [ ] `ecosystem.config.js` is in project root
- [ ] Build command updated: `pnpm build` (already done)
- [ ] Deployment script updated to use PM2
- [ ] Both processes start successfully
- [ ] Worker logs show "CRM Sync Worker started"
- [ ] Test a sync job to verify it works

---

## Verification Steps

After deployment, verify everything is working:

### 1. Check Processes

```bash
pm2 status
```

Expected output:

```
┌─────┬──────────────────┬─────────┬─────────┐
│ id  │ name             │ status  │ restart │
├─────┼──────────────────┼─────────┼─────────┤
│ 0   │ introhub-web     │ online  │ 0       │
│ 1   │ introhub-worker  │ online  │ 0       │
└─────┴──────────────────┴─────────┴─────────┘
```

### 2. Check Worker Logs

```bash
pm2 logs introhub-worker --lines 20
```

Expected output:

```
🚀 Starting CRM Sync Worker...
✅ CRM Sync Worker started and listening for jobs
```

### 3. Check Redis Connection

```bash
redis-cli -h your-redis-host ping
```

Expected output: `PONG`

### 4. Test Sync Job

Once the UI is built (Phase 6), test creating a sync job and verify:

- Job appears in queue
- Worker processes the job
- Contacts are synced to database
- Sync log is created

---

## Rollback Plan

If something goes wrong:

```bash
# Stop PM2 processes
pm2 stop all

# Go back to old deployment
pnpm start:prod
```

The CRM sync feature won't work, but your main app will still function.

---

## Summary

### What I've Done ✅

- Created worker process code
- Added build scripts
- Created PM2 configuration
- Updated package.json scripts
- Created comprehensive documentation

### What You Need to Do 📋

1. Install PM2: `npm install -g pm2`
2. Ensure Redis is running
3. Set environment variables (especially `REDIS_URL`)
4. Update deployment script to use: `pm2 start ecosystem.config.js`
5. Verify both processes are running

### Files to Review

- [`ecosystem.config.js`](../ecosystem.config.js) - PM2 configuration
- [`documentation/crm-worker-production-deployment.md`](crm-worker-production-deployment.md) - Full deployment guide
- [`package.json`](../package.json) - Updated scripts

---

## Questions?

**Q: Do I need to change my current deployment if I'm not using CRM features yet?**
A: No, but you should set it up now so it's ready when you enable CRM features.

**Q: Can I run the worker on a different server?**
A: Yes! As long as it can connect to the same Redis and PostgreSQL instances.

**Q: How many worker instances should I run?**
A: Start with 1. Scale to 2-3 if you have many users syncing simultaneously.

**Q: What if I'm using a PaaS like Heroku/Railway/Render?**
A: Most platforms support "worker" processes. Add a worker process type that runs `pnpm start:worker`.

**Q: Is this a breaking change?**
A: No - your app will work without the worker, but CRM sync jobs won't process.

---

## Need Help?

See the full deployment guide: [`documentation/crm-worker-production-deployment.md`](crm-worker-production-deployment.md)
