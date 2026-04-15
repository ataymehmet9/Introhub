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
 * Simple EventEmitter implementation to avoid Node.js imports in build
 */
class SimpleEventEmitter<
  TEvents extends Record<string, (...args: Array<unknown>) => void>,
> {
  private events: Map<keyof TEvents, Set<(...args: Array<unknown>) => void>> =
    new Map()
  private maxListeners = 10

  setMaxListeners(n: number): this {
    this.maxListeners = n
    return this
  }

  on<TKey extends keyof TEvents>(event: TKey, listener: TEvents[TKey]): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(listener)
    return this
  }

  once<TKey extends keyof TEvents>(event: TKey, listener: TEvents[TKey]): this {
    const onceWrapper = (...args: Parameters<TEvents[TKey]>) => {
      this.off(event, onceWrapper as TEvents[TKey])
      listener(...args)
    }
    return this.on(event, onceWrapper as TEvents[TKey])
  }

  off<TKey extends keyof TEvents>(event: TKey, listener: TEvents[TKey]): this {
    const listeners = this.events.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
    return this
  }

  emit<TKey extends keyof TEvents>(
    event: TKey,
    ...args: Parameters<TEvents[TKey]>
  ): boolean {
    const listeners = this.events.get(event)
    if (!listeners || listeners.size === 0) {
      return false
    }
    listeners.forEach((listener) => {
      try {
        listener(...args)
      } catch (error) {
        console.error(`Error in event listener for ${String(event)}:`, error)
      }
    })
    return true
  }

  removeAllListeners(event?: keyof TEvents): this {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
    return this
  }
}

/**
 * Typed EventEmitter for notification events
 */
export class NotificationEventEmitter extends SimpleEventEmitter<
  NotificationEvents & Record<string, (...args: Array<unknown>) => void>
> {}

/**
 * Singleton instance of the notification event emitter
 * Used to broadcast notification events to SSE connections
 */
export const notificationEmitter = new NotificationEventEmitter()

// Set max listeners to handle multiple SSE connections
notificationEmitter.setMaxListeners(100)
