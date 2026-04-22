/**
 * OpenTelemetry Logging Types
 *
 * Type definitions for structured logging events in the IntroHub application.
 */

/**
 * Log severity levels
 */
export type LogSeverity =
  | 'TRACE'
  | 'DEBUG'
  | 'INFO'
  | 'WARN'
  | 'ERROR'
  | 'FATAL'

/**
 * Base log attributes type
 */
export type Attributes = Record<string, unknown>

/**
 * Base attributes that should be included in all logs
 */
export interface BaseLogAttributes extends Attributes {
  posthogDistinctId?: string
  sessionId?: string
  timestamp: string
  service: string
}

/**
 * Authentication event attributes
 */
export interface AuthLogAttributes extends BaseLogAttributes {
  email?: string
  provider?: 'google' | 'linkedin' | 'microsoft' | 'email'
  status: 'success' | 'failed'
  error_type?: string
  duration_ms?: number
}

/**
 * Billing event attributes
 */
export interface BillingLogAttributes extends BaseLogAttributes {
  subscription_id?: string
  plan?: 'free' | 'pro'
  amount_cents?: number
  currency?: string
  stripe_session_id?: string
  error_type?: string
  error_message?: string
  attempt_count?: number
  cancel_at_period_end?: boolean
  reason?: string
}

/**
 * CRM integration event attributes
 */
export interface CRMLogAttributes extends BaseLogAttributes {
  provider: 'hubspot'
  job_id?: string
  sync_type?: 'full' | 'incremental'
  stage?: 'fetching' | 'mapping' | 'syncing' | 'completed'
  total_contacts?: number
  processed_contacts?: number
  created_count?: number
  updated_count?: number
  skipped_count?: number
  error_count?: number
  percentage?: number
  is_reconnection?: boolean
  duration_ms?: number
  error_type?: string
}

/**
 * AI generation event attributes
 */
export interface AILogAttributes extends BaseLogAttributes {
  target_contact_id?: number
  model?: string
  rate_limit_remaining?: number
  token_count?: number
  retry_count?: number
  generations_this_hour?: number
  limit?: number
  reset_at?: string
  duration_ms?: number
  error_type?: string
}

/**
 * Contact management event attributes
 */
export interface ContactLogAttributes extends BaseLogAttributes {
  contact_id?: number
  source?: 'manual' | 'csv_import' | 'crm_sync'
  fields_updated?: Array<string>
  total_rows?: number
  successful_imports?: number
  failed_imports?: number
  duration_ms?: number
  error_type?: string
}

/**
 * Introduction request event attributes
 */
export interface IntroductionLogAttributes extends BaseLogAttributes {
  request_id?: number
  target_contact_id?: number
  approver_id?: string
  requester_id?: string
  email_type?: 'request' | 'approval' | 'rejection' | 'introduction'
  recipient_email?: string
  has_ai_message?: boolean
  response_time_hours?: number
  reason?: string
  error_type?: string
}

/**
 * Error event attributes
 */
export interface ErrorLogAttributes extends BaseLogAttributes {
  error_type: string
  error_message: string
  stack_trace?: string
  context?: Record<string, unknown>
  endpoint?: string
  category:
    | 'database'
    | 'external_api'
    | 'validation'
    | 'authorization'
    | 'rate_limit'
    | 'system'
}

/**
 * Log event types
 */
export type LogEvent =
  // Authentication
  | 'auth.signup'
  | 'auth.signin'
  | 'auth.signout'
  | 'auth.password_reset'
  // Billing
  | 'billing.checkout_created'
  | 'billing.subscription_activated'
  | 'billing.payment_failed'
  | 'billing.subscription_canceled'
  | 'billing.subscription_updated'
  // CRM
  | 'crm.oauth_flow'
  | 'crm.sync_started'
  | 'crm.sync_progress'
  | 'crm.sync_completed'
  | 'crm.connection_failed'
  // AI
  | 'ai.generation_requested'
  | 'ai.generation_completed'
  | 'ai.rate_limit_exceeded'
  // Contacts
  | 'contact.created'
  | 'contact.updated'
  | 'contact.deleted'
  | 'contact.bulk_import'
  | 'contact.batch_deleted'
  | 'contact.batch_uploaded'
  | 'contact.read_success'
  | 'contact.read_failed'
  | 'contact.read_error'
  // Introduction Requests
  | 'introduction.request_created'
  | 'introduction.request_approved'
  | 'introduction.request_rejected'
  | 'introduction.email_sent'
  // Errors
  | 'error.database'
  | 'error.external_api'
  | 'error.validation'
  | 'error.authorization'
  | 'error.rate_limit'
  | 'error.system'

/**
 * Structured log entry
 */
export interface LogEntry<T extends Attributes = Attributes> {
  event: LogEvent
  severity: LogSeverity
  message: string
  attributes: T
}

/**
 * Log context for tracking request-level information
 */
export interface LogContext {
  userId?: string
  sessionId?: string
  requestId?: string
  userAgent?: string
  ip?: string
}

// Made with Bob
