import { useMemo } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { GetNotifications } from '@/schemas'
import { useTRPC } from '@/integrations/trpc/react'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { Notification, toast } from '@/components/ui'

type UseNotificationsProps = Omit<GetNotifications, 'page'> & {
  enabled?: boolean
}

/**
 * Hook to manage notifications with real-time SSE updates
 * All server state is managed by TanStack Query cache
 * Uses infinite query for pagination support
 */
export function useNotifications(props?: UseNotificationsProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { pageSize = 5, unreadOnly = false, enabled = true } = props || {}

  // Fetch notifications list with infinite query (no polling, updated via SSE)
  const {
    data,
    isFetching: isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications', 'list', { pageSize, unreadOnly }],
    queryFn: async ({ pageParam = 1 }) => {
      return trpcClient.notifications.list.query({
        page: pageParam,
        pageSize,
        unreadOnly,
      })
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined
    },
    initialPageParam: 1,
    refetchOnWindowFocus: true,
    enabled,
  })

  // Get the actual query key being used by the query
  const notificationsQueryKey = [
    'notifications',
    'list',
    { pageSize, unreadOnly },
  ]

  const unreadCountQueryKey = trpc.notifications.getUnreadCount.queryKey()

  // Extract and flatten notifications from all pages - memoized to prevent infinite loops
  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.data) || [],
    [data?.pages],
  )

  // Get pagination info from the last page
  const lastPage = data?.pages[data.pages.length - 1]
  const pagination = lastPage?.pagination

  // Fetch unread count (no polling, updated via SSE)
  const { data: unreadData } = useQuery({
    ...trpc.notifications.getUnreadCount.queryOptions(),
    refetchOnWindowFocus: true,
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) =>
      trpcClient.notifications.markAsRead.mutate({ id }),
    onMutate: async (id) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey })
      await queryClient.cancelQueries({ queryKey: unreadCountQueryKey })

      // Snapshot the previous values for rollback
      const previousNotifications = queryClient.getQueryData(
        notificationsQueryKey,
      )
      const previousUnreadCount = queryClient.getQueryData(unreadCountQueryKey)

      // Optimistically update notifications list (infinite query structure)
      queryClient.setQueryData(
        notificationsQueryKey,
        (oldData: unknown): unknown => {
          if (!oldData || typeof oldData !== 'object' || !('pages' in oldData))
            return oldData
          const data = oldData as {
            pages: Array<{
              data: Array<{ id: number; read: boolean; [key: string]: unknown }>
              [key: string]: unknown
            }>
            [key: string]: unknown
          }
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              data: page.data.map((n) =>
                n.id === id ? { ...n, read: true } : n,
              ),
            })),
          }
        },
      )

      // Optimistically update unread count
      queryClient.setQueryData(
        unreadCountQueryKey,
        (oldData: { count: number; hasUnread: boolean } | undefined) => {
          const currentCount = oldData?.count || 0
          const newCount = Math.max(0, currentCount - 1)
          return {
            count: newCount,
            hasUnread: newCount > 0,
          }
        },
      )

      return { previousNotifications, previousUnreadCount }
    },
    onSuccess: () => {
      // After successful mutation, invalidate to sync with SSE updates
      // Use a small delay to allow SSE event to arrive first
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['notifications', 'list'],
          refetchType: 'active',
        })
      }, 100)
    },
    onError: (error: Error, _id, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationsQueryKey,
          context.previousNotifications,
        )
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          unreadCountQueryKey,
          context.previousUnreadCount,
        )
      }

      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to mark notification as read'}
        </Notification>,
      )
    },
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => trpcClient.notifications.markAllAsRead.mutate(),
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey })
      await queryClient.cancelQueries({ queryKey: unreadCountQueryKey })

      // Snapshot the previous values for rollback
      const previousNotifications = queryClient.getQueryData(
        notificationsQueryKey,
      )
      const previousUnreadCount = queryClient.getQueryData(unreadCountQueryKey)

      // Optimistically update notifications list (infinite query structure)
      queryClient.setQueryData(
        notificationsQueryKey,
        (oldData: unknown): unknown => {
          if (!oldData || typeof oldData !== 'object' || !('pages' in oldData))
            return oldData
          const data = oldData as {
            pages: Array<{
              data: Array<{ read: boolean; [key: string]: unknown }>
              [key: string]: unknown
            }>
            [key: string]: unknown
          }
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              data: page.data.map((n) => ({ ...n, read: true })),
            })),
          }
        },
      )

      // Optimistically update unread count
      queryClient.setQueryData(unreadCountQueryKey, {
        count: 0,
        hasUnread: false,
      })

      return { previousNotifications, previousUnreadCount }
    },
    onSuccess: () => {
      toast.push(
        <Notification type="success" title="Success">
          All notifications marked as read
        </Notification>,
      )

      // After successful mutation, invalidate to sync with SSE updates
      // Use a small delay to allow SSE event to arrive first
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['notifications', 'list'],
          refetchType: 'active',
        })
      }, 100)
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationsQueryKey,
          context.previousNotifications,
        )
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          unreadCountQueryKey,
          context.previousUnreadCount,
        )
      }

      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to mark all notifications as read'}
        </Notification>,
      )
    },
  })

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => trpcClient.notifications.delete.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
      queryClient.invalidateQueries({ queryKey: unreadCountQueryKey })
    },
    onError: (error: Error) => {
      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to delete notification'}
        </Notification>,
      )
    },
  })

  // Delete all read notifications mutation
  const deleteAllReadMutation = useMutation({
    mutationFn: () => trpcClient.notifications.deleteAllRead.mutate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
      toast.push(
        <Notification type="success" title="Success">
          All read notifications deleted
        </Notification>,
      )
    },
    onError: (error: Error) => {
      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to delete notifications'}
        </Notification>,
      )
    },
  })

  return {
    notifications,
    pagination,
    unreadCount: unreadData?.count || 0,
    hasUnread: unreadData?.hasUnread || false,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    markAsRead: (id: number) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id: number) => deleteNotificationMutation.mutate(id),
    deleteAllRead: () => deleteAllReadMutation.mutate(),
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
      queryClient.invalidateQueries({ queryKey: unreadCountQueryKey })
    },
  }
}
