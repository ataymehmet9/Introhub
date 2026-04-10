import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'
import type { auth } from './auth'

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
})

// Export the base auth client methods
const {
  signIn: baseSignIn,
  signOut: baseSignOut,
  signUp: baseSignUp,
  getSession,
  getAccessToken,
  useSession,
} = authClient

// Export base methods for internal use
export { baseSignIn, baseSignOut, baseSignUp }

// Export other methods directly
export { getSession, getAccessToken, useSession }

// These will be wrapped with cache clearing in auth-wrapper
export const signIn = baseSignIn
export const signOut = baseSignOut
export const signUp = baseSignUp

// Made with Bob
