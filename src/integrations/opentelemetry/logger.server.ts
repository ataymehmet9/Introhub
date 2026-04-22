/**
 * OpenTelemetry Logger - Server Only
 *
 * This file should only be imported in server-side code.
 * For client-side code, use the stub functions from logger.ts
 */

import { logs } from '@opentelemetry/api-logs'
import type {
  AILogAttributes,
  Attributes,
  AuthLogAttributes,
  BillingLogAttributes,
  CRMLogAttributes,
  ContactLogAttributes,
  ErrorLogAttributes,
  IntroductionLogAttributes,
  LogEvent,
  LogSeverity,
} from './types'

/**
 * Get the logger instance
 */
function getLogger() {
  return logs.getLogger('introhub-app', '1.0.0')
}

/**
 * Base log function
 */
function log(
  event: LogEvent,
  severity: LogSeverity,
  message: string,
  attributes: Attributes,
): void {
  const logger = getLogger()

  try {
    logger.emit({
      severityText: severity,
      body: message,
      attributes: {
        event,
        service: 'introhub-api',
        timestamp: new Date().toISOString(),
        ...attributes,
      },
    })
  } catch (error) {
    // Silently fail - logging should never break the application
    console.error('Failed to emit log:', error)
  }
}

/**
 * Authentication logging
 */
export const authLogger = {
  signup: (attributes: Omit<AuthLogAttributes, 'timestamp' | 'service'>) => {
    log(
      'auth.signup',
      attributes.status === 'success' ? 'INFO' : 'ERROR',
      `User signup ${attributes.status}`,
      attributes,
    )
  },

  signin: (attributes: Omit<AuthLogAttributes, 'timestamp' | 'service'>) => {
    log(
      'auth.signin',
      attributes.status === 'success' ? 'INFO' : 'ERROR',
      `User signin ${attributes.status}`,
      attributes,
    )
  },

  signout: (
    attributes: Omit<AuthLogAttributes, 'timestamp' | 'service' | 'status'>,
  ) => {
    log('auth.signout', 'INFO', 'User signed out', {
      ...attributes,
      status: 'success',
    })
  },

  passwordReset: (
    attributes: Omit<AuthLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log(
      'auth.password_reset',
      attributes.status === 'success' ? 'INFO' : 'ERROR',
      `Password reset ${attributes.status}`,
      attributes,
    )
  },
}

/**
 * Billing logging
 */
export const billingLogger = {
  checkoutCreated: (
    attributes: Omit<BillingLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log(
      'billing.checkout_created',
      'INFO',
      'Checkout session created',
      attributes,
    )
  },

  subscriptionActivated: (
    attributes: Omit<BillingLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log(
      'billing.subscription_activated',
      'INFO',
      'Subscription activated',
      attributes,
    )
  },

  paymentFailed: (
    attributes: Omit<BillingLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log('billing.payment_failed', 'ERROR', 'Payment failed', attributes)
  },

  subscriptionCanceled: (
    attributes: Omit<BillingLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log(
      'billing.subscription_canceled',
      'WARN',
      'Subscription canceled',
      attributes,
    )
  },

  subscriptionUpdated: (
    attributes: Omit<BillingLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log(
      'billing.subscription_updated',
      'INFO',
      'Subscription updated',
      attributes,
    )
  },
}

/**
 * CRM logging
 */
export const crmLogger = {
  oauthFlow: (attributes: Omit<CRMLogAttributes, 'timestamp' | 'service'>) => {
    log(
      'crm.oauth_flow',
      attributes.success ? 'INFO' : 'ERROR',
      `CRM OAuth ${attributes.success ? 'successful' : 'failed'}`,
      attributes,
    )
  },

  syncStarted: (
    attributes: Omit<CRMLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log('crm.sync_started', 'INFO', 'CRM sync started', attributes)
  },

  syncProgress: (
    attributes: Omit<CRMLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log('crm.sync_progress', 'INFO', 'CRM sync in progress', attributes)
  },

  syncCompleted: (
    attributes: Omit<CRMLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log('crm.sync_completed', 'INFO', 'CRM sync completed', attributes)
  },

  connectionFailed: (
    attributes: Omit<CRMLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log('crm.connection_failed', 'ERROR', 'CRM connection failed', attributes)
  },
}

/**
 * AI logging
 */
export const aiLogger = {
  generationRequested: (
    attributes: Omit<AILogAttributes, 'timestamp' | 'service'>,
  ) => {
    log(
      'ai.generation_requested',
      'INFO',
      'AI generation requested',
      attributes,
    )
  },

  generationCompleted: (
    attributes: Omit<AILogAttributes, 'timestamp' | 'service'>,
  ) => {
    log(
      'ai.generation_completed',
      attributes.error_type ? 'ERROR' : 'INFO',
      `AI generation ${attributes.error_type ? 'failed' : 'completed'}`,
      attributes,
    )
  },

  rateLimitExceeded: (
    attributes: Omit<AILogAttributes, 'timestamp' | 'service'>,
  ) => {
    log('ai.rate_limit_exceeded', 'WARN', 'AI rate limit exceeded', attributes)
  },
}

/**
 * Contact management logging
 */
export const contactLogger = {
  created: (
    attributes: Omit<ContactLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log('contact.created', 'INFO', 'Contact created', attributes)
  },

  updated: (
    attributes: Omit<ContactLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log('contact.updated', 'INFO', 'Contact updated', attributes)
  },

  deleted: (
    attributes: Omit<ContactLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log('contact.deleted', 'INFO', 'Contact deleted', attributes)
  },

  bulkImport: (
    attributes: Omit<ContactLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log(
      'contact.bulk_import',
      typeof attributes.failed_imports === 'number' &&
        attributes.failed_imports > 0
        ? 'WARN'
        : 'INFO',
      'Contact bulk import completed',
      attributes,
    )
  },

  batchDeleted: (
    attributes: Omit<ContactLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log('contact.batch_deleted', 'INFO', 'Contacts batch deleted', attributes)
  },

  batchUploaded: (
    attributes: Omit<ContactLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log(
      'contact.batch_uploaded',
      typeof attributes.error_count === 'number' && attributes.error_count > 0
        ? 'WARN'
        : 'INFO',
      'Contacts batch uploaded',
      attributes,
    )
  },

  readSuccess: (
    attributes: Omit<ContactLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log('contact.read_success', 'INFO', 'Contact read successful', attributes)
  },

  readFailed: (
    attributes: Omit<ContactLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log('contact.read_failed', 'WARN', 'Contact read failed', attributes)
  },

  readError: (
    attributes: Omit<ContactLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log('contact.read_error', 'ERROR', 'Contact read error', attributes)
  },
}

/**
 * Introduction request logging
 */
export const introductionLogger = {
  requestCreated: (
    attributes: Omit<IntroductionLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log(
      'introduction.request_created',
      'INFO',
      'Introduction request created',
      attributes,
    )
  },

  requestApproved: (
    attributes: Omit<IntroductionLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log(
      'introduction.request_approved',
      'INFO',
      'Introduction request approved',
      attributes,
    )
  },

  requestRejected: (
    attributes: Omit<IntroductionLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log(
      'introduction.request_rejected',
      'INFO',
      'Introduction request rejected',
      attributes,
    )
  },

  emailSent: (
    attributes: Omit<IntroductionLogAttributes, 'timestamp' | 'service'>,
  ) => {
    log(
      'introduction.email_sent',
      attributes.success ? 'INFO' : 'ERROR',
      `Introduction email ${attributes.success ? 'sent' : 'failed'}`,
      attributes,
    )
  },
}

/**
 * Error logging
 */
export const errorLogger = {
  database: (
    attributes: Omit<ErrorLogAttributes, 'timestamp' | 'service' | 'category'>,
  ) => {
    log('error.database', 'ERROR', 'Database error', {
      ...attributes,
      category: 'database',
    })
  },

  externalApi: (
    attributes: Omit<ErrorLogAttributes, 'timestamp' | 'service' | 'category'>,
  ) => {
    log('error.external_api', 'ERROR', 'External API error', {
      ...attributes,
      category: 'external_api',
    })
  },

  validation: (
    attributes: Omit<ErrorLogAttributes, 'timestamp' | 'service' | 'category'>,
  ) => {
    log('error.validation', 'ERROR', 'Validation error', {
      ...attributes,
      category: 'validation',
    })
  },

  authorization: (
    attributes: Omit<ErrorLogAttributes, 'timestamp' | 'service' | 'category'>,
  ) => {
    log('error.authorization', 'ERROR', 'Authorization error', {
      ...attributes,
      category: 'authorization',
    })
  },

  rateLimit: (
    attributes: Omit<ErrorLogAttributes, 'timestamp' | 'service' | 'category'>,
  ) => {
    log('error.rate_limit', 'ERROR', 'Rate limit error', {
      ...attributes,
      category: 'rate_limit',
    })
  },

  system: (
    attributes: Omit<ErrorLogAttributes, 'timestamp' | 'service' | 'category'>,
  ) => {
    log('error.system', 'ERROR', 'System error', {
      ...attributes,
      category: 'system',
    })
  },
}

// Made with Bob
