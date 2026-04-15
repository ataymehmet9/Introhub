# CRM Integration - Developer Guide

## Quick Reference

This guide provides quick reference information for developers working on the CRM integration feature.

## Architecture Overview

```
User Action → tRPC Endpoint → Service Layer → Database/External API
                                    ↓
                              BullMQ Queue → Background Worker
                                    ↓
                              SSE Updates → Real-time UI
```

## Key Files & Responsibilities

### Backend Services

| File                                    | Purpose                | Key Functions                                                                     |
| --------------------------------------- | ---------------------- | --------------------------------------------------------------------------------- |
| `src/services/hubspot.service.ts`       | HubSpot API client     | `exchangeCodeForTokens()`, `fetchContacts()`, `refreshAccessToken()`              |
| `src/services/field-mapping.service.ts` | Field transformation   | `mapHubSpotContactToDb()`, `mapHubSpotContactsBatch()`, `validateMappedContact()` |
| `src/services/sync-queue.service.ts`    | Background sync worker | `processSyncJob()`, `createSyncLog()`, `updateSyncLog()`                          |
| `src/services/token-storage.service.ts` | Token encryption       | `encryptToken()`, `decryptToken()`                                                |

### API Layer

| File                                       | Purpose        | Endpoints                                                                                       |
| ------------------------------------------ | -------------- | ----------------------------------------------------------------------------------------------- |
| `src/integrations/trpc/routes/crm.ts`      | tRPC router    | `list`, `get`, `syncNow`, `updateSettings`, `disconnect`, `getContactCount`, `getSyncAnalytics` |
| `src/routes/api/crm/hubspot/callback.ts`   | OAuth callback | Handles HubSpot OAuth redirect                                                                  |
| `src/routes/api/crm/sync-status/stream.ts` | SSE endpoint   | Real-time sync status updates                                                                   |

### Frontend Components

| File                                                                               | Purpose                   |
| ---------------------------------------------------------------------------------- | ------------------------- |
| `src/routes/_authenticated/(crm-integrations)/crm-integrations.tsx`                | Main CRM page             |
| `src/routes/_authenticated/(crm-integrations)/-components/CRMIntegrationsList.tsx` | Integration cards         |
| `src/routes/_authenticated/(crm-integrations)/-components/CRMSettingsDialog.tsx`   | Settings modal            |
| `src/routes/_authenticated/(crm-integrations)/-components/CRMDisconnectDialog.tsx` | Disconnect modal          |
| `src/routes/_authenticated/(dashboard)/-components/CRMSyncAnalyticsCard.tsx`       | Dashboard analytics       |
| `src/components/shared/common/ContactImportModal.tsx`                              | Import modal with CRM tab |

### Database Schema

| File               | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `src/db/schema.ts` | Schema definitions for `crmIntegrations` and `syncLogs` tables |

## Common Development Tasks

### Adding a New CRM Provider

1. **Update Schema** (`src/db/schema.ts`)

   ```typescript
   export const crmProviders = ['hubspot', 'salesforce'] as const
   ```

2. **Create Service** (`src/services/salesforce.service.ts`)

   ```typescript
   export class SalesforceService {
     async exchangeCodeForTokens(code: string) {
       /* ... */
     }
     async fetchContacts(accessToken: string) {
       /* ... */
     }
     async refreshAccessToken(refreshToken: string) {
       /* ... */
     }
   }
   ```

3. **Add Field Mapping** (`src/services/field-mapping.service.ts`)

   ```typescript
   export function mapSalesforceContactToDb(contact: SalesforceContact) {
     // Map Salesforce fields to database schema
   }
   ```

4. **Create OAuth Callback** (`src/routes/api/crm/salesforce/callback.ts`)

   ```typescript
   // Handle Salesforce OAuth redirect
   ```

5. **Update UI** (`src/routes/_authenticated/(crm-integrations)/-components/CRMIntegrationsList.tsx`)
   ```typescript
   const CRM_PROVIDERS = [
     { id: 'hubspot', name: 'HubSpot' /* ... */ },
     { id: 'salesforce', name: 'Salesforce' /* ... */ },
   ]
   ```

### Debugging Sync Issues

#### Check Sync Logs

```sql
SELECT
  sl.id,
  sl.provider,
  sl.status,
  sl.total_contacts,
  sl.success_count,
  sl.error_count,
  sl.errors,
  sl.started_at,
  sl.completed_at
FROM sync_logs sl
WHERE sl.user_id = 'user_xxx'
ORDER BY sl.started_at DESC
LIMIT 10;
```

#### Check Integration Status

```sql
SELECT
  ci.id,
  ci.provider,
  ci.status,
  ci.sync_status,
  ci.last_synced_at,
  ci.last_sync_error,
  ci.next_sync_at
FROM crm_integrations ci
WHERE ci.user_id = 'user_xxx';
```

#### Check BullMQ Queue

```bash
# Connect to Redis
redis-cli

# Check queue length
LLEN bull:crm-sync:wait

# View failed jobs
LRANGE bull:crm-sync:failed 0 -1

# View active jobs
LRANGE bull:crm-sync:active 0 -1
```

#### Enable Debug Logging

```bash
DEBUG=crm:* pnpm dev
```

### Testing Sync Flow

#### Manual Test

```typescript
// In browser console or test file
const result = await trpc.crm.syncNow.mutate({ provider: 'hubspot' })
console.log('Job ID:', result.jobId)
```

#### Unit Test

```typescript
import { describe, it, expect } from 'vitest'
import { mapHubSpotContactToDb } from '@/services/field-mapping.service'

describe('Field Mapping', () => {
  it('should map HubSpot contact to database schema', () => {
    const hubspotContact = {
      id: '123',
      properties: {
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
      },
    }

    const result = mapHubSpotContactToDb(hubspotContact, 'user_123')

    expect(result.email).toBe('test@example.com')
    expect(result.firstName).toBe('John')
    expect(result.lastName).toBe('Doe')
  })
})
```

### Monitoring Sync Performance

#### Query Average Sync Time

```sql
SELECT
  provider,
  COUNT(*) as total_syncs,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds,
  MAX(EXTRACT(EPOCH FROM (completed_at - started_at))) as max_duration_seconds
FROM sync_logs
WHERE status = 'completed'
  AND started_at > NOW() - INTERVAL '7 days'
GROUP BY provider;
```

#### Query Success Rate

```sql
SELECT
  provider,
  COUNT(*) as total_syncs,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_syncs,
  ROUND(
    100.0 * SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) as success_rate_percent
FROM sync_logs
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY provider;
```

## API Reference

### tRPC Endpoints

#### `crm.list`

Get all CRM integrations for current user.

```typescript
const integrations = await trpc.crm.list.query()
```

#### `crm.syncNow`

Trigger manual sync.

```typescript
const result = await trpc.crm.syncNow.mutate({ provider: 'hubspot' })
```

**Error Codes:**

- `NOT_FOUND` - Integration not found
- `PRECONDITION_FAILED` - Integration not active
- `CONFLICT` - Sync already in progress

#### `crm.getSyncAnalytics`

Get sync analytics.

```typescript
const analytics = await trpc.crm.getSyncAnalytics.query({
  provider: 'hubspot',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
})
```

### SSE Events

#### Connect to Stream

```typescript
const eventSource = new EventSource('/api/crm/sync-status/stream')

eventSource.addEventListener('sync-update', (event) => {
  const data = JSON.parse(event.data)
  console.log('Sync update:', data)
})

eventSource.addEventListener('error', (error) => {
  console.error('SSE error:', error)
  eventSource.close()
})
```

#### Event Data Structure

```typescript
{
  integrationId: number
  status: 'idle' | 'syncing' | 'completed' | 'failed'
  progress?: number // 0-100
  message?: string
  error?: string
}
```

## Field Mapping

### HubSpot → Database

| HubSpot Field          | Database Field | Notes                            |
| ---------------------- | -------------- | -------------------------------- |
| `properties.email`     | `email`        | Required, validated              |
| `properties.firstname` | `firstName`    | Optional                         |
| `properties.lastname`  | `lastName`     | Optional                         |
| `properties.phone`     | `phone`        | Optional                         |
| `properties.company`   | `company`      | Optional                         |
| `properties.jobtitle`  | `jobTitle`     | Optional                         |
| `properties.address`   | `address`      | Optional                         |
| `properties.city`      | `city`         | Optional                         |
| `properties.state`     | `state`        | Optional                         |
| `properties.zip`       | `zipCode`      | Optional                         |
| `properties.country`   | `country`      | Optional                         |
| `properties.website`   | `website`      | Optional, validated URL          |
| `properties.linkedin`  | `linkedinUrl`  | Optional, validated URL          |
| `properties.*`         | `metadata`     | All other fields stored as JSONB |

### Validation Rules

- **Email**: Required, must be valid email format
- **URLs**: Must be valid URL format (website, linkedinUrl)
- **Phone**: No specific format required (international support)
- **Duplicates**: Checked by email before insert

## Environment Variables

### Required for CRM Integration

```bash
# HubSpot OAuth
HUBSPOT_CLIENT_ID=your_client_id
HUBSPOT_CLIENT_SECRET=your_client_secret
HUBSPOT_REDIRECT_URI=http://localhost:3000/api/crm/hubspot/callback

# Token Encryption
ENCRYPTION_KEY=your_32_byte_key # openssl rand -base64 32

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379
```

### Optional

```bash
# Email notifications
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASSWORD=your_password
SMTP_FROM=noreply@yourdomain.com
```

## Common Issues & Solutions

### Issue: OAuth Fails with "Invalid Redirect URI"

**Cause**: Redirect URI mismatch between `.env` and HubSpot app settings.

**Solution**:

1. Check `HUBSPOT_REDIRECT_URI` in `.env`
2. Verify it matches exactly in HubSpot app settings
3. Ensure protocol (http/https) matches
4. Restart dev server after changing `.env`

### Issue: Sync Fails with "Token Expired"

**Cause**: Access token expired and refresh failed.

**Solution**:

1. Check `expires_at` in `crm_integrations` table
2. Verify refresh token is valid
3. Check HubSpot app is still active
4. User may need to reconnect

### Issue: Contacts Not Syncing

**Cause**: Multiple possible causes.

**Debug Steps**:

1. Check sync logs for errors
2. Verify HubSpot has contacts with email addresses
3. Check field mapping validation
4. Review BullMQ queue for stuck jobs
5. Check Redis connection

### Issue: SSE Connection Drops

**Cause**: Proxy/load balancer timeout or network issue.

**Solution**:

1. Increase proxy timeout (nginx: `proxy_read_timeout 300s`)
2. Implement reconnection logic in frontend
3. Add heartbeat messages to keep connection alive

## Performance Optimization

### Database Indexes

Ensure these indexes exist:

```sql
CREATE INDEX idx_crm_integrations_user_id ON crm_integrations(user_id);
CREATE INDEX idx_crm_integrations_provider ON crm_integrations(provider);
CREATE INDEX idx_sync_logs_integration_id ON sync_logs(integration_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
```

### Query Optimization

Use proper query keys for React Query:

```typescript
// Good - specific query key
;['crm', 'integrations', userId][
  // Bad - too generic
  'crm'
]
```

### Batch Processing

Process contacts in batches:

```typescript
const BATCH_SIZE = 100
for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
  const batch = contacts.slice(i, i + BATCH_SIZE)
  await processBatch(batch)
}
```

## Security Considerations

### Token Storage

- Tokens encrypted using AES-256-GCM
- Encryption key stored in environment variable
- Never log tokens or encryption key

### API Security

- All endpoints require authentication
- Rate limiting on OAuth endpoints
- CSRF protection enabled
- Input validation with Zod

### Data Privacy

- User can delete all synced contacts
- Metadata stored separately for flexibility
- Audit logs maintained in sync_logs

## Resources

- [HubSpot API Documentation](https://developers.hubspot.com/docs/api/overview)
- [BullMQ Documentation](https://docs.bullmq.io)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)

---

**Last Updated**: 2024-01-14  
**Maintained By**: Development Team
