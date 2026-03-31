# Product Requirements Document: Subscription Plan System

**Project:** IntroHub Subscription Tiers
**Version:** 1.0
**Date:** March 30, 2026
**Status:** Draft - Awaiting Review

---

## Executive Summary

This PRD outlines the implementation of a two-tier subscription system (Free and Pro) for IntroHub, with usage-based restrictions on introduction requests for free tier users and Stripe integration for Pro plan billing.

---

## 1. Business Objectives

### 1.1 Goals

- Monetize the IntroHub platform through a Pro subscription tier
- Provide a sustainable free tier that allows users to experience core functionality
- Create a clear upgrade path from Free to Pro
- Ensure seamless subscription management through Stripe integration

### 1.2 Success Metrics

- Conversion rate from Free to Pro tier
- Monthly Recurring Revenue (MRR) from Pro subscriptions
- Free tier user engagement (requests sent vs. limit)
- Churn rate for Pro subscribers
- Time to upgrade (days from signup to Pro conversion)

---

## 2. User Stories

### 2.1 Free Tier User

- As a free tier user, I want to send up to 5 introduction requests per month so I can evaluate the platform
- As a free tier user, I want to see how many requests I have remaining so I can plan my usage
- As a free tier user, I want to be notified when I reach my limit with an option to upgrade
- As a free tier user, I want my request limit to reset monthly based on when I joined

### 2.2 Pro Tier User

- As a Pro user, I want unlimited introduction requests so I can maximize my networking
- As a Pro user, I want to manage my subscription (update payment, cancel) through Stripe
- As a Pro user, I want to see my current plan status and billing information
- As a Pro user, I want to downgrade to Free if needed, with access continuing until my billing period ends

### 2.3 Admin/System

- As the system, I need to track usage accurately to enforce limits
- As the system, I need to sync subscription status with Stripe webhooks
- As the system, I need to handle subscription lifecycle events (upgrades, downgrades, cancellations)

---

## 3. Functional Requirements

### 3.1 Subscription Tiers

#### 3.1.1 Free Tier

**Features:**

- 5 introduction requests per calendar month (based on user's anniversary date)
- Up to 50 contacts
- Basic support
- All core platform features

**Limitations:**

- Request limit resets monthly on anniversary date (e.g., joined March 15 → resets April 15)
- No rollover of unused requests
- Limited to 5 requests regardless of approval status

**Cost:** $0/month

#### 3.1.2 Pro Tier

**Features:**

- Unlimited introduction requests
- Unlimited contacts
- Priority support
- Full CRM Integrations (future feature)
- All Free tier features

**Cost:** $99/month (billed monthly via Stripe)

### 3.2 Usage Tracking & Enforcement

#### 3.2.1 Request Counting

- Count only successfully created introduction requests (not failed attempts)
- Track requests per user per billing cycle
- Reset counter on anniversary date for free tier users
- No tracking needed for Pro users (unlimited)

#### 3.2.2 Limit Enforcement

**Free Tier:**

- Block request creation when limit reached (5 requests)
- Show clear error message with upgrade CTA
- Display remaining requests in UI before limit reached

**Pro Tier:**

- No enforcement needed
- No request counting required

#### 3.2.3 Anniversary Date Logic

**New User Signup:**

- Set `freeTierStartDate` to signup date
- This becomes their monthly reset date

**Upgrade to Pro:**

- Clear `freeTierStartDate` (set to null)
- No longer track usage

**Downgrade from Pro:**

- Set `freeTierStartDate` to the date Pro subscription ends
- Begin tracking usage from that date
- Apply 5 request limit immediately after Pro period expires

### 3.3 Stripe Integration

#### 3.3.1 Subscription Creation

- Create Stripe customer on first Pro upgrade
- Store `stripeCustomerId` in user table
- Create checkout session with Pro plan price ID
- Redirect to Stripe Checkout for payment

#### 3.3.2 Webhook Events

**Handle the following Stripe events:**

1. **`checkout.session.completed`**
   - Update user: `stripeSubscriptionId`, `stripeSubscriptionStatus = 'active'`
   - Clear `freeTierStartDate` (user is now Pro)
   - Send confirmation email

2. **`customer.subscription.updated`**
   - Update `stripeSubscriptionStatus` to match Stripe status
   - Handle status changes: `active`, `past_due`, `canceled`, `unpaid`

3. **`customer.subscription.deleted`**
   - Clear `stripeSubscriptionId` and `stripeSubscriptionStatus`
   - Set `freeTierStartDate` to current date (downgrade to Free)
   - Send downgrade notification

4. **`invoice.payment_failed`**
   - Update `stripeSubscriptionStatus` to `past_due`
   - Send payment failure notification
   - Maintain Pro access during grace period

5. **`invoice.payment_succeeded`**
   - Ensure `stripeSubscriptionStatus = 'active'`
   - Send payment receipt

#### 3.3.3 Subscription Management

- Use Stripe Customer Portal for:
  - Payment method updates
  - Subscription cancellation
  - Invoice history
  - Billing information updates

### 3.4 User Interface Requirements

#### 3.4.1 Plan Indicator (Header/User Menu)

**Location:** User dropdown menu in header

**Display:**

- Badge showing current plan: "Free" or "Pro"
- For Free tier: Show remaining requests (e.g., "3/5 requests left")
- For Pro tier: Show "Unlimited" or Pro badge
- Click to navigate to billing page

**Design:**

```
┌─────────────────────────┐
│ John Doe               │
│ john@example.com       │
├─────────────────────────┤
│ Plan: Free 🆓          │
│ 3/5 requests left      │
├─────────────────────────┤
│ Profile                │
│ Settings               │
│ Billing                │
│ Logout                 │
└─────────────────────────┘
```

#### 3.4.2 Limit Reached Notification

**Trigger:** When user attempts to create 6th request in billing cycle

**Type:** In-app notification (using existing SSE notification system)

**Content:**

- Title: "Monthly Limit Reached"
- Message: "You've used all 5 introduction requests for this month. Upgrade to Pro for unlimited requests."
- CTA Button: "Upgrade to Pro"
- Secondary: "View Billing"

**Behavior:**

- Push notification via SSE
- Show in notification center
- Persist until dismissed
- Link to billing page with upgrade flow

#### 3.4.3 Warning Notifications

**Trigger Points:**

- At 4/5 requests (1 remaining)
- At 5/5 requests (limit reached)

**Type:** Toast notification (non-blocking)

**Content:**

- "You have 1 request remaining this month"
- "You've reached your monthly limit. Upgrade to Pro for unlimited requests."

#### 3.4.4 Billing Page Enhancements

**Current Plan Section:**

- Highlight current plan with visual indicator
- Show next billing date for Pro users
- Show next reset date for Free users
- Display usage stats (requests used/remaining)

**Upgrade/Downgrade Actions:**

- Free → Pro: "Upgrade to Pro" button (Stripe Checkout)
- Pro → Free: "Manage Subscription" button (Stripe Portal)
- Clear messaging about when changes take effect

#### 3.4.5 Request Creation Flow

**Before Submission:**

- Check user's plan and usage
- If Free tier and at limit: Show error modal instead of creating request
- If Free tier and under limit: Show remaining count in UI
- If Pro tier: No restrictions

**Error Modal (Limit Reached):**

```
┌─────────────────────────────────────┐
│  Monthly Limit Reached              │
├─────────────────────────────────────┤
│  You've used all 5 introduction     │
│  requests for this month.           │
│                                     │
│  Upgrade to Pro for:                │
│  ✓ Unlimited requests               │
│  ✓ Priority support                 │
│  ✓ Full CRM integrations            │
│                                     │
│  [Upgrade to Pro]  [Maybe Later]    │
└─────────────────────────────────────┘
```

---

## 4. Technical Requirements

### 4.1 Database Schema Changes

#### 4.1.1 User Table Updates

Add the following columns to the `user` table:

```typescript
// New columns to add
freeTierStartDate: timestamp('free_tier_start_date')
planType: varchar('plan_type', { length: 20 }).default('free').notNull() // 'free' | 'pro'
requestsUsedThisCycle: integer('requests_used_this_cycle').default(0).notNull()
currentCycleStartDate: timestamp('current_cycle_start_date')

// Existing Stripe columns (already present)
stripeCustomerId: text('stripe_customer_id')
stripeSubscriptionId: text('stripe_subscription_id')
stripeSubscriptionStatus: text('stripe_subscription_status')
```

**Column Descriptions:**

- `freeTierStartDate`: Date when user started/returned to free tier (null for Pro users)
- `planType`: Current plan type for quick queries ('free' or 'pro')
- `requestsUsedThisCycle`: Counter for requests in current billing cycle (Free tier only)
- `currentCycleStartDate`: Start date of current billing cycle for tracking

#### 4.1.2 Indexes

Add indexes for performance:

```sql
CREATE INDEX idx_user_plan_type ON user(plan_type);
CREATE INDEX idx_user_free_tier_start ON user(free_tier_start_date) WHERE free_tier_start_date IS NOT NULL;
```

### 4.2 Service Layer Architecture

#### 4.2.1 Subscription Service (`src/services/subscription.service.ts`)

**Responsibilities:**

- Determine user's current plan
- Check if user can create introduction request
- Calculate remaining requests for free tier
- Handle plan transitions (upgrade/downgrade)
- Reset monthly usage counters

**Key Functions:**

```typescript
// Get user's subscription details
getUserSubscription(userId: string): Promise<SubscriptionDetails>

// Check if user can create a request
canCreateRequest(userId: string): Promise<{ allowed: boolean; reason?: string }>

// Get remaining requests for free tier
getRemainingRequests(userId: string): Promise<number>

// Increment usage counter
incrementRequestCount(userId: string): Promise<void>

// Reset monthly counter (called by cron job)
resetMonthlyCounters(): Promise<void>

// Handle upgrade to Pro
upgradeToPro(userId: string, stripeSubscriptionId: string): Promise<void>

// Handle downgrade to Free
downgradeToFree(userId: string): Promise<void>
```

#### 4.2.2 Usage Tracking Service (`src/services/usage-tracking.service.ts`)

**Responsibilities:**

- Track introduction request creation
- Calculate billing cycle dates
- Determine if reset is needed
- Provide usage analytics

**Key Functions:**

```typescript
// Check if user needs cycle reset
needsCycleReset(user: User): boolean

// Get current cycle start date
getCurrentCycleStart(user: User): Date

// Get usage stats for user
getUsageStats(userId: string): Promise<UsageStats>
```

### 4.3 API Endpoints (tRPC)

#### 4.3.1 New Billing Router Procedures

Add to `src/integrations/trpc/routes/billing.ts`:

```typescript
// Get user's plan and usage details
getPlanDetails: protectedProcedure.query()
// Returns: { plan, requestsUsed, requestsLimit, nextResetDate, subscriptionStatus }

// Check if user can create request
canCreateRequest: protectedProcedure.query()
// Returns: { allowed: boolean, reason?: string, remainingRequests?: number }

// Get usage statistics
getUsageStats: protectedProcedure.query()
// Returns: { requestsThisCycle, requestsLastCycle, totalRequests, averagePerMonth }
```

#### 4.3.2 Update Introduction Request Router

Modify `src/integrations/trpc/routes/introduction-request.ts`:

```typescript
create: protectedProcedure
  .input(createIntroductionRequestSchema)
  .mutation(async ({ input, ctx }) => {
    // 1. Check if user can create request
    const canCreate = await subscriptionService.canCreateRequest(ctx.user.id)

    if (!canCreate.allowed) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: canCreate.reason || 'Cannot create request',
      })
    }

    // 2. Create request (existing logic)
    // ...

    // 3. Increment usage counter
    await subscriptionService.incrementRequestCount(ctx.user.id)

    // 4. Check if user just hit limit and send notification
    const remaining = await subscriptionService.getRemainingRequests(
      ctx.user.id,
    )
    if (remaining === 0) {
      await sendLimitReachedNotification(ctx.user.id)
    } else if (remaining === 1) {
      await sendLimitWarningNotification(ctx.user.id, remaining)
    }
  })
```

### 4.4 Webhook Handler Enhancements

Update `src/routes/api/billing/webhook.ts`:

```typescript
// Add new event handlers
case 'customer.subscription.deleted': {
  // Existing logic to clear subscription
  // NEW: Set free tier start date
  await db.update(userTable)
    .set({
      stripeSubscriptionId: null,
      stripeSubscriptionStatus: null,
      planType: 'free',
      freeTierStartDate: new Date(),
      currentCycleStartDate: new Date(),
      requestsUsedThisCycle: 0
    })
    .where(eq(userTable.stripeCustomerId, customerId))

  // Send downgrade notification
  await sendDowngradeNotification(userId)
  break
}

case 'invoice.payment_failed': {
  // Update status to past_due
  await db.update(userTable)
    .set({ stripeSubscriptionStatus: 'past_due' })
    .where(eq(userTable.stripeCustomerId, customerId))

  // Send payment failure notification
  await sendPaymentFailureNotification(userId)
  break
}

case 'checkout.session.completed': {
  // Existing logic
  // NEW: Clear free tier tracking
  await db.update(userTable)
    .set({
      stripeSubscriptionId: subscriptionId,
      stripeSubscriptionStatus: 'active',
      planType: 'pro',
      freeTierStartDate: null,
      requestsUsedThisCycle: 0
    })
    .where(eq(userTable.stripeCustomerId, customerId))
  break
}
```

### 4.5 Background Jobs

#### 4.5.1 Monthly Reset Job

**Purpose:** Reset request counters for free tier users on their anniversary date

**Schedule:** Run daily at 00:00 UTC

**Implementation:** Create `src/jobs/reset-monthly-limits.ts`

```typescript
// Pseudo-code
async function resetMonthlyLimits() {
  const today = new Date()

  // Find all free tier users whose cycle should reset today
  const usersToReset = await db
    .select()
    .from(user)
    .where(
      and(
        eq(user.planType, 'free'),
        // Match day of month with freeTierStartDate
        sql`EXTRACT(DAY FROM ${user.freeTierStartDate}) = EXTRACT(DAY FROM ${today})`,
      ),
    )

  // Reset counters
  for (const user of usersToReset) {
    await db
      .update(userTable)
      .set({
        requestsUsedThisCycle: 0,
        currentCycleStartDate: today,
      })
      .where(eq(userTable.id, user.id))
  }
}
```

**Deployment:** Use cron job or scheduled task (Vercel Cron, AWS EventBridge, etc.)

### 4.6 Middleware & Guards

#### 4.6.1 Subscription Check Middleware

Create `src/lib/subscription-middleware.ts`:

```typescript
export async function checkSubscriptionLimit(userId: string) {
  const canCreate = await subscriptionService.canCreateRequest(userId)

  if (!canCreate.allowed) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: canCreate.reason,
      cause: 'SUBSCRIPTION_LIMIT_REACHED',
    })
  }
}
```

### 4.7 Configuration

#### 4.7.1 Environment Variables

Add to `.env`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_... # Monthly Pro plan price ID

# Subscription Configuration
FREE_TIER_REQUEST_LIMIT=5
PRO_TIER_PRICE=99
```

#### 4.7.2 Subscription Config

Create `src/configs/subscription.config.ts`:

```typescript
export const SUBSCRIPTION_CONFIG = {
  FREE_TIER: {
    REQUEST_LIMIT: 5,
    CONTACT_LIMIT: 50,
    RESET_FREQUENCY: 'monthly' as const,
  },
  PRO_TIER: {
    REQUEST_LIMIT: null, // unlimited
    CONTACT_LIMIT: null, // unlimited
    PRICE: 99,
    CURRENCY: 'USD',
  },
  NOTIFICATIONS: {
    WARN_AT_REMAINING: 1, // Warn when 1 request left
    NOTIFY_ON_LIMIT: true,
  },
} as const
```

---

## 5. User Experience Flow

### 5.1 New User Journey

1. User signs up → Set as Free tier, `freeTierStartDate` = signup date
2. User can create up to 5 requests
3. At 4th request: Toast warning "1 request remaining"
4. At 5th request: Success, but show "Limit reached" notification
5. At 6th attempt: Block with upgrade modal
6. User clicks "Upgrade to Pro" → Stripe Checkout
7. After payment: Immediate Pro access, unlimited requests

### 5.2 Upgrade Flow

1. User on Free tier clicks "Upgrade to Pro" (billing page or limit modal)
2. Redirect to Stripe Checkout
3. User completes payment
4. Webhook updates user to Pro tier
5. User redirected back with success message
6. Immediate unlimited access

### 5.3 Downgrade Flow

1. Pro user clicks "Manage Subscription" → Stripe Portal
2. User cancels subscription in Stripe
3. Webhook receives `customer.subscription.deleted`
4. System sets subscription to cancel at period end
5. User maintains Pro access until period ends
6. On period end date: Downgrade to Free, set `freeTierStartDate`
7. User now has 5 requests/month starting from downgrade date

### 5.4 Limit Reached Flow

1. Free user attempts 6th request
2. System checks: `requestsUsedThisCycle >= 5`
3. Block request creation
4. Show modal: "Monthly Limit Reached"
5. User options:
   - "Upgrade to Pro" → Stripe Checkout
   - "Maybe Later" → Close modal, return to search
6. Send in-app notification about limit
7. User can view notification center for upgrade link

---

## 6. Edge Cases & Error Handling

### 6.1 Edge Cases

#### 6.1.1 Webhook Failures

**Scenario:** Stripe webhook fails to deliver or process
**Solution:**

- Implement webhook retry logic
- Log all webhook events for manual reconciliation
- Provide admin tool to manually sync subscription status
- Query Stripe API on user login to verify status

#### 6.1.2 Payment Failures

**Scenario:** Pro user's payment fails
**Solution:**

- Stripe sets status to `past_due`
- Maintain Pro access during grace period (Stripe default: 7 days)
- Send payment failure notification
- After grace period: Stripe cancels subscription → downgrade to Free

#### 6.1.3 Timezone Issues

**Scenario:** User in different timezone, reset timing unclear
**Solution:**

- Store all dates in UTC
- Calculate anniversary date based on UTC
- Display reset date in user's local timezone in UI
- Run reset job at 00:00 UTC daily

#### 6.1.4 Mid-Cycle Upgrade

**Scenario:** User upgrades to Pro mid-cycle with 3 requests already used
**Solution:**

- Clear `requestsUsedThisCycle` on upgrade
- User immediately gets unlimited access
- No prorating needed (Stripe handles billing)

#### 6.1.5 Mid-Cycle Downgrade

**Scenario:** User downgrades mid-cycle
**Solution:**

- Maintain Pro access until period end (Stripe handles this)
- On period end: Set `freeTierStartDate` to that date
- Start fresh with 5 requests from downgrade date

#### 6.1.6 Existing Users Migration

**Scenario:** Existing users when feature launches
**Solution:**

- Set all existing users to Free tier
- Set `freeTierStartDate` to migration date
- Give grace period: 10 requests for first month
- Send announcement email about new plans

### 6.2 Error Messages

#### 6.2.1 Limit Reached

```
Title: "Monthly Limit Reached"
Message: "You've used all 5 introduction requests for this month. Your limit will reset on [date]. Upgrade to Pro for unlimited requests."
Actions: [Upgrade to Pro] [View Billing]
```

#### 6.2.2 Payment Failed

```
Title: "Payment Failed"
Message: "We couldn't process your payment. Please update your payment method to continue your Pro subscription."
Actions: [Update Payment] [Contact Support]
```

#### 6.2.3 Subscription Sync Error

```
Title: "Subscription Status Error"
Message: "We're having trouble verifying your subscription. Please try again or contact support."
Actions: [Retry] [Contact Support]
```

---

## 7. Testing Requirements

### 7.1 Unit Tests

- Subscription service functions
- Usage tracking calculations
- Date/anniversary logic
- Limit enforcement logic

### 7.2 Integration Tests

- Stripe webhook handling
- Request creation with limits
- Plan upgrades/downgrades
- Monthly reset job

### 7.3 E2E Tests

- Complete upgrade flow
- Complete downgrade flow
- Limit reached scenario
- Payment failure recovery

### 7.4 Test Scenarios

1. **Free User Creates 5 Requests**
   - Verify counter increments
   - Verify 6th request blocked
   - Verify notifications sent

2. **Free User Upgrades to Pro**
   - Verify Stripe checkout works
   - Verify webhook updates user
   - Verify unlimited access granted

3. **Pro User Downgrades**
   - Verify access maintained until period end
   - Verify downgrade on period end
   - Verify free tier limits apply after

4. **Monthly Reset**
   - Verify counters reset on anniversary
   - Verify correct users selected
   - Verify timezone handling

5. **Payment Failure**
   - Verify status updates
   - Verify notifications sent
   - Verify grace period handling

---

## 8. Security Considerations

### 8.1 Webhook Security

- Verify Stripe webhook signatures
- Use webhook secret from environment
- Log all webhook events
- Rate limit webhook endpoint

### 8.2 Usage Tracking

- Prevent counter manipulation
- Server-side enforcement only
- Validate all requests server-side
- Log suspicious activity

### 8.3 Subscription Status

- Never trust client-side plan status
- Always verify from database
- Sync with Stripe periodically
- Handle stale data gracefully

---

## 9. Performance Considerations

### 9.1 Database Queries

- Index on `planType` for quick filtering
- Index on `freeTierStartDate` for reset job
- Cache user subscription status (5 min TTL)
- Batch reset operations

### 9.2 API Performance

- Cache subscription checks (1 min TTL)
- Optimize webhook processing
- Async notification sending
- Background job for resets

---

## 10. Monitoring & Analytics

### 10.1 Metrics to Track

- Free tier usage patterns (avg requests/user)
- Conversion rate (Free → Pro)
- Churn rate (Pro → Free)
- Time to upgrade (days from signup)
- Limit reached frequency
- Payment failure rate
- Webhook processing time

### 10.2 Alerts

- Webhook processing failures
- Payment failure spike
- Subscription sync errors
- Reset job failures
- High churn rate

### 10.3 Dashboards

- Subscription overview (Free vs Pro count)
- Revenue metrics (MRR, ARR)
- Usage patterns
- Conversion funnel
- Churn analysis

---

## 11. Future Enhancements

### 11.1 Phase 2 Features

- Annual billing option (discounted)
- Team/Enterprise plans
- Usage-based pricing tiers
- Referral program (extra free requests)
- Trial period for Pro features

### 11.2 Advanced Restrictions (Configurable System)

The system is designed with a flexible architecture to easily add new restrictions in the future:

**Potential Future Restrictions:**

- API rate limiting per plan
- Storage limits per plan (e.g., file uploads)
- Full CRM integrations (Pro only)
- Export capabilities (Pro only)
- Custom branding (Pro only)
- Webhook integrations (Pro only)

**Implementation Pattern for Adding New Restrictions:**

1. Add restriction to `RESTRICTION_REGISTRY` in config
2. Create service method to check restriction
3. Add enforcement in relevant API endpoints
4. Update UI to show restriction status
5. Add to billing page feature comparison

**Example: Adding Storage Limit**

```typescript
// 1. Add to RESTRICTION_REGISTRY
{
  name: 'storage_mb',
  freeTierLimit: 100,
  proTierLimit: null,
  description: 'File storage limit in MB',
}

// 2. Service method
async canUploadFile(userId: string, fileSizeMB: number): Promise<boolean> {
  const user = await getUser(userId)
  if (user.planType === 'pro') return true

  const currentUsage = await getStorageUsage(userId)
  const limit = SUBSCRIPTION_CONFIG.FREE_TIER.STORAGE_LIMIT
  return (currentUsage + fileSizeMB) <= limit
}

// 3. Enforce in API
if (!await canUploadFile(userId, fileSize)) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'Storage limit reached. Upgrade to Pro for unlimited storage.'
  })
}
```

### 11.3 Optimization

- Predictive upgrade prompts
- A/B testing for pricing
- Personalized upgrade offers
- Usage-based recommendations

---

## 12. Implementation Timeline

### Phase 1: Foundation (Week 1-2)

- [ ] Database schema updates
- [ ] Migration scripts
- [ ] Subscription service layer
- [ ] Usage tracking service
- [ ] Unit tests

### Phase 2: Core Logic (Week 2-3)

- [ ] Update introduction request creation
- [ ] Implement limit enforcement
- [ ] Enhance webhook handler
- [ ] Monthly reset job
- [ ] Integration tests

### Phase 3: UI/UX (Week 3-4)

- [ ] Plan indicator in header
- [ ] Limit reached modal
- [ ] Warning notifications
- [ ] Billing page updates
- [ ] E2E tests

### Phase 4: Testing & Launch (Week 4-5)

- [ ] QA testing
- [ ] Stripe test mode validation
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] User communication

---

## 13. Dependencies

### 13.1 External Services

- Stripe (already integrated)
- Email service (already integrated)
- Notification system (SSE - already integrated)

### 13.2 Internal Dependencies

- Database (PostgreSQL with Drizzle ORM)
- tRPC API layer
- Authentication system (Better Auth)
- Notification system

### 13.3 Environment Setup

- Stripe test account
- Webhook endpoint configuration
- Cron job scheduler
- Monitoring tools

---

## 14. Rollout Strategy

### 14.1 Soft Launch

1. Deploy to staging environment
2. Test with internal users
3. Validate Stripe integration
4. Monitor for issues

### 14.2 Beta Launch

1. Enable for 10% of users
2. Monitor metrics closely
3. Gather feedback
4. Iterate on UX

### 14.3 Full Launch

1. Announce to all users
2. Migrate existing users
3. Enable for 100%
4. Monitor and optimize

### 14.4 Communication Plan

- Pre-launch: Email announcement
- Launch day: In-app banner
- Post-launch: Blog post, social media
- Ongoing: Help docs, FAQs

---

## 15. Success Criteria

### 15.1 Launch Criteria

- [ ] All tests passing
- [ ] Stripe integration validated
- [ ] Webhook handling tested
- [ ] UI/UX reviewed and approved
- [ ] Documentation complete
- [ ] Monitoring in place

### 15.2 Post-Launch Metrics (30 days)

- Conversion rate > 5%
- Payment failure rate < 2%
- Webhook success rate > 99%
- User satisfaction score > 4/5
- Zero critical bugs

---

## 16. Risk Assessment

### 16.1 Technical Risks

| Risk                    | Impact | Probability | Mitigation                       |
| ----------------------- | ------ | ----------- | -------------------------------- |
| Webhook failures        | High   | Medium      | Retry logic, manual sync tool    |
| Usage counter drift     | Medium | Low         | Server-side validation, auditing |
| Performance degradation | Medium | Low         | Caching, indexing, monitoring    |
| Stripe API changes      | Low    | Low         | Version pinning, monitoring      |

### 16.2 Business Risks

| Risk                 | Impact | Probability | Mitigation                        |
| -------------------- | ------ | ----------- | --------------------------------- |
| Low conversion rate  | High   | Medium      | A/B testing, pricing optimization |
| High churn rate      | High   | Low         | Value demonstration, support      |
| User backlash        | Medium | Low         | Clear communication, grace period |
| Revenue below target | Medium | Medium      | Marketing, feature improvements   |

---

## 17. Appendix

### 17.1 Database Schema (Complete)

```sql
-- User table updates
ALTER TABLE "user" ADD COLUMN "free_tier_start_date" TIMESTAMP;
ALTER TABLE "user" ADD COLUMN "plan_type" VARCHAR(20) DEFAULT 'free' NOT NULL;
ALTER TABLE "user" ADD COLUMN "requests_used_this_cycle" INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE "user" ADD COLUMN "current_cycle_start_date" TIMESTAMP;

-- Indexes
CREATE INDEX idx_user_plan_type ON "user"(plan_type);
CREATE INDEX idx_user_free_tier_start ON "user"(free_tier_start_date)
  WHERE free_tier_start_date IS NOT NULL;

-- Set existing users to free tier
UPDATE "user"
SET
  plan_type = 'free',
  free_tier_start_date = NOW(),
  current_cycle_start_date = NOW(),
  requests_used_this_cycle = 0
WHERE plan_type IS NULL;
```

### 17.2 Type Definitions

```typescript
// Subscription types
export type PlanType = 'free' | 'pro'

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | null

export interface SubscriptionDetails {
  planType: PlanType
  status: SubscriptionStatus
  requestsUsed: number
  requestsLimit: number | null // null = unlimited
  nextResetDate: Date | null
  stripeSubscriptionId: string | null
  currentPeriodEnd: Date | null
}

export interface UsageStats {
  requestsThisCycle: number
  requestsLastCycle: number
  totalRequests: number
  averagePerMonth: number
  cycleStartDate: Date
  cycleEndDate: Date
}

export interface CanCreateRequestResult {
  allowed: boolean
  reason?: string
  remainingRequests?: number
}
```

### 17.3 API Response Examples

```typescript
// GET /api/trpc/billing.getPlanDetails
{
  "plan": "free",
  "requestsUsed": 3,
  "requestsLimit": 5,
  "nextResetDate": "2026-04-15T00:00:00Z",
  "subscriptionStatus": null
}

// GET /api/trpc/billing.canCreateRequest
{
  "allowed": true,
  "remainingRequests": 2
}

// Error response when limit reached
{
  "allowed": false,
  "reason": "You've reached your monthly limit of 5 introduction requests. Upgrade to Pro for unlimited requests.",
  "remainingRequests": 0
}
```

---

## Document Control

**Version History:**

- v1.0 (2026-03-30): Initial draft

**Reviewers:**

- Product Manager: [Pending]
- Engineering Lead: [Pending]
- Design Lead: [Pending]

**Approval:**

- [ ] Product Manager
- [ ] Engineering Lead
- [ ] Design Lead
- [ ] Stakeholders

**Next Steps:**

1. Review and approve PRD
2. Create technical design document
3. Break down into implementation tasks
4. Assign to development team
5. Begin Phase 1 implementation

---

_End of Document_
