# SSR Migration Plan for IntroHub TanStack Start Application

## Problem Statement

The application was experiencing Flash of Unstyled Content (FOUC) issues due to client-side data fetching. For example, on the billing page, users would briefly see "free tier" status before it switched to the correct "pro tier" status once data loaded from the client.

**Root Cause**: All data fetching was happening on the client using hooks (`useQuery`, `useInfiniteQuery`), despite TanStack Start being designed for Server-Side Rendering (SSR).

## Solution Overview

Convert routes to use TanStack Start's `loader` functions with server-side TRPC calls to fetch data during SSR, eliminating FOUC and improving perceived performance.

## Technical Approach

### 1. Server Function Pattern

Create server functions using `createServerFn()` that:

- Extract auth headers from the request
- Get session from Better Auth
- Create TRPC caller with context
- Fetch data server-side
- Return only serializable data (no functions)

```typescript
const getPageData = createServerFn()
  .validator((data: InputType) => data)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const { session, user } = (await auth.api.getSession({ headers })) ?? {}

    if (!user) {
      throw new Error('Unauthorized')
    }

    const context = { db, session, user }
    const caller = trpcRouter.createCaller(context)

    const result = await caller.namespace.procedure(data)

    return { result }
  })
```

### 2. Route Loader Pattern

```typescript
export const Route = createFileRoute('/route-path')({
  loader: async ({ location }) => {
    const search = searchSchema.parse(location.search)
    return await getPageData({ data: search })
  },
  component: RouteComponent,
})
```

### 3. Component Pattern

For regular queries:

```typescript
function RouteComponent() {
  const loaderData = Route.useLoaderData()

  const { data } = useQuery({
    ...trpc.namespace.procedure.queryOptions(),
    initialData: loaderData.result,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return <div>{/* Use data */}</div>
}
```

For infinite queries:

```typescript
function RouteComponent() {
  const loaderData = Route.useLoaderData()

  const { data } = useInfiniteQuery({
    queryKey: ['key', params],
    queryFn: async ({ pageParam }) => {
      return trpcClient.namespace.procedure.query({ page: pageParam, ...params })
    },
    getNextPageParam: (lastPage) => lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    initialData: loaderData.result ? {
      pages: [loaderData.result],
      pageParams: [1],
    } : undefined,
    staleTime: 5 * 60 * 1000,
  })

  return <div>{/* Use data */}</div>
}
```

## SSR Strategy: Streaming vs Full HTML

### Streaming SSR (Default - RECOMMENDED)

- Data is fetched on server and serialized in HTML
- HTML shell sent immediately
- Client hydrates with serialized data (no refetch)
- UI state (theme, navigation) loads from localStorage separately
- **Pros**: No FOUC for data, no hydration mismatches for UI state
- **Cons**: Brief moment where theme/nav loads after initial render

### Full HTML SSR (`ssr: true`)

- Complete HTML rendered on server including all UI state
- **Pros**: Fully rendered page sent to client
- **Cons**: Theme (localStorage) and navigation (Zustand) not available during SSR → hydration mismatch

**Decision**: Use streaming SSR (default) for all routes to avoid hydration mismatches while still eliminating data FOUC.

## Migration Status

### ✅ Completed Routes

#### 1. `/me/billing` - Billing Page

- **Data**: Subscription details, plan information
- **Pattern**: Regular query with `initialData`
- **Status**: ✅ Converted and tested
- **Files Modified**:
  - `src/routes/_authenticated/(user)/me/billing.tsx`

#### 2. `/me/notifications` - Notifications Page

- **Data**: Paginated notifications list
- **Pattern**: Infinite query with `initialData`
- **Status**: ✅ Converted, needs testing
- **Files Modified**:
  - `src/routes/_authenticated/(user)/me/notifications.tsx`
  - `src/hooks/useNotifications.tsx` (added `initialData` support)

### 🔄 Routes to Convert

#### 3. `/dashboard` - Dashboard Page

- **Data**:
  - Dashboard stats (total contacts, requests, etc.)
  - Trend data (charts)
  - Top contacts
- **Hooks Used**:
  - `useDashboardStats()`
  - `useDashboardTrends()`
  - `useTopContacts()`
- **Pattern**: Multiple regular queries
- **Priority**: HIGH (main landing page)

#### 4. `/search` - Search Page

- **Data**: Search results
- **Hooks Used**: `useSearch()`
- **Pattern**: Regular query with search params
- **Priority**: HIGH (core feature)

#### 5. `/contacts` - Contacts Page

- **Data**: Contacts list
- **Hooks Used**: `useContact()`
- **Pattern**: Regular query or infinite query
- **Priority**: HIGH (core feature)

#### 6. `/requests` - Requests Page

- **Data**: Introduction requests
- **Hooks Used**: `useRequests()`
- **Pattern**: Regular query or infinite query
- **Priority**: HIGH (core feature)

### ⏭️ Routes That Don't Need SSR

#### `/me/index` - Profile Page

- **Reason**: Uses session data already available from auth context
- **Status**: No changes needed

#### `/me/security` - Security Settings

- **Reason**: No data fetching, just forms
- **Status**: No changes needed

## Implementation Steps

### For Each Route:

1. **Read the route file** to understand current data fetching
2. **Identify the hooks** used for data fetching
3. **Create server function** using the pattern above
4. **Update route loader** to call server function
5. **Update component** to use `Route.useLoaderData()` and pass to hook as `initialData`
6. **Update hook** (if needed) to accept `initialData` parameter
7. **Test** the route for:
   - No FOUC on initial load
   - Data displays correctly
   - Client-side navigation works
   - Mutations still work
   - Real-time updates (SSE) still work
8. **Commit** changes with descriptive message

## Testing Checklist

For each converted route, verify:

- [ ] Initial page load shows correct data immediately (no flash)
- [ ] Data is correct and matches expected values
- [ ] Loading states work during client-side navigation
- [ ] Mutations (create, update, delete) work correctly
- [ ] Optimistic updates work
- [ ] Real-time updates via SSE work
- [ ] Error handling works
- [ ] Search/filter parameters work
- [ ] Pagination works (for infinite queries)
- [ ] Browser back/forward navigation works

## Key Learnings

### 1. Serialization

- Server functions must return only serializable data
- Cannot return TRPC caller objects or functions
- Dates are serialized as strings and need parsing on client

### 2. Infinite Queries

- Need special handling for `initialData`
- Must wrap in `{ pages: [data], pageParams: [1] }` structure
- Hook needs to accept `initialData` parameter

### 3. Streaming SSR

- Default streaming SSR is better than full HTML SSR
- Avoids hydration mismatches with localStorage-based state
- Still eliminates data FOUC

### 4. Cache Configuration

- Use `staleTime: 5 * 60 * 1000` (5 minutes) for SSR data
- Prevents immediate refetch after SSR
- Allows client-side navigation to use cached data

## Files Modified

### Core Files

- `src/routes/_authenticated.tsx` - Re-added Suspense boundary
- `documentation/SSR_CACHING_STRATEGY.md` - Caching documentation

### Route Files

- `src/routes/_authenticated/(user)/me/billing.tsx`
- `src/routes/_authenticated/(user)/me/notifications.tsx`

### Hook Files

- `src/hooks/useNotifications.tsx` - Added `initialData` support

### Deleted Files

- `src/integrations/trpc/server-caller.ts` - Unused utility

## Next Steps

1. Test notifications page SSR
2. Convert dashboard page (highest priority)
3. Convert search, contacts, and requests pages
4. Test all converted pages thoroughly
5. Commit all changes
6. Update documentation with final patterns
7. Consider adding E2E tests for SSR behavior

## References

- [TanStack Start Documentation](https://tanstack.com/start/latest)
- [TanStack Query SSR Guide](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- Internal: `documentation/SSR_CACHING_STRATEGY.md`
