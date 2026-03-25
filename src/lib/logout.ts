import { useQueryClient } from '@tanstack/react-query'
import { usePostHog } from '@posthog/react'
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

  const logout = async () => {
    try {
      // Step 1: Clear ALL query cache - this is critical for security
      // This removes all cached queries, mutations, and their data
      queryClient.clear()

      // Step 2: Sign out the user
      await signOut()

      // Step 3: Reset PostHog to prevent cross-user analytics tracking
      posthog.reset()

      // Step 4: Additional cleanup - remove any query cache observers
      queryClient.removeQueries()

      // Step 5: Clear mutation cache as well
      queryClient.getMutationCache().clear()

      console.log('Logout complete: All caches cleared')
    } catch (error) {
      console.error('Error during logout:', error)
      // Even if there's an error, still try to clear the cache
      queryClient.clear()
      queryClient.removeQueries()
      queryClient.getMutationCache().clear()
      posthog.reset()
      throw error
    }
  }

  return { logout }
}
