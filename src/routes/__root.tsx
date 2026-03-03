import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { PostHogProvider } from '@posthog/react'

import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'
import type { TRPCRouter } from '@/integrations/trpc/router'
import type { QueryClient } from '@tanstack/react-query'
import Theme from '@/components/template/Theme'
import { RouteTransition } from '@/components/shared/RouteTransition'

import TanStackQueryDevtools from '@/integrations/tanstack-query/devtools'

// Import CSS directly so Vite can inline it during SSR to prevent FOUC
import '../index.css'


import { DefaultCatchBoundary } from '@/components/DefaultCatchBoundary'
import { NotFound } from '@/components/NotFound'

interface MyRouterContext {
  queryClient: QueryClient

  trpc: TRPCOptionsProxy<TRPCRouter>
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'IntroHub - Professional Introduction Management',
      },
      {
        name: 'description',
        content:
          'Manage your professional network and introductions efficiently',
      },
    ],
    // CSS is now imported directly above, no need for links array
  }),

  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <PostHogProvider
          apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
          options={{
            api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
            defaults: import.meta.env.VITE_PUBLIC_POSTHOG_DEFAULTS,
            capture_exceptions: true,
          }}
        >
          <Theme>
            <RouteTransition />
            {children}
          </Theme>
        </PostHogProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
