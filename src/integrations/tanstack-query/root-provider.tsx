import { QueryClient } from '@tanstack/react-query'
import superjson from 'superjson'
import { createTRPCClient, httpBatchStreamLink } from '@trpc/client'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'

import type { TRPCRouter } from '@/integrations/trpc/router'

import { TRPCProvider } from '@/integrations/trpc/react'

/**
 * Check if an error is an AbortError
 * AbortErrors occur when requests are cancelled (e.g., user navigates away)
 * These are expected and should not be logged to error tracking services
 */
function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'AbortError' ||
      error.message.includes('aborted') ||
      error.message.includes('cancelled')
    )
  }
  return false
}

function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return ''
    return `http://localhost:${process.env.PORT ?? 3000}`
  })()
  return `${base}/api/trpc`
}

export const trpcClient = createTRPCClient<TRPCRouter>({
  links: [
    httpBatchStreamLink({
      transformer: superjson,
      url: getUrl(),
    }),
  ],
})

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
      queries: {
        // Retry configuration - don't retry on AbortErrors
        retry: (failureCount, error) => {
          // Don't retry AbortErrors
          if (isAbortError(error)) {
            return false
          }
          // Retry up to 3 times for other errors
          return failureCount < 3
        },
        // Stale time to reduce unnecessary refetches
        staleTime: 1000 * 60, // 1 minute
      },
      mutations: {
        // Don't retry mutations on AbortErrors
        retry: (failureCount, error) => {
          if (isAbortError(error)) {
            return false
          }
          return failureCount < 1
        },
      },
    },
  })

  // Add global error handler to filter out AbortErrors from error tracking
  queryClient.getQueryCache().config.onError = (error) => {
    if (!isAbortError(error)) {
      // Only log non-abort errors
      console.error('Query error:', error)
    }
  }

  queryClient.getMutationCache().config.onError = (error) => {
    if (!isAbortError(error)) {
      // Only log non-abort errors
      console.error('Mutation error:', error)
    }
  }

  const serverHelpers = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient: queryClient,
  })
  return {
    queryClient,
    trpc: serverHelpers,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      {children}
    </TRPCProvider>
  )
}
