# Logout Cache Clearing Implementation

## Overview

This document describes the implementation of secure logout functionality that prevents data leaks between user sessions by clearing all cached queries.

## Problem

When a user logged out and another user logged in on the same device/browser, cached data from the previous user (contacts, requests, etc.) could be visible to the new user. This was a critical security vulnerability.

## Solution

Created a custom logout handler (`useLogout`) that performs comprehensive cleanup:

### Implementation Details

#### 1. Custom Logout Hook (`src/lib/logout.ts`)

```typescript
export const useLogout = () => {
  const queryClient = useQueryClient()
  const posthog = usePostHog()

  const logout = async () => {
    // Clear ALL query cache
    queryClient.clear()

    // Sign out the user
    await signOut()

    // Reset PostHog analytics
    posthog.reset()

    // Remove all query observers
    queryClient.removeQueries()

    // Clear mutation cache
    queryClient.getMutationCache().clear()
  }

  return { logout }
}
```

#### 2. Updated UserProfileDropdown

The logout button now uses the secure logout handler:

```typescript
const { logout } = useLogout()

const handleSignOut = async () => {
  try {
    await logout()
    navigate({ to: '/login' })
  } catch (error) {
    console.error('Logout failed:', error)
    navigate({ to: '/login' })
  }
}
```

## Security Benefits

1. **Complete Cache Clearing**: All TanStack Query cache is cleared, including:
   - Query cache (all fetched data)
   - Mutation cache (pending mutations)
   - Query observers (active subscriptions)

2. **Analytics Reset**: PostHog user identity is reset to prevent cross-user tracking

3. **Error Handling**: Even if logout fails, cache is still cleared and user is redirected

## Testing

To verify the fix works:

1. Log in as User A
2. Navigate to contacts/requests pages (load data)
3. Log out
4. Log in as User B
5. Verify User B cannot see User A's data

## Files Modified

- `src/lib/logout.ts` - New custom logout handler
- `src/components/template/UserProfileDropdown.tsx` - Updated to use new logout handler

## Related Issues

This fix addresses the critical security vulnerability where cached data could leak between user sessions.
