# CRM Sync Queue Guide

## Overview

The CRM sync queue system uses BullMQ and Redis to handle background processing of contact synchronization from CRM platforms like HubSpot. This ensures sync operations don't block the main application and provides robust error handling, retry logic, and progress tracking.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Web App   │─────▶│  BullMQ      │─────▶│   Worker    │
│  (Queue)    │      │  Queue       │      │  (Process)  │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │    Redis     │
                     │  (Storage)   │
                     └──────────────┘
```

## Components

### 1. Sync Queue Service (`src/services/sync-queue.service.ts`)

Main service that manages the job queue:

- **Queue**: `hubspotSyncQueue` - Manages sync jobs
- **Worker**: `hubspotSyncWorker` - Processes sync jobs
- **Functions**:
  - `queueHubSpotSync()` - Add sync job to queue
  - `getSyncJobStatus()` - Get job status
  - `getUserSyncJobs()` - Get all jobs for a user
  - `cancelSyncJob()` - Cancel a running job
  - `getQueueMetrics()` - Get queue statistics

### 2. Worker Process (`src/workers/sync-worker.ts`)

Standalone process that runs the BullMQ worker:

- Listens for jobs from the queue
- Processes sync operations
- Emits progress updates
- Handles errors and retries

### 3. Job Data Structure

```typescript
interface HubSpotSyncJobData {
  userId: string
  integrationId: number
  provider: 'hubspot'
  options?: {
    updateExisting?: boolean // Update existing contacts
    onlyNew?: boolean // Only sync new contacts
    batchSize?: number // Contacts per batch
  }
}
```

### 4. Job Progress Tracking

```typescript
interface SyncJobProgress {
  stage: 'fetching' | 'mapping' | 'syncing' | 'completed'
  totalContacts: number
  processedContacts: number
  createdCount: number
  updatedCount: number
  skippedCount: number
  errorCount: number
  percentage: number // 0-100
}
```

## Usage

### Starting the Worker

**Development:**

```bash
pnpm worker:dev
```

**Production:**

```bash
pnpm worker
```

### Queueing a Sync Job

```typescript
import { queueHubSpotSync } from '@/services/sync-queue.service'

// Queue a sync job
const job = await queueHubSpotSync({
  userId: 'user-123',
  integrationId: 1,
  provider: 'hubspot',
  options: {
    updateExisting: true,
    onlyNew: false,
    batchSize: 100,
  },
})

console.log('Job queued:', job.id)
```

### Monitoring Job Progress

```typescript
import { getSyncJobStatus } from '@/services/sync-queue.service'

const job = await getSyncJobStatus('job-id')

if (job) {
  const progress = await job.progress()
  console.log('Progress:', progress)

  const state = await job.getState()
  console.log('State:', state) // 'waiting', 'active', 'completed', 'failed'
}
```

### Getting User's Jobs

```typescript
import { getUserSyncJobs } from '@/services/sync-queue.service'

const jobs = await getUserSyncJobs('user-123')

for (const job of jobs) {
  const state = await job.getState()
  const progress = await job.progress()
  console.log(`Job ${job.id}: ${state} - ${progress?.percentage}%`)
}
```

### Cancelling a Job

```typescript
import { cancelSyncJob } from '@/services/sync-queue.service'

const cancelled = await cancelSyncJob('job-id')
console.log('Cancelled:', cancelled)
```

## Job Lifecycle

### 1. Queued

Job is added to the queue and waiting to be processed.

### 2. Active

Worker picks up the job and starts processing:

**Stage 1: Fetching (0-30%)**

- Fetch contacts from HubSpot API
- Progress updates as contacts are fetched

**Stage 2: Mapping (30-40%)**

- Map HubSpot fields to database schema
- Validate contact data

**Stage 3: Syncing (40-95%)**

- Insert/update contacts in database
- Handle duplicates
- Track errors

**Stage 4: Completed (95-100%)**

- Update sync log
- Update integration timestamp
- Return final results

### 3. Completed

Job finished successfully with results.

### 4. Failed

Job failed after retries. Error details stored in sync log.

## Error Handling

### Automatic Retries

Jobs automatically retry on failure:

- **Attempts**: 3 retries
- **Backoff**: Exponential (5s, 10s, 20s)
- **Strategy**: Retry on transient errors (network, rate limits)

### Error Logging

All errors are logged to:

1. **Sync Log Table**: Database record with error details
2. **Job Result**: Returned with error information
3. **Worker Logs**: Console output for monitoring

### Common Errors

| Error         | Cause                 | Solution                    |
| ------------- | --------------------- | --------------------------- |
| Token expired | OAuth token invalid   | Refresh token automatically |
| Rate limit    | Too many API requests | Backoff and retry           |
| Network error | Connection issue      | Retry with backoff          |
| Invalid data  | Bad contact data      | Skip and log error          |

## Configuration

### Queue Options

```typescript
{
  attempts: 3,                    // Retry attempts
  backoff: {
    type: 'exponential',
    delay: 5000,                  // Initial delay (ms)
  },
  removeOnComplete: {
    age: 24 * 3600,              // Keep 24 hours
    count: 100,                   // Keep last 100
  },
  removeOnFail: {
    age: 7 * 24 * 3600,          // Keep 7 days
  },
}
```

### Worker Options

```typescript
{
  concurrency: 2,                 // Process 2 jobs at once
}
```

## Monitoring

### Queue Metrics

```typescript
import { getQueueMetrics } from '@/services/sync-queue.service'

const metrics = await getQueueMetrics()
console.log(metrics)
// {
//   waiting: 5,
//   active: 2,
//   completed: 100,
//   failed: 3,
//   total: 110
// }
```

### Job Events

The worker emits events for monitoring:

```typescript
hubspotSyncWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`)
})

hubspotSyncWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err)
})

hubspotSyncWorker.on('progress', (job, progress) => {
  console.log(`Job ${job.id} progress:`, progress)
})
```

## Production Deployment

### Process Management

Use a process manager like PM2:

```bash
# Install PM2
npm install -g pm2

# Start worker
pm2 start pnpm --name "crm-worker" -- worker

# Monitor
pm2 logs crm-worker
pm2 monit

# Restart
pm2 restart crm-worker

# Stop
pm2 stop crm-worker
```

### Docker Deployment

```dockerfile
# Worker Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "worker"]
```

### Environment Variables

Required environment variables:

```env
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://...
HUBSPOT_CLIENT_ID=...
HUBSPOT_CLIENT_SECRET=...
ENCRYPTION_KEY=...
```

## Scaling

### Horizontal Scaling

Run multiple worker instances:

```bash
# Terminal 1
pnpm worker

# Terminal 2
pnpm worker

# Terminal 3
pnpm worker
```

Workers automatically coordinate via Redis.

### Vertical Scaling

Increase worker concurrency:

```typescript
// In sync-queue.service.ts
export const hubspotSyncWorker = new Worker(
  'hubspot-contact-sync',
  processJob,
  {
    connection: redisConnection,
    concurrency: 5, // Process 5 jobs concurrently
  },
)
```

## Troubleshooting

### Worker Not Processing Jobs

1. Check Redis connection:

```bash
redis-cli ping
```

2. Check worker logs:

```bash
pnpm worker:dev
```

3. Verify environment variables

### Jobs Stuck in Queue

1. Check worker is running
2. Check for errors in worker logs
3. Manually retry failed jobs:

```typescript
const job = await getSyncJobStatus('job-id')
await job?.retry()
```

### High Memory Usage

1. Reduce batch size:

```typescript
queueHubSpotSync({
  // ...
  options: {
    batchSize: 50, // Smaller batches
  },
})
```

2. Reduce worker concurrency
3. Add more worker instances

## Best Practices

1. **Monitor Queue Metrics**: Track queue size and job states
2. **Set Appropriate Batch Sizes**: Balance speed vs memory
3. **Handle Errors Gracefully**: Log errors for debugging
4. **Use Progress Tracking**: Keep users informed
5. **Clean Up Old Jobs**: Prevent Redis bloat
6. **Scale Workers**: Add workers for high load
7. **Test Retry Logic**: Ensure retries work correctly
8. **Monitor Redis**: Watch memory and connection count

## Next Steps

- Implement UI for job monitoring
- Add webhook notifications for job completion
- Create admin dashboard for queue management
- Add metrics and alerting
- Implement job scheduling (cron-based syncs)
