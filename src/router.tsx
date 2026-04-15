import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { DefaultCatchBoundary } from './components/DefaultCatchBoundary'
import { NotFound } from './components/NotFound'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
  const rqContext = TanstackQuery.getContext()

  const router = createRouter({
    routeTree,
    context: {
      ...rqContext,
    },
    Wrap: ({ children }) => (
      <TanstackQuery.Provider queryClient={rqContext.queryClient}>
        {children}
      </TanstackQuery.Provider>
    ),
    defaultPreload: 'intent',
    defaultPreloadDelay: 100,
    scrollRestoration: true,
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    defaultPendingMs: 150,
    defaultPendingMinMs: 300,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient })

  if (!router.isServer) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [],
      tracesSampleRate: 1.0,
      sendDefaultPii: true,
    })
  } else {
    // Initialize Redis pub/sub bridge for cross-process notifications on server
    // This enables the BullMQ worker to send notifications to SSE connections
    // Lazy import to avoid bundling ioredis on client side
    import('./lib/notification-bridge')
      .then(({ initializeNotificationBridge }) => {
        return initializeNotificationBridge()
      })
      .catch((error) => {
        console.error('Failed to initialize notification bridge:', error)
      })
  }

  return router
}
