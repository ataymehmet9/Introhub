# Subscription Cancellation Flow

This document explains how subscription cancellations work in IntroHub and ensures users are properly downgraded when their billing period ends.

## Overview

When a user cancels their Pro subscription through the Stripe Customer Portal, the subscription doesn't end immediately. Instead, Stripe marks it as `cancel_at_period_end: true`, allowing the user to continue using Pro features until the end of their current billing period.

## How It Works

### 1. User Cancels Subscription

**User Action:**

- User clicks "Manage subscription" on the billing page
- Redirected to Stripe Customer Portal
- Clicks "Cancel subscription"
- Stripe confirms cancellation at end of billing period

**What Happens:**

- Stripe sets `cancel_at_period_end: true` on the subscription
- Subscription `status` remains `active`
- User continues to have Pro access

### 2. Webhook Event: `customer.subscription.updated`

**When:** Immediately after cancellation is scheduled

**Handler Logic:**

```typescript
if (subscription.cancel_at_period_end) {
  // Send notification to user
  await db.insert(notifications).values({
    userId,
    type: 'unknown',
    title: 'Subscription Cancellation Scheduled',
    message: `Your Pro subscription will be canceled at the end of your billing period. You'll continue to have Pro access until then.`,
    read: false,
  })
}
```

**Result:**

- User receives in-app notification
- Billing page shows warning alert with cancellation date
- User still has Pro access

### 3. During Billing Period

**User Experience:**

- ✅ Full Pro access (unlimited requests)
- ⚠️ Warning banner on billing page showing cancellation date
- 🔄 Option to reactivate subscription before period ends

**Database State:**

- `planType`: `pro`
- `stripeSubscriptionStatus`: `active`
- Subscription in Stripe: `cancel_at_period_end: true`

### 4. User Reactivates (Optional)

**User Action:**

- Clicks "Manage subscription" before period ends
- In Stripe Portal, clicks "Renew subscription"

**Webhook Event:** `customer.subscription.updated`

**Handler Logic:**

```typescript
if (subscription.status === 'active') {
  const previousSubscription = event.data.previous_attributes
  if (
    previousSubscription &&
    previousSubscription.cancel_at_period_end === true
  ) {
    // Subscription was reactivated
    await db.insert(notifications).values({
      userId,
      type: 'unknown',
      title: 'Subscription Reactivated',
      message:
        'Your Pro subscription has been reactivated and will continue automatically.',
      read: false,
    })
  }
}
```

**Result:**

- `cancel_at_period_end` set back to `false`
- Subscription continues normally
- User receives reactivation notification

### 5. Billing Period Ends

**When:** At the end of the current billing period (e.g., 30 days after last payment)

**Webhook Event:** `customer.subscription.deleted`

**Handler Logic:**

```typescript
case 'customer.subscription.deleted': {
  const subscription = event.data.object
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id

  // Get user ID
  const users = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.stripeCustomerId, customerId))
    .limit(1)

  if (users.length > 0) {
    // Downgrade user to Free
    await downgradeToFree(users[0].id)

    // Send downgrade notification
    await db.insert(notifications).values({
      userId: users[0].id,
      type: 'unknown',
      title: 'Subscription Canceled',
      message: 'Your Pro subscription has been canceled. You now have 5 introduction requests per month on the Free plan.',
      read: false,
    })
  }
  break
}
```

**Result:**

- User downgraded to Free plan
- Database updated:
  - `planType`: `free`
  - `freeTierStartDate`: current date
  - `requestsUsedThisCycle`: 0 (reset)
  - `stripeSubscriptionId`: null
  - `stripeSubscriptionStatus`: null
- User receives downgrade notification
- Request limit enforced (5 per month)

## Database Changes

### During Cancellation Period

```sql
-- User remains Pro
planType = 'pro'
stripeSubscriptionId = 'sub_xxx'
stripeSubscriptionStatus = 'active'
```

### After Period Ends

```sql
-- User downgraded to Free
planType = 'free'
freeTierStartDate = NOW()
currentCycleStartDate = NOW()
requestsUsedThisCycle = 0
stripeSubscriptionId = NULL
stripeSubscriptionStatus = NULL
```

## UI Indicators

### Billing Page

**Active Pro (Not Canceled):**

```
✅ Current plan: Pro
💳 Manage subscription button
```

**Pro with Scheduled Cancellation:**

```
⚠️ Warning Alert:
"Subscription Cancellation Scheduled
Your Pro subscription will be canceled on [DATE].
You'll continue to have Pro access until then.
You can reactivate your subscription anytime before this date."

✅ Current plan: Pro (until [DATE])
💳 Manage subscription button (to reactivate)
```

**After Cancellation:**

```
✅ Current plan: Free
📊 Usage: X/5 requests this month
🚀 Upgrade to Pro button
```

## Testing the Flow

### Test Scenario 1: Cancel and Wait

1. Subscribe to Pro plan
2. Cancel subscription in Stripe Portal
3. Verify:
   - ✅ User still has Pro access
   - ✅ Warning banner shows on billing page
   - ✅ Notification received
4. Wait for billing period to end (or use Stripe CLI to trigger event)
5. Verify:
   - ✅ User downgraded to Free
   - ✅ Request limit enforced (5/month)
   - ✅ Downgrade notification received

### Test Scenario 2: Cancel and Reactivate

1. Subscribe to Pro plan
2. Cancel subscription in Stripe Portal
3. Verify warning banner appears
4. Reactivate subscription in Stripe Portal
5. Verify:
   - ✅ Warning banner disappears
   - ✅ Reactivation notification received
   - ✅ Subscription continues normally

### Using Stripe CLI for Testing

```bash
# Trigger subscription updated (cancellation scheduled)
stripe trigger customer.subscription.updated

# Trigger subscription deleted (period ended)
stripe trigger customer.subscription.deleted

# View webhook events
stripe events list --limit 10
```

## Important Notes

1. **Grace Period:** Users keep Pro access until the end of their billing period, even after canceling
2. **Automatic Downgrade:** The system automatically downgrades users when `customer.subscription.deleted` fires
3. **No Manual Intervention:** No cron jobs or manual processes needed - Stripe webhooks handle everything
4. **Reactivation:** Users can reactivate before the period ends without losing access
5. **Data Preservation:** User data (contacts, requests) is preserved during downgrade

## Troubleshooting

### User Not Downgraded After Period Ends

**Check:**

1. Webhook endpoint is receiving events: Check Stripe Dashboard → Webhooks
2. Webhook signature is valid: Check server logs
3. `customer.subscription.deleted` event was fired: Check Stripe events
4. Database was updated: Query user table for `planType` and `stripeSubscriptionId`

**Solution:**

- Manually trigger the webhook event using Stripe CLI
- Or manually call `downgradeToFree(userId)` function

### User Downgraded Too Early

**Cause:** Likely handling `customer.subscription.updated` incorrectly

**Check:**

- Ensure you're not downgrading when `cancel_at_period_end: true`
- Only downgrade on `customer.subscription.deleted`

### Warning Banner Not Showing

**Check:**

1. `getSubscription` query returns `cancelAtPeriodEnd: true`
2. Stripe subscription has `cancel_at_period_end: true`
3. Frontend is checking `subscription?.cancelAtPeriodEnd`

## Related Files

- Webhook Handler: `src/routes/api/billing/webhook.ts`
- Subscription Service: `src/services/subscription.service.ts`
- Billing Router: `src/integrations/trpc/routes/billing.ts`
- Billing UI: `src/routes/_authenticated/(user)/me/billing.tsx`

## Stripe Documentation

- [Subscription Lifecycle](https://stripe.com/docs/billing/subscriptions/overview)
- [Canceling Subscriptions](https://stripe.com/docs/billing/subscriptions/cancel)
- [Webhook Events](https://stripe.com/docs/api/events/types)
