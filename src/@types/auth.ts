import type { User as BetterAuthUser, Session } from 'better-auth/types'

// Better Auth sign-in credentials
export type SignInCredential = {
  email: string
  password: string
}

// Better Auth sign-up credentials
export type SignUpCredential = {
  name: string
  email: string
  password: string
}

// Better Auth forgot password
export type ForgotPassword = {
  email: string
}

// Better Auth reset password
export type ResetPassword = {
  password: string
  token?: string
}

// Auth request status
export type AuthRequestStatus = 'success' | 'failed' | ''

// Auth result type
export type AuthResult = Promise<{
  status: AuthRequestStatus
  message: string
}>

// Better Auth User type (extends the session user)
export type User = BetterAuthUser

// Better Auth Session type
export type AuthSession = Session

// OAuth sign-in callback payload
export type OauthSignInCallbackPayload = {
  onSignIn: (session: AuthSession) => void
  redirect: () => void
}
