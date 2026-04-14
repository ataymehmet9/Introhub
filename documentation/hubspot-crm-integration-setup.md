# HubSpot CRM Integration - Setup Guide

## ✅ Prerequisites Status

- ✅ **Database schema**: Updated successfully
- ✅ **Podman services**: PostgreSQL and Redis running
- ⏳ **HubSpot Developer App**: Needs to be created
- ⏳ **Environment variables**: Need to be configured

---

## Step 1: Create HubSpot Developer App

### Understanding HubSpot App Types

HubSpot now has two ways to create apps:

1. **New Developer Platform** (CLI-based) - For complex apps with UI extensions, serverless functions, etc.
2. **Legacy Apps** (UI-based) - **Recommended for OAuth integrations** ✅

For our OAuth integration to sync contacts, we'll use **Legacy Apps** as it's simpler and perfect for API-only integrations.

### 1.1 Access HubSpot Developer Portal

1. Go to **https://app.hubspot.com/**
2. Log in to your HubSpot account (or create a free account)
3. In the top navigation, click on the **settings icon** (⚙️) in the top right
4. In the left sidebar, scroll down to find **"Development"** section
5. Click on **"Legacy Apps"**

   **💡 Note:** If you see "Projects" or "Overview" in the Development section, that's the new platform. You want **"Legacy Apps"** for this integration.

### 1.2 Create a New Legacy App

1. On the Legacy Apps page, click **"Create app"** button (top right)
2. Fill in the app details:
   ```
   App name: IntroHub CRM Integration
   Description: OAuth integration to sync contacts between HubSpot and IntroHub
   ```
3. Click **"Create app"**

   You'll be taken to your new app's dashboard.

### 1.3 Configure OAuth Settings

1. In your new app dashboard, click on the **"Auth"** tab in the left sidebar
2. Scroll down to **"Redirect URLs"** section
3. Click **"Add redirect URL"**
4. Add the following URL:
   ```
   http://localhost:3000/api/crm/hubspot/callback
   ```
5. Click **"Add"**

   **📝 Note for Production:**
   When deploying to production, you'll need to add your production URL:

   ```
   https://yourdomain.com/api/crm/hubspot/callback
   ```

### 1.4 Select Required Scopes

1. Still in the **"Auth"** tab, scroll down to **"Scopes"** section
2. Search for and select the following scopes:

   **Required Scopes:**
   - ✅ `crm.objects.contacts.read` - Read contact records
   - ✅ `crm.objects.contacts.write` - Create and update contacts (for future bi-directional sync)

3. Click **"Save"** at the bottom of the page

### 1.5 Get Your App Credentials

1. In the **"Auth"** tab, scroll to the top
2. You'll see a section called **"App credentials"**
3. Copy the following values (you'll need them in Step 2):

   ```
   Client ID: (looks like: 12345678-1234-1234-1234-123456789012)
   Client Secret: (looks like: abcdef12-3456-7890-abcd-ef1234567890)
   ```

   **⚠️ Important:** Keep your Client Secret secure! Never commit it to version control.

### 1.6 Testing the OAuth Flow

**Note:** Legacy Apps don't have a separate "Install" tab. The OAuth authorization happens when users click the "Connect HubSpot" button in your application (which we'll build in Phase 6).

For now, you can test the OAuth flow manually:

1. Once you have your Client ID from step 1.5, you can construct a test authorization URL:

   ```
   https://app.hubspot.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/api/crm/hubspot/callback&scope=crm.objects.contacts.read%20crm.objects.contacts.write
   ```

2. Replace `YOUR_CLIENT_ID` with your actual Client ID

3. **Don't test this yet** - we need to build the callback endpoint first (Phase 6)

4. The OAuth flow will be fully testable once we complete the CRM Integrations UI

**What happens during OAuth:**

- User clicks "Connect HubSpot" in your app
- They're redirected to HubSpot's authorization page
- They log in (if needed) and approve permissions
- HubSpot redirects back to your callback URL with an authorization code
- Your app exchanges the code for access tokens
- Tokens are encrypted and stored in the database

---

## Step 2: Configure Environment Variables

### 2.1 Generate Encryption Key

Open your terminal and run:

```bash
openssl rand -hex 32
```

**Copy the output** (it will be a 64-character string like: `a1b2c3d4e5f6...`)

### 2.2 Update Your `.env.local` File

Open or create `.env.local` in your project root and add these variables:

```env
# ==============================================
# REDIS (for BullMQ job queue)
# ==============================================
REDIS_URL="redis://localhost:6379"

# ==============================================
# CRM INTEGRATIONS - HUBSPOT
# ==============================================
# Paste your Client ID from Step 1.5
HUBSPOT_CLIENT_ID="your-client-id-here"

# Paste your Client Secret from Step 1.5
HUBSPOT_CLIENT_SECRET="your-client-secret-here"

# This must match the redirect URL you added in Step 1.3
HUBSPOT_REDIRECT_URI="http://localhost:3000/api/crm/hubspot/callback"

# ==============================================
# ENCRYPTION
# ==============================================
# Paste the encryption key you generated in Step 2.1
ENCRYPTION_KEY="your-64-character-encryption-key-here"
```

### 2.3 Verify Existing Variables

Make sure your `.env.local` also has these existing variables:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `VITE_BETTER_AUTH_URL`
- All other existing environment variables from `.env.example`

---

## Step 3: Verify Setup

### 3.1 Check Podman Services

```bash
# Verify both services are running
podman ps

# Expected output:
# CONTAINER ID  IMAGE                    STATUS                  PORTS                   NAMES
# xxx           postgres:16-alpine       Up (healthy)            0.0.0.0:5432->5432/tcp  intro-hub-postgres
# xxx           redis:7-alpine           Up (healthy)            0.0.0.0:6379->6379/tcp  intro-hub-redis
```

### 3.2 Test Redis Connection

```bash
# Test Redis is accessible
podman exec -it intro-hub-redis redis-cli ping

# Expected output: PONG
```

### 3.3 Start Development Server

```bash
pnpm dev
```

You should see:

- ✅ No errors about missing environment variables
- ✅ Server starts successfully on http://localhost:3000
- ✅ No Redis connection errors

---

## Step 4: Test HubSpot OAuth Flow (After UI is Built)

Once the CRM Integrations UI is complete, you can test the OAuth flow:

1. Navigate to **CRM Integrations** page in your app
2. Click **"Connect HubSpot"** button
3. You'll be redirected to HubSpot's authorization page
4. Log in with your HubSpot account (if not already logged in)
5. Review the permissions and click **"Connect app"**
6. You'll be redirected back to your app
7. You should see "Connected" status for HubSpot

---

## Step 5: Create Test Data in HubSpot (Optional)

To test the contact sync functionality:

1. Log in to your HubSpot account at https://app.hubspot.com/
2. Go to **Contacts** → **Contacts**
3. Click **"Create contact"**
4. Add some test contacts with:
   - First name
   - Last name
   - Email (required)
   - Company
   - Job title
   - Phone number
5. Create 5-10 test contacts for a good test

---

## Troubleshooting

### ❌ "ENCRYPTION_KEY environment variable is not set"

**Solution:**

- Generate key: `openssl rand -hex 32`
- Add to `.env.local` as shown in Step 2.2

### ❌ "HubSpot credentials not configured"

**Solution:**

- Verify `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`, and `HUBSPOT_REDIRECT_URI` are in `.env.local`
- Check for typos or extra spaces
- Restart your dev server after adding variables

### ❌ "Failed to connect to Redis"

**Solution:**

```bash
# Check if Redis is running
podman ps | grep redis

# If not running, start it
podman-compose up -d redis

# Test connection
podman exec -it intro-hub-redis redis-cli ping
```

### ❌ OAuth redirect doesn't work

**Solution:**

- Verify redirect URI in `.env.local` **exactly matches** what's in HubSpot app settings
- Check for:
  - `http://` vs `https://`
  - Trailing slashes
  - Port numbers
  - Typos

### ❌ "Invalid client credentials" during OAuth

**Solution:**

- Double-check Client ID and Client Secret in `.env.local`
- Make sure you copied them correctly from HubSpot (no extra spaces)
- Verify the app is not in "Draft" mode in HubSpot

### ❌ "Scope not authorized" error

**Solution:**

- Go back to HubSpot app settings → Auth tab
- Verify both scopes are selected:
  - `crm.objects.contacts.read`
  - `crm.objects.contacts.write`
- Click "Save" and try again

---

## Production Deployment Checklist

When deploying to production:

### Before Deployment

- [ ] Update `HUBSPOT_REDIRECT_URI` to production domain
- [ ] Add production redirect URI to HubSpot app settings
- [ ] Use managed Redis service (Upstash recommended for serverless)
- [ ] Store `ENCRYPTION_KEY` in secrets manager (not in code)
- [ ] Enable HTTPS for all OAuth redirects
- [ ] Test OAuth flow in staging environment first

### HubSpot App Settings

- [ ] Add production redirect URL in HubSpot app
- [ ] Verify scopes are correct
- [ ] Test with a real HubSpot account

### Environment Variables

```env
# Production example
HUBSPOT_REDIRECT_URI="https://yourdomain.com/api/crm/hubspot/callback"
REDIS_URL="redis://your-managed-redis-url:6379"
ENCRYPTION_KEY="your-production-encryption-key"
```

---

## Quick Reference

### Important URLs

- **HubSpot Developer Portal**: https://developers.hubspot.com/
- **HubSpot API Documentation**: https://developers.hubspot.com/docs/api/overview
- **Your Apps Dashboard**: https://app.hubspot.com/developer/applications
- **HubSpot Account**: https://app.hubspot.com/

### Key Files Created

```
src/
├── db/schema.ts                      # Database tables (crm_integrations, sync_logs)
├── services/
│   ├── encryption.service.ts         # AES-256-GCM encryption
│   ├── token-storage.service.ts      # OAuth token management
│   └── hubspot.service.ts            # HubSpot API client
└── schemas/
    ├── crm-integration.schema.ts     # CRM integration validation
    └── sync-log.schema.ts            # Sync log validation
```

### Useful Commands

```bash
# Podman Services
podman ps                              # List running containers
podman-compose up -d                   # Start all services
podman-compose down                    # Stop all services
podman-compose logs -f redis           # View Redis logs
podman exec -it intro-hub-redis redis-cli  # Access Redis CLI

# Development
pnpm dev                               # Start dev server
pnpm db:push                           # Push schema changes
pnpm db:studio                         # Open database GUI

# Testing
podman exec -it intro-hub-redis redis-cli ping  # Test Redis
```

### Environment Variables Checklist

- [ ] `REDIS_URL`
- [ ] `HUBSPOT_CLIENT_ID`
- [ ] `HUBSPOT_CLIENT_SECRET`
- [ ] `HUBSPOT_REDIRECT_URI`
- [ ] `ENCRYPTION_KEY`

---

## Next Steps

Now that your environment is fully configured:

1. ✅ Database schema is ready
2. ✅ Podman services (PostgreSQL + Redis) are running
3. ✅ HubSpot app is configured
4. ✅ Environment variables are set
5. ⏳ Continue with Phase 4: Field Mapping & Sync Logic
6. ⏳ Build the CRM Integrations UI (Phase 6)
7. ⏳ Implement contact sync functionality

---

## Support & Resources

### HubSpot Resources

- [OAuth 2.0 Guide](https://developers.hubspot.com/docs/api/oauth-quickstart-guide)
- [Contacts API](https://developers.hubspot.com/docs/api/crm/contacts)
- [API Rate Limits](https://developers.hubspot.com/docs/api/usage-details)

### Need Help?

- Check application logs for detailed error messages
- Review HubSpot API documentation
- Verify all environment variables are set correctly
- Test OAuth flow step by step
