import { Redis } from 'ioredis'
import { notificationEmitter } from './notification-emitter.server'
import type { NotificationWithMetadata } from '@/schemas'

/**
 * Redis Pub/Sub Bridge for Cross-Process Notification Events
 *
 * This bridge enables communication between the BullMQ worker process
 * and the web server process for real-time notifications via SSE.
 *
 * Architecture:
 * - Worker process: Publishes notification events to Redis
 * - Web server process: Subscribes to Redis and emits to local EventEmitter
 * - SSE connections: Listen to local EventEmitter for real-time updates
 */

const REDIS_CHANNEL = 'notifications:events'

/**
 * Redis publisher instance (used by worker process)
 */
let publisherInstance: Redis | null = null

/**
 * Redis subscriber instance (used by web server process)
 */
let subscriberInstance: Redis | null = null

/**
 * Get or create Redis publisher instance
 */
export function getPublisher(): Redis {
  if (!publisherInstance) {
    publisherInstance = new Redis(
      process.env.REDIS_URL || 'redis://localhost:6379',
      {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        lazyConnect: false,
      },
    )

    publisherInstance.on('error', (error) => {
      console.error('[NotificationBridge] Publisher error:', error)
    })

    publisherInstance.on('connect', () => {
      console.log('[NotificationBridge] Publisher connected to Redis')
    })
  }
  return publisherInstance
}

/**
 * Get or create Redis subscriber instance
 */
export function getSubscriber(): Redis {
  if (!subscriberInstance) {
    subscriberInstance = new Redis(
      process.env.REDIS_URL || 'redis://localhost:6379',
      {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        lazyConnect: false,
      },
    )

    subscriberInstance.on('error', (error) => {
      console.error('[NotificationBridge] Subscriber error:', error)
    })

    subscriberInstance.on('connect', () => {
      console.log('[NotificationBridge] Subscriber connected to Redis')
    })
  }
  return subscriberInstance
}

/**
 * Notification event types that can be published/subscribed
 */
export type NotificationEventType =
  | 'notification:created'
  | 'notification:read'
  | 'notification:deleted'
  | 'notification:all-read'

/**
 * Event payload structure
 */
export interface NotificationEventPayload {
  type: NotificationEventType
  data:
    | {
        userId: string
        notification: NotificationWithMetadata
      }
    | {
        userId: string
        notificationId: number
      }
    | {
        userId: string
      }
}

/**
 * Publish a notification event to Redis
 * Used by worker process to broadcast events
 */
export async function publishNotificationEvent(
  type: NotificationEventType,
  data: NotificationEventPayload['data'],
): Promise<void> {
  try {
    const publisher = getPublisher()
    const payload: NotificationEventPayload = { type, data }
    await publisher.publish(REDIS_CHANNEL, JSON.stringify(payload))
    console.log(`[NotificationBridge] Published ${type} event to Redis`)
  } catch (error) {
    console.error(
      `[NotificationBridge] Failed to publish ${type} event:`,
      error,
    )
    // Don't throw - notification delivery is not critical
  }
}

/**
 * Initialize Redis subscriber and bridge events to local EventEmitter
 * Used by web server process to receive events from worker
 */
export async function initializeNotificationBridge(): Promise<void> {
  try {
    const subscriber = getSubscriber()

    // Subscribe to notification events channel
    await subscriber.subscribe(REDIS_CHANNEL)
    console.log(
      `[NotificationBridge] Subscribed to Redis channel: ${REDIS_CHANNEL}`,
    )

    // Handle incoming messages
    subscriber.on('message', (channel, message) => {
      if (channel !== REDIS_CHANNEL) return

      try {
        const payload: NotificationEventPayload = JSON.parse(message)
        console.log(
          `[NotificationBridge] Received ${payload.type} event from Redis`,
        )

        // Bridge to local EventEmitter for SSE connections
        switch (payload.type) {
          case 'notification:created':
            notificationEmitter.emit(
              'notification:created',
              payload.data as {
                userId: string
                notification: NotificationWithMetadata
              },
            )
            break
          case 'notification:read':
            notificationEmitter.emit(
              'notification:read',
              payload.data as {
                userId: string
                notificationId: number
              },
            )
            break
          case 'notification:deleted':
            notificationEmitter.emit(
              'notification:deleted',
              payload.data as {
                userId: string
                notificationId: number
              },
            )
            break
          case 'notification:all-read':
            notificationEmitter.emit(
              'notification:all-read',
              payload.data as {
                userId: string
              },
            )
            break
          default:
            console.warn(
              `[NotificationBridge] Unknown event type: ${payload.type}`,
            )
        }
      } catch (error) {
        console.error('[NotificationBridge] Failed to process message:', error)
      }
    })

    console.log('[NotificationBridge] Notification bridge initialized')
  } catch (error) {
    console.error('[NotificationBridge] Failed to initialize bridge:', error)
    throw error
  }
}

/**
 * Cleanup Redis connections
 */
export async function closeNotificationBridge(): Promise<void> {
  try {
    if (subscriberInstance) {
      await subscriberInstance.unsubscribe(REDIS_CHANNEL)
      await subscriberInstance.quit()
      subscriberInstance = null
      console.log('[NotificationBridge] Subscriber closed')
    }

    if (publisherInstance) {
      await publisherInstance.quit()
      publisherInstance = null
      console.log('[NotificationBridge] Publisher closed')
    }
  } catch (error) {
    console.error('[NotificationBridge] Error closing connections:', error)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await closeNotificationBridge()
})

process.on('SIGINT', async () => {
  await closeNotificationBridge()
})

// Made with Bob
