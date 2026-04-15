import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { GetNotifications } from '@/schemas'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { Notification, toast } from '@/components/ui'
import { useSession } from '@/lib/auth-client'

type UseNotificationsProps = Omit<GetNotifications, 'page'> & {
  enabled?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any
}

/**
 * Hook to manage notifications with real-time SSE updates
 * All server state is managed by TanStack Query cache
 * Uses infinite query for pagination support
 */
export function useNotifications(props?: UseNotificationsProps) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const {
    pageSize = 5,
    unreadOnly = false,
    enabled = true,
    initialData,
  } = props || {}

  // CRITICAL: Include userId in query keys to prevent cross-user cache pollution
  // Memoize to prevent infinite re-renders
  const notificationsQueryKey = useMemo(
    () => [
      'notifications',
      'list',
      { pageSize, unreadOnly, userId: currentUserId },
    ],
    [pageSize, unreadOnly, currentUserId],
  )

  // Fetch notifications list with infinite query (no polling, updated via SSE)
  const {
    data,
    isFetching: isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: notificationsQueryKey,
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
    // Use SSR data as initial data for the first page
    initialData: initialData
      ? {
          pages: [initialData],
          pageParams: [1],
        }
      : undefined,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!currentUserId, // Only fetch if user is authenticated
  })

  // CRITICAL: Include userId in unread count query key to prevent cross-user cache pollution
  // Memoize to prevent infinite re-renders
  // NOTE: We use a static query key instead of trpc.notifications.getUnreadCount.queryKey()
  // because the trpc object changes on every render, causing infinite loops
  const unreadCountQueryKey = useMemo(
    () => [['notifications', 'getUnreadCount'], { userId: currentUserId }],
    [currentUserId],
  )

  // Extract and flatten notifications from all pages - memoized to prevent infinite loops
  const notifications = useMemo(
    () => (data ? data.pages.flatMap((page) => page.data) : []),
    [data],
  )

  // Get pagination info from the last page - memoized to prevent new object references
  const pagination = useMemo(() => {
    const lastPage = data ? data.pages[data.pages.length - 1] : undefined
    return lastPage?.pagination
  }, [data])

  // Fetch unread count (no polling, updated via SSE)
  // IMPORTANT: userId is included in query key to prevent cross-user data leaks
  // SECURITY: Only fetch if we have a current user
  const { data: unreadData } = useQuery({
    queryKey: unreadCountQueryKey,
    queryFn: () => trpcClient.notifications.getUnreadCount.query(),
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch to ensure fresh data for current user
    enabled: enabled && !!currentUserId, // Only fetch if user is authenticated
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
              data: page.data.map((notification) =>
                notification.id === id
                  ? { ...notification, read: true }
                  : notification,
              ),
            })),
          }
        },
      )

      // Optimistically update unread count
      queryClient.setQueryData(unreadCountQueryKey, (oldData: unknown) => {
        const data = oldData as
          | { count: number; hasUnread: boolean; userId?: string }
          | undefined
        const currentCount = data?.count || 0
        const newCount = Math.max(0, currentCount - 1)
        return {
          count: newCount,
          hasUnread: newCount > 0,
          userId: data?.userId || currentUserId || '',
        }
      })

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
              data: page.data.map((notification) => ({
                ...notification,
                read: true,
              })),
            })),
          }
        },
      )

      // Optimistically update unread count
      queryClient.setQueryData(unreadCountQueryKey, (oldData: unknown) => {
        const data = oldData as { userId?: string } | undefined
        return {
          count: 0,
          hasUnread: false,
          userId: data?.userId || currentUserId || '',
        }
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

  // Use refs to create stable callbacks and prevent infinite re-renders
  // Mutation objects are recreated on every render, so we can't use them as dependencies
  const markAsReadRef = useRef<(id: number) => void>(() => {})
  const markAllAsReadRef = useRef<() => void>(() => {})
  const deleteNotificationRef = useRef<(id: number) => void>(() => {})
  const deleteAllReadRef = useRef<() => void>(() => {})

  useEffect(() => {
    markAsReadRef.current = (id: number) => markAsReadMutation.mutate(id)
    markAllAsReadRef.current = () => markAllAsReadMutation.mutate()
    deleteNotificationRef.current = (id: number) =>
      deleteNotificationMutation.mutate(id)
    deleteAllReadRef.current = () => deleteAllReadMutation.mutate()
  })

  const markAsRead = useCallback(
    (id: number) => markAsReadRef.current?.(id),
    [],
  )
  const markAllAsRead = useCallback(() => markAllAsReadRef.current?.(), [])
  const deleteNotification = useCallback(
    (id: number) => deleteNotificationRef.current?.(id),
    [],
  )
  const deleteAllRead = useCallback(() => deleteAllReadRef.current?.(), [])

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
    queryClient.invalidateQueries({ queryKey: unreadCountQueryKey })
  }, [queryClient, notificationsQueryKey, unreadCountQueryKey])

  return useMemo(
    () => ({
      notifications,
      pagination,
      unreadCount: unreadData?.count || 0,
      hasUnread: unreadData?.hasUnread || false,
      isLoading,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAllRead,
      refetch,
    }),
    [
      notifications,
      pagination,
      unreadData?.count,
      unreadData?.hasUnread,
      isLoading,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAllRead,
      refetch,
    ],
  )
}
