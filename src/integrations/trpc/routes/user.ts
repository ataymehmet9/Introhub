import { TRPCRouterRecord, TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { updateUserSchema } from '@/schemas'
import { user as userDb } from '@/db/schema'
import { protectedProcedure } from '../init'
import { trackServerEvent } from '@/integrations/posthog'

export const userRouter = {
  update: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { user, db } = ctx

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      try {
        const response = await db
          .update(userDb)
          .set(input)
          .where(eq(userDb.id, user.id))
          .returning()

        trackServerEvent(user.id, 'user_profile_update_success', {
          updatedFields: Object.keys(input),
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })

        return { success: true, data: response[0] }
      } catch (error) {
        trackServerEvent(user.id, 'user_profile_update_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })
        throw error
      }
    }),
} satisfies TRPCRouterRecord
