# HubSpot CRM Integration - Complete Guide

## Overview

The HubSpot CRM integration allows users to sync their contacts from HubSpot into the IntroHub application. This feature provides seamless contact management with automatic synchronization, real-time status updates, and comprehensive analytics.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [User Guide](#user-guide)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

## Features

### Core Functionality

- ✅ OAuth 2.0 authentication with HubSpot
- ✅ Automatic contact synchronization
- ✅ Configurable sync frequency (6h, 12h, 24h, weekly)
- ✅ Manual sync trigger
- ✅ Real-time sync status via Server-Sent Events (SSE)
- ✅ Comprehensive sync analytics dashboard
- ✅ Email notifications for sync failures
- ✅ Detailed sync logging and error tracking

### User Experience

- ✅ Dedicated CRM Integrations page in main navigation
- ✅ CRM Sync tab in Contact Import Modal
- ✅ Per-provider analytics with tabs (future-proof for multiple CRMs)
- ✅ Empty states and loading indicators
- ✅ Responsive design for mobile and desktop

## Architecture

### High-Level Flow

```
┌─────────────┐      OAuth      ┌──────────┐
│   User      │ ◄──────────────► │ HubSpot  │
└──────┬──────┘                  └────┬─────┘
       │                              │
       │ 1. Connect                   │
       ▼                              │
┌─────────────────┐                   │
│ CRM Integration │                   │
│     Page        │                   │
└────────┬────────┘                   │
         │                            │
         │ 2. Store tokens            │
         ▼                            │
┌─────────────────┐                   │
│   Database      │                   │
│ (crmIntegrations│                   │
│   + syncLogs)   │                   │
└────────┬────────┘                   │
         │                            │
         │ 3. Queue sync              │
         ▼                            │
┌─────────────────┐                   │
│   BullMQ        │ ──── 4. Fetch ───►│
│  Sync Worker    │ ◄─── contacts ────┘
└────────┬────────┘
         │
         │ 5. Map & store
         ▼
┌─────────────────┐
│   Contacts      │
│   Table         │
└─────────────────┘
```

### Components

#### Backend Services

- **HubSpotService** (`src/services/hubspot.service.ts`)
  - OAuth flow management
  - Contact fetching with pagination
  - Token refresh handling
- **FieldMappingService** (`src/services/field-mapping.service.ts`)
  - Maps HubSpot fields to database schema
  - Validates contact data
  - Stores additional fields in metadata

- **SyncQueueService** (`src/services/sync-queue.service.ts`)
  - BullMQ job queue management
  - Background sync processing
  - Error handling and retry logic
  - Sync log creation and updates

- **TokenStorageService** (`src/services/token-storage.service.ts`)
  - Encrypts/decrypts OAuth tokens
  - Secure token management

#### Frontend Components

- **CRMIntegrationsList** - Main CRM management interface
- **CRMSyncAnalyticsCard** - Dashboard analytics widget
- **ContactImportModal** - Enhanced with CRM sync tab
- **CRMSettingsDialog** - Sync frequency configuration
- **CRMDisconnectDialog** - Integration removal with options

#### API Layer

- **tRPC Router** (`src/integrations/trpc/routes/crm.ts`)
  - `list` - Get user's CRM integrations
  - `get` - Get specific integration
  - `syncNow` - Trigger manual sync
  - `updateSettings` - Update sync frequency
  - `disconnect` - Remove integration
  - `getContactCount` - Get synced contact count
  - `getSyncAnalytics` - Get sync metrics and history

## Setup & Configuration

### Environment Variables

Add to `.env`:

```bash
# HubSpot OAuth Configuration
HUBSPOT_CLIENT_ID=your_client_id_here
HUBSPOT_CLIENT_SECRET=your_client_secret_here
HUBSPOT_REDIRECT_URI=http://localhost:3000/api/crm/hubspot/callback

# Token Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your_32_byte_encryption_key_here

# Redis for BullMQ (if not already configured)
REDIS_URL=redis://localhost:6379
```

### HubSpot App Setup

1. Go to [HubSpot Developer Portal](https://developers.hubspot.com/)
2. Create a new app
3. Configure OAuth:
   - Redirect URL: `http://localhost:3000/api/crm/hubspot/callback`
   - Scopes: `crm.objects.contacts.read`, `crm.objects.contacts.write`
4. Copy Client ID and Client Secret to `.env`

### Database Migration

Run the CRM integration migration:

```bash
pnpm db:push
```

This creates:

- `crm_integrations` table
- `sync_logs` table
- Required indexes

### Redis Setup

Ensure Redis is running for BullMQ:

```bash
# macOS
brew services start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

## User Guide

### Connecting HubSpot

1. Navigate to **CRM Integrations** in the main menu
2. Click **Connect** on the HubSpot card
3. Authorize IntroHub in HubSpot OAuth flow
4. Return to IntroHub - integration is now active

### Syncing Contacts

#### Automatic Sync

- Syncs run automatically based on configured frequency
- Default: Every 24 hours
- Can be changed in Settings (6h, 12h, 24h, weekly)

#### Manual Sync

1. Go to CRM Integrations page
2. Click **Sync Now** button
3. Watch real-time progress indicator
4. Receive email notification if sync fails

#### From Contact Import Modal

1. Click **Add/Import Contacts**
2. Select **CRM Sync** tab
3. Choose your connected CRM
4. Click **Sync Contacts**

### Viewing Analytics

Analytics are displayed in two places:

#### Dashboard Card

- Success rate percentage
- Total syncs in selected period
- Average sync time
- Last sync status with details

#### CRM Integrations Page

- Per-integration sync history
- Detailed error logs
- Contact count per CRM

### Managing Integration

#### Update Settings

1. Click **Settings** icon on integration card
2. Change sync frequency
3. Save changes

#### Disconnect

1. Click **Disconnect** button
2. Choose whether to delete synced contacts
3. Confirm disconnection

## API Reference

### tRPC Endpoints

#### `crm.list`

Get all CRM integrations for current user.

```typescript
const integrations = await trpc.crm.list.query()
```

**Response:**

```typescript
Array<{
  id: number
  provider: 'hubspot'
  status: 'active' | 'error' | 'expired'
  syncFrequency: '6h' | '12h' | '24h' | 'weekly'
  syncStatus: 'idle' | 'syncing' | 'completed' | 'failed'
  lastSyncedAt: Date | null
  connectedAt: Date
}>
```

#### `crm.getSyncAnalytics`

Get sync analytics for a provider.

```typescript
const analytics = await trpc.crm.getSyncAnalytics.query({
  provider: 'hubspot',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
})
```

**Response:**

```typescript
{
  totalSyncs: number
  successRate: number // 0-100
  avgSyncTime: number // milliseconds
  avgSyncTimeFormatted: string // "2m 15s"
  lastSyncStatus: {
    status: 'completed' | 'failed' | 'in_progress' | 'partial'
    timestamp: Date
    timeAgo: string
    successCount: number
    errorCount: number
    updatedCount: number
    skippedCount: number
  } | null
  completedSyncs: number
  failedSyncs: number
}
```

#### `crm.syncNow`

Trigger manual sync.

```typescript
const result = await trpc.crm.syncNow.mutate({
  provider: 'hubspot',
})
```

**Response:**

```typescript
{
  success: boolean
  jobId: string
  message: string
}
```

**Errors:**

- `NOT_FOUND` - Integration not found
- `PRECONDITION_FAILED` - Integration not active
- `CONFLICT` - Sync already in progress

### SSE Endpoint

Real-time sync status updates:

```typescript
// Connect to SSE stream
const eventSource = new EventSource('/api/crm/sync-status/stream')

eventSource.addEventListener('sync-update', (event) => {
  const data = JSON.parse(event.data)
  // data.integrationId, data.status, data.progress
})
```

## Database Schema

### `crm_integrations`

```sql
CREATE TABLE crm_integrations (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'hubspot'
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT, -- Encrypted
  expires_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'error' | 'expired'
  sync_frequency VARCHAR(20) NOT NULL DEFAULT '24h',
  sync_status TEXT NOT NULL DEFAULT 'idle',
  last_synced_at TIMESTAMP,
  last_sync_error TEXT,
  sync_started_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  connected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crm_integrations_user_id ON crm_integrations(user_id);
CREATE INDEX idx_crm_integrations_provider ON crm_integrations(provider);
CREATE UNIQUE INDEX idx_crm_integrations_user_provider ON crm_integrations(user_id, provider);
```

### `sync_logs`

```sql
CREATE TABLE sync_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  integration_id INTEGER NOT NULL REFERENCES crm_integrations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  total_contacts INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  errors TEXT, -- JSONB array
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_integration_id ON sync_logs(integration_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
```

## Testing

### Running Tests

```bash
# All CRM tests
pnpm test src/__tests__/crm

# Unit tests only
pnpm test src/__tests__/crm/field-mapping.test.ts

# With coverage
pnpm test:coverage src/__tests__/crm
```

### Test Coverage

- ✅ **Unit Tests**: 15 tests for field mapping (100% coverage)
- 🚧 **Integration Tests**: Placeholders for tRPC endpoints
- 📋 **E2E Tests**: Planned for critical user flows

See `src/__tests__/crm/README.md` for detailed testing guide.

## Deployment

### Pre-Deployment Checklist

- [ ] Environment variables configured in production
- [ ] HubSpot app configured with production redirect URI
- [ ] Redis instance running and accessible
- [ ] Database migrations applied
- [ ] Encryption key generated and secured
- [ ] Email service configured for failure notifications
- [ ] PostHog analytics configured (optional)

### Environment-Specific Configuration

#### Production

```bash
HUBSPOT_REDIRECT_URI=https://yourdomain.com/api/crm/hubspot/callback
REDIS_URL=redis://your-redis-instance:6379
ENCRYPTION_KEY=<secure-32-byte-key>
```

#### Staging

```bash
HUBSPOT_REDIRECT_URI=https://staging.yourdomain.com/api/crm/hubspot/callback
REDIS_URL=redis://staging-redis:6379
ENCRYPTION_KEY=<staging-key>
```

### Deployment Steps

1. **Deploy Database Changes**

   ```bash
   pnpm db:push
   ```

2. **Deploy Application**

   ```bash
   pnpm build
   pnpm start
   ```

3. **Verify Services**
   - Check Redis connection
   - Test OAuth flow
   - Trigger test sync
   - Verify SSE connection

4. **Monitor**
   - Check BullMQ dashboard
   - Monitor sync logs
   - Watch for error notifications

### Rollback Plan

If issues occur:

1. **Disable New Connections**
   - Remove CRM Integrations from navigation
   - Return 503 from OAuth callback

2. **Stop Background Jobs**

   ```bash
   # Pause BullMQ queue
   redis-cli LPUSH bull:crm-sync:paused 1
   ```

3. **Revert Database** (if needed)
   ```bash
   # Rollback migration
   pnpm db:rollback
   ```

## Troubleshooting

### Common Issues

#### OAuth Fails

**Symptom**: Redirect to error page after HubSpot authorization

**Solutions**:

- Verify `HUBSPOT_REDIRECT_URI` matches HubSpot app settings
- Check `HUBSPOT_CLIENT_ID` and `HUBSPOT_CLIENT_SECRET`
- Ensure user has proper permissions in HubSpot

#### Sync Fails

**Symptom**: Sync status shows "failed"

**Solutions**:

- Check sync logs table for error details
- Verify HubSpot API access (token not expired)
- Check Redis connection for BullMQ
- Review error email for specific failure reason

#### No Contacts Synced

**Symptom**: Sync completes but no contacts appear

**Solutions**:

- Verify contacts have email addresses in HubSpot
- Check field mapping logic
- Review sync log for skipped count
- Ensure user has contacts in HubSpot

#### SSE Not Working

**Symptom**: Real-time updates not appearing

**Solutions**:

- Check browser console for connection errors
- Verify SSE endpoint is accessible
- Check for proxy/load balancer timeout settings
- Ensure Redis pub/sub is working

### Debug Mode

Enable detailed logging:

```bash
DEBUG=crm:* pnpm start
```

### Support

For additional help:

- Check sync logs in database
- Review BullMQ dashboard
- Contact development team with:
  - User ID
  - Integration ID
  - Sync log ID
  - Error message

## Future Enhancements

### Planned Features

- [ ] Support for additional CRM providers (Salesforce, Pipedrive)
- [ ] Bi-directional sync (update HubSpot from IntroHub)
- [ ] Custom field mapping configuration
- [ ] Sync filtering (by list, tag, or property)
- [ ] Webhook support for real-time updates
- [ ] Bulk operations (pause all syncs, reconnect all)

### Performance Optimizations

- [ ] Incremental sync (only changed contacts)
- [ ] Parallel contact processing
- [ ] Caching for frequently accessed data
- [ ] Rate limit optimization

---

**Last Updated**: 2024-01-14
**Version**: 1.0.0
**Maintained By**: Development Team
