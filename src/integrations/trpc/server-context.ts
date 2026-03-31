import { getRequestHeaders } from '@tanstack/react-start/server'
import { createContextFromHeaders } from './init'
import { trpcRouter } from './router'

/**
 * Creates a TRPC caller for server-side operations (SSR loaders, server functions)
 *
 * This reuses the same context creation logic as the HTTP adapter,
 * ensuring consistency between client-side TRPC calls and server-side direct calls.
 *
 * @returns TRPC caller with authenticated context
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * const getData = createServerFn({ method: 'GET' }).handler(async () => {
 *   const caller = await createServerCaller()
 *   return await caller.dashboard.getStats({ ... })
 * })
 * ```
 */
export async function createServerCaller() {
  const headers = getRequestHeaders()
  const context = await createContextFromHeaders(headers)

  if (!context.user) {
    throw new Error('Unauthorized')
  }

  return trpcRouter.createCaller(context)
}

// Made with Bob
