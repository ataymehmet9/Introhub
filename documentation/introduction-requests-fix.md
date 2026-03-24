# Introduction Requests Data Retrieval Fix

## Issue Description

In production, a user with contacts received an introduction request from another user. The email notification was sent successfully, but when the recipient logged in and navigated to the requests page, no received requests were displayed despite the data existing in the database.

## Issues Identified

### Issue 1: Client-Side Filtering After Pagination (Initial Issue)

The issue was caused by a combination of three problems in the data retrieval implementation:

### 1. **Client-Side Filtering After Server-Side Pagination**

The original implementation:

- Server returned ALL requests (both sent and received) with pagination
- Client then filtered the paginated results to show only "sent" or "received"

**Problem**: If a user had 10 sent requests and 5 received requests:

- Page 1 would return the first 10 requests (all sent)
- Client would filter to show only "received" → **0 results displayed**
- The actual received requests were on page 2, but users never saw them

### 2. **Missing Sort Order**

The query sorted by `createdAt` in **ascending order** (oldest first), meaning:

- Newest requests appeared on later pages
- Users landing on page 1 saw old requests first
- Recent requests requiring action were hidden

### 3. **No Server-Side Filter Parameter**

The tRPC endpoint didn't accept a `filterType` parameter, so:

- Server couldn't filter by request type before pagination
- Pagination counts were incorrect for filtered views
- Client had to do inefficient post-pagination filtering

## Solution Implemented

### Changes to `src/integrations/trpc/routes/introduction-request.ts`

1. **Added `filterType` input parameter**:

```typescript
.input(
  z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(10),
    filterType: z.enum(['sent', 'received', 'all']).optional().default('all'),
  }),
)
```

2. **Implemented server-side filtering**:

```typescript
let whereClause
if (filterType === 'sent') {
  whereClause = and(
    eq(introductionRequests.requesterId, currentUser.id),
    eq(introductionRequests.deleted, false),
  )
} else if (filterType === 'received') {
  whereClause = and(
    eq(introductionRequests.approverId, currentUser.id),
    eq(introductionRequests.deleted, false),
  )
} else {
  // 'all' - show both sent and received
  whereClause = and(
    or(
      eq(introductionRequests.requesterId, currentUser.id),
      eq(introductionRequests.approverId, currentUser.id),
    ),
    eq(introductionRequests.deleted, false),
  )
}
```

3. **Added descending sort order**:

```typescript
import { and, count, desc, eq, or } from 'drizzle-orm'

// In query:
.orderBy(desc(introductionRequests.createdAt))
```

### Changes to `src/routes/_authenticated/(requests)/-hooks/useRequests.tsx`

1. **Pass `filterType` to server**:

```typescript
const queryKey = trpc.introductionRequests.listByUser.queryKey({
  page,
  pageSize,
  filterType,
})

const { data, isFetching: isLoading } = useQuery({
  ...trpc.introductionRequests.listByUser.queryOptions({
    page,
    pageSize,
    filterType,
  }),
  enabled,
})
```

2. **Removed client-side filtering**:

```typescript
// Before: Client-side filtering after pagination
const requests = allRequests.filter((request) => {
  if (filterType === 'sent') return request.requesterId === currentUserId
  else if (filterType === 'received')
    return request.approverId === currentUserId
  return true
})

// After: Use server-filtered data directly
const requests = data?.data ?? []
const pagination = data?.pagination
const requestsTotal = pagination?.total ?? 0
```

## Benefits

1. **Correct Pagination**: Server filters before paginating, ensuring accurate page counts
2. **Better Performance**: Filtering happens at the database level, not in the client
3. **Newest First**: Users see most recent requests requiring action immediately
4. **Accurate Counts**: Total counts reflect the filtered view, not all requests

## Testing Recommendations

1. Create test data with mixed sent/received requests
2. Verify "Requests Received" tab shows only received requests
3. Verify "Requests Made" tab shows only sent requests
4. Confirm pagination works correctly for each tab
5. Verify newest requests appear first
6. Test with users who have many requests spanning multiple pages

## Database Query Example

The fixed query now properly filters at the database level:

```sql
-- For received requests
SELECT * FROM introduction_requests
WHERE approver_id = $currentUserId
  AND deleted = false
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;

-- For sent requests
SELECT * FROM introduction_requests
WHERE requester_id = $currentUserId
  AND deleted = false
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

## Related Files

- `src/integrations/trpc/routes/introduction-request.ts` - Server-side query logic
- `src/routes/_authenticated/(requests)/-hooks/useRequests.tsx` - Client-side data fetching
- `src/routes/_authenticated/(requests)/requests.tsx` - Requests page component
- `src/db/schema.ts` - Database schema definition

---

### Issue 2: Stale Cache Not Invalidated (Follow-up Issue)

After fixing the pagination issue, a second problem was discovered: users on the introduction requests screen were not seeing new requests until they clicked the notification icon in the header.

#### Root Cause

1. **Stale Cache**: The requests query had a `staleTime: 1000 * 60` (1 minute) from the global TanStack Query config
2. **No Cache Invalidation**: When a new introduction request notification arrived via SSE, only the notification cache was updated - the introduction requests cache was NOT invalidated
3. **Window Focus Trigger**: Clicking the notification icon triggered a window focus event or navigation, which caused `refetchOnWindowFocus: true` to refetch the data

#### Solution Implemented

**Changes to `src/hooks/useNotificationSSE.tsx`:**

1. **Added introduction requests query key**:

```typescript
const introductionRequestsQueryKey =
  trpc.introductionRequests.listByUser.queryKey()
```

2. **Invalidate cache when new introduction request notification arrives**:

```typescript
// In handleNotificationCreated callback
if (notification.type === 'introduction_request') {
  queryClient.invalidateQueries({
    queryKey: introductionRequestsQueryKey,
    refetchType: 'active', // Only refetch if the query is currently being used
  })
}
```

3. **Invalidate cache when approval/decline notifications are read**:

```typescript
// In handleNotificationRead callback
if (
  notification?.type === 'introduction_approved' ||
  notification?.type === 'introduction_declined'
) {
  queryClient.invalidateQueries({
    queryKey: introductionRequestsQueryKey,
    refetchType: 'active',
  })
}
```

**Changes to `src/routes/_authenticated/(requests)/-hooks/useRequests.tsx`:**

1. **Added balanced caching strategy**:

```typescript
const { data, isFetching: isLoading } = useQuery({
  ...trpc.introductionRequests.listByUser.queryOptions({
    page,
    pageSize,
    filterType,
  }),
  enabled,
  refetchOnWindowFocus: true, // Refetch when user returns to the page
  staleTime: 1000 * 30, // Cache for 30 seconds - balance between freshness and performance
  gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes when not in use
})
```

#### How It Works Now

1. **Real-time Updates**: When a new introduction request notification arrives via SSE:
   - Notification cache is updated (existing behavior)
   - Introduction requests cache is invalidated (new behavior)
   - If user is on the requests page, data refetches automatically

2. **Window Focus**: When user returns to the requests page:
   - Data is considered stale after 30 seconds (`staleTime: 1000 * 30`)
   - Automatic refetch occurs if data is stale (`refetchOnWindowFocus: true`)
   - Cached data shown immediately while refetching in background

3. **Status Updates**: When approval/decline notifications are read:
   - Introduction requests cache is invalidated
   - Ensures the requests list reflects updated statuses

#### Benefits

- **Immediate Updates**: New requests appear instantly via SSE cache invalidation
- **Performance**: 30-second cache reduces unnecessary API calls
- **Fresh Data**: Window focus refetch ensures data is current when user returns
- **Efficient**: Only refetches active queries (not background cached data)
- **Reliable**: Multiple fallback mechanisms ensure data freshness
- **Better UX**: Cached data shown immediately while refetching in background

#### Performance Characteristics

- **Cache Duration**: 30 seconds (good balance for request data that changes infrequently)
- **Garbage Collection**: 5 minutes (keeps data available for quick navigation)
- **Refetch Triggers**:
  1. SSE notification arrives → immediate invalidation and refetch
  2. Window focus after 30 seconds → background refetch
  3. Manual navigation → uses cache if fresh, refetches if stale
- **Network Requests**: Minimized through intelligent caching while maintaining data freshness

---

## Date Fixed

2026-03-24 (Initial pagination fix)
2026-03-24 (Cache invalidation fix)
