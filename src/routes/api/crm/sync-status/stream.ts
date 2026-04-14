/**
 * CRM Sync Status SSE Endpoint
 *
 * Provides real-time updates for CRM sync status via Server-Sent Events.
 * This endpoint streams sync status changes to the client without storing
 * them as persistent notifications.
 */

import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { crmIntegrations } from '@/db/schema'

interface SyncStatusSSEEvent {
  type: 'sync_status' | 'connected' | 'heartbeat'
  data: {
    provider?: string
    syncStatus?: string
    lastSyncedAt?: Date | null
    lastSyncError?: string | null
    syncStartedAt?: Date | null
    message?: string
    timestamp?: number
  }
}

async function handler({ request }: { request: Request }) {
  // Authenticate the user
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

  // Hoist mutable state
  let cleanedUp = false
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null
  let pollInterval: ReturnType<typeof setInterval> | null = null
  let streamController: ReadableStreamDefaultController | null = null

  /**
   * Centralized cleanup
   */
  function cleanup(reason: string) {
    if (cleanedUp) return
    cleanedUp = true

    console.log(`[CRM SSE] Cleaning up stream for user ${userId} (${reason})`)

    if (heartbeatInterval !== null) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }

    if (pollInterval !== null) {
      clearInterval(pollInterval)
      pollInterval = null
    }

    if (streamController !== null) {
      try {
        streamController.close()
      } catch {
        // Controller may already be closed
      }
      streamController = null
    }
  }

  // Create ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      console.log(`[CRM SSE] Starting stream for user ${userId}`)

      streamController = controller

      // Send initial connection event
      const connectedEvent: SyncStatusSSEEvent = {
        type: 'connected',
        data: {
          message: 'Connected to CRM sync status stream',
          timestamp: Date.now(),
        },
      }
      controller.enqueue(
        `event: ${connectedEvent.type}\ndata: ${JSON.stringify(connectedEvent.data)}\n\n`,
      )

      // Set up heartbeat (every 30 seconds)
      heartbeatInterval = setInterval(() => {
        try {
          const heartbeatEvent: SyncStatusSSEEvent = {
            type: 'heartbeat',
            data: { timestamp: Date.now() },
          }
          controller.enqueue(
            `event: ${heartbeatEvent.type}\ndata: ${JSON.stringify(heartbeatEvent.data)}\n\n`,
          )
        } catch (error) {
          console.error(`[CRM SSE] Heartbeat error for user ${userId}:`, error)
          cleanup('heartbeat-error')
        }
      }, 30000)

      // Poll for sync status changes (every 2 seconds)
      pollInterval = setInterval(async () => {
        try {
          const integrations = await db.query.crmIntegrations.findMany({
            where: eq(crmIntegrations.userId, userId),
          })

          for (const integration of integrations) {
            const statusEvent: SyncStatusSSEEvent = {
              type: 'sync_status',
              data: {
                provider: integration.provider,
                syncStatus: integration.syncStatus,
                lastSyncedAt: integration.lastSyncedAt,
                lastSyncError: integration.lastSyncError,
                syncStartedAt: integration.syncStartedAt,
              },
            }

            controller.enqueue(
              `event: ${statusEvent.type}\ndata: ${JSON.stringify(statusEvent.data)}\n\n`,
            )
          }
        } catch (error) {
          console.error(
            `[CRM SSE] Error fetching sync status for user ${userId}:`,
            error,
          )
        }
      }, 2000)

      // Handle connection close
      request.signal.addEventListener('abort', () => {
        cleanup('abort')
      })
    },

    cancel(reason) {
      cleanup(`cancel:${reason ?? 'unknown'}`)
    },
  })

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export const Route = createFileRoute('/api/crm/sync-status/stream')({
  server: {
    handlers: {
      GET: handler,
    },
  },
})

// Made with Bob
