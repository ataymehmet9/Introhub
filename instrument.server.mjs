// Initialize OpenTelemetry first (must be before other instrumentation)
import { initializeOpenTelemetry } from './src/integrations/opentelemetry/init.ts'

// Initialize OpenTelemetry SDK
const otelSDK = initializeOpenTelemetry()

if (otelSDK) {
  console.log('✓ OpenTelemetry logging initialized successfully')
} else {
  console.warn('⚠ OpenTelemetry logging is disabled (missing PostHog token)')
}

// Initialize Sentry after OpenTelemetry
import * as Sentry from '@sentry/tanstackstart-react'

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
  console.log('✓ Sentry initialized successfully')
}
