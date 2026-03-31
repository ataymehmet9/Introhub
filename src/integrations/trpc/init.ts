import { TRPCError, initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { posthogMiddleware } from './middleware/posthog'
import type { CreateNextContextOptions } from '@trpc/server/adapters/next'
import { auth } from '@/lib/auth'
import { db } from '@/db'

/**
 * Creates TRPC context from request headers
 * Used by both HTTP adapter and direct server-side calls
 */
export async function createContextFromHeaders(headers: Headers) {
  const { session, user } = (await auth.api.getSession({ headers })) ?? {}
  return {
    db,
    session,
    user,
  }
}

/**
 * HTTP adapter context creator (for client-side TRPC calls)
 */
export const createContext = async ({ req }: CreateNextContextOptions) => {
  return createContextFromHeaders(req.headers)
}

const t = initTRPC.context<typeof createContext>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router

// Apply PostHog middleware to all procedures
export const publicProcedure = t.procedure.use(posthogMiddleware)

export const protectedProcedure = t.procedure
  .use(posthogMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next()
  })
