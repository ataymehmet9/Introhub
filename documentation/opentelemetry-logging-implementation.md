# OpenTelemetry Logging Implementation Guide

## Overview

This document describes the comprehensive OpenTelemetry logging implementation for IntroHub, integrated with PostHog for centralized log management and analysis.

## Architecture

### Core Components

1. **OpenTelemetry SDK** (`@opentelemetry/sdk-node`)
   - Initialized in `instrument.server.mjs` before application startup
   - Uses OTLP HTTP exporter to send logs to PostHog
   - Batch processing for efficient log transmission

2. **Logger Services**
   - `src/integrations/opentelemetry/logger.server.ts` - Server-side logging implementations
   - `src/integrations/opentelemetry/logger.ts` - Client-safe stub functions
   - `src/integrations/opentelemetry/types.ts` - TypeScript definitions for 30+ log event types

3. **PostHog Integration**
   - `src/integrations/posthog/helpers.server.ts` - Server-side PostHog event tracking
   - `src/integrations/posthog/helpers.ts` - Client-safe stub functions
   - Logs sent to `https://us.i.posthog.com/i/v1/logs`

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```bash
# PostHog Configuration
VITE_PUBLIC_POSTHOG_KEY="phc_your_project_key"
VITE_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
POSTHOG_PROJECT_TOKEN="your_project_token"

# OpenTelemetry Configuration
OTEL_SERVICE_NAME="introhub-api"
OTEL_LOG_LEVEL="info"
```

### Build Configuration

The build script includes increased Node memory allocation to handle the large bundle:

```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=8192' vite build && cp instrument.server.mjs .output/server"
  }
}
```

## Logged User Flows

### 1. Billing & Subscriptions

**File**: `src/routes/api/billing/webhook.ts`

**Events Logged**:

- `billing_subscription_activated` - Successful subscription activation
- `billing_subscription_failed` - Subscription activation failure
- `billing_subscription_cancelled` - Subscription cancellation
- `billing_payment_failed` - Payment processing failure
- `billing_webhook_error` - Webhook processing error

**Context Included**:

- User ID
- Subscription tier
- Stripe customer/subscription IDs
- Error details (if applicable)
- Timestamp

### 2. CRM Integration (HubSpot)

**Files**:

- `src/routes/api/crm/hubspot/callback.ts` - OAuth flow
- `src/services/sync-queue.service.ts` - Contact syncing

**Events Logged**:

- `crm_oauth_success` - Successful OAuth connection
- `crm_oauth_failed` - OAuth connection failure
- `crm_sync_started` - Contact sync initiated
- `crm_sync_completed` - Contact sync completed successfully
- `crm_sync_failed` - Contact sync failure
- `crm_sync_partial` - Partial sync completion with some failures

**Context Included**:

- User ID
- CRM provider (HubSpot)
- Contact counts (total, synced, failed)
- Sync duration
- Error details
- Portal ID

### 3. AI Generation

**File**: `src/integrations/trpc/routes/ai.ts`

**Events Logged**:

- `ai_generation_started` - AI request initiated
- `ai_generation_completed` - AI generation successful
- `ai_generation_failed` - AI generation failure
- `ai_rate_limit_exceeded` - Rate limit hit

**Context Included**:

- User ID
- Request type (introduction, email, etc.)
- Token usage
- Generation duration
- Model used
- Error details

### 4. Contact Management

**File**: `src/integrations/trpc/routes/contact.ts`

**Events Logged**:

- `contact_created` - New contact created
- `contact_updated` - Contact information updated
- `contact_deleted` - Contact removed
- `contact_batch_upload_started` - Batch upload initiated
- `contact_batch_upload_completed` - Batch upload finished
- `contact_batch_upload_failed` - Batch upload failure

**Context Included**:

- User ID
- Contact ID
- Contact count (for batch operations)
- Success/failure counts
- Error details

### 5. Authentication

**Files**:

- `src/lib/auth-wrapper.ts` - Client-side auth (uses PostHog client SDK)
- `src/services/auth.functions.ts` - Server-side auth operations

**Events Logged**:

- `auth_signin_success` - Successful sign in
- `auth_signin_failed` - Sign in failure
- `auth_signup_success` - Successful sign up
- `auth_signup_failed` - Sign up failure
- `auth_oauth_started` - OAuth flow initiated
- `auth_password_reset_requested` - Password reset email sent
- `auth_password_reset_completed` - Password successfully reset

**Context Included**:

- User ID (when available)
- Provider (email, Google, etc.)
- Duration
- Error details
- Email (for tracking)

### 6. Introduction Requests

**File**: `src/integrations/trpc/routes/introduction-request.ts`

**Events Logged**:

- `introduction_request_created` - New request created
- `introduction_request_approved` - Request approved
- `introduction_request_rejected` - Request rejected
- `introduction_email_sent` - Introduction email delivered
- `introduction_email_failed` - Email delivery failure

**Context Included**:

- User ID
- Request ID
- Requester/Requestee information
- Email delivery status
- Error details

## Log Structure

All logs follow the "Structured Wide Events" pattern recommended by PostHog:

```typescript
{
  // Core identification
  posthogDistinctId: string,  // Links to PostHog user
  sessionId?: string,          // Links to session replay

  // Event details
  event: string,               // Event name (e.g., 'billing_subscription_activated')
  severity: 'INFO' | 'WARN' | 'ERROR',

  // Context
  userId?: string,
  timestamp: string,
  duration_ms?: number,

  // Event-specific attributes
  [key: string]: any
}
```

## Usage Examples

### Server-Side Logging

```typescript
import {
  billingLogger,
  errorLogger,
} from '@/integrations/opentelemetry/logger.server'

// Log successful operation
billingLogger.logSubscriptionActivated({
  posthogDistinctId: user.id,
  userId: user.id,
  subscriptionTier: 'pro',
  stripeCustomerId: customer.id,
  timestamp: new Date().toISOString(),
})

// Log error
errorLogger.logError({
  posthogDistinctId: user.id,
  error: error.message,
  stack: error.stack,
  context: { operation: 'subscription_activation' },
  timestamp: new Date().toISOString(),
})
```

### Client-Side Tracking

```typescript
import { usePostHog } from '@posthog/react'

const posthog = usePostHog()

// Track client-side event
posthog.capture('auth_signin_success', {
  provider: 'email',
  duration_ms: Date.now() - startTime,
  timestamp: new Date().toISOString(),
})
```

## Viewing Logs in PostHog

1. Navigate to PostHog dashboard
2. Go to "Logs" section
3. Filter by:
   - Event name (e.g., `billing_subscription_activated`)
   - User ID (`posthogDistinctId`)
   - Time range
   - Severity level

4. Click on any log entry to see:
   - Full event context
   - Linked session replay (if available)
   - User journey
   - Related events

## Best Practices

### 1. Always Include Context

```typescript
// Good
billingLogger.logSubscriptionActivated({
  posthogDistinctId: user.id,
  userId: user.id,
  subscriptionTier: tier,
  stripeCustomerId: customerId,
  timestamp: new Date().toISOString(),
})

// Bad - missing context
billingLogger.logSubscriptionActivated({
  posthogDistinctId: user.id,
})
```

### 2. Use Appropriate Severity Levels

- **INFO**: Normal operations (successful actions)
- **WARN**: Unexpected but handled situations (rate limits, retries)
- **ERROR**: Failures requiring attention (payment failures, sync errors)

### 3. Include Timing Information

```typescript
const startTime = Date.now()
// ... operation ...
logger.logEvent({
  // ... other fields
  duration_ms: Date.now() - startTime,
})
```

### 4. Link to Session Replays

```typescript
import { getSessionId } from '@/integrations/opentelemetry/logger.server'

logger.logEvent({
  posthogDistinctId: user.id,
  sessionId: getSessionId(), // Links to session replay
  // ... other fields
})
```

## Troubleshooting

### Build Failures

If you encounter "JavaScript heap out of memory" errors:

```bash
# Increase Node memory for build
NODE_OPTIONS='--max-old-space-size=8192' npm run build
```

### Logs Not Appearing in PostHog

1. Verify environment variables are set correctly
2. Check PostHog project token matches
3. Ensure `instrument.server.mjs` is loaded before app startup
4. Check server logs for OpenTelemetry initialization messages

### Client-Side Bundle Issues

If you see errors about Node.js modules in the client bundle:

1. Ensure server-side code imports from `logger.server.ts`
2. Client-side code should use PostHog client SDK directly
3. Check `vite.config.ts` has correct SSR externals configuration

## Performance Considerations

1. **Batch Processing**: Logs are batched before sending to reduce network overhead
2. **Async Operations**: All logging is non-blocking
3. **Conditional Logging**: Logs only sent when PostHog is configured
4. **Memory Management**: Build requires 8GB Node heap for large bundle

## Security

1. **No Sensitive Data**: Never log passwords, tokens, or PII
2. **User Consent**: Logging respects user privacy settings
3. **Secure Transport**: All logs sent over HTTPS
4. **Access Control**: PostHog dashboard access restricted to authorized users

## Future Enhancements

1. Add distributed tracing for cross-service requests
2. Implement custom metrics for business KPIs
3. Add alerting for critical errors
4. Create custom dashboards for specific user flows
5. Implement log sampling for high-volume events

## Related Documentation

- [PostHog Logs Documentation](https://posthog.com/docs/logs)
- [OpenTelemetry Node.js SDK](https://opentelemetry.io/docs/languages/js/getting-started/nodejs/)
- [PostHog Best Practices](https://posthog.com/docs/logs/best-practices)

## Support

For issues or questions:

1. Check PostHog dashboard for log delivery status
2. Review server logs for OpenTelemetry errors
3. Verify environment configuration
4. Contact team lead for access issues
