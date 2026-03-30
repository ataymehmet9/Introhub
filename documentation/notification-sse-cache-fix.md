# Notification SSE Cache Synchronization Fix

## Problem

SSE notifications were not properly updating the cache when moving from unread to read state. The header notification icon would show new notifications, but when navigating to the `/me/notifications` page, the notifications would not display correctly or the read/unread state would be out of sync.

## Root Cause

The issue was caused by **query key mismatch** between different parts of the application:

1. **Header Notification Component**: Used default query key from `useNotifications()` hook
2. **SSE Hook**: Used `trpc.notifications.list.queryKey({ unreadOnly: false })` - a specific query key
3. **Notifications Page**: Used query key with `pageSize` and `unreadOnly` parameters

When SSE events arrived, they were updating a different cache entry than what the notifications page was reading from, causing the UI to be out of sync.

## Solution

### 1. Updated `useNotificationSSE.tsx`

Changed from trying to update specific query keys to **invalidating ALL notification queries**:

```typescript
// Before: Tried to update specific query key
const notificationsQueryKey = trpc.notifications.list.queryKey({
  unreadOnly: false,
})
queryClient.setQueryData(notificationsQueryKey, ...)

// After: Invalidate all notification queries
queryClient.invalidateQueries({
  queryKey: ['notifications', 'list'],
  refetchType: 'active',
})
```

**Benefits:**

- Works regardless of query parameters (pageSize, unreadOnly, etc.)
- Ensures all notification queries stay in sync
- Simpler and more maintainable code

### 2. Updated `useNotifications.tsx`

Added invalidation after successful mutations to sync with SSE updates:

```typescript
onSuccess: () => {
  // After successful mutation, invalidate to sync with SSE updates
  // Use a small delay to allow SSE event to arrive first
  setTimeout(() => {
    queryClient.invalidateQueries({
      queryKey: ['notifications', 'list'],
      refetchType: 'active',
    })
  }, 100)
}
```

**Why the delay?**

- Allows the SSE event to arrive and update the cache first
- Prevents race conditions between optimistic updates and SSE events
- Ensures the final state is always correct

## How It Works Now

1. **User marks notification as read** (either in header or notifications page)
2. **Optimistic update** happens immediately (UI updates instantly)
3. **Mutation sent to server**
4. **Server processes** and sends SSE event to all connected clients
5. **SSE event received** → invalidates all notification queries
6. **Mutation completes** → waits 100ms → invalidates again (ensures sync)
7. **All queries refetch** with the latest data from server

## Testing Checklist

- [ ] New notification arrives via SSE → appears in header dropdown
- [ ] Navigate to `/me/notifications` → new notification is visible
- [ ] Mark notification as read in header → updates in notifications page
- [ ] Mark notification as read in notifications page → updates in header
- [ ] Mark all as read → updates everywhere
- [ ] Multiple browser tabs stay in sync
- [ ] No duplicate notifications or stale data

## Files Changed

- `src/hooks/useNotificationSSE.tsx` - Changed to invalidate all queries instead of updating specific ones
- `src/hooks/useNotifications.tsx` - Added post-mutation invalidation to sync with SSE

## Technical Details

### Query Key Structure

All notification list queries now use the base key pattern:

```typescript
;['notifications', 'list', { pageSize, unreadOnly }]
```

When we invalidate with `['notifications', 'list']`, it matches ALL queries that start with this pattern, regardless of the parameters.

### Cache Invalidation Strategy

- **SSE events**: Invalidate immediately with `refetchType: 'active'` (only refetch if query is being used)
- **Mutations**: Optimistic update + delayed invalidation (100ms) to sync with SSE
- **Unread count**: Updated optimistically for instant UI feedback

### Race Condition Prevention

- Cancel ongoing queries before optimistic updates
- Use `refetchType: 'active'` to avoid unnecessary refetches
- Small delay after mutations to let SSE events arrive first
- Rollback mechanism on mutation errors

## Future Improvements

1. Consider using WebSocket instead of SSE for bidirectional communication
2. Add retry logic for failed SSE connections
3. Implement exponential backoff for reconnection attempts (already done)
4. Add telemetry to track SSE connection health
