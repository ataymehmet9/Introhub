import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import SettingsNotificationAction from './-components/notifications/SettingsNotificationAction'
import SettingsNotifications from './-components/notifications/SettingsNotifications'
import { AdaptiveCard } from '@/components/shared'
import { useNotifications } from '@/hooks/useNotifications'
import { notificationSearchSchema } from '@/schemas'
import { createServerCaller } from '@/integrations/trpc/server-context'

// Server function to fetch first page of notifications
const getNotificationsData = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { page: number; pageSize: number; unreadOnly: boolean }) => data,
  )
  .handler(async ({ data }) => {
    const caller = await createServerCaller()

    const notifications = await caller.notifications.list({
      page: data.page,
      pageSize: data.pageSize,
      unreadOnly: data.unreadOnly,
    })

    return { notifications }
  })

export const Route = createFileRoute('/_authenticated/(user)/me/notifications')(
  {
    validateSearch: notificationSearchSchema,
    loader: async ({ location }) => {
      const search = notificationSearchSchema.parse(location.search)
      // Fetch first page on server
      return await getNotificationsData({
        data: {
          page: 1,
          pageSize: search.c ?? 10,
          unreadOnly: search.unreadOnly ?? false,
        },
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
  const loaderData = Route.useLoaderData()

  // Only use initial data if the filter matches what was loaded on the server
  const shouldUseInitialData = (searchParams.unreadOnly ?? false) === false

  const {
    notifications,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    markAsRead,
  } = useNotifications({
    pageSize: searchParams.c ?? 10,
    unreadOnly: searchParams.unreadOnly ?? false,
    initialData: shouldUseInitialData ? loaderData?.notifications : undefined,
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

// Made with Bob
