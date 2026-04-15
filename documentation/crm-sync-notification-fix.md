# CRM Sync Notification Fix

## Problem

In production, users were successfully syncing contacts through HubSpot, and new contacts were being added to the database. However, users were **not receiving real-time notifications** when the sync completed.

## Root Cause

The issue was caused by a **distributed system architecture problem**:

1. **BullMQ Worker Process**: The contact sync runs in a separate worker process (via BullMQ)
2. **Web Server Process**: The SSE (Server-Sent Events) connections for real-time notifications run in the main web server process
3. **In-Memory EventEmitter**: The notification system was using Node.js's in-memory `EventEmitter`

When the worker process completed a sync and emitted a notification event, it was emitting to **its own process's EventEmitter instance**, not the one in the web server process where the SSE connections were listening. This meant the notification was created in the database but never broadcast to connected clients.

```
┌─────────────────┐         ┌──────────────────┐
│  Worker Process │         │  Web Server      │
│                 │         │                  │
│  Sync Complete  │         │  SSE Connection  │
│       ↓         │         │       ↓          │
│  Emit Event     │    ✗    │  EventEmitter    │
│  (Local Only)   │─────────│  (Different)     │
└─────────────────┘         └──────────────────┘
```

## Solution

Implemented a **Redis Pub/Sub bridge** to enable cross-process communication:

1. **Worker Process**: Publishes notification events to Redis
2. **Web Server Process**: Subscribes to Redis and bridges events to local EventEmitter
3. **SSE Connections**: Listen to local EventEmitter for real-time updates

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Worker Process │         │      Redis       │         │  Web Server      │
│                 │         │                  │         │                  │
│  Sync Complete  │         │   Pub/Sub        │         │  SSE Connection  │
│       ↓         │         │                  │         │       ↓          │
│  Publish Event  │────────▶│  Channel         │────────▶│  EventEmitter    │
│  (to Redis)     │         │  "notifications" │         │  (Bridged)       │
└─────────────────┘         └──────────────────┘         └──────────────────┘
```

## Implementation

### 1. Created Notification Bridge (`src/lib/notification-bridge.ts`)

A new module that provides:

- **Publisher**: Used by worker process to publish events to Redis
- **Subscriber**: Used by web server to subscribe to Redis events
- **Bridge**: Forwards Redis events to local EventEmitter for SSE connections

Key functions:

- `publishNotificationEvent()`: Publish events to Redis (worker side)
- `initializeNotificationBridge()`: Subscribe to Redis and bridge to EventEmitter (server side)

### 2. Updated Sync Queue Service (`src/services/sync-queue.service.ts`)

Changed from:

```typescript
notificationEmitter.emit('notification:created', { ... })
```

To:

```typescript
await publishNotificationEvent('notification:created', { ... })
```

This ensures the worker publishes to Redis instead of emitting locally.

### 3. Initialize Bridge on Server Startup (`instrument.server.mjs`)

Added initialization code to start the Redis subscriber when the server starts:

```javascript
import { initializeNotificationBridge } from './src/lib/notification-bridge.ts'

initializeNotificationBridge().catch((error) => {
  console.error('Failed to initialize notification bridge:', error)
})
```

## Benefits

1. **Cross-Process Communication**: Worker and web server can now communicate
2. **Scalability**: Works with multiple worker and web server instances
3. **Reliability**: Redis provides reliable message delivery
4. **No Breaking Changes**: Existing SSE implementation remains unchanged
5. **Graceful Degradation**: If Redis fails, sync still completes (notifications just won't be real-time)

## Testing

To verify the fix works:

1. **Start the application** (both web server and worker)
2. **Connect to HubSpot** and initiate a contact sync
3. **Monitor logs** for:
   - `[NotificationBridge] Published notification:created event to Redis` (worker)
   - `[NotificationBridge] Received notification:created event from Redis` (server)
   - `[SSE] Sent notification event to X connection(s)` (server)
4. **Check the UI**: Notification bell should show the new notification in real-time

## Production Deployment

### Prerequisites

- Redis must be running and accessible to both worker and web server processes
- `REDIS_URL` environment variable must be set correctly

### Deployment Steps

1. Deploy the updated code
2. Restart both web server and worker processes
3. Verify Redis connection in logs:
   - `[NotificationBridge] Publisher connected to Redis`
   - `[NotificationBridge] Subscriber connected to Redis`
   - `[NotificationBridge] Subscribed to Redis channel: notifications:events`

### Monitoring

Monitor these log messages:

- Worker: `[NotificationBridge] Published X event to Redis`
- Server: `[NotificationBridge] Received X event from Redis`
- Server: `[SSE] Sent notification event to X connection(s)`

## Troubleshooting

### Notifications Still Not Appearing

1. **Check Redis Connection**:

   ```bash
   # Verify Redis is accessible
   redis-cli ping
   ```

2. **Check Logs**:
   - Worker logs should show "Published ... event to Redis"
   - Server logs should show "Received ... event from Redis"
   - Server logs should show "Sent notification event to X connection(s)"

3. **Verify SSE Connection**:
   - Open browser DevTools → Network tab
   - Look for `/api/notifications/stream` connection
   - Should show "Status: 200" and "Type: eventsource"

4. **Check Database**:
   ```sql
   SELECT * FROM notifications
   WHERE user_id = 'your_user_id'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

   - Notification should exist in database even if not delivered via SSE

### Redis Connection Issues

If Redis connection fails:

- Notifications will still be created in the database
- Users can see them by refreshing the page
- Real-time delivery will resume when Redis connection is restored

## Related Files

- [`src/lib/notification-bridge.ts`](../src/lib/notification-bridge.ts) - Redis pub/sub bridge
- [`src/services/sync-queue.service.ts`](../src/services/sync-queue.service.ts) - Worker that publishes events
- [`src/routes/api/notifications/stream.ts`](../src/routes/api/notifications/stream.ts) - SSE endpoint
- [`src/lib/notification-emitter.ts`](../src/lib/notification-emitter.ts) - Local EventEmitter
- [`instrument.server.mjs`](../instrument.server.mjs) - Server initialization

## Future Enhancements

1. **Health Checks**: Add Redis connection health monitoring
2. **Metrics**: Track pub/sub message delivery rates
3. **Fallback**: Implement polling fallback if Redis is unavailable
4. **Message Persistence**: Store undelivered messages for offline users

---

**Last Updated**: 2026-04-15  
**Version**: 1.0.0  
**Author**: Bob (AI Assistant)
