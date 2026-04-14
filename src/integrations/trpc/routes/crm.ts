import { z } from 'zod'
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../init'
import { contacts, crmIntegrations, syncLogs } from '@/db/schema'
import { queueHubSpotSync } from '@/services/sync-queue.service'

export const crmRouter = createTRPCRouter({
  // Get all CRM integrations for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const integrations = await ctx.db.query.crmIntegrations.findMany({
      where: eq(crmIntegrations.userId, ctx.user!.id),
      orderBy: (table, { desc }) => [desc(table.connectedAt)],
    })

    return integrations
  }),

  // Get a specific CRM integration
  get: protectedProcedure
    .input(
      z.object({
        provider: z.enum(['hubspot']),
      }),
    )
    .query(async ({ ctx, input }) => {
      const integration = await ctx.db.query.crmIntegrations.findFirst({
        where: and(
          eq(crmIntegrations.userId, ctx.user!.id),
          eq(crmIntegrations.provider, input.provider),
        ),
      })

      return integration
    }),

  // Update integration settings
  updateSettings: protectedProcedure
    .input(
      z.object({
        provider: z.enum(['hubspot']),
        syncFrequency: z.enum(['6h', '12h', '24h', 'weekly']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const integration = await ctx.db.query.crmIntegrations.findFirst({
        where: and(
          eq(crmIntegrations.userId, ctx.user!.id),
          eq(crmIntegrations.provider, input.provider),
        ),
      })

      if (!integration) {
        throw new Error('Integration not found')
      }

      await ctx.db
        .update(crmIntegrations)
        .set({
          syncFrequency: input.syncFrequency,
          updatedAt: new Date(),
        })
        .where(eq(crmIntegrations.id, integration.id))

      return { success: true }
    }),

  // Trigger manual sync
  syncNow: protectedProcedure
    .input(
      z.object({
        provider: z.enum(['hubspot']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const integration = await ctx.db.query.crmIntegrations.findFirst({
        where: and(
          eq(crmIntegrations.userId, ctx.user!.id),
          eq(crmIntegrations.provider, input.provider),
        ),
      })

      if (!integration) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Integration not found',
        })
      }

      // Check if integration is active
      if (integration.status !== 'active') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Integration is not active. Please reconnect.',
        })
      }

      // Check if a sync is already in progress
      if (integration.syncStatus === 'syncing') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A sync is already in progress for this integration',
        })
      }

      // Update integration status to syncing
      await ctx.db
        .update(crmIntegrations)
        .set({
          syncStatus: 'syncing',
          syncStartedAt: new Date(),
          lastSyncError: null,
          updatedAt: new Date(),
        })
        .where(eq(crmIntegrations.id, integration.id))

      // Queue the sync job
      const job = await queueHubSpotSync({
        userId: ctx.user!.id,
        integrationId: integration.id,
        provider: input.provider,
        options: {
          updateExisting: true,
          onlyNew: false,
        },
      })

      return {
        success: true,
        jobId: job.id,
        message: 'Sync started successfully',
      }
    }),

  // Get contact count for a CRM integration
  getContactCount: protectedProcedure
    .input(
      z.object({
        provider: z.enum(['hubspot']),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, ctx.user!.id),
            eq(contacts.source, input.provider),
          ),
        )

      return { count: result?.count || 0 }
    }),

  // Disconnect integration
  disconnect: protectedProcedure
    .input(
      z.object({
        provider: z.enum(['hubspot']),
        deleteContacts: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const integration = await ctx.db.query.crmIntegrations.findFirst({
        where: and(
          eq(crmIntegrations.userId, ctx.user!.id),
          eq(crmIntegrations.provider, input.provider),
        ),
      })

      if (!integration) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Integration not found',
        })
      }

      // If deleteContacts is true, delete all contacts from this CRM
      if (input.deleteContacts) {
        await ctx.db
          .delete(contacts)
          .where(
            and(
              eq(contacts.userId, ctx.user!.id),
              eq(contacts.source, input.provider),
            ),
          )
      }

      // Delete the integration
      await ctx.db
        .delete(crmIntegrations)
        .where(eq(crmIntegrations.id, integration.id))

      return { success: true }
    }),

  // Get sync analytics for dashboard
  getSyncAnalytics: protectedProcedure
    .input(
      z.object({
        provider: z.enum(['hubspot']).optional(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { provider, startDate, endDate } = input

      // Build where conditions
      const whereConditions = [
        eq(syncLogs.userId, ctx.user!.id),
        gte(syncLogs.startedAt, startDate),
        lte(syncLogs.startedAt, endDate),
      ]

      if (provider) {
        whereConditions.push(eq(syncLogs.provider, provider))
      }

      // Get all sync logs in the date range
      const logs = await ctx.db.query.syncLogs.findMany({
        where: and(...whereConditions),
        orderBy: [desc(syncLogs.startedAt)],
      })

      // Calculate metrics
      const totalSyncs = logs.length
      const completedSyncs = logs.filter(
        (log) => log.status === 'completed',
      ).length
      const failedSyncs = logs.filter((log) => log.status === 'failed').length
      const successRate =
        totalSyncs > 0 ? (completedSyncs / totalSyncs) * 100 : 0

      // Calculate average sync time (only for completed syncs)
      const completedLogsWithTime = logs.filter(
        (log) => log.status === 'completed' && log.completedAt && log.startedAt,
      )
      const avgSyncTimeMs =
        completedLogsWithTime.length > 0
          ? completedLogsWithTime.reduce((sum, log) => {
              const duration =
                log.completedAt!.getTime() - log.startedAt.getTime()
              return sum + duration
            }, 0) / completedLogsWithTime.length
          : 0

      // Format average sync time
      const avgSyncTimeSeconds = Math.round(avgSyncTimeMs / 1000)
      const avgSyncTimeFormatted =
        avgSyncTimeSeconds < 60
          ? `${avgSyncTimeSeconds}s`
          : `${Math.round(avgSyncTimeSeconds / 60)}m ${avgSyncTimeSeconds % 60}s`

      // Get last sync details
      const lastSync = logs[0] // Already ordered by startedAt desc
      let lastSyncStatus = null
      if (lastSync) {
        const timeSinceSync = Date.now() - lastSync.startedAt.getTime()
        const hoursAgo = Math.floor(timeSinceSync / (1000 * 60 * 60))
        const minutesAgo = Math.floor(
          (timeSinceSync % (1000 * 60 * 60)) / (1000 * 60),
        )

        const timeAgo =
          hoursAgo > 0
            ? `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`
            : `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`

        lastSyncStatus = {
          status: lastSync.status,
          timestamp: lastSync.startedAt,
          timeAgo,
          successCount: lastSync.successCount,
          errorCount: lastSync.errorCount,
          updatedCount: lastSync.updatedCount,
          skippedCount: lastSync.skippedCount,
        }
      }

      return {
        totalSyncs,
        successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
        avgSyncTime: avgSyncTimeMs,
        avgSyncTimeFormatted,
        lastSyncStatus,
        completedSyncs,
        failedSyncs,
      }
    }),
})

// Made with Bob
