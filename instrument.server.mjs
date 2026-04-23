/**
 * Server Instrumentation
 * Initializes OpenTelemetry and Sentry before the application starts
 */

import { LoggerProvider } from '@opentelemetry/sdk-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { logs } from '@opentelemetry/api-logs'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'

// Initialize OpenTelemetry
let loggerProvider = null

try {
  const posthogToken =
    process.env.POSTHOG_PROJECT_TOKEN || process.env.VITE_PUBLIC_POSTHOG_KEY
  const posthogHost =
    process.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

  if (posthogToken) {
    const serviceName = process.env.OTEL_SERVICE_NAME || 'introhub-api'

    // Create resource with service information
    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    })

    // Create OTLP log exporter for PostHog
    const logExporter = new OTLPLogExporter({
      url: `${posthogHost}/i/v1/logs`,
      headers: {
        Authorization: `Bearer ${posthogToken}`,
        'Content-Type': 'application/json',
      },
    })

    // Create batch log processor
    const logRecordProcessor = new BatchLogRecordProcessor(logExporter, {
      maxQueueSize: 2048,
      maxExportBatchSize: 512,
      scheduledDelayMillis: 5000,
      exportTimeoutMillis: 30000,
    })

    // Create and register LoggerProvider with processors
    loggerProvider = new LoggerProvider({
      resource,
      processors: [logRecordProcessor],
    })

    // CRITICAL: Register the logger provider globally
    logs.setGlobalLoggerProvider(loggerProvider)

    console.log('✓ OpenTelemetry logging initialized successfully')
    console.log(`  Service: ${serviceName}`)
    console.log(`  Endpoint: ${posthogHost}/i/v1/logs`)

    // Graceful shutdown
    const shutdown = async () => {
      try {
        await loggerProvider?.shutdown()
        console.log('OpenTelemetry LoggerProvider shut down successfully')
      } catch (error) {
        console.error('Error shutting down OpenTelemetry:', error)
      }
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
  } else {
    console.warn('⚠ OpenTelemetry logging is disabled (missing PostHog token)')
  }
} catch (error) {
  console.warn('⚠ Failed to initialize OpenTelemetry:', error.message)
}

// Initialize Sentry after OpenTelemetry
const Sentry = await import('@sentry/tanstackstart-react')

const sentryDsn =
  import.meta.env?.VITE_SENTRY_DSN ?? process.env.VITE_SENTRY_DSN

if (!sentryDsn) {
  console.warn('VITE_SENTRY_DSN is not defined. Sentry is not running.')
} else {
  Sentry.init({
    dsn: sentryDsn,
    sendDefaultPii: true,
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
  })
  console.log('✓ Sentry initialized successfully')
}

// Made with Bob
