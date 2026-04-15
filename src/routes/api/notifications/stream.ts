import { createFileRoute } from '@tanstack/react-router'
import type {
  ConnectedSSEEvent,
  HeartbeatSSEEvent,
  NotificationSSEEvent,
} from '@/lib/sse-manager'
import { auth } from '@/lib/auth'
import { sseManager } from '@/lib/sse-manager'

/**
 * SSE endpoint for real-time notifications
 * GET /api/notifications/stream
 */
async function handler({ request }: { request: Request }) {
  // Dynamically import the notification emitter to avoid bundling Node.js modules
  const { notificationEmitter } =
    await import('@/lib/notification-emitter.server')

  // Authenticate the user using Better Auth session
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }

  const userId = session.user.id

  // Hoist mutable state so both start() and cancel() share the same references
  let cleanedUp = false
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null
  let streamController: ReadableStreamDefaultController | null = null

  // Notification event handlers — defined here so cleanup() can reference them
  const handleNotificationCreated = (data: {
    userId: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notification: any
  }) => {
    if (data.userId !== userId) return
    try {
      const event: NotificationSSEEvent = {
        type: 'notification',
        data: { action: 'created', notification: data.notification },
      }
      streamController?.enqueue(
        `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`,
      )
    } catch (error) {
      console.error(
        `[SSE] Error sending notification:created to user ${userId}:`,
        error,
      )
    }
  }

  const handleNotificationRead = (data: {
    userId: string
    notificationId: number
  }) => {
    if (data.userId !== userId) return
    try {
      const event: NotificationSSEEvent = {
        type: 'notification',
        data: { action: 'read', notificationId: data.notificationId },
      }
      streamController?.enqueue(
        `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`,
      )
    } catch (error) {
      console.error(
        `[SSE] Error sending notification:read to user ${userId}:`,
        error,
      )
    }
  }

  const handleNotificationDeleted = (data: {
    userId: string
    notificationId: number
  }) => {
    if (data.userId !== userId) return
    try {
      const event: NotificationSSEEvent = {
        type: 'notification',
        data: { action: 'deleted', notificationId: data.notificationId },
      }
      streamController?.enqueue(
        `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`,
      )
    } catch (error) {
      console.error(
        `[SSE] Error sending notification:deleted to user ${userId}:`,
        error,
      )
    }
  }

  const handleAllRead = (data: { userId: string }) => {
    if (data.userId !== userId) return
    try {
      const event: NotificationSSEEvent = {
        type: 'notification',
        data: { action: 'all-read' },
      }
      streamController?.enqueue(
        `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`,
      )
    } catch (error) {
      console.error(
        `[SSE] Error sending notification:all-read to user ${userId}:`,
        error,
      )
    }
  }

  /**
   * Centralised cleanup — idempotent, safe to call from both abort and cancel.
   * Removes all event listeners, clears the heartbeat timer,
   * deregisters the connection from the manager, and closes the controller.
   */
  function cleanup(reason: string) {
    if (cleanedUp) return
    cleanedUp = true

    console.log(`[SSE] Cleaning up stream for user ${userId} (${reason})`)

    if (heartbeatInterval !== null) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }

    notificationEmitter.off('notification:created', handleNotificationCreated)
    notificationEmitter.off('notification:read', handleNotificationRead)
    notificationEmitter.off('notification:deleted', handleNotificationDeleted)
    notificationEmitter.off('notification:all-read', handleAllRead)

    if (streamController !== null) {
      sseManager.removeConnection(userId, streamController)
      try {
        streamController.close()
      } catch {
        // Controller may already be closed — safe to ignore
      }
      streamController = null
    }
  }

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      console.log(`[SSE] Starting stream for user ${userId}`)

      streamController = controller

      // Register this connection with the SSE manager
      sseManager.addConnection(userId, controller)

      // Send initial connection event
      const connectedEvent: ConnectedSSEEvent = {
        type: 'connected',
        data: {
          message: 'Connected to notification stream',
          timestamp: Date.now(),
        },
      }
      controller.enqueue(
        `event: ${connectedEvent.type}\ndata: ${JSON.stringify(connectedEvent.data)}\n\n`,
      )

      // Set up heartbeat to keep connection alive (every 30 seconds)
      heartbeatInterval = setInterval(() => {
        try {
          const heartbeatEvent: HeartbeatSSEEvent = {
            type: 'heartbeat',
            data: { timestamp: Date.now() },
          }
          controller.enqueue(
            `event: ${heartbeatEvent.type}\ndata: ${JSON.stringify(heartbeatEvent.data)}\n\n`,
          )
        } catch (error) {
          console.error(`[SSE] Heartbeat error for user ${userId}:`, error)
          cleanup('heartbeat-error')
        }
      }, 30000)

      // Register notification event listeners
      notificationEmitter.on('notification:created', handleNotificationCreated)
      notificationEmitter.on('notification:read', handleNotificationRead)
      notificationEmitter.on('notification:deleted', handleNotificationDeleted)
      notificationEmitter.on('notification:all-read', handleAllRead)

      // Handle connection close — fires when the client disconnects or the
      // request is aborted (e.g. browser tab closed, navigation away)
      request.signal.addEventListener('abort', () => {
        cleanup('abort')
      })
    },

    // cancel() is called by the runtime when the consumer stops reading
    // (e.g. the response is dropped without the abort signal firing).
    // The cleanedUp guard makes this idempotent with the abort path.
    cancel(reason) {
      cleanup(`cancel:${reason ?? 'unknown'}`)
    },
  })

  // Return SSE response with proper headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}

export const Route = createFileRoute('/api/notifications/stream')({
  server: {
    handlers: {
      GET: handler,
    },
  },
})
