# Dashboard Cache Invalidation Fix

## Problem

When performing actions like creating introduction requests, accepting/rejecting requests, or adding/updating/deleting contacts, the dashboard statistics were not updating immediately. Users had to manually change the date range filter to see the new data reflected in the dashboard.

This occurred because:

1. Dashboard queries had a 5-minute stale time for performance optimization
2. Dashboard queries didn't refetch on window focus
3. Mutations in other parts of the app only invalidated their own query caches, not the dashboard cache

## Solution

Implemented comprehensive cache invalidation across all relevant mutations to ensure dashboard queries are invalidated whenever data changes that would affect dashboard statistics.

### Changes Made

#### 1. Introduction Request Creation (`useIntroductionRequest.tsx`)

- Added dashboard cache invalidation when a new introduction request is created
- Invalidates all queries with `dashboard` as the first key segment

#### 2. Request Status Updates (`useRequests.tsx`)

- Added dashboard cache invalidation for:
  - Accept request mutation
  - Reject request mutation
  - Delete request mutation
- All three mutations now invalidate dashboard queries in their `onSettled` handlers

#### 3. Contact Mutations (`useContact.tsx`)

- Added dashboard cache invalidation for:
  - Create contact mutation
  - Update contact mutation
  - Delete contact mutation
  - Batch delete contacts mutation
- All four mutations now invalidate dashboard queries in their `onSettled` handlers

### Implementation Pattern

All cache invalidations use a predicate-based approach to match all dashboard-related queries:

```typescript
await queryClient.invalidateQueries({
  predicate: (query) => {
    return (
      Array.isArray(query.queryKey) && query.queryKey[0]?.[0] === 'dashboard'
    )
  },
})
```

This ensures that all dashboard queries (stats, trends, top contacts) are invalidated regardless of their specific parameters (date range, granularity, etc.).

## Benefits

1. **Immediate UI Updates**: Dashboard reflects changes immediately after any relevant action
2. **Consistent User Experience**: No need to manually refresh or change filters to see updates
3. **Data Accuracy**: Dashboard always shows the most current data after mutations
4. **Maintainable**: Uses a consistent pattern across all mutations

## Testing

To verify the fix:

1. Create a new introduction request from the search page
2. Navigate to the dashboard
3. Verify the request count and trends update immediately
4. Accept/reject a request from the requests page
5. Navigate to the dashboard
6. Verify the status changes are reflected
7. Add/update/delete contacts
8. Verify the dashboard updates accordingly

## Related Files

- `src/routes/_authenticated/(search)/-hooks/useIntroductionRequest.tsx`
- `src/routes/_authenticated/(requests)/-hooks/useRequests.tsx`
- `src/routes/_authenticated/(contacts)/-hooks/useContact.tsx`
- `src/routes/_authenticated/(dashboard)/-hooks/useDashboardStats.tsx`
- `src/routes/_authenticated/(dashboard)/-hooks/useDashboardTrends.tsx`
- `src/routes/_authenticated/(dashboard)/-hooks/useTopContacts.tsx`
