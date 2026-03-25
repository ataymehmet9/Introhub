import { trackServerEvent } from '../../posthog'

/**
 * PostHog tracking middleware for tRPC
 * Tracks all tRPC procedure calls with user information
 */
export const posthogMiddleware = async (opts: {
  ctx: any
  next: () => Promise<any>
  path: string
  type: 'query' | 'mutation' | 'subscription'
}) => {
  const start = Date.now()
  const { ctx, path, type } = opts

  // Get user ID from context (if authenticated)
  const userId = ctx.user?.id
  const distinctId = userId || 'anonymous'

  try {
    // Execute the procedure
    const result = await opts.next()

    // Track successful procedure call
    const duration = Date.now() - start
    trackServerEvent(distinctId, 'trpc_procedure_call', {
      path,
      type,
      duration,
      success: true,
      userId: userId || null,
      userEmail: ctx.user?.email || null,
      timestamp: new Date().toISOString(),
    })

    return result
  } catch (error) {
    // Track failed procedure call
    const duration = Date.now() - start
    trackServerEvent(distinctId, 'trpc_procedure_error', {
      path,
      type,
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: userId || null,
      userEmail: ctx.user?.email || null,
      timestamp: new Date().toISOString(),
    })

    // Re-throw the error to maintain normal error handling
    throw error
  }
}
