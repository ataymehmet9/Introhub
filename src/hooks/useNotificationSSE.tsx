import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { NotificationWithMetadata } from '@/schemas'
import { useTRPC } from '@/integrations/trpc/react'

/**
 * SSE connection status
 */
export type SSEConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

/**
 * SSE event data types
 */
interface NotificationEventData {
  action: 'created' | 'read' | 'deleted' | 'all-read'
  notification?: NotificationWithMetadata
  notificationId?: number
}

interface HeartbeatEventData {
  timestamp: number
}

interface ConnectedEventData {
  message: string
  timestamp: number
}

// Exponential backoff delays (in milliseconds): 1s, 2s, 4s, 8s, 16s, 30s (max)
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]

/**
 * Hook to manage SSE connection for real-time notifications.
 *
 * Key behaviours:
 * - Stops reconnecting on 401 (unauthenticated) to prevent log spam.
 * - Disconnects when the page is hidden and reconnects when it becomes visible.
 * - Closes the connection on beforeunload so the server cleans up immediately.
 * - Uses exponential backoff for transient errors.
 */
export function useNotificationSSE() {
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCountRef = useRef(0)
  // Tracks whether we should attempt reconnection at all (set to false on 401)
  const shouldReconnectRef = useRef(true)
  const [connectionStatus, setConnectionStatus] =
    useState<SSEConnectionStatus>('disconnected')

  // Query keys for cache invalidation — must match the keys used in useNotifications
  const notificationsQueryKey = trpc.notifications.list.queryKey({
    unreadOnly: false,
  })
  const unreadCountQueryKey = trpc.notifications.getUnreadCount.queryKey()

  // Introduction requests query key - for invalidating when new requests arrive
  const introductionRequestsQueryKey =
    trpc.introductionRequests.listByUser.queryKey()

  // ─── Cache update helpers ────────────────────────────────────────────────

  const handleNotificationCreated = useCallback(
    (notification: NotificationWithMetadata) => {
      queryClient.setQueryData(notificationsQueryKey, (oldData: any) => {
        if (!oldData) {
          return {
            data: [notification],
            pagination: {
              page: 1,
              pageSize: 50,
              totalItems: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          }
        }
        const newData = [notification, ...oldData.data]
        return {
          ...oldData,
          data: newData,
          pagination: {
            ...oldData.pagination,
            totalItems: oldData.pagination.totalItems + 1,
            totalPages: Math.ceil(
              (oldData.pagination.totalItems + 1) / oldData.pagination.pageSize,
            ),
          },
        }
      })

      if (!notification.read) {
        queryClient.setQueryData(
          unreadCountQueryKey,
          (oldData: { count: number; hasUnread: boolean } | undefined) => {
            const currentCount = oldData?.count || 0
            return { count: currentCount + 1, hasUnread: true }
          },
        )
      }

      // Invalidate introduction requests cache when a new introduction request notification arrives
      // This ensures the requests page shows new requests immediately
      if (notification.type === 'introduction_request') {
        queryClient.invalidateQueries({
          queryKey: introductionRequestsQueryKey,
          refetchType: 'active', // Only refetch if the query is currently being used
        })
      }
    },
    [
      queryClient,
      notificationsQueryKey,
      unreadCountQueryKey,
      introductionRequestsQueryKey,
    ],
  )

  const handleNotificationRead = useCallback(
    (notificationId: number) => {
      queryClient.setQueryData(notificationsQueryKey, (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          data: oldData.data.map((n: NotificationWithMetadata) =>
            n.id === notificationId ? { ...n, read: true } : n,
          ),
        }
      })

      queryClient.setQueryData(
        unreadCountQueryKey,
        (oldData: { count: number; hasUnread: boolean } | undefined) => {
          const currentCount = oldData?.count || 0
          const newCount = Math.max(0, currentCount - 1)
          return { count: newCount, hasUnread: newCount > 0 }
        },
      )

      // Invalidate introduction requests when approval/decline notifications are read
      // This ensures the requests list reflects the updated status
      const notification = queryClient
        .getQueryData<any>(notificationsQueryKey)
        ?.data?.find((n: NotificationWithMetadata) => n.id === notificationId)
      if (
        notification?.type === 'introduction_approved' ||
        notification?.type === 'introduction_declined'
      ) {
        queryClient.invalidateQueries({
          queryKey: introductionRequestsQueryKey,
          refetchType: 'active',
        })
      }
    },
    [
      queryClient,
      notificationsQueryKey,
      unreadCountQueryKey,
      introductionRequestsQueryKey,
    ],
  )

  const handleNotificationDeleted = useCallback(
    (notificationId: number) => {
      const currentData = queryClient.getQueryData<any>(notificationsQueryKey)
      const deletedNotification = currentData?.data?.find(
        (n: NotificationWithMetadata) => n.id === notificationId,
      )

      queryClient.setQueryData(notificationsQueryKey, (oldData: any) => {
        if (!oldData) return oldData
        const newData = oldData.data.filter(
          (n: NotificationWithMetadata) => n.id !== notificationId,
        )
        return {
          ...oldData,
          data: newData,
          pagination: {
            ...oldData.pagination,
            totalItems: Math.max(0, oldData.pagination.totalItems - 1),
            totalPages: Math.ceil(
              Math.max(0, oldData.pagination.totalItems - 1) /
                oldData.pagination.pageSize,
            ),
          },
        }
      })

      if (deletedNotification && !deletedNotification.read) {
        queryClient.setQueryData(
          unreadCountQueryKey,
          (oldData: { count: number; hasUnread: boolean } | undefined) => {
            const currentCount = oldData?.count || 0
            const newCount = Math.max(0, currentCount - 1)
            return { count: newCount, hasUnread: newCount > 0 }
          },
        )
      }
    },
    [queryClient, notificationsQueryKey, unreadCountQueryKey],
  )

  const handleAllRead = useCallback(() => {
    queryClient.setQueryData(notificationsQueryKey, (oldData: any) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        data: oldData.data.map((n: NotificationWithMetadata) => ({
          ...n,
          read: true,
        })),
      }
    })
    queryClient.setQueryData(unreadCountQueryKey, {
      count: 0,
      hasUnread: false,
    })
  }, [queryClient, notificationsQueryKey, unreadCountQueryKey])

  // ─── Connection management ───────────────────────────────────────────────

  /**
   * Tear down the current EventSource without scheduling a reconnect.
   */
  const closeEventSource = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  /**
   * Fully disconnect and prevent any future reconnection attempts.
   */
  const disconnect = useCallback(() => {
    console.log('[SSE] Disconnecting...')
    shouldReconnectRef.current = false
    closeEventSource()
    setConnectionStatus('disconnected')
    retryCountRef.current = 0
  }, [closeEventSource])

  /**
   * Connect to the SSE endpoint.
   * Will not create a second connection if one already exists.
   */
  const connect = useCallback(() => {
    // Don't create multiple connections
    if (eventSourceRef.current) return

    // Don't reconnect if we've been told not to (e.g. after a 401)
    if (!shouldReconnectRef.current) return

    console.log('[SSE] Connecting to notification stream...')
    setConnectionStatus('connecting')

    try {
      const eventSource = new EventSource('/api/notifications/stream', {
        withCredentials: true,
      })

      eventSourceRef.current = eventSource

      eventSource.addEventListener('open', () => {
        console.log('[SSE] Connection opened')
        setConnectionStatus('connected')
        retryCountRef.current = 0
      })

      eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data) as ConnectedEventData
        console.log('[SSE] Connected:', data.message)
      })

      eventSource.addEventListener('heartbeat', (event) => {
        const data = JSON.parse(event.data) as HeartbeatEventData
        console.log('[SSE] Heartbeat received:', new Date(data.timestamp))
      })

      eventSource.addEventListener('notification', (event) => {
        const data = JSON.parse(event.data) as NotificationEventData

        switch (data.action) {
          case 'created':
            if (data.notification) handleNotificationCreated(data.notification)
            break
          case 'read':
            if (data.notificationId) handleNotificationRead(data.notificationId)
            break
          case 'deleted':
            if (data.notificationId)
              handleNotificationDeleted(data.notificationId)
            break
          case 'all-read':
            handleAllRead()
            break
        }
      })

      eventSource.addEventListener('error', async () => {
        // EventSource doesn't expose the HTTP status directly, but when the
        // server returns a non-2xx response the readyState goes to CLOSED
        // immediately without ever reaching OPEN. We detect a 401 by probing
        // the endpoint with fetch so we can stop the reconnect loop.
        const wasEverOpen = eventSource.readyState !== EventSource.CLOSED

        closeEventSource()

        if (!wasEverOpen) {
          // Connection was never established — check if it's a 401
          try {
            const probe = await fetch('/api/notifications/stream', {
              method: 'GET',
              credentials: 'include',
              headers: { Accept: 'text/event-stream' },
              signal: AbortSignal.timeout(5000),
            })

            if (probe.status === 401) {
              console.warn(
                '[SSE] Received 401 — stopping reconnection attempts. User may have logged out.',
              )
              shouldReconnectRef.current = false
              setConnectionStatus('error')
              // Abort the probe body so we don't hold the connection open
              probe.body?.cancel()
              return
            }

            // Abort the probe body regardless — we only needed the status
            probe.body?.cancel()
          } catch {
            // Probe failed (network error, timeout) — fall through to normal retry
          }
        }

        setConnectionStatus('error')

        if (!shouldReconnectRef.current) return

        const delay =
          RETRY_DELAYS[Math.min(retryCountRef.current, RETRY_DELAYS.length - 1)]
        console.log(
          `[SSE] Reconnecting in ${delay}ms (attempt ${retryCountRef.current + 1})`,
        )

        reconnectTimeoutRef.current = setTimeout(() => {
          retryCountRef.current++
          connect()
        }, delay)
      })
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error)
      setConnectionStatus('error')
    }
  }, [
    closeEventSource,
    handleNotificationCreated,
    handleNotificationRead,
    handleNotificationDeleted,
    handleAllRead,
  ])

  // ─── Lifecycle effects ───────────────────────────────────────────────────

  useEffect(() => {
    if (!window.EventSource) {
      console.warn('[SSE] EventSource not supported in this browser')
      setConnectionStatus('error')
      return
    }

    shouldReconnectRef.current = true
    connect()

    // Disconnect when the page is hidden (tab switch, minimise) and reconnect
    // when it becomes visible again. This prevents stale connections from
    // accumulating on the server.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('[SSE] Page hidden — closing connection')
        closeEventSource()
        setConnectionStatus('disconnected')
      } else if (document.visibilityState === 'visible') {
        console.log('[SSE] Page visible — reconnecting')
        if (shouldReconnectRef.current) {
          retryCountRef.current = 0
          connect()
        }
      }
    }

    // Close the connection immediately when the user closes the tab or
    // navigates away so the server can clean up without waiting for a timeout.
    const handleBeforeUnload = () => {
      closeEventSource()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps — only run on mount/unmount

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    isDisconnected: connectionStatus === 'disconnected',
    hasError: connectionStatus === 'error',
    reconnect: connect,
    disconnect,
  }
}

// Made with Bob
