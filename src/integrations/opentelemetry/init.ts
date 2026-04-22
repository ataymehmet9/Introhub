/**
 * OpenTelemetry Initialization
 *
 * Configures and initializes the OpenTelemetry SDK for logging to PostHog.
 */

import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'

let sdk: NodeSDK | null = null

/**
 * Initialize OpenTelemetry SDK with PostHog configuration
 */
export function initializeOpenTelemetry(): NodeSDK | null {
  // Only initialize once
  if (sdk) {
    return sdk
  }

  // Check for required environment variables
  const posthogToken =
    process.env.POSTHOG_PROJECT_TOKEN || process.env.VITE_PUBLIC_POSTHOG_KEY
  const posthogHost =
    process.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

  if (!posthogToken) {
    console.warn(
      'PostHog token not found. OpenTelemetry logging will be disabled.',
    )
    return null
  }

  const serviceName = process.env.OTEL_SERVICE_NAME || 'introhub-api'
  const logLevel = process.env.OTEL_LOG_LEVEL || 'info'

  try {
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
      },
    })

    // Create batch log processor for efficient log batching
    const logRecordProcessor = new BatchLogRecordProcessor(logExporter, {
      // Maximum queue size before forcing a flush
      maxQueueSize: 2048,
      // Maximum batch size per export
      maxExportBatchSize: 512,
      // Time interval (in milliseconds) between consecutive exports
      scheduledDelayMillis: 5000,
      // Maximum time (in milliseconds) to wait for export to complete
      exportTimeoutMillis: 30000,
    })

    // Initialize the SDK
    sdk = new NodeSDK({
      resource,
      logRecordProcessor,
    })

    sdk.start()

    console.log(
      `OpenTelemetry SDK initialized successfully for service: ${serviceName}`,
    )
    console.log(`Log level: ${logLevel}`)
    console.log(`PostHog endpoint: ${posthogHost}/i/v1/logs`)

    // Graceful shutdown on process termination
    const shutdown = async () => {
      try {
        await sdk?.shutdown()
        console.log('OpenTelemetry SDK shut down successfully')
      } catch (error) {
        console.error('Error shutting down OpenTelemetry SDK:', error)
      }
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    return sdk
  } catch (error) {
    console.error('Failed to initialize OpenTelemetry SDK:', error)
    return null
  }
}

/**
 * Get the initialized SDK instance
 */
export function getOpenTelemetrySDK(): NodeSDK | null {
  return sdk
}

/**
 * Shutdown the OpenTelemetry SDK
 */
export async function shutdownOpenTelemetry(): Promise<void> {
  if (sdk) {
    await sdk.shutdown()
    sdk = null
  }
}

// Made with Bob
