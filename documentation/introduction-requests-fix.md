# Introduction Requests Data Retrieval Fix

## Issue Description

In production, a user with contacts received an introduction request from another user. The email notification was sent successfully, but when the recipient logged in and navigated to the requests page, no received requests were displayed despite the data existing in the database.

## Root Cause Analysis

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

## Date Fixed

2026-03-24
