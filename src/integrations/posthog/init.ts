import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

export function getPostHogClient() {
  // Only initialize if we have the required environment variables
  if (!process.env.VITE_PUBLIC_POSTHOG_KEY) {
    console.warn('PostHog API key not found. Analytics will be disabled.')
    return null
  }

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.VITE_PUBLIC_POSTHOG_KEY || '', {
      host: process.env.VITE_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return posthogClient
}
