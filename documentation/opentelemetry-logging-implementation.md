# OpenTelemetry Logging Implementation Plan

## Overview

This document outlines the implementation plan for integrating OpenTelemetry logging with PostHog in the IntroHub application. The goal is to establish comprehensive logging for critical user flows, errors, and warnings to enable effective debugging and monitoring.

## Architecture

### Technology Stack

- **OpenTelemetry SDK**: `@opentelemetry/sdk-node`
- **OTLP Exporter**: `@opentelemetry/exporter-logs-otlp-http`
- **Log Processor**: `@opentelemetry/sdk-logs` (BatchLogRecordProcessor)
- **API**: `@opentelemetry/api-logs`
- **Resources**: `@opentelemetry/resources`
- **Backend**: PostHog (https://us.i.posthog.com/i/v1/logs)

### Key Principles

1. **Structured Wide Events**: Use single, comprehensive log entries per operation instead of multiple step-level logs
2. **Proper Log Levels**: ERROR for failures, WARN for unexpected events, INFO for normal operations, DEBUG for development only
3. **User Context**: Include `posthogDistinctId` for user linking and `sessionId` for session replay linking
4. **Performance Tracking**: Include duration metrics for critical operations
5. **Error Context**: Capture full error context including stack traces and relevant metadata

## Critical User Flows to Log

### 1. Authentication Flows

**Priority**: HIGH

#### Sign Up

- **Event**: `auth.signup`
- **Severity**: INFO (success), ERROR (failure)
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `email`: User email
  - `provider`: OAuth provider (google, linkedin, microsoft) or "email"
  - `status`: "success" | "failed"
  - `error_type`: Error code if failed
  - `duration_ms`: Time taken
  - `timestamp`: ISO timestamp

#### Sign In

- **Event**: `auth.signin`
- **Severity**: INFO (success), WARN (failed attempt), ERROR (system error)
- **Attributes**:
  - `posthogDistinctId`: User ID (if successful)
  - `email`: User email
  - `provider`: OAuth provider or "email"
  - `status`: "success" | "failed"
  - `error_type`: Error code if failed
  - `duration_ms`: Time taken
  - `timestamp`: ISO timestamp

#### Password Reset

- **Event**: `auth.password_reset`
- **Severity**: INFO (success), ERROR (failure)
- **Attributes**:
  - `email`: User email
  - `status`: "requested" | "completed" | "failed"
  - `error_type`: Error code if failed
  - `timestamp`: ISO timestamp

### 2. Billing & Subscription Flows

**Priority**: CRITICAL

#### Checkout Session Created

- **Event**: `billing.checkout_created`
- **Severity**: INFO
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `plan`: "pro"
  - `stripe_session_id`: Checkout session ID
  - `amount_cents`: Price in cents
  - `currency`: "USD"
  - `timestamp`: ISO timestamp

#### Subscription Activated

- **Event**: `billing.subscription_activated`
- **Severity**: INFO
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `subscription_id`: Stripe subscription ID
  - `plan`: "pro"
  - `status`: "active"
  - `timestamp`: ISO timestamp

#### Payment Failed

- **Event**: `billing.payment_failed`
- **Severity**: ERROR
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `subscription_id`: Stripe subscription ID
  - `error_type`: Stripe error code
  - `error_message`: Error description
  - `attempt_count`: Number of retry attempts
  - `timestamp`: ISO timestamp

#### Subscription Canceled

- **Event**: `billing.subscription_canceled`
- **Severity**: WARN
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `subscription_id`: Stripe subscription ID
  - `reason`: Cancellation reason
  - `cancel_at_period_end`: boolean
  - `timestamp`: ISO timestamp

### 3. CRM Integration Flows

**Priority**: HIGH

#### OAuth Connection

- **Event**: `crm.oauth_flow`
- **Severity**: INFO (success), ERROR (failure)
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `provider`: "hubspot"
  - `status`: "initiated" | "completed" | "failed"
  - `error_type`: Error code if failed
  - `is_reconnection`: boolean
  - `duration_ms`: Time taken
  - `timestamp`: ISO timestamp

#### Contact Sync Started

- **Event**: `crm.sync_started`
- **Severity**: INFO
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `provider`: "hubspot"
  - `job_id`: BullMQ job ID
  - `sync_type`: "full" | "incremental"
  - `timestamp`: ISO timestamp

#### Contact Sync Progress

- **Event**: `crm.sync_progress`
- **Severity**: INFO
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `job_id`: BullMQ job ID
  - `stage`: "fetching" | "mapping" | "syncing"
  - `total_contacts`: number
  - `processed_contacts`: number
  - `percentage`: number
  - `timestamp`: ISO timestamp

#### Contact Sync Completed

- **Event**: `crm.sync_completed`
- **Severity**: INFO (success), ERROR (failure)
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `job_id`: BullMQ job ID
  - `status`: "success" | "failed"
  - `total_contacts`: number
  - `created_count`: number
  - `updated_count`: number
  - `skipped_count`: number
  - `error_count`: number
  - `duration_ms`: Time taken
  - `timestamp`: ISO timestamp

### 4. AI Generation Flows

**Priority**: HIGH

#### AI Generation Request

- **Event**: `ai.generation_requested`
- **Severity**: INFO
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `target_contact_id`: Contact ID
  - `model`: "llama-3.3-70b-versatile"
  - `rate_limit_remaining`: number
  - `timestamp`: ISO timestamp

#### AI Generation Completed

- **Event**: `ai.generation_completed`
- **Severity**: INFO (success), ERROR (failure)
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `target_contact_id`: Contact ID
  - `status`: "success" | "failed"
  - `error_type`: Error code if failed
  - `duration_ms`: Time taken
  - `token_count`: Number of tokens used
  - `retry_count`: Number of retries
  - `timestamp`: ISO timestamp

#### Rate Limit Exceeded

- **Event**: `ai.rate_limit_exceeded`
- **Severity**: WARN
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `generations_this_hour`: number
  - `limit`: number
  - `reset_at`: ISO timestamp
  - `timestamp`: ISO timestamp

### 5. Contact Management Flows

**Priority**: MEDIUM

#### Contact Created

- **Event**: `contact.created`
- **Severity**: INFO
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `contact_id`: Contact ID
  - `source`: "manual" | "csv_import" | "crm_sync"
  - `timestamp`: ISO timestamp

#### Contact Updated

- **Event**: `contact.updated`
- **Severity**: INFO
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `contact_id`: Contact ID
  - `fields_updated`: Array of field names
  - `timestamp`: ISO timestamp

#### Contact Deleted

- **Event**: `contact.deleted`
- **Severity**: INFO
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `contact_id`: Contact ID
  - `timestamp`: ISO timestamp

#### Bulk Import

- **Event**: `contact.bulk_import`
- **Severity**: INFO (success), ERROR (failure)
- **Attributes**:
  - `posthogDistinctId`: User ID
  - `total_rows`: number
  - `successful_imports`: number
  - `failed_imports`: number
  - `duration_ms`: Time taken
  - `timestamp`: ISO timestamp

### 6. Introduction Request Flows

**Priority**: CRITICAL

#### Request Created

- **Event**: `introduction.request_created`
- **Severity**: INFO (success), ERROR (failure)
- **Attributes**:
  - `posthogDistinctId`: Requester user ID
  - `request_id`: Request ID
  - `target_contact_id`: Contact ID
  - `approver_id`: Contact owner ID
  - `status`: "success" | "failed"
  - `error_type`: Error code if failed
  - `has_ai_message`: boolean
  - `timestamp`: ISO timestamp

#### Request Approved

- **Event**: `introduction.request_approved`
- **Severity**: INFO
- **Attributes**:
  - `posthogDistinctId`: Approver user ID
  - `request_id`: Request ID
  - `requester_id`: Requester user ID
  - `target_contact_id`: Contact ID
  - `response_time_hours`: Time from request to approval
  - `timestamp`: ISO timestamp

#### Request Rejected

- **Event**: `introduction.request_rejected`
- **Severity**: INFO
- **Attributes**:
  - `posthogDistinctId`: Approver user ID
  - `request_id`: Request ID
  - `requester_id`: Requester user ID
  - `target_contact_id`: Contact ID
  - `reason`: Rejection reason
  - `response_time_hours`: Time from request to rejection
  - `timestamp`: ISO timestamp

#### Email Sent

- **Event**: `introduction.email_sent`
- **Severity**: INFO (success), ERROR (failure)
- **Attributes**:
  - `posthogDistinctId`: Sender user ID
  - `email_type`: "request" | "approval" | "rejection" | "introduction"
  - `recipient_email`: Recipient email
  - `status`: "success" | "failed"
  - `error_type`: Error code if failed
  - `timestamp`: ISO timestamp

## Error Logging Strategy

### Application Errors

All application errors should be logged with:

- **Severity**: ERROR
- **Event**: `error.{category}`
- **Attributes**:
  - `posthogDistinctId`: User ID (if available)
  - `error_type`: Error class/code
  - `error_message`: Error message
  - `stack_trace`: Full stack trace
  - `context`: Relevant context data
  - `endpoint`: API endpoint (if applicable)
  - `timestamp`: ISO timestamp

### Categories:

1. `error.database` - Database operation failures
2. `error.external_api` - Third-party API failures (Stripe, HubSpot, Groq)
3. `error.validation` - Input validation failures
4. `error.authorization` - Permission/access errors
5. `error.rate_limit` - Rate limiting errors
6. `error.system` - System-level errors

### Warning Logging Strategy

Warnings should be logged for:

1. Deprecated feature usage
2. Approaching rate limits
3. Slow operations (>5s)
4. Retry attempts
5. Fallback behavior triggered

## Implementation Structure

```
src/
├── services/
│   └── logging.service.ts          # Core logging service
├── integrations/
│   └── opentelemetry/
│       ├── init.ts                 # OpenTelemetry initialization
│       ├── logger.ts               # Logger instance and helpers
│       └── types.ts                # TypeScript types for log events
└── instrument.server.mjs           # Updated with OpenTelemetry setup
```

## Environment Variables

Add to `.env.example` and `.env.local`:

```bash
# OpenTelemetry Logging (PostHog)
POSTHOG_PROJECT_TOKEN="<ph_project_token>"
OTEL_SERVICE_NAME="introhub-api"
OTEL_LOG_LEVEL="info"  # debug, info, warn, error
```

## Performance Considerations

1. **Batch Processing**: Use `BatchLogRecordProcessor` to batch logs before sending
2. **Async Operations**: All logging operations are non-blocking
3. **Sampling**: Consider sampling for high-volume events in production
4. **Resource Limits**: Set appropriate flush intervals and batch sizes

## Testing Strategy

1. **Unit Tests**: Test logging service methods
2. **Integration Tests**: Verify logs are sent to PostHog
3. **Manual Testing**: Use PostHog dashboard to verify log structure
4. **Load Testing**: Ensure logging doesn't impact performance

## Rollout Plan

### Phase 1: Foundation (Week 1)

- Install dependencies
- Set up OpenTelemetry configuration
- Create logging service
- Update instrument.server.mjs

### Phase 2: Critical Flows (Week 2)

- Implement billing/subscription logging
- Implement introduction request logging
- Implement CRM integration logging

### Phase 3: Additional Flows (Week 3)

- Implement authentication logging
- Implement AI generation logging
- Implement contact management logging

### Phase 4: Error Handling (Week 4)

- Add comprehensive error logging
- Add warning logging
- Add error boundaries

### Phase 5: Testing & Optimization (Week 5)

- Test all logging flows
- Optimize performance
- Update documentation

## Monitoring & Maintenance

1. **Dashboard Setup**: Create PostHog dashboards for key metrics
2. **Alerts**: Set up alerts for critical errors
3. **Review Cadence**: Weekly review of logs and error patterns
4. **Retention Policy**: Configure log retention in PostHog
5. **Cost Monitoring**: Monitor PostHog usage and costs

## Success Metrics

1. **Coverage**: 100% of critical user flows logged
2. **Error Detection**: <5 minute time to detect critical errors
3. **Performance Impact**: <10ms average logging overhead
4. **Log Quality**: >95% of logs contain all required attributes
5. **Actionability**: >80% of errors can be debugged from logs alone

## References

- [PostHog Node.js Logs Installation](https://posthog.com/docs/logs/installation/nodejs)
- [PostHog Logging Best Practices](https://posthog.com/docs/logs/best-practices)
- [OpenTelemetry Node.js SDK](https://opentelemetry.io/docs/languages/js/getting-started/nodejs/)
- [OpenTelemetry Logs API](https://opentelemetry.io/docs/specs/otel/logs/)
