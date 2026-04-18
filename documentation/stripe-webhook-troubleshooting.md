# Stripe Webhook Troubleshooting Guide

## Issue: Subscription Successful but Account Not Upgraded

### Symptoms

- Successfully completed Stripe checkout
- Redirected back to billing page with success message
- Account still shows as "Free" tier
- Even after logging out and back in, still on Free tier

### Root Cause

The Stripe webhook (`checkout.session.completed`) hasn't been received or processed yet. The success redirect happens **immediately** after checkout, but the webhook that actually upgrades your account can be delayed.

## How It Works

```
1. User clicks "Upgrade to Pro"
2. Redirected to Stripe Checkout
3. Enters payment info
4. Stripe processes payment ✓
5. Stripe redirects to: /me/billing?success=true ← YOU ARE HERE
6. [DELAY: 1-30 seconds or more]
7. Stripe sends webhook to: /api/billing/webhook
8. Webhook handler upgrades account to Pro ← HASN'T HAPPENED YET
```

## Immediate Fix (UI Improvement)

The billing page now:

- Shows "Processing your subscription..." while waiting for webhook
- Automatically polls for updates every 2 seconds
- Shows success message once upgrade is detected
- No manual refresh needed

## Troubleshooting Steps

### 1. Check if Webhook is Configured (Production)

**In Stripe Dashboard:**

1. Go to: https://dashboard.stripe.com/webhooks
2. Look for endpoint: `https://yourdomain.com/api/billing/webhook`
3. Check "Events to send":
   - ✓ `checkout.session.completed`
   - ✓ `customer.subscription.updated`
   - ✓ `customer.subscription.deleted`
   - ✓ `invoice.payment_succeeded`
   - ✓ `invoice.payment_failed`

**If webhook is missing:**

```bash
# Add webhook endpoint in Stripe Dashboard
URL: https://yourdomain.com/api/billing/webhook
Events: Select all 5 events above
Copy the signing secret (whsec_...)
```

### 2. Verify Webhook Secret is Set

**Check environment variable:**

```bash
# In production environment
echo $STRIPE_WEBHOOK_SECRET
# Should output: whsec_...
```

**If missing, add to your deployment platform:**

- Railway: Settings → Variables
- Vercel: Settings → Environment Variables
- AWS: Systems Manager → Parameter Store

### 3. Check Webhook Delivery Status

**In Stripe Dashboard:**

1. Go to: Developers → Webhooks
2. Click on your webhook endpoint
3. View "Recent deliveries"
4. Look for failed attempts (red X)

**Common failure reasons:**

- ❌ 404 Not Found → Endpoint URL is wrong
- ❌ 401 Unauthorized → Webhook secret mismatch
- ❌ 500 Server Error → Application error (check logs)
- ❌ Timeout → Server took too long to respond

### 4. Manual Webhook Retry

**If webhook failed:**

1. Go to Stripe Dashboard → Webhooks
2. Find the failed `checkout.session.completed` event
3. Click "..." → "Resend event"
4. Check if account upgrades

### 5. Check Application Logs

**Look for webhook processing:**

```bash
# Check for webhook events
grep "checkout.session.completed" /var/log/app.log

# Check for errors
grep "ERROR" /var/log/app.log | grep webhook
```

### 6. Verify Database State

**Check user record:**

```sql
SELECT
  id,
  email,
  plan_type,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_subscription_status
FROM "user"
WHERE email = 'user@example.com';
```

**Expected after successful upgrade:**

- `plan_type`: `'pro'`
- `stripe_subscription_id`: `'sub_...'` (not null)
- `stripe_subscription_status`: `'active'`

### 7. Manual Account Upgrade (Emergency)

**If webhook is permanently broken:**

```typescript
// Run this in your database or admin panel
import { upgradeToPro } from '@/services/subscription.service'

await upgradeToPro('user-id-here', 'sub_stripe_subscription_id_here')
```

## Prevention

### For Local Development

**Always run Stripe CLI:**

```bash
# Terminal 1: Run your app
pnpm dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/billing/webhook
```

**Copy the webhook secret:**

```bash
# From Stripe CLI output
Ready! Your webhook signing secret is whsec_...

# Add to .env.local
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### For Production

**Set up monitoring:**

1. Enable webhook failure alerts in Stripe
2. Monitor webhook delivery success rate
3. Set up alerts for failed webhooks (>5 failures/hour)

**Test webhook endpoint:**

```bash
# Test that endpoint is reachable
curl -X POST https://yourdomain.com/api/billing/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Should return 400 (missing signature) - that's OK!
# 404 or 500 means there's a problem
```

## Common Issues

### Issue: Webhook Secret Mismatch

**Symptom:** Webhook fails with "signature verification failed"
**Solution:**

1. Get new webhook secret from Stripe Dashboard
2. Update `STRIPE_WEBHOOK_SECRET` environment variable
3. Restart application

### Issue: Webhook Endpoint Not Found (404)

**Symptom:** Stripe shows 404 errors in webhook logs
**Solution:**

1. Verify URL is correct: `https://yourdomain.com/api/billing/webhook`
2. Check that route file exists: `src/routes/api/billing/webhook.ts`
3. Ensure application is deployed and running

### Issue: Webhook Times Out

**Symptom:** Stripe shows timeout errors
**Solution:**

1. Optimize webhook handler (should respond in <5 seconds)
2. Move heavy processing to background jobs
3. Increase server timeout settings

### Issue: Multiple Webhooks Received

**Symptom:** Account upgraded multiple times or duplicate notifications
**Solution:**

1. Implement idempotency checks in webhook handler
2. Use Stripe's `idempotency_key` for operations
3. Check for duplicate event IDs

## Testing Webhooks

### Test in Development

```bash
# Use Stripe CLI to trigger test events
stripe trigger checkout.session.completed

# Or use test mode in Stripe Dashboard
# Complete a test checkout with card: 4242 4242 4242 4242
```

### Test in Production

```bash
# Use Stripe test mode
# Complete checkout with test card
# Monitor webhook delivery in Stripe Dashboard
```

## Related Files

- Webhook Handler: [`src/routes/api/billing/webhook.ts`](../src/routes/api/billing/webhook.ts)
- Subscription Service: [`src/services/subscription.service.ts`](../src/services/subscription.service.ts)
- Billing Page: [`src/routes/_authenticated/(user)/me/billing.tsx`](<../src/routes/_authenticated/(user)/me/billing.tsx>)

## Support

If webhooks continue to fail:

1. Check Stripe status page: https://status.stripe.com/
2. Review Stripe webhook best practices: https://stripe.com/docs/webhooks/best-practices
3. Contact Stripe support with webhook event IDs
