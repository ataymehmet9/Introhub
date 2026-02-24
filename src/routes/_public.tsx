import { createFileRoute, Outlet } from '@tanstack/react-router'
import { publicMiddleware } from '@/lib/auth-middleware'
import { Suspense } from 'react'
import { RoutePendingComponent } from '@/components/shared/common'
import PreLoginLayout from '@/components/layouts/PreLoginLayout'

export const Route = createFileRoute('/_public')({
  component: RouteComponent,
  pendingComponent: RoutePendingComponent,
  server: {
    middleware: [publicMiddleware],
  },
})

function RouteComponent() {
  return (
    <Suspense fallback={<RoutePendingComponent />}>
      <PreLoginLayout>
        <Outlet />
      </PreLoginLayout>
    </Suspense>
  )
}
