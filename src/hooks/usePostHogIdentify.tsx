import { useEffect } from 'react'
import { usePostHog } from '@posthog/react'
import { useSession } from '@/lib/auth-client'

/**
 * Custom hook to identify users in PostHog when they have an active session
 * This runs on:
 * - Login
 * - Signup
 * - Page refresh with valid cookie
 */
export function usePostHogIdentify() {
  const posthog = usePostHog()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    // Don't identify if session is still loading or PostHog is not initialized
    if (isPending || !posthog) return

    if (session?.user) {
      const { id, email, name, company, position } = session.user

      // Identify the user in PostHog
      posthog.identify(id, {
        email,
        name,
        company: company || undefined,
        position: position || undefined,
      })

      // Track session start event
      posthog.capture('session_start', {
        userId: id,
        email,
        name,
        timestamp: new Date().toISOString(),
      })

      console.log('PostHog: User identified', { id, email })
    } else {
      // Reset PostHog if no session (user logged out)
      posthog.reset()
      console.log('PostHog: User reset (no session)')
    }
  }, [session, isPending, posthog])
}

// Made with Bob
