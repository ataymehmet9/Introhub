import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePostHog } from '@posthog/react'
import { useRouter } from '@tanstack/react-router'
import { authClient, baseSignIn, baseSignUp } from './auth-client'

/**
 * Secure authentication wrapper that ensures complete cache cleanup
 * on ALL authentication state changes (login, logout, signup).
 *
 * SECURITY CRITICAL: This prevents cached data from one user being
 * visible to another user after authentication state changes.
 *
 * Usage: Use these hooks instead of calling auth methods directly
 */

/**
 * Hook for secure sign in with automatic cache clearing
 */
export const useSecureSignIn = () => {
  const queryClient = useQueryClient()
  const posthog = usePostHog()
  const router = useRouter()

  const clearAllCaches = () => {
    queryClient.clear()
    queryClient.removeQueries()
    queryClient.getMutationCache().clear()
    posthog.reset()
    // Clear TanStack Router loader cache - THIS IS CRITICAL FOR SSR DATA
    router.invalidate()
    // Clear session tracking to ensure fresh cache on this login
    sessionStorage.removeItem('lastClearedSession')
    console.log('All caches cleared including router loaders')
  }

  const signIn = async (...args: Parameters<typeof baseSignIn.email>) => {
    try {
      // Step 1: Clear ALL existing cache BEFORE signing in
      clearAllCaches()
      console.log('Pre-login cache cleared')

      // Step 2: Perform the actual sign in
      const result = await baseSignIn.email(...args)

      // Step 3: If sign in was successful, clear cache again to ensure fresh start
      if (!result.error) {
        clearAllCaches()
        console.log('Post-login cache cleared - fresh session started')
      }

      return result
    } catch (error) {
      console.error('Error during secure sign in:', error)
      // Even on error, ensure cache is cleared
      clearAllCaches()
      throw error
    }
  }

  const signInSocial = async (
    ...args: Parameters<typeof baseSignIn.social>
  ) => {
    try {
      // Clear cache before OAuth redirect
      clearAllCaches()
      console.log('Pre-OAuth cache cleared')

      // Perform OAuth sign in (this will redirect)
      await baseSignIn.social(...args)
    } catch (error) {
      console.error('Error during secure OAuth sign in:', error)
      clearAllCaches()
      throw error
    }
  }

  return { signIn, signInSocial }
}

/**
 * Hook for secure sign up with automatic cache clearing
 */
export const useSecureSignUp = () => {
  const queryClient = useQueryClient()
  const posthog = usePostHog()
  const router = useRouter()

  const clearAllCaches = () => {
    queryClient.clear()
    queryClient.removeQueries()
    queryClient.getMutationCache().clear()
    posthog.reset()
    // Clear TanStack Router loader cache - THIS IS CRITICAL FOR SSR DATA
    router.invalidate()
    // Clear session tracking to ensure fresh cache on this signup
    sessionStorage.removeItem('lastClearedSession')
    console.log('All caches cleared including router loaders')
  }

  const signUp = async (...args: Parameters<typeof baseSignUp.email>) => {
    try {
      // Step 1: Clear ALL existing cache BEFORE signing up
      clearAllCaches()
      console.log('Pre-signup cache cleared')

      // Step 2: Perform the actual sign up
      const result = await baseSignUp.email(...args)

      // Step 3: If sign up was successful, clear cache again to ensure fresh start
      if (!result.error) {
        clearAllCaches()
        console.log('Post-signup cache cleared - fresh session started')
      }

      return result
    } catch (error) {
      console.error('Error during secure sign up:', error)
      // Even on error, ensure cache is cleared
      clearAllCaches()
      throw error
    }
  }

  return { signUp }
}

/**
 * Hook for secure sign out with automatic cache clearing
 * This is an alias to useLogout for consistency
 */
export { useLogout as useSecureSignOut } from './logout'

/**
 * Hook to clear all caches when returning from OAuth redirect
 * This should be called in the authenticated layout to ensure
 * cache is cleared after OAuth authentication completes
 */
export const useClearCacheOnAuth = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const session = authClient.useSession()

  // Use useEffect to only run once when session changes
  useEffect(() => {
    // Clear cache when session changes (e.g., after OAuth redirect or any new login)
    if (session.data?.user && !session.isPending) {
      const sessionId = session.data.session.id
      const userId = session.data.user.id
      const lastClearedSession = sessionStorage.getItem('lastClearedSession')

      // Always clear if this is a different session OR if no session was tracked
      if (!lastClearedSession || lastClearedSession !== sessionId) {
        console.log(
          `[Auth] New session detected (${sessionId}), clearing all caches for user ${userId}`,
        )

        // Clear ALL query cache
        queryClient.clear()
        queryClient.removeQueries()
        queryClient.getMutationCache().clear()

        // Clear TanStack Router loader cache - THIS IS CRITICAL FOR SSR DATA
        router.invalidate()

        // Specifically invalidate notification queries to ensure fresh data
        queryClient.invalidateQueries({
          queryKey: ['notifications'],
          refetchType: 'all',
        })

        // Force refetch of unread count for the new user
        queryClient.refetchQueries({
          queryKey: ['trpc', 'notifications', 'getUnreadCount'],
          type: 'active',
        })

        sessionStorage.setItem('lastClearedSession', sessionId)
        console.log(
          `[Auth] Cache cleared and notification queries invalidated for session: ${sessionId}`,
        )
      }
    }
  }, [
    session.data?.session.id,
    session.data?.user.id,
    session.isPending,
    queryClient,
    router,
  ])
}

// Made with Bob
