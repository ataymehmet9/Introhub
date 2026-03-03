# PostHog Analytics Integration

This document describes the PostHog analytics integration in the IntroHub application.

## Overview

PostHog is integrated both on the client-side (using `@posthog/react`) and server-side (using `posthog-node`) to provide comprehensive analytics tracking across the entire application.

## Features

### 1. **Automatic User Identification**

- Users are automatically identified in PostHog when they:
  - Sign up (new account creation)
  - Log in (email/password or OAuth)
  - Refresh the page with a valid session cookie

### 2. **Server-Side tRPC Tracking**

- All tRPC procedure calls are automatically tracked with:
  - Procedure path (e.g., `contacts.getAll`)
  - Procedure type (query, mutation, subscription)
  - Duration (execution time in milliseconds)
  - Success/failure status
  - User ID and email (if authenticated)
  - Error messages (for failed calls)

### 3. **Authentication Event Tracking**

- **Login Success/Failure**: Tracks email login attempts
- **Signup Success/Failure**: Tracks new user registrations
- **OAuth Attempts**: Tracks social login attempts (Google, Microsoft, LinkedIn)
- **Session Start**: Tracks when a user session begins

## Architecture

### Client-Side Integration

#### PostHog Provider

Located in `src/routes/__root.tsx`, the PostHog provider wraps the entire application:

```tsx
<PostHogProvider
  apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
  options={{
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    defaults: import.meta.env.VITE_PUBLIC_POSTHOG_DEFAULTS,
    capture_exceptions: true,
  }}
>
  {/* App content */}
</PostHogProvider>
```

#### User Identification Hook

`src/hooks/usePostHogIdentify.tsx` - Automatically identifies users when they have an active session:

```tsx
import { usePostHogIdentify } from '@/hooks/usePostHogIdentify'

// In your component
usePostHogIdentify()
```

This hook:

- Runs on every session change
- Identifies the user with their ID, email, name, company, and position
- Tracks a `session_start` event
- Resets PostHog when the user logs out

### Server-Side Integration

#### PostHog Server Utility

`src/integrations/posthog.ts` - Provides server-side PostHog functionality:

```typescript
import { trackServerEvent, identifyUser } from '@/integrations/posthog'

// Track an event
trackServerEvent('user-123', 'custom_event', {
  property1: 'value1',
  property2: 'value2',
})

// Identify a user
identifyUser('user-123', {
  email: 'user@example.com',
  name: 'John Doe',
})
```

#### tRPC Middleware

`src/integrations/trpc/middleware/posthog.ts` - Automatically tracks all tRPC calls:

- Applied to both `publicProcedure` and `protectedProcedure`
- Tracks execution time, success/failure, and user context
- Logs errors without interrupting normal error handling

## Environment Variables

Add these to your `.env.local` file:

```bash
# PostHog Configuration
VITE_PUBLIC_POSTHOG_KEY="your-posthog-project-api-key"
VITE_PUBLIC_POSTHOG_HOST="https://app.posthog.com"  # or your self-hosted URL
VITE_PUBLIC_POSTHOG_DEFAULTS="your-posthog-defaults"  # optional
```

**Note**: All `VITE_PUBLIC_*` variables are exposed to the client-side code.

## Tracked Events

### Authentication Events

| Event Name             | Trigger                         | Properties                                          |
| ---------------------- | ------------------------------- | --------------------------------------------------- |
| `login_success`        | Successful email/password login | `email`, `timestamp`                                |
| `login_failed`         | Failed email/password login     | `email`, `error`, `timestamp`                       |
| `signup_success`       | Successful user registration    | `email`, `name`, `company`, `position`, `timestamp` |
| `signup_failed`        | Failed user registration        | `email`, `error`, `timestamp`                       |
| `oauth_signin_attempt` | OAuth sign-in initiated         | `provider`, `timestamp`                             |
| `session_start`        | User session begins             | `userId`, `email`, `name`, `timestamp`              |

### tRPC Events

| Event Name             | Trigger              | Properties                                                                         |
| ---------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| `trpc_procedure_call`  | Successful tRPC call | `path`, `type`, `duration`, `success`, `userId`, `userEmail`, `timestamp`          |
| `trpc_procedure_error` | Failed tRPC call     | `path`, `type`, `duration`, `success`, `error`, `userId`, `userEmail`, `timestamp` |

## User Properties

When a user is identified, the following properties are set:

- `email`: User's email address
- `name`: User's full name
- `company`: User's company (if provided)
- `position`: User's position/title (if provided)

## Usage Examples

### Track Custom Events (Client-Side)

```tsx
import { usePostHog } from '@posthog/react'

function MyComponent() {
  const posthog = usePostHog()

  const handleAction = () => {
    posthog?.capture('custom_action', {
      action_type: 'button_click',
      button_name: 'submit',
      timestamp: new Date().toISOString(),
    })
  }

  return <button onClick={handleAction}>Submit</button>
}
```

### Track Custom Events (Server-Side)

```typescript
import { trackServerEvent } from '@/integrations/posthog'

export async function myServerFunction(userId: string) {
  // Your logic here

  // Track the event
  trackServerEvent(userId, 'server_action_completed', {
    action: 'data_export',
    recordCount: 100,
    timestamp: new Date().toISOString(),
  })
}
```

## Best Practices

1. **Event Naming**: Use snake_case for event names (e.g., `user_action_completed`)
2. **Properties**: Always include a `timestamp` property for time-based analysis
3. **User Context**: Include `userId` and `userEmail` when available
4. **Error Tracking**: Always track both success and failure events for important actions
5. **Privacy**: Never track sensitive data (passwords, tokens, etc.)

## Debugging

### Check if PostHog is Initialized

```tsx
import { usePostHog } from '@posthog/react'

function DebugComponent() {
  const posthog = usePostHog()

  console.log('PostHog initialized:', !!posthog)
  console.log('PostHog config:', posthog?.config)

  return null
}
```

### Server-Side Logging

The server-side PostHog client logs warnings if the API key is missing:

```
PostHog API key not found. Analytics will be disabled.
```

### View Events in PostHog

1. Go to your PostHog dashboard
2. Navigate to "Events" or "Live Events"
3. Filter by event name or user ID
4. Check event properties and timestamps

## Troubleshooting

### Events Not Appearing

1. **Check Environment Variables**: Ensure `VITE_PUBLIC_POSTHOG_KEY` is set correctly
2. **Check Network**: Open browser DevTools → Network tab → Filter by "posthog"
3. **Check Console**: Look for PostHog-related errors or warnings
4. **Verify API Key**: Ensure the API key matches your PostHog project

### User Not Identified

1. **Check Session**: Ensure the user has a valid session
2. **Check Hook**: Verify `usePostHogIdentify()` is called in `_authenticated.tsx`
3. **Check Console**: Look for "PostHog: User identified" log messages

### Server Events Not Tracking

1. **Check Environment**: Ensure `VITE_PUBLIC_POSTHOG_KEY` is available on the server
2. **Check Logs**: Look for "Failed to track PostHog event" errors
3. **Verify Network**: Ensure the server can reach PostHog's API

## Performance Considerations

- **Client-Side**: Events are batched and sent asynchronously
- **Server-Side**: Events are flushed immediately in development (`flushAt: 1`)
- **Middleware**: Adds minimal overhead (~1-2ms) to tRPC calls
- **Memory**: PostHog client is a singleton to avoid multiple instances

## Security

- API keys are exposed on the client-side (this is expected for PostHog)
- Never track sensitive user data (passwords, tokens, credit cards)
- Use PostHog's data retention and privacy features to comply with regulations
- Consider implementing user consent for analytics tracking

## Future Enhancements

- [ ] Add feature flag support
- [ ] Implement A/B testing with PostHog experiments
- [ ] Add session recording (with user consent)
- [ ] Track page views and navigation
- [ ] Add custom dashboards for key metrics
- [ ] Implement cohort analysis
- [ ] Add funnel tracking for user journeys

## Resources

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog React SDK](https://posthog.com/docs/libraries/react)
- [PostHog Node SDK](https://posthog.com/docs/libraries/node)
- [PostHog LLM Documentation](https://posthog.com/llms.txt)
