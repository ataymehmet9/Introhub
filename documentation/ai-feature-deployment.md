# AI Feature Deployment Guide

## Overview

This guide covers deploying the AI-powered introduction message generation feature to production.

## What's Being Deployed

### New Database Table

- `ai_generations` - Tracks all AI generation requests for analytics and rate limiting

### New Features

- AI-powered introduction message generation using Groq (free tier)
- Rate limiting: 10 generations per hour per user
- Automatic validation and error handling
- Usage tracking and analytics

## Pre-Deployment Checklist

### 1. Environment Variables

Ensure these are set in Railway:

```bash
# Required - Groq API Key (free tier, no credit card needed)
GROQ_API_KEY="gsk_your_groq_api_key_here"

# Optional - AI Configuration (defaults provided)
AI_MODEL="llama-3.3-70b-versatile"
AI_MAX_TOKENS="500"
AI_TEMPERATURE="0.7"
AI_RATE_LIMIT_PER_HOUR="10"
```

**Get Groq API Key:**

1. Sign up at https://console.groq.com/
2. Go to API Keys section
3. Create new API key
4. Copy and add to Railway environment variables

### 2. Database Migration

The migration will run automatically on deployment via `pnpm start:prod` command.

**Migration file:** `drizzle/0009_ordinary_colonel_america.sql`

**What it creates:**

- `ai_generation_type` enum
- `ai_generations` table with indexes
- Foreign keys to `user` and `contacts` tables

### 3. Railway Configuration

Verify `railway.json` has the correct start command:

```json
{
  "deploy": {
    "startCommand": "pnpm start:prod"
  }
}
```

This ensures migrations run before the app starts.

## Deployment Steps

### Step 1: Add Environment Variables

1. Go to Railway dashboard
2. Select your project
3. Go to Variables tab
4. Add `GROQ_API_KEY` with your API key
5. Save changes

### Step 2: Deploy

```bash
# Commit all changes
git add .
git commit -m "feat: add AI-powered introduction message generation"

# Push to trigger Railway deployment
git push origin main
```

### Step 3: Monitor Deployment

1. Watch Railway deployment logs
2. Look for migration success message:
   ```
   Running migrations...
   Migration 0009_ordinary_colonel_america.sql applied successfully
   ```
3. Verify app starts successfully

### Step 5: Verify in Production

1. Log into your production app
2. Go to Search page
3. Search for a contact
4. Click "Generate AI Message"
5. Verify message is generated successfully

## Troubleshooting

### Migration Fails

**Error:** `type "ai_generation_type" already exists`

**Solution:** This means the migration already ran. Check if the table exists:

```sql
SELECT * FROM ai_generations LIMIT 1;
```

If table exists, the migration is complete. If not, manually run:

```bash
# In Railway console
pnpm db:migrate
```

### AI Generation Fails

**Error:** `GROQ_API_KEY is not configured`

**Solution:**

1. Verify environment variable is set in Railway
2. Restart the application
3. Check Railway logs for startup errors

**Error:** `Rate limit exceeded`

**Solution:** User has exceeded 10 generations per hour. This is expected behavior.

### Database Connection Issues

**Error:** `Failed to connect to database`

**Solution:**

1. Verify `DATABASE_URL` is set correctly
2. Check database is running
3. Verify network connectivity

## Rollback Plan

If deployment fails:

### Option 1: Revert Code

```bash
git revert HEAD
git push origin main
```

### Option 2: Manual Database Rollback

```sql
-- Drop the table and enum
DROP TABLE IF EXISTS ai_generations CASCADE;
DROP TYPE IF EXISTS ai_generation_type CASCADE;
```

## Post-Deployment

### Monitor Usage

1. Check AI generation success rate
2. Monitor rate limit hits
3. Track token usage (if Groq provides metrics)

### Analytics Queries

```sql
-- Total AI generations
SELECT COUNT(*) FROM ai_generations;

-- Success rate
SELECT
  success,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM ai_generations
GROUP BY success;

-- Generations per user
SELECT
  u.email,
  COUNT(*) as generations,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful
FROM ai_generations ag
JOIN "user" u ON ag.user_id = u.id
GROUP BY u.email
ORDER BY generations DESC
LIMIT 10;

-- Average response time
SELECT
  AVG(response_time_ms) as avg_ms,
  MIN(response_time_ms) as min_ms,
  MAX(response_time_ms) as max_ms
FROM ai_generations
WHERE success = true;
```

## Related Documentation

- [AI Feature Implementation Plan](./AI_FEATURE_IMPLEMENTATION_PLAN.md)
- [AI Feature Testing Guide](./AI_FEATURE_TESTING_GUIDE.md)
- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT_GUIDE.md)

## Support

If issues persist:

1. Check Railway logs
2. Review Groq API status: https://status.groq.com/
3. Check database connection
4. Verify all environment variables are set
