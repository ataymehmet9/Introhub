import type { Resend } from 'resend'

let resendInstance: Resend | null = null
let ResendClass: typeof Resend | null = null

/**
 * Get singleton instance of Resend client
 * @returns {Promise<Resend>} Resend client instance
 */
export async function getResendInstance(): Promise<Resend> {
  // Only import Resend on the server side to avoid Buffer issues in browser
  if (typeof window !== 'undefined') {
    throw new Error('Resend can only be used on the server side')
  }

  if (!resendInstance) {
    // Dynamic import to ensure this only runs on server
    if (!ResendClass) {
      const resendModule = await import('resend')
      ResendClass = resendModule.Resend
    }
    resendInstance = new ResendClass(import.meta.env.RESEND_API_KEY)
  }
  return resendInstance
}

/**
 * Reset the Resend instance (useful for testing)
 */
export function resetResendInstance(): void {
  resendInstance = null
}
