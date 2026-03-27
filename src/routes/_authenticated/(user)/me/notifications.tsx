import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import SettingsNotificationAction from './-components/notifications/SettingsNotificationAction'
import SettingsNotifications from './-components/notifications/SettingsNotifications'
import { AdaptiveCard } from '@/components/shared'
import { useNotifications } from '@/hooks/useNotifications'
import { notificationSearchSchema } from '@/schemas'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

export const Route = createFileRoute('/_authenticated/(user)/me/notifications')(
  {
    validateSearch: notificationSearchSchema,
    loader: async ({ context, location }) => {
      const search = notificationSearchSchema.parse(location.search)
      // Prefetch first page for infinite query
      await context.queryClient.prefetchInfiniteQuery({
        queryKey: [
          'notifications',
          'list',
          { pageSize: search.c, unreadOnly: search.unreadOnly },
        ],
        queryFn: async () => {
          return trpcClient.notifications.list.query({
            page: 1,
            pageSize: search.c,
            unreadOnly: search.unreadOnly,
          })
        },
        initialPageParam: 1,
      })
    },
    component: RouteComponent,
  },
)

function RouteComponent() {
  const searchParams = useSearch({
    from: '/_authenticated/(user)/me/notifications',
  })
  const navigate = useNavigate()

  const {
    notifications,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    markAsRead,
  } = useNotifications({
    pageSize: searchParams.c,
    unreadOnly: searchParams.unreadOnly,
  })

  const handleFilterChange = (unreadOnly: boolean) => {
    navigate({
      to: '/me/notifications',
      search: { ...searchParams, unreadOnly },
      replace: true,
    })
  }

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id)
  }

  return (
    <AdaptiveCard>
      <div className="mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h4>Notifications</h4>
          <SettingsNotificationAction
            showUnreadOnly={searchParams.unreadOnly}
            onFilterChange={handleFilterChange}
          />
        </div>
        <div style={{ opacity: isFetchingNextPage ? 0.5 : 1 }}>
          <SettingsNotifications
            isLoading={isLoading}
            loadable={hasNextPage}
            notifications={notifications}
            onLoadMore={handleLoadMore}
            onMarkAsRead={handleMarkAsRead}
          />
        </div>
      </div>
    </AdaptiveCard>
  )
}
