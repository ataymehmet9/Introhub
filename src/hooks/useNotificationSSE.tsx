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

  // Query keys for cache invalidation
  const unreadCountQueryKey = trpc.notifications.getUnreadCount.queryKey()

  // Introduction requests query key - for invalidating when new requests arrive
  const introductionRequestsQueryKey =
    trpc.introductionRequests.listByUser.queryKey()

  // ─── Cache update helpers ────────────────────────────────────────────────
  // Instead of trying to update specific query keys, we invalidate ALL notification queries
  // This ensures consistency across the header dropdown and notifications page

  const handleNotificationCreated = useCallback(
    (notification: NotificationWithMetadata) => {
      // Update unread count optimistically
      if (!notification.read) {
        queryClient.setQueryData(
          unreadCountQueryKey,
          (
            oldData:
              | { count: number; hasUnread: boolean; userId: string }
              | undefined,
          ) => {
            const currentCount = oldData?.count || 0
            return {
              count: currentCount + 1,
              hasUnread: true,
              userId: oldData?.userId || '', // Preserve userId
            }
          },
        )
      }

      // Invalidate ALL notification list queries to refetch with new data
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'list'],
        refetchType: 'active',
      })

      // Invalidate introduction requests cache when a new introduction request notification arrives
      if (notification.type === 'introduction_request') {
        queryClient.invalidateQueries({
          queryKey: introductionRequestsQueryKey,
          refetchType: 'active',
        })
      }

      // Invalidate contacts cache when a CRM sync completes successfully
      if (notification.type === 'crm_sync_completed') {
        queryClient.invalidateQueries({
          predicate: (query) => {
            // Query key structure: [['contacts', 'list'], {...}]
            const firstKey = query.queryKey[0]
            return (
              Array.isArray(firstKey) &&
              firstKey[0] === 'contacts' &&
              firstKey[1] === 'list'
            )
          },
        })
      }
    },
    [queryClient, unreadCountQueryKey, introductionRequestsQueryKey],
  )

  const handleNotificationRead = useCallback(
    (_notificationId: number) => {
      // Update unread count optimistically
      queryClient.setQueryData(
        unreadCountQueryKey,
        (
          oldData:
            | { count: number; hasUnread: boolean; userId: string }
            | undefined,
        ) => {
          const currentCount = oldData?.count || 0
          const newCount = Math.max(0, currentCount - 1)
          return {
            count: newCount,
            hasUnread: newCount > 0,
            userId: oldData?.userId || '', // Preserve userId
          }
        },
      )

      // Invalidate ALL notification list queries to refetch with updated read status
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'list'],
        refetchType: 'active',
      })

      // Invalidate introduction requests when approval/decline notifications are read
      queryClient.invalidateQueries({
        queryKey: introductionRequestsQueryKey,
        refetchType: 'active',
      })
    },
    [queryClient, unreadCountQueryKey, introductionRequestsQueryKey],
  )

  const handleNotificationDeleted = useCallback(
    (_notificationId: number) => {
      // Invalidate ALL notification queries to refetch
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'list'],
        refetchType: 'active',
      })

      // Also invalidate unread count
      queryClient.invalidateQueries({
        queryKey: unreadCountQueryKey,
        refetchType: 'active',
      })
    },
    [queryClient, unreadCountQueryKey],
  )

  const handleAllRead = useCallback(() => {
    // Update unread count immediately
    queryClient.setQueryData(unreadCountQueryKey, (oldData) => ({
      count: 0,
      hasUnread: false,
      userId: oldData?.userId || '', // Preserve userId
    }))

    // Invalidate ALL notification list queries to refetch with updated read status
    queryClient.invalidateQueries({
      queryKey: ['notifications', 'list'],
      refetchType: 'active',
    })
  }, [queryClient, unreadCountQueryKey])

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
    // EventSource is always available in browser environments where this hook runs
    // This check is kept for documentation purposes but will always pass

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
      } else {
        // Page is visible again
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
