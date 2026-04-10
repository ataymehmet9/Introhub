import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { authMiddleware } from '@/lib/auth-middleware'
import { RoutePendingComponent } from '@/components/shared/common'
import PostLoginLayout from '@/components/layouts/PostLoginLayout'
import PageContainer from '@/components/template/PageContainer'
import { useThemeStore } from '@/store/themeStore'
import { useSession } from '@/lib/auth-client'
import { usePostHogIdentify } from '@/hooks/usePostHogIdentify'
import { useClearCacheOnAuth } from '@/lib/auth-wrapper'

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
  pendingComponent: RoutePendingComponent,
  server: {
    middleware: [authMiddleware],
  },
  beforeLoad: async () => {
    // Ensure session is loaded before rendering layout
    // This prevents null user errors during SSR
  },
})

function RouteComponent() {
  const layoutType = useThemeStore((state) => state.layout.type)
  const { data: session, isPending } = useSession()

  // Clear cache on auth state changes (especially OAuth redirects)
  useClearCacheOnAuth()

  // Identify user in PostHog on session start
  usePostHogIdentify()

  // Show loading state while session is being fetched
  if (isPending || !session) {
    return <RoutePendingComponent />
  }

  return (
    <Suspense fallback={<RoutePendingComponent />}>
      <PostLoginLayout layoutType={layoutType}>
        <PageContainer>
          <Outlet />
        </PageContainer>
      </PostLoginLayout>
    </Suspense>
  )
}
