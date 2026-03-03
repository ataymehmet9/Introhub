import type { NotificationWithMetadata } from '@/schemas'

/**
 * SSE event types that can be sent to clients
 */
export type SSEEventType = 'notification' | 'heartbeat' | 'connected'

/**
 * SSE event data structures
 */
export interface SSEEvent {
  type: SSEEventType
  data: unknown
}

export interface NotificationSSEEvent extends SSEEvent {
  type: 'notification'
  data: {
    action: 'created' | 'read' | 'deleted' | 'all-read'
    notification?: NotificationWithMetadata
    notificationId?: number
  }
}

export interface HeartbeatSSEEvent extends SSEEvent {
  type: 'heartbeat'
  data: {
    timestamp: number
  }
}

export interface ConnectedSSEEvent extends SSEEvent {
  type: 'connected'
  data: {
    message: string
    timestamp: number
  }
}

/**
 * Manages Server-Sent Events connections for real-time notifications
 * Singleton pattern to maintain connections across the application
 */
class SSEConnectionManager {
  private connections: Map<string, Set<ReadableStreamDefaultController>> =
    new Map()

  /**
   * Add a new SSE connection for a user
   */
  addConnection(
    userId: string,
    controller: ReadableStreamDefaultController,
  ): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set())
    }
    this.connections.get(userId)!.add(controller)
    console.log(
      `[SSE] User ${userId} connected. Total connections: ${this.getConnectionCount(userId)}`,
    )
  }

  /**
   * Remove an SSE connection for a user
   */
  removeConnection(
    userId: string,
    controller: ReadableStreamDefaultController,
  ): void {
    const userConnections = this.connections.get(userId)
    if (userConnections) {
      userConnections.delete(controller)
      if (userConnections.size === 0) {
        this.connections.delete(userId)
      }
      console.log(
        `[SSE] User ${userId} disconnected. Remaining connections: ${this.getConnectionCount(userId)}`,
      )
    }
  }

  /**
   * Send an event to all connections for a specific user
   */
  sendToUser(userId: string, event: SSEEvent): void {
    const userConnections = this.connections.get(userId)
    if (!userConnections || userConnections.size === 0) {
      return
    }

    const message = this.formatSSEMessage(event)
    const deadConnections: Array<ReadableStreamDefaultController> = []

    userConnections.forEach((controller) => {
      try {
        controller.enqueue(message)
      } catch (error) {
        console.error(`[SSE] Failed to send to user ${userId}:`, error)
        deadConnections.push(controller)
      }
    })

    // Clean up dead connections
    deadConnections.forEach((controller) => {
      this.removeConnection(userId, controller)
    })

    console.log(
      `[SSE] Sent ${event.type} event to ${userConnections.size} connection(s) for user ${userId}`,
    )
  }

  /**
   * Send an event to all active connections
   */
  sendToAll(event: SSEEvent): void {
    const message = this.formatSSEMessage(event)
    let sentCount = 0

    this.connections.forEach((userConnections, userId) => {
      const deadConnections: Array<ReadableStreamDefaultController> = []

      userConnections.forEach((controller) => {
        try {
          controller.enqueue(message)
          sentCount++
        } catch (error) {
          console.error(`[SSE] Failed to send to user ${userId}:`, error)
          deadConnections.push(controller)
        }
      })

      // Clean up dead connections
      deadConnections.forEach((controller) => {
        this.removeConnection(userId, controller)
      })
    })

    console.log(
      `[SSE] Broadcast ${event.type} event to ${sentCount} connection(s)`,
    )
  }

  /**
   * Get the number of active connections for a user
   */
  getConnectionCount(userId: string): number {
    return this.connections.get(userId)?.size || 0
  }

  /**
   * Get the total number of active connections
   */
  getTotalConnectionCount(): number {
    let total = 0
    this.connections.forEach((userConnections) => {
      total += userConnections.size
    })
    return total
  }

  /**
   * Get the number of users with active connections
   */
  getActiveUserCount(): number {
    return this.connections.size
  }

  /**
   * Format an SSE event into the proper message format
   */
  private formatSSEMessage(event: SSEEvent): string {
    return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
  }

  /**
   * Get connection statistics for monitoring
   */
  getStats() {
    return {
      totalConnections: this.getTotalConnectionCount(),
      activeUsers: this.getActiveUserCount(),
      connectionsPerUser: Array.from(this.connections.entries()).map(
        ([userId, connections]) => ({
          userId,
          connectionCount: connections.size,
        }),
      ),
    }
  }
}

/**
 * Singleton instance of the SSE connection manager
 */
export const sseManager = new SSEConnectionManager()
