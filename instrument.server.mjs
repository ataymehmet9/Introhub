import * as Sentry from '@sentry/tanstackstart-react'
import { initializeNotificationBridge } from './src/lib/notification-bridge.ts'

const sentryDsn =
  import.meta.env?.VITE_SENTRY_DSN ?? process.env.VITE_SENTRY_DSN

if (!sentryDsn) {
  console.warn('VITE_SENTRY_DSN is not defined. Sentry is not running.')
} else {
  Sentry.init({
    dsn: sentryDsn,
    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
  })
}

// Initialize Redis pub/sub bridge for cross-process notifications
// This enables the BullMQ worker to send notifications to SSE connections
initializeNotificationBridge().catch((error) => {
  console.error('Failed to initialize notification bridge:', error)
})
