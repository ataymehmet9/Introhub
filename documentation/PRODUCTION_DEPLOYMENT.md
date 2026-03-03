# Production Deployment Guide - IntroHub

This guide covers how to properly configure environment variables for production deployment of IntroHub.

## Table of Contents

1. [Environment Variables Overview](#environment-variables-overview)
2. [Required Environment Variables](#required-environment-variables)
3. [Deployment Platforms](#deployment-platforms)
4. [Docker Deployment](#docker-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Environment Variables Overview

IntroHub uses two types of environment variables:

### Client-Side Variables (VITE\_\*)

These variables are **embedded into the client bundle at build time** and are visible in the browser:

- `VITE_BETTER_AUTH_URL`
- `VITE_BETTER_UPLOAD_BUCKET_NAME`
- `VITE_BETTER_UPLOAD_BUCKET_REGION`
- `VITE_SENTRY_DSN`
- `VITE_SENTRY_ORG`
- `VITE_SENTRY_PROJECT`
- `VITE_PUBLIC_POSTHOG_KEY`
- `VITE_PUBLIC_POSTHOG_HOST`
- `VITE_PUBLIC_POSTHOG_DEFAULTS`

⚠️ **Important**: These must be set during the build process, not just at runtime.

### Server-Side Variables

These variables are only accessible on the server and are never exposed to the client:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `RESEND_API_KEY`
- `BETTER_UPLOAD_ACCESS_KEY`
- `BETTER_UPLOAD_SECRET_KEY`
- `SENTRY_AUTH_TOKEN`

---

## Required Environment Variables

### 1. Database Configuration

```bash
DATABASE_URL="postgresql://username:password@host:port/database"
```

**Example**: `postgresql://postgres:mypassword@db.example.com:5432/introhub`

### 2. Authentication (Better Auth)

```bash
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="https://yourdomain.com"
VITE_BETTER_AUTH_URL="https://yourdomain.com"
```

**Generate secret**: `openssl rand -hex 32`

### 3. OAuth Providers

#### LinkedIn

```bash
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"
```

Get credentials from: https://www.linkedin.com/developers/
Redirect URL: `{BETTER_AUTH_URL}/api/auth/callback/linkedin`

#### Microsoft

```bash
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
```

Get credentials from: https://portal.azure.com/
Redirect URL: `{BETTER_AUTH_URL}/api/auth/callback/microsoft`

### 4. Email Service (Resend)

```bash
RESEND_API_KEY="re_xxxxxxxxxxxxx"
```

Get API key from: https://resend.com/

### 5. File Upload (Better Upload - AWS S3)

```bash
BETTER_UPLOAD_ACCESS_KEY="AKIAXXXXXXXXXXXXXXXX"
BETTER_UPLOAD_SECRET_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
VITE_BETTER_UPLOAD_BUCKET_NAME="your-bucket-name"
VITE_BETTER_UPLOAD_BUCKET_REGION="ap-southeast-2"
```

**AWS Setup**:

1. Create an S3 bucket in AWS Console
2. Create an IAM user with programmatic access
3. Attach policy with permissions: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`
4. Configure CORS on your S3 bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 6. Monitoring (Sentry)

````bash
VITE_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
VITE_SENTRY_ORG="your-org-id"
VITE_SENTRY_PROJECT="your-project-name"
SENTRY_AUTH_TOKEN="sntryu_xxxxxxxxxxxxx"


### 7. Analytics (PostHog)

```bash
VITE_PUBLIC_POSTHOG_KEY="AKIAXXXXXXXXXXXXXXXX"
VITE_PUBLIC_POSTHOG_HOST="your-host"
VITE_PUBLIC_POSTHOG_DEFAULTS="your-default"
````

Get from: https://posthog.com/

---

## Deployment Platforms

### Vercel

1. Go to your project settings → Environment Variables
2. Add all required variables
3. **Important**: Set `VITE_*` variables for all environments (Production, Preview, Development)
4. Redeploy after adding variables

```bash
# Deploy command
vercel --prod
```

### Railway

1. Go to your project → Variables
2. Add all required variables
3. Railway automatically rebuilds when variables change

### AWS / EC2

1. Use AWS Systems Manager Parameter Store or Secrets Manager
2. Set environment variables in your deployment script:

```bash
export DATABASE_URL="..."
export BETTER_AUTH_SECRET="..."
# ... etc
```

### Render

1. Go to your service → Environment
2. Add all required variables
3. Render automatically redeploys when variables change

---

## Docker Deployment

### Using Docker Compose

1. Create a `.env` file in your project root (DO NOT commit this file):

```bash
# Copy from .env.example
cp .env.example .env

# Edit with your production values
nano .env
```

2. Build and run:

```bash
# Build with environment variables
docker-compose build --build-arg VITE_BETTER_AUTH_URL=https://yourdomain.com \
  --build-arg VITE_BETTER_UPLOAD_BUCKET_NAME=your-bucket \
  --build-arg VITE_BETTER_UPLOAD_BUCKET_REGION=ap-southeast-2 \
  --build-arg VITE_SENTRY_DSN=your-sentry-dsn \
  --build-arg VITE_SENTRY_ORG=your-org \
  --build-arg VITE_SENTRY_PROJECT=your-project \
  --build-arg VITE_PUBLIC_POSTHOG_KEY=your-posthog-key \
  --build-arg VITE_PUBLIC_POSTHOG_HOST=your-posthog-host \
  --build-arg VITE_PUBLIC_POSTHOG_DEFAULTS=your-posthog-default

# Start services
docker-compose up -d
```

### Using Dockerfile Directly

```bash
# Build with build-time arguments
docker build \
  --build-arg VITE_BETTER_AUTH_URL=https://yourdomain.com \
  --build-arg VITE_BETTER_UPLOAD_BUCKET_NAME=your-bucket \
  --build-arg VITE_BETTER_UPLOAD_BUCKET_REGION=ap-southeast-2 \
  --build-arg VITE_SENTRY_DSN=your-sentry-dsn \
  --build-arg VITE_SENTRY_ORG=your-org \
  --build-arg VITE_SENTRY_PROJECT=your-project \
  --build-arg VITE_PUBLIC_POSTHOG_KEY=your-posthog-key \
  --build-arg VITE_PUBLIC_POSTHOG_HOST=your-posthog-host \
  --build-arg VITE_PUBLIC_POSTHOG_DEFAULTS=your-pothog-default \
  -t introhub:latest .

# Run with runtime environment variables
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e BETTER_AUTH_SECRET="..." \
  -e BETTER_AUTH_URL="https://yourdomain.com" \
  -e VITE_BETTER_AUTH_URL="https://yourdomain.com" \
  -e LINKEDIN_CLIENT_ID="..." \
  -e LINKEDIN_CLIENT_SECRET="..." \
  -e MICROSOFT_CLIENT_ID="..." \
  -e MICROSOFT_CLIENT_SECRET="..." \
  -e RESEND_API_KEY="..." \
  -e BETTER_UPLOAD_ACCESS_KEY="..." \
  -e BETTER_UPLOAD_SECRET_KEY="..." \
  -e VITE_BETTER_UPLOAD_BUCKET_NAME="..." \
  -e VITE_BETTER_UPLOAD_BUCKET_REGION="..." \
  -e VITE_SENTRY_DSN="..." \
  -e VITE_SENTRY_ORG="..." \
  -e VITE_SENTRY_PROJECT="..." \
  -e SENTRY_AUTH_TOKEN="..." \
  -e VITE_PUBLIC_POSTHOG_KEY="..." \
  -e VITE_PUBLIC_POSTHOG_HOST="..." \
  -e VITE_PUBLIC_POSTHOG_DEFAULTS="..." \
  introhub:latest
```

### Kubernetes

Create a Secret:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: introhub-secrets
type: Opaque
stringData:
  DATABASE_URL: 'postgresql://...'
  BETTER_AUTH_SECRET: '...'
  BETTER_UPLOAD_ACCESS_KEY: '...'
  BETTER_UPLOAD_SECRET_KEY: '...'
  # ... other secrets
```

Create a ConfigMap for non-sensitive data:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: introhub-config
data:
  VITE_BETTER_AUTH_URL: 'https://yourdomain.com'
  VITE_BETTER_UPLOAD_BUCKET_NAME: 'your-bucket'
  VITE_BETTER_UPLOAD_BUCKET_REGION: 'ap-southeast-2'
  # ... other config
```

---

## Troubleshooting

### Issue: BETTER_UPLOAD variables not working in production

**Symptoms**:

- File uploads fail
- Console errors about missing S3 credentials
- "Cannot read property 'accessKeyId' of undefined"

**Solutions**:

1. **Check if VITE\_\* variables were set during build**:
   - These must be set as build arguments in Docker
   - Or set before running `pnpm build` in other platforms

2. **Verify server-side variables are set at runtime**:

   ```bash
   # In your container/server
   echo $BETTER_UPLOAD_ACCESS_KEY
   echo $BETTER_UPLOAD_SECRET_KEY
   ```

3. **Check the Better Upload initialization**:
   - File: `src/integrations/better-upload/init.ts`
   - Ensure it's reading from `process.env` correctly

4. **Rebuild your Docker image** if you changed VITE\_\* variables:
   ```bash
   docker-compose build --no-cache
   ```

### Issue: Environment variables not loading

**Check**:

1. Variable names are correct (case-sensitive)
2. No trailing spaces in values
3. Quotes are properly escaped
4. `.env` file is in the correct location
5. Platform-specific variable syntax is correct

### Issue: OAuth redirects failing

**Check**:

1. `BETTER_AUTH_URL` matches your actual domain
2. OAuth provider redirect URLs are configured correctly
3. No trailing slashes in URLs

### Issue: Database connection fails

**Check**:

1. Database is accessible from your deployment environment
2. Connection string format is correct
3. Database credentials are valid
4. Firewall rules allow connections

---

## Security Best Practices

1. **Never commit `.env` or `.env.local` files** to version control
2. **Use different secrets** for each environment (dev, staging, production)
3. **Rotate secrets regularly**, especially after team member changes
4. **Use secret management services** for production (AWS Secrets Manager, HashiCorp Vault, etc.)
5. **Limit IAM permissions** to only what's necessary
6. **Enable MFA** on all cloud provider accounts
7. **Monitor access logs** for unusual activity

---

## Checklist for Production Deployment

- [ ] All environment variables are set in deployment platform
- [ ] `VITE_*` variables are set as build arguments/variables
- [ ] Database is accessible and migrations are run
- [ ] S3 bucket is created and CORS is configured
- [ ] OAuth redirect URLs are configured in provider dashboards
- [ ] Sentry project is set up and receiving events
- [ ] SSL/TLS certificates are configured
- [ ] Domain DNS is pointing to deployment
- [ ] Health checks are passing
- [ ] Monitoring and alerting are configured

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review application logs
3. Verify all environment variables are set correctly
4. Check the Better Upload documentation: https://better-upload.com/docs

---

**Last Updated**: 2026-02-24
