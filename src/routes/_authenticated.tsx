import { createFileRoute, Outlet } from '@tanstack/react-router'
import { authMiddleware } from '@/lib/auth-middleware'
import { Suspense } from 'react'
import { RoutePendingComponent } from '@/components/shared/common'
import PostLoginLayout from '@/components/layouts/PostLoginLayout'
import PageContainer from '@/components/template/PageContainer'
import { useThemeStore } from '@/store/themeStore'
import { useSession } from '@/lib/auth-client'

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
