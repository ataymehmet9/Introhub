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
  emit<TKey extends keyof NotificationEvents>(
    event: TKey,
    ...args: Parameters<NotificationEvents[TKey]>
  ): boolean {
    return super.emit(event, ...args)
  }

  on<TKey extends keyof NotificationEvents>(
    event: TKey,
    listener: NotificationEvents[TKey],
  ): this {
    return super.on(event, listener)
  }

  once<TKey extends keyof NotificationEvents>(
    event: TKey,
    listener: NotificationEvents[TKey],
  ): this {
    return super.once(event, listener)
  }

  off<TKey extends keyof NotificationEvents>(
    event: TKey,
    listener: NotificationEvents[TKey],
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
