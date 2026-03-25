import Loading from '@/components/shared/Loading'

/**
 * Reusable pending component for route transitions
 * Shows a full-screen loading indicator
 */
export function RoutePendingComponent() {
  return (
    <div className="flex flex-auto flex-col h-[100vh]">
      <Loading loading={true} />
    </div>
  )
}
