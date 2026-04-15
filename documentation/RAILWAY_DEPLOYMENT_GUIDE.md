# Railway Deployment Guide - CRM Integration

## Overview

This guide covers deploying your IntroHub application with the new CRM worker to Railway.

## What I've Done For You ✅

I've created the necessary configuration files:

1. **`Procfile`** - Tells Railway to run both web and worker processes
2. **`railway.json`** - Railway-specific build configuration
3. **`package.json`** - Updated with `start:worker` script

**You don't need to modify any code!** Just follow the steps below in your Railway dashboard.

---

## Step-by-Step Deployment

### Step 1: Add Redis to Your Railway Project

1. Go to your Railway project dashboard
2. Click **"+ New"** button
3. Select **"Database"** → **"Add Redis"**
4. Railway will automatically:
   - Create a Redis instance
   - Add `REDIS_URL` environment variable to your services

### Step 2: Add Worker Service

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"** (same repo as your web service)
3. Name it: **"introhub-worker"**
4. Railway will detect the `Procfile` automatically

### Step 3: Configure Worker Service

1. Click on the **"introhub-worker"** service
2. Go to **"Settings"** tab
3. Scroll to **"Service"** section
4. Set **"Start Command"**: `pnpm start:worker`
5. Under **"Networking"**:
   - **Disable** "Public Networking" (worker doesn't need a public URL)

### Step 4: Configure Environment Variables

The worker needs access to the same environment variables as your web service.

**Option A: Share Variables (Recommended)**

Railway can share variables between services:

1. Go to your project's **"Variables"** tab (top level, not service level)
2. Add these variables if not already present:
   ```
   REDIS_URL=${{Redis.REDIS_URL}}
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   HUBSPOT_CLIENT_ID=your-client-id
   HUBSPOT_CLIENT_SECRET=your-client-secret
   HUBSPOT_REDIRECT_URI=https://yourdomain.com/api/crm/hubspot/callback
   ENCRYPTION_KEY=your-64-character-key
   BETTER_AUTH_SECRET=your-auth-secret
   BETTER_AUTH_URL=https://yourdomain.com
   NODE_ENV=production
   ```

**Option B: Copy Variables**

1. Go to your **web service** → **"Variables"** tab
2. Copy all environment variables
3. Go to **worker service** → **"Variables"** tab
4. Paste all variables

### Step 5: Deploy

1. Push your code to GitHub:

   ```bash
   git add -A
   git commit -m "feat: add CRM worker support"
   git push
   ```

2. Railway will automatically:
   - Build your application
   - Deploy the web service
   - Deploy the worker service

3. Monitor the deployment:
   - Click on **"introhub-worker"** service
   - Go to **"Deployments"** tab
   - Click on the latest deployment
   - Check logs for: `✅ CRM Sync Worker started and listening for jobs`

---

## Verification

### 1. Check Services Are Running

In your Railway dashboard, you should see:

```
✅ introhub-web      (Running)
✅ introhub-worker   (Running)
✅ Redis             (Running)
✅ PostgreSQL        (Running)
```

### 2. Check Worker Logs

1. Click on **"introhub-worker"** service
2. Go to **"Deployments"** → Latest deployment
3. Check logs for:
   ```
   🚀 Starting CRM Sync Worker...
   ✅ CRM Sync Worker started and listening for jobs
   ```

### 3. Check Redis Connection

In worker logs, you should NOT see:

- ❌ "Failed to connect to Redis"
- ❌ "ECONNREFUSED"

If you see these errors, check that `REDIS_URL` is set correctly.

---

## Your Railway Project Structure

After setup, your project should look like this:

```
Railway Project: IntroHub
├── introhub-web (Service)
│   ├── Start Command: pnpm start:prod
│   ├── Public URL: https://your-app.up.railway.app
│   └── Environment Variables: ✅
│
├── introhub-worker (Service) ← NEW!
│   ├── Start Command: pnpm start:worker
│   ├── Public URL: None (disabled)
│   └── Environment Variables: ✅
│
├── PostgreSQL (Database)
│   └── DATABASE_URL: ✅
│
└── Redis (Database) ← NEW!
    └── REDIS_URL: ✅
```

---

## Cost Implications

### Railway Pricing

- **Web Service**: Already running (no change)
- **Worker Service**: ~$5-10/month (based on usage)
- **Redis**: ~$5/month (512MB plan)

**Total Additional Cost**: ~$10-15/month

### Optimization Tips

1. **Start with 1 worker instance** - Scale only if needed
2. **Use Railway's free Redis** - 512MB is plenty for job queue
3. **Monitor usage** - Railway shows resource usage in dashboard

---

## Scaling

### Scale Worker Instances

If you need more workers:

1. Go to **"introhub-worker"** service
2. Click **"Settings"** → **"Service"**
3. Increase **"Replicas"** (e.g., 2 or 3)

**When to scale:**

- Many users syncing simultaneously
- Sync jobs taking too long
- Queue backing up

---

## Troubleshooting

### Worker Not Starting

**Check logs:**

1. Go to worker service → Deployments → Latest
2. Look for error messages

**Common issues:**

- Missing `REDIS_URL` → Add Redis database
- Missing environment variables → Copy from web service
- Build failed → Check `pnpm build` runs locally

### Worker Crashes/Restarts

**Check:**

1. Memory usage (Railway dashboard)
2. Redis connection (check `REDIS_URL`)
3. Database connection (check `DATABASE_URL`)

**Solution:**

- Increase memory limit in Settings
- Verify all environment variables are set
- Check Redis is running

### Jobs Not Processing

**Verify:**

1. Worker is running (check Railway dashboard)
2. Redis is accessible (check logs)
3. No errors in worker logs

**Test:**

```bash
# In Railway CLI or web terminal
redis-cli -u $REDIS_URL ping
# Should return: PONG
```

---

## Monitoring

### View Logs

**Web Service:**

```bash
railway logs --service introhub-web
```

**Worker Service:**

```bash
railway logs --service introhub-worker
```

### Metrics

Railway dashboard shows:

- CPU usage
- Memory usage
- Network traffic
- Deployment history

---

## Environment Variables Checklist

Make sure these are set in **both** web and worker services:

- [ ] `DATABASE_URL` (auto-set by Railway)
- [ ] `REDIS_URL` (auto-set by Railway)
- [ ] `HUBSPOT_CLIENT_ID`
- [ ] `HUBSPOT_CLIENT_SECRET`
- [ ] `HUBSPOT_REDIRECT_URI`
- [ ] `ENCRYPTION_KEY`
- [ ] `BETTER_AUTH_SECRET`
- [ ] `BETTER_AUTH_URL`
- [ ] `NODE_ENV=production`

---

## What You Need to Do

### Immediate Actions (Required)

1. **Add Redis database** to your Railway project
2. **Create worker service** from same GitHub repo
3. **Configure worker** with start command: `pnpm start:worker`
4. **Disable public networking** on worker service
5. **Set environment variables** (copy from web service)
6. **Push code** to trigger deployment

### Optional Actions

1. Set up monitoring/alerts in Railway
2. Configure custom domain for web service
3. Set up staging environment

---

## Quick Setup Commands

```bash
# 1. Commit the new files
git add Procfile railway.json package.json
git commit -m "feat: add Railway worker configuration"

# 2. Push to trigger deployment
git push

# 3. Monitor deployment (optional - install Railway CLI)
npm install -g @railway/cli
railway login
railway logs --service introhub-worker
```

---

## Summary

### What I Did ✅

- Created `Procfile` for Railway
- Created `railway.json` configuration
- Updated `package.json` with worker scripts
- Created comprehensive documentation

### What You Do 📋

1. Add Redis to Railway project (2 minutes)
2. Create worker service (3 minutes)
3. Configure environment variables (2 minutes)
4. Push code to deploy (1 minute)

**Total time: ~10 minutes**

---

## Need Help?

- **Railway Docs**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **This Project's Docs**: See `documentation/` folder

---

## Next Steps

After deployment:

1. ✅ Verify both services are running
2. ✅ Check worker logs show "Worker started"
3. ✅ Test CRM sync once UI is built (Phase 6)
4. ✅ Monitor for any errors in first 24 hours
