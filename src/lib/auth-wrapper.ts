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

      // Only clear if this is a DIFFERENT session (not just first load)
      if (lastClearedSession && lastClearedSession !== sessionId) {
        console.log(
          `[Auth] Session changed from ${lastClearedSession} to ${sessionId}, clearing caches for user ${userId}`,
        )

        // CRITICAL: Remove ALL notification queries regardless of userId
        // This prevents cached data from previous users
        queryClient.removeQueries({
          predicate: (query) => {
            const key = query.queryKey
            // Remove any query that has 'notifications' in its key path
            return (
              Array.isArray(key) &&
              (key.includes('notifications') ||
                (Array.isArray(key[0]) && key[0].includes('notifications')) ||
                (Array.isArray(key[1]) && key[1] === 'notifications'))
            )
          },
        })

        console.log(
          `[Auth] Notification queries cleared for session change: ${sessionId}, user: ${userId}`,
        )
      }

      // Always update the session tracker
      if (!lastClearedSession) {
        console.log(
          `[Auth] First session detected: ${sessionId}, user: ${userId}`,
        )
      }
      sessionStorage.setItem('lastClearedSession', sessionId)
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
