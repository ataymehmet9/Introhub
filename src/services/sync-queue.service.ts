/**
 * Sync Queue Service
 *
 * Manages background job queue for CRM contact syncing using BullMQ.
 * Handles job creation, processing, progress tracking, and error handling.
 */

import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { eq } from 'drizzle-orm'
import { hubspotService } from './hubspot.service'
import { mapHubSpotContactsBatch } from './field-mapping.service'
import { syncContactsBatch } from './contact-sync.service'
import { sendCRMSyncFailureEmailDirect } from './email.functions'
import type { Job } from 'bullmq'
import { db } from '@/db'
import { crmIntegrations, notifications, syncLogs, user } from '@/db/schema'
import {
  crmLogger,
  errorLogger,
} from '@/integrations/opentelemetry/logger.server'

// Dynamic import to avoid bundling server-only code in client bundle
const getPublishNotificationEvent = async () => {
  const { publishNotificationEvent } = await import('@/lib/notification-bridge')
  return publishNotificationEvent
}

/**
 * Job data for HubSpot contact sync
 */
export interface HubSpotSyncJobData {
  userId: string
  integrationId: number
  provider: 'hubspot'
  options?: {
    updateExisting?: boolean
    onlyNew?: boolean
    batchSize?: number
  }
}

/**
 * Job progress data
 */
export interface SyncJobProgress {
  stage: 'fetching' | 'mapping' | 'syncing' | 'completed'
  totalContacts: number
  processedContacts: number
  createdCount: number
  updatedCount: number
  skippedCount: number
  errorCount: number
  percentage: number
}

/**
 * Job result data
 */
export interface SyncJobResult {
  success: boolean
  syncLogId: number
  totalContacts: number
  createdCount: number
  updatedCount: number
  skippedCount: number
  errorCount: number
  errors?: Array<{ email: string; error: string }>
}

// Redis connection
const redisConnection = new Redis(
  process.env.REDIS_URL || 'redis://localhost:6379',
  {
    maxRetriesPerRequest: null,
  },
)

// Queue for HubSpot sync jobs
export const hubspotSyncQueue = new Queue<HubSpotSyncJobData>(
  'hubspot-contact-sync',
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // Start with 5 seconds
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep completed jobs for 24 hours
        count: 100, // Keep last 100 completed jobs
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed jobs for 7 days
      },
    },
  },
)

/**
 * Worker to process HubSpot sync jobs
 */
export const hubspotSyncWorker = new Worker<
  HubSpotSyncJobData,
  SyncJobResult,
  string
>(
  'hubspot-contact-sync',
  async (job: Job<HubSpotSyncJobData>) => {
    const { userId, integrationId, provider, options = {} } = job.data
    const startTime = Date.now()

    // Log sync started
    crmLogger.syncStarted({
      posthogDistinctId: userId,
      provider: 'hubspot',
      job_id: job.id,
      sync_type: options.onlyNew ? 'incremental' : 'full',
    })

    // Create sync log entry
    const [syncLog] = await db
      .insert(syncLogs)
      .values({
        userId,
        integrationId,
        provider,
        status: 'in_progress',
        totalContacts: 0,
        successCount: 0,
        errorCount: 0,
        skippedCount: 0,
        updatedCount: 0,
        startedAt: new Date(),
      })
      .returning()

    try {
      // Update job progress - fetching stage
      await job.updateProgress({
        stage: 'fetching',
        totalContacts: 0,
        processedContacts: 0,
        createdCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        errorCount: 0,
        percentage: 0,
      } satisfies SyncJobProgress)

      // Fetch all contacts from HubSpot with progress tracking
      const hubspotContacts = await hubspotService.fetchContactsWithProgress(
        userId,
        (current, total) => {
          job.updateProgress({
            stage: 'fetching',
            totalContacts: total || 0,
            processedContacts: current,
            createdCount: 0,
            updatedCount: 0,
            skippedCount: 0,
            errorCount: 0,
            percentage: total ? Math.round((current / total) * 30) : 0, // Fetching is 30% of total
          } satisfies SyncJobProgress)
        },
        options.batchSize,
      )

      // Update sync log with total contacts
      await db
        .update(syncLogs)
        .set({ totalContacts: hubspotContacts.length })
        .where(eq(syncLogs.id, syncLog.id))

      // Update job progress - mapping stage
      await job.updateProgress({
        stage: 'mapping',
        totalContacts: hubspotContacts.length,
        processedContacts: hubspotContacts.length,
        createdCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        errorCount: 0,
        percentage: 40, // Mapping is quick, 40% done
      } satisfies SyncJobProgress)

      // Map HubSpot contacts to our schema
      const mappedContacts = mapHubSpotContactsBatch(hubspotContacts)

      // Update job progress - syncing stage
      await job.updateProgress({
        stage: 'syncing',
        totalContacts: mappedContacts.length,
        processedContacts: 0,
        createdCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        errorCount: 0,
        percentage: 50, // Starting sync at 50%
      } satisfies SyncJobProgress)

      // Sync contacts to database with progress tracking
      const syncResult = await syncContactsBatch(
        mappedContacts,
        {
          userId,
          provider,
          updateExisting: options.updateExisting ?? true,
          onlyNew: options.onlyNew ?? false,
        },
        (current, total) => {
          const basePercentage = 50
          const syncPercentage = Math.round((current / total) * 45) // Sync is 45% (50-95%)
          job.updateProgress({
            stage: 'syncing',
            totalContacts: total,
            processedContacts: current,
            createdCount: 0, // Will be updated after sync completes
            updatedCount: 0,
            skippedCount: 0,
            errorCount: 0,
            percentage: basePercentage + syncPercentage,
          } satisfies SyncJobProgress)
        },
      )

      // Extract errors for logging
      const errors = syncResult.results
        .filter((r) => !r.success)
        .map((r) => ({
          email: r.email,
          error: r.error || 'Unknown error',
        }))

      // Update sync log with final results
      await db
        .update(syncLogs)
        .set({
          status: errors.length > 0 ? 'partial' : 'completed',
          successCount: syncResult.created + syncResult.updated,
          errorCount: syncResult.errors,
          skippedCount: syncResult.skipped,
          updatedCount: syncResult.updated,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
          completedAt: new Date(),
        })
        .where(eq(syncLogs.id, syncLog.id))

      // Update integration's last synced timestamp and sync status
      await db
        .update(crmIntegrations)
        .set({
          lastSyncedAt: new Date(),
          syncStatus: 'completed',
          syncStartedAt: null,
        })
        .where(eq(crmIntegrations.id, integrationId))

      // Final progress update
      await job.updateProgress({
        stage: 'completed',
        totalContacts: syncResult.total,
        processedContacts: syncResult.total,
        createdCount: syncResult.created,
        updatedCount: syncResult.updated,
        skippedCount: syncResult.skipped,
        errorCount: syncResult.errors,
        percentage: 100,
      } satisfies SyncJobProgress)

      // Log sync completed
      const duration = Date.now() - startTime
      crmLogger.syncCompleted({
        posthogDistinctId: userId,
        provider: 'hubspot',
        job_id: job.id,
        stage: 'completed',
        total_contacts: syncResult.total,
        created_count: syncResult.created,
        updated_count: syncResult.updated,
        skipped_count: syncResult.skipped,
        error_count: syncResult.errors,
        duration_ms: duration,
      })

      // Create success notification
      const [createdNotification] = await db
        .insert(notifications)
        .values({
          userId,
          type: 'crm_sync_completed',
          title: 'CRM Sync Completed',
          message: `Successfully synced ${syncResult.created + syncResult.updated} contacts from ${provider === 'hubspot' ? 'HubSpot' : provider}`,
          metadata: JSON.stringify({
            provider,
            syncLogId: syncLog.id,
            integrationId,
            totalContacts: syncResult.total,
            createdCount: syncResult.created,
            updatedCount: syncResult.updated,
            errorCount: syncResult.errors,
            skippedCount: syncResult.skipped,
          }),
        })
        .returning()

      // Publish notification event to Redis for cross-process SSE broadcast
      if (createdNotification) {
        const publishNotificationEvent = await getPublishNotificationEvent()
        await publishNotificationEvent('notification:created', {
          userId,
          notification: {
            ...createdNotification,
            parsedMetadata: {
              provider,
              syncLogId: syncLog.id,
              integrationId,
              totalContacts: syncResult.total,
              createdCount: syncResult.created,
              updatedCount: syncResult.updated,
              errorCount: syncResult.errors,
              skippedCount: syncResult.skipped,
            },
          },
        })
      }

      return {
        success: true,
        syncLogId: syncLog.id,
        totalContacts: syncResult.total,
        createdCount: syncResult.created,
        updatedCount: syncResult.updated,
        skippedCount: syncResult.skipped,
        errorCount: syncResult.errors,
        errors: errors.length > 0 ? errors : undefined,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      // Log sync failure
      errorLogger.externalApi({
        posthogDistinctId: userId,
        error_type: 'crm_sync_failed',
        error_message: errorMessage,
        stack_trace: error instanceof Error ? error.stack : undefined,
        context: {
          provider,
          jobId: job.id,
          integrationId,
        },
      })

      // Update sync log with error
      await db
        .update(syncLogs)
        .set({
          status: 'failed',
          errors: JSON.stringify([{ error: errorMessage }]),
          completedAt: new Date(),
        })
        .where(eq(syncLogs.id, syncLog.id))

      // Update integration sync status to failed
      await db
        .update(crmIntegrations)
        .set({
          syncStatus: 'failed',
          lastSyncError: errorMessage,
          syncStartedAt: null,
        })
        .where(eq(crmIntegrations.id, integrationId))

      // Send failure notification email to user
      try {
        const userRecord = await db.query.user.findFirst({
          where: eq(user.id, userId),
        })

        if (userRecord?.email && userRecord?.name) {
          await sendCRMSyncFailureEmailDirect({
            to: userRecord.email,
            userName: userRecord.name,
            provider: provider,
            errorMessage,
            syncStartedAt: syncLog.startedAt.toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
            crmIntegrationsUrl: `${process.env.VITE_APP_URL}/crm-integrations`,
          })
        }
      } catch (emailError) {
        // Log email error but don't fail the job
        console.error('Failed to send sync failure email:', emailError)
      }

      // Create failure notification
      try {
        await db.insert(notifications).values({
          userId,
          type: 'crm_sync_failed',
          title: 'CRM Sync Failed',
          message: `Failed to sync contacts from ${provider === 'hubspot' ? 'HubSpot' : provider}: ${errorMessage}`,
          metadata: JSON.stringify({
            provider,
            syncLogId: syncLog.id,
            integrationId,
            errorMessage,
          }),
        })
      } catch (notificationError) {
        // Log notification error but don't fail the job
        console.error(
          'Failed to create sync failure notification:',
          notificationError,
        )
      }

      throw error
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Process 2 sync jobs concurrently
  },
)

/**
 * Adds a HubSpot sync job to the queue
 *
 * @param data - Job data
 * @returns Job instance
 */
export async function queueHubSpotSync(data: HubSpotSyncJobData) {
  return hubspotSyncQueue.add('sync-contacts', data, {
    jobId: `hubspot-sync-${data.userId}-${Date.now()}`,
  })
}

/**
 * Gets the status of a sync job
 *
 * @param jobId - Job ID
 * @returns Job instance or null
 */
export async function getSyncJobStatus(jobId: string) {
  return hubspotSyncQueue.getJob(jobId)
}

/**
 * Gets all sync jobs for a user
 *
 * @param userId - User ID
 * @returns Array of jobs
 */
export async function getUserSyncJobs(userId: string) {
  const jobs = await hubspotSyncQueue.getJobs([
    'active',
    'waiting',
    'completed',
    'failed',
  ])

  return jobs.filter((job) => job.data.userId === userId)
}

/**
 * Cancels a sync job
 *
 * @param jobId - Job ID
 * @returns True if cancelled successfully
 */
export async function cancelSyncJob(jobId: string) {
  const job = await hubspotSyncQueue.getJob(jobId)
  if (job) {
    await job.remove()
    return true
  }
  return false
}

/**
 * Cleans up old completed and failed jobs
 *
 * @param grace - Grace period in milliseconds (default: 24 hours)
 */
export async function cleanupOldJobs(grace = 24 * 60 * 60 * 1000) {
  await hubspotSyncQueue.clean(grace, 100, 'completed')
  await hubspotSyncQueue.clean(grace * 7, 100, 'failed') // Keep failed jobs longer
}

/**
 * Gets queue metrics
 */
export async function getQueueMetrics() {
  const [waiting, active, completed, failed] = await Promise.all([
    hubspotSyncQueue.getWaitingCount(),
    hubspotSyncQueue.getActiveCount(),
    hubspotSyncQueue.getCompletedCount(),
    hubspotSyncQueue.getFailedCount(),
  ])

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed,
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await hubspotSyncWorker.close()
  await hubspotSyncQueue.close()
  await redisConnection.quit()
})

// Made with Bob
