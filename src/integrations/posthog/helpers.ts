import { getPostHogClient } from './init'

export function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>,
) {
  const client = getPostHogClient()
  if (!client) return

  try {
    client.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        $lib: 'posthog-node',
        $lib_version: '5.26.0',
      },
    })
  } catch (error) {
    console.error('Failed to track PostHog event:', error)
  }
}

/**
 * Identify a user with PostHog
 */
export function identifyUser(
  distinctId: string,
  properties?: Record<string, any>,
) {
  const client = getPostHogClient()
  if (!client) return

  try {
    client.identify({
      distinctId,
      properties,
    })
  } catch (error) {
    console.error('Failed to identify user in PostHog:', error)
  }
}
