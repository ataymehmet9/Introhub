# SSR Caching Strategy for IntroHub

## Overview

This document outlines how caching and cache invalidation work when using TanStack Start loaders with TanStack Query.

## Current Caching Configuration

### Global Defaults (root-provider.tsx)

```typescript
queries: {
  staleTime: 1000 * 60, // 1 minute - data considered fresh
  retry: 3, // Retry failed queries up to 3 times
}
```

### Route-Specific Overrides

Individual routes can override these defaults:

- **Dashboard Stats**: 5 min staleTime, 10 min gcTime
- **Dashboard Trends**: Custom caching per component
- **Top Contacts**: Custom caching per component

## How SSR Loaders Work with Caching

### 1. Server-Side Rendering (Initial Load)

```typescript
loader: async ({ context }) => {
  // Runs on server, populates cache
  const data = await context.trpc.billing.getSubscription.ensureData()
  return data
}
```

**What happens:**

- Data fetched on server
- Cache populated with fresh data
- HTML rendered with data (no FOUC)
- Cache dehydrated and sent to client
- Client rehydrates cache with server data

### 2. Client-Side Navigation

When navigating between routes:

- If data is **fresh** (within staleTime): Use cached data, no refetch
- If data is **stale** (past staleTime): Use cached data, refetch in background
- If data is **missing**: Fetch immediately

### 3. Cache Invalidation Strategies

#### A. Automatic Invalidation (Mutations)

```typescript
const updateUserMutation = useMutation({
  mutationFn: (data) => trpcClient.users.update.mutate(data),
  onSuccess: async () => {
    // Invalidate related queries
    await queryClient.invalidateQueries({
      queryKey: ['users', 'me'],
    })
  },
})
```

#### B. Manual Invalidation

```typescript
// Invalidate specific query
queryClient.invalidateQueries({
  queryKey: trpc.billing.getSubscription.getQueryKey(),
})

// Invalidate all billing queries
queryClient.invalidateQueries({
  queryKey: ['billing'],
})
```

#### C. Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: updateData,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['data'] })

    // Snapshot previous value
    const previous = queryClient.getQueryData(['data'])

    // Optimistically update
    queryClient.setQueryData(['data'], newData)

    return { previous }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['data'], context.previous)
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['data'] })
  },
})
```

## Migration Strategy: Maintaining Cache Behavior

### Before (Client-Side Only)

```typescript
function Component() {
  const { data } = useQuery({
    ...trpc.billing.getSubscription.queryOptions(),
    staleTime: 5 * 60 * 1000,
  })
  // FOUC: data is undefined initially
}
```

### After (SSR with Loader)

```typescript
export const Route = createFileRoute('/billing')({
  loader: async ({ context }) => {
    // Pre-fetch on server, populate cache
    const subscription = await context.trpc.billing.getSubscription.ensureData()
    return { subscription }
  },
  component: Component,
})

function Component() {
  const { subscription } = Route.useLoaderData()
  // No FOUC: data available immediately

  // Optional: Keep query active for background updates
  const { data } = useQuery({
    ...trpc.billing.getSubscription.queryOptions(),
    initialData: subscription,
    staleTime: 5 * 60 * 1000,
  })
}
```

## Key Points for SSR Migration

### ✅ What Stays the Same

1. **Query keys** - No changes needed
2. **Cache configuration** - staleTime, gcTime work identically
3. **Invalidation** - Same methods work on client
4. **Mutations** - No changes needed

### ✅ What Changes

1. **Initial data source** - From loader instead of client fetch
2. **No loading states** - Data available at render time
3. **Better performance** - No waterfall requests

### ✅ Cache Invalidation Patterns

#### Pattern 1: Mutation Invalidates Query

```typescript
// In billing page after subscription change
const checkoutMutation = useMutation({
  mutationFn: () => trpcClient.billing.createCheckoutSession.mutate(),
  onSuccess: ({ url }) => {
    // Redirect to Stripe
    window.location.href = url
    // Note: No need to invalidate - page will reload
  },
})
```

#### Pattern 2: Cross-Route Invalidation

```typescript
// After updating user profile, invalidate billing data
const updateUserMutation = useMutation({
  mutationFn: (data) => trpcClient.users.update.mutate(data),
  onSuccess: async () => {
    // Invalidate user session
    await session.refetch()

    // Invalidate billing if plan changed
    await queryClient.invalidateQueries({
      queryKey: trpc.billing.getSubscription.getQueryKey(),
    })
  },
})
```

#### Pattern 3: Time-Based Invalidation

```typescript
// Dashboard with date range changes
const { dateRange } = useDashboardStore()

useEffect(() => {
  // Invalidate when date range changes
  queryClient.invalidateQueries({
    queryKey: trpc.dashboard.getStats.getQueryKey({
      startDate: dateRange.start,
      endDate: dateRange.end,
    }),
  })
}, [dateRange])
```

## Best Practices

### 1. Use Loaders for Initial Data

- Always fetch critical data in loaders
- Prevents FOUC and improves UX
- Enables proper SSR

### 2. Keep Queries Active for Updates

- Use `initialData` from loader
- Query stays active for background refetches
- Maintains real-time updates

### 3. Invalidate Strategically

- After mutations that change data
- When user actions affect multiple queries
- Use specific query keys, not broad invalidation

### 4. Configure Appropriate Stale Times

- **Frequently changing data**: 1-2 minutes
- **Stable data**: 5-10 minutes
- **Static data**: 30+ minutes

### 5. Handle Errors Gracefully

- Loaders should handle errors
- Provide fallback data when possible
- Use error boundaries for critical failures

## Testing Cache Behavior

### 1. Verify SSR

```bash
# Check HTML source includes data
curl http://localhost:3000/me/billing | grep "pro"
```

### 2. Test Cache Invalidation

```typescript
// In browser console
queryClient.getQueryCache().getAll()
queryClient.invalidateQueries({ queryKey: ['billing'] })
```

### 3. Monitor Network

- Initial load: No API calls (data from SSR)
- Navigation: API calls only if stale
- Mutations: Proper invalidation triggers refetch

## Conclusion

The SSR migration maintains all existing caching behavior while adding:

- ✅ No FOUC
- ✅ Better SEO
- ✅ Faster perceived performance
- ✅ Same cache invalidation patterns
- ✅ Same query configuration options
