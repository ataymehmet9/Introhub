# Stripe Setup Quickstart

Quick guide to fix the "You must provide one of `price` or `price_data` for each line item" error.

## The Problem

The error occurs because the required Stripe environment variables are not configured. The checkout session needs a valid Price ID to create a subscription.

## Quick Fix (5 minutes)

### Step 1: Get Your Stripe Price ID

1. Go to https://dashboard.stripe.com/test/products
2. Click on "IntroHub Pro" (or create a new product if it doesn't exist)
3. Copy the **Price ID** (looks like `price_1234567890abcdefghijklmn`)

### Step 2: Get Your Stripe Secret Key

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy the **Secret key** (looks like `sk_test_...`)

### Step 3: Set Up Webhook (for local testing)

**Option A: Using Stripe CLI (Recommended)**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Copy the webhook signing secret from the output (looks like `whsec_...`)

**Option B: Using ngrok**

1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 3000`
3. Copy the HTTPS URL
4. Add webhook endpoint in Stripe Dashboard with the ngrok URL

### Step 4: Update Your .env.local File

Create or update `.env.local` in your project root:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_key_here"
STRIPE_PRO_PRICE_ID="price_your_price_id_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
```

### Step 5: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Start it again
pnpm dev
```

## Test It

1. Go to http://localhost:3000/me/billing
2. Click "Upgrade to Pro"
3. Use test card: `4242 4242 4242 4242`
4. Any future expiry date and any CVC

## Troubleshooting

### Still getting the error?

1. **Check environment variables are loaded:**

   ```bash
   # In your terminal where you run pnpm dev
   echo $STRIPE_PRO_PRICE_ID
   ```

   If empty, the .env.local file isn't being read.

2. **Verify the Price ID is correct:**
   - Must start with `price_`
   - Must be from the correct Stripe account (test/live)
   - Must be an active, recurring price

3. **Check the server logs:**
   Look for error messages when clicking "Upgrade to Pro"

### Webhook not working?

1. **For local development:**
   - Make sure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/billing/webhook`
   - Check the Stripe CLI output for webhook events

2. **Check webhook secret:**
   - Must start with `whsec_`
   - Must match the secret from Stripe CLI or Dashboard

## Next Steps

Once working locally, see the full [Stripe Integration Guide](./stripe-integration.md) for:

- Production deployment
- Security best practices
- Advanced configuration
- Monitoring and debugging

## Quick Reference

### Test Card Numbers

| Card Number         | Result             |
| ------------------- | ------------------ |
| 4242 4242 4242 4242 | Success            |
| 4000 0000 0000 0002 | Decline            |
| 4000 0000 0000 9995 | Insufficient funds |

### Required Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_...        # From API Keys
STRIPE_PRO_PRICE_ID=price_...        # From Products
STRIPE_WEBHOOK_SECRET=whsec_...      # From Webhooks or CLI
```

### Useful Commands

```bash
# Test webhook locally
stripe listen --forward-to localhost:3000/api/billing/webhook

# Trigger a test event
stripe trigger checkout.session.completed

# View recent events
stripe events list

# View logs
stripe logs tail
```
