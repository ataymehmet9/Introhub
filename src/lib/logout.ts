import { useQueryClient } from '@tanstack/react-query'
import { usePostHog } from '@posthog/react'
import { useRouter } from '@tanstack/react-router'
import { signOut } from './auth-client'

/**
 * Custom logout handler that ensures complete cleanup of user data
 *
 * This function performs the following critical security operations:
 * 1. Clears ALL TanStack Query cache to prevent data leaks between users
 * 2. Signs out the user via better-auth
 * 3. Resets PostHog analytics to prevent cross-user tracking
 *
 * SECURITY: This prevents cached data from one user being visible to another user
 * after logout/login on the same device/browser.
 */
export const useLogout = () => {
  const queryClient = useQueryClient()
  const posthog = usePostHog()
  const router = useRouter()

  const logout = async () => {
    try {
      console.log('[Logout] Starting logout process...')

      // Step 1: Clear ALL query cache - this is critical for security
      // This removes all cached queries, mutations, and their data
      queryClient.clear()

      // Step 2: Specifically remove notification queries to prevent cross-user data leaks
      queryClient.removeQueries({
        queryKey: ['notifications'],
      })
      queryClient.removeQueries({
        queryKey: ['trpc', 'notifications'],
      })

      // Step 3: Sign out the user
      await signOut()

      // Step 4: Reset PostHog to prevent cross-user analytics tracking
      posthog.reset()

      // Step 5: Additional cleanup - remove any query cache observers
      queryClient.removeQueries()

      // Step 6: Clear mutation cache as well
      queryClient.getMutationCache().clear()

      // Step 7: Clear TanStack Router loader cache - THIS IS CRITICAL FOR SSR DATA
      router.invalidate()

      // Step 8: Clear session tracking to force cache clear on next login
      sessionStorage.removeItem('lastClearedSession')

      console.log(
        '[Logout] Complete: All caches cleared including router loaders and notification queries',
      )
    } catch (error) {
      console.error('[Logout] Error during logout:', error)
      // Even if there's an error, still try to clear the cache
      queryClient.clear()
      queryClient.removeQueries({
        queryKey: ['notifications'],
      })
      queryClient.removeQueries({
        queryKey: ['trpc', 'notifications'],
      })
      queryClient.removeQueries()
      queryClient.getMutationCache().clear()
      router.invalidate()
      posthog.reset()
      sessionStorage.removeItem('lastClearedSession')
      throw error
    }
  }

  return { logout }
}
