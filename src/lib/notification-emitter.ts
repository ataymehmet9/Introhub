import { EventEmitter } from 'node:events'
import type { NotificationWithMetadata } from '@/schemas'

/**
 * Event types for notification system
 */
export interface NotificationEvents {
  'notification:created': (data: {
    userId: string
    notification: NotificationWithMetadata
  }) => void
  'notification:read': (data: {
    userId: string
    notificationId: number
  }) => void
  'notification:deleted': (data: {
    userId: string
    notificationId: number
  }) => void
  'notification:all-read': (data: { userId: string }) => void
}

/**
 * Typed EventEmitter for notification events
 */
class NotificationEventEmitter extends EventEmitter {
  emit<K extends keyof NotificationEvents>(
    event: K,
    ...args: Parameters<NotificationEvents[K]>
  ): boolean {
    return super.emit(event, ...args)
  }

  on<K extends keyof NotificationEvents>(
    event: K,
    listener: NotificationEvents[K],
  ): this {
    return super.on(event, listener)
  }

  once<K extends keyof NotificationEvents>(
    event: K,
    listener: NotificationEvents[K],
  ): this {
    return super.once(event, listener)
  }

  off<K extends keyof NotificationEvents>(
    event: K,
    listener: NotificationEvents[K],
  ): this {
    return super.off(event, listener)
  }
}

/**
 * Singleton instance of the notification event emitter
 * Used to broadcast notification events to SSE connections
 */
export const notificationEmitter = new NotificationEventEmitter()

// Set max listeners to handle multiple SSE connections
notificationEmitter.setMaxListeners(100)
