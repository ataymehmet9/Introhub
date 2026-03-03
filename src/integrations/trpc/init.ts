import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { auth } from '@/lib/auth'
import type { CreateNextContextOptions } from '@trpc/server/adapters/next'
import { TRPCError } from '@trpc/server'
import { db } from '@/db'
import { posthogMiddleware } from './middleware/posthog'

export const createContext = async ({ req }: CreateNextContextOptions) => {
  const { session, user } =
    (await auth.api.getSession({
      headers: req.headers,
    })) ?? {}
  return {
    db,
    session,
    user,
  }
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
