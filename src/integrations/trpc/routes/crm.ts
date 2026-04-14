import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { createTRPCRouter, protectedProcedure } from '../init'
import { crmIntegrations } from '@/db/schema'

export const crmRouter = createTRPCRouter({
  // Get all CRM integrations for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const integrations = await ctx.db.query.crmIntegrations.findMany({
      where: eq(crmIntegrations.userId, ctx.user!.id),
      orderBy: (integrations, { desc }) => [desc(integrations.connectedAt)],
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
        throw new Error('Integration not found')
      }

      // Delete the integration
      await ctx.db
        .delete(crmIntegrations)
        .where(eq(crmIntegrations.id, integration.id))

      // TODO: If deleteContacts is true, delete all contacts with this CRM source
      // This will be implemented in Phase 8

      return { success: true }
    }),
})

// Made with Bob
