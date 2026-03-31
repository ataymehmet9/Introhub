# Subscription System Deployment Guide

This guide covers the deployment and migration process for the two-tier subscription system (Free & Pro plans).

## Overview

The subscription system has been fully implemented and tested. This guide walks through:

1. Database migration on staging
2. Existing user migration
3. Production deployment
4. Webhook configuration
5. Monitoring and verification

---

## Phase 6.1: Staging Database Migration

### Prerequisites

- Access to staging database
- Drizzle Kit installed (`pnpm add -D drizzle-kit`)
- Staging environment variables configured

### Steps

1. **Backup Staging Database**

   ```bash
   # Create a backup before migration
   pg_dump -h staging-host -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Review Migration Script**

   ```bash
   # Review the migration file
   cat drizzle/0005_melodic_wind_dancer.sql
   ```

   The migration adds:
   - `planType` (default: 'free')
   - `freeTierStartDate` (nullable)
   - `requestsUsedThisCycle` (default: 0)
   - `currentCycleStartDate` (nullable)
   - `stripeCustomerId` (nullable)
   - `stripeSubscriptionId` (nullable)
   - `stripeSubscriptionStatus` (nullable)

3. **Run Migration on Staging**

   ```bash
   # Set staging environment
   export DATABASE_URL="postgresql://user:pass@staging-host:5432/db"

   # Push schema changes
   pnpm drizzle-kit push
   ```

4. **Verify Schema Changes**

   ```bash
   # Connect to staging database
   psql $DATABASE_URL

   # Check new columns
   \d "user"

   # Verify indexes
   \di
   ```

5. **Test with Sample Data**

   ```sql
   -- Create a test user
   INSERT INTO "user" (id, email, name, "planType", "freeTierStartDate", "requestsUsedThisCycle")
   VALUES ('test-user-1', 'test@example.com', 'Test User', 'free', NOW(), 0);

   -- Verify
   SELECT id, email, "planType", "freeTierStartDate", "requestsUsedThisCycle"
   FROM "user"
   WHERE id = 'test-user-1';
   ```

### Rollback Plan

If issues occur:

```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

---

## Phase 6.2: Migrate Existing Users to Free Tier

### Migration Script

Create a migration script to initialize existing users:

```typescript
// scripts/migrate-users-to-free-tier.ts
import { db } from '@/db'
import { user as userTable } from '@/db/schema'
import { eq, isNull } from 'drizzle-orm'

async function migrateUsersToFreeTier() {
  console.log('Starting user migration to free tier...')

  try {
    // Find all users without a plan type set
    const usersToMigrate = await db
      .select({
        id: userTable.id,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .where(isNull(userTable.planType))

    console.log(`Found ${usersToMigrate.length} users to migrate`)

    // Update each user
    let successCount = 0
    let errorCount = 0

    for (const user of usersToMigrate) {
      try {
        await db
          .update(userTable)
          .set({
            planType: 'free',
            freeTierStartDate: user.createdAt || new Date(),
            requestsUsedThisCycle: 0,
            currentCycleStartDate: user.createdAt || new Date(),
          })
          .where(eq(userTable.id, user.id))

        successCount++

        if (successCount % 100 === 0) {
          console.log(`Migrated ${successCount} users...`)
        }
      } catch (error) {
        console.error(`Error migrating user ${user.id}:`, error)
        errorCount++
      }
    }

    console.log('\nMigration complete!')
    console.log(`✓ Successfully migrated: ${successCount} users`)
    console.log(`✗ Errors: ${errorCount} users`)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateUsersToFreeTier()
  .then(() => {
    console.log('Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })
```

### Running the Migration

1. **On Staging**

   ```bash
   # Set staging environment
   export DATABASE_URL="postgresql://user:pass@staging-host:5432/db"

   # Run migration script
   tsx scripts/migrate-users-to-free-tier.ts
   ```

2. **Verify Migration**

   ```sql
   -- Check all users have plan type
   SELECT COUNT(*) FROM "user" WHERE "planType" IS NULL;
   -- Should return 0

   -- Check distribution
   SELECT "planType", COUNT(*)
   FROM "user"
   GROUP BY "planType";

   -- Sample check
   SELECT id, email, "planType", "freeTierStartDate", "requestsUsedThisCycle"
   FROM "user"
   LIMIT 10;
   ```

3. **Test User Flows**
   - Log in as a migrated user
   - Check plan indicator in header
   - Verify billing page shows correct info
   - Test creating introduction requests

---

## Phase 6.3: Production Deployment

### Pre-Deployment Checklist

- [ ] Staging migration successful
- [ ] User migration tested on staging
- [ ] All tests passing
- [ ] Stripe webhook endpoint configured
- [ ] Environment variables set
- [ ] Monitoring tools ready
- [ ] Rollback plan documented

### Environment Variables

Ensure these are set in production:

```bash
# Database
DATABASE_URL=postgresql://user:pass@prod-host:5432/db

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...  # Pro plan price ID

# Application
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_APP_URL=https://yourdomain.com
```

### Deployment Steps

1. **Deploy Application Code**

   ```bash
   # Build application
   pnpm build

   # Deploy to your hosting platform
   # (Vercel, Netlify, AWS, etc.)
   ```

2. **Run Database Migration**

   ```bash
   # Set production environment
   export DATABASE_URL="postgresql://user:pass@prod-host:5432/db"

   # Push schema changes
   pnpm drizzle-kit push
   ```

3. **Migrate Existing Users**

   ```bash
   # Run migration script on production
   tsx scripts/migrate-users-to-free-tier.ts
   ```

4. **Set Up Cron Job for Monthly Reset**

   Choose one of these options:

   **Option A: System Cron (Linux/macOS)**

   ```bash
   # Edit crontab
   crontab -e

   # Add daily job at 2 AM
   0 2 * * * cd /path/to/app && tsx src/jobs/monthly-reset.ts >> /var/log/subscription-reset.log 2>&1
   ```

   **Option B: Node-cron (In-app)**

   ```typescript
   // src/jobs/scheduler.ts
   import cron from 'node-cron'
   import { resetMonthlyLimits } from './monthly-reset'

   // Run daily at 2 AM
   cron.schedule('0 2 * * *', async () => {
     console.log('Running monthly reset job...')
     await resetMonthlyLimits()
   })
   ```

   **Option C: Cloud Scheduler (AWS/GCP)**
   - AWS EventBridge: Create rule with cron expression `0 2 * * ? *`
   - GCP Cloud Scheduler: Create job with schedule `0 2 * * *`
   - Trigger Lambda/Cloud Function that runs the reset script

5. **Configure Stripe Webhook**

   In Stripe Dashboard:
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/billing/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

6. **Verify Deployment**

   ```bash
   # Check application is running
   curl https://yourdomain.com/api/health

   # Test webhook endpoint
   curl -X POST https://yourdomain.com/api/billing/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"ping"}'
   ```

---

## Phase 6.4: Monitoring and Verification

### Webhook Monitoring

1. **Stripe Dashboard**
   - Go to Developers → Webhooks
   - Monitor webhook attempts
   - Check for failed deliveries
   - Review event logs

2. **Application Logs**

   ```bash
   # Monitor webhook processing
   tail -f /var/log/app.log | grep "Stripe webhook"

   # Check for errors
   tail -f /var/log/app.log | grep "ERROR"
   ```

3. **Database Monitoring**

   ```sql
   -- Check subscription status distribution
   SELECT "stripeSubscriptionStatus", COUNT(*)
   FROM "user"
   WHERE "planType" = 'pro'
   GROUP BY "stripeSubscriptionStatus";

   -- Monitor failed payments
   SELECT id, email, "stripeSubscriptionStatus"
   FROM "user"
   WHERE "stripeSubscriptionStatus" IN ('past_due', 'unpaid', 'incomplete');
   ```

### Test Complete Flows

1. **Free Tier User Flow**
   - [ ] Create new account
   - [ ] Verify starts on free tier
   - [ ] Create 5 introduction requests
   - [ ] Verify limit reached modal appears
   - [ ] Check plan indicator in header

2. **Upgrade Flow**
   - [ ] Click "Upgrade to Pro" button
   - [ ] Complete Stripe checkout
   - [ ] Verify webhook processes successfully
   - [ ] Check user upgraded to pro tier
   - [ ] Verify unlimited requests work
   - [ ] Check billing page shows subscription

3. **Downgrade Flow**
   - [ ] Cancel subscription in Stripe portal
   - [ ] Verify webhook processes cancellation
   - [ ] Check user downgraded to free tier
   - [ ] Verify `freeTierStartDate` set correctly
   - [ ] Test 5 request limit enforced

4. **Monthly Reset Flow**
   - [ ] Wait for cron job to run (or trigger manually)
   - [ ] Verify free tier users' counters reset
   - [ ] Check `currentCycleStartDate` updated
   - [ ] Verify only eligible users reset (anniversary date)

### Monitoring Queries

```sql
-- Daily subscription metrics
SELECT
  DATE("createdAt") as date,
  "planType",
  COUNT(*) as new_users
FROM "user"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt"), "planType"
ORDER BY date DESC;

-- Users approaching limit
SELECT
  id,
  email,
  "requestsUsedThisCycle",
  "currentCycleStartDate"
FROM "user"
WHERE "planType" = 'free'
  AND "requestsUsedThisCycle" >= 4;

-- Failed subscription payments
SELECT
  id,
  email,
  "stripeSubscriptionStatus",
  "updatedAt"
FROM "user"
WHERE "stripeSubscriptionStatus" IN ('past_due', 'unpaid')
ORDER BY "updatedAt" DESC;

-- Monthly reset candidates (for verification)
SELECT
  id,
  email,
  "freeTierStartDate",
  "currentCycleStartDate",
  "requestsUsedThisCycle",
  AGE(NOW(), "currentCycleStartDate") as days_since_reset
FROM "user"
WHERE "planType" = 'free'
  AND AGE(NOW(), "currentCycleStartDate") >= INTERVAL '30 days'
ORDER BY "currentCycleStartDate" ASC
LIMIT 10;
```

### Alert Setup

Set up alerts for:

1. **Failed Webhooks**
   - Monitor Stripe webhook failures
   - Alert if >5 failures in 1 hour

2. **Failed Payments**
   - Alert when users enter `past_due` status
   - Daily report of payment issues

3. **Cron Job Failures**
   - Alert if monthly reset job fails
   - Monitor job execution logs

4. **High Request Usage**
   - Alert if many users hitting limits
   - May indicate need for plan adjustments

### Performance Monitoring

```sql
-- Query performance check
EXPLAIN ANALYZE
SELECT * FROM "user"
WHERE "planType" = 'free'
  AND "requestsUsedThisCycle" < 5;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'user';
```

---

## Rollback Procedures

### If Issues Occur Post-Deployment

1. **Immediate Rollback**

   ```bash
   # Revert to previous deployment
   git revert HEAD
   pnpm build
   # Deploy previous version
   ```

2. **Database Rollback**

   ```bash
   # Restore from backup
   psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   ```

3. **Disable Webhooks**
   - Go to Stripe Dashboard → Webhooks
   - Disable the webhook endpoint temporarily
   - Fix issues
   - Re-enable when ready

### Partial Rollback (Keep Schema, Disable Features)

If you need to keep the database changes but disable features:

```typescript
// Temporarily disable limit checks
// In src/configs/subscription.config.ts
export const SUBSCRIPTION_CONFIG = {
  FREE_TIER: {
    REQUEST_LIMIT: null, // Temporarily unlimited
    RESET_FREQUENCY: 'monthly',
  },
  // ...
}
```

---

## Post-Deployment Tasks

### Week 1

- [ ] Monitor webhook processing daily
- [ ] Check for failed payments
- [ ] Review user feedback
- [ ] Monitor error logs
- [ ] Verify cron job runs successfully

### Week 2-4

- [ ] Analyze conversion rates (free → pro)
- [ ] Review usage patterns
- [ ] Optimize queries if needed
- [ ] Gather user feedback on limits
- [ ] Consider adjustments to free tier limits

### Ongoing

- [ ] Monthly review of subscription metrics
- [ ] Monitor churn rates
- [ ] Track failed payment recovery
- [ ] Review and optimize cron job performance
- [ ] Update documentation based on learnings

---

## Troubleshooting

### Common Issues

**Issue: Webhook signature verification fails**

```
Solution: Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
Check: Stripe Dashboard → Webhooks → Signing secret
```

**Issue: Users not being reset monthly**

```
Solution: Check cron job is running
Debug: Run monthly-reset.ts manually and check logs
Verify: Check currentCycleStartDate calculations
```

**Issue: Limit not enforced**

```
Solution: Check canCreateRequest() logic
Debug: Query user's requestsUsedThisCycle value
Verify: Check RESTRICTION_REGISTRY configuration
```

**Issue: Upgrade not processing**

```
Solution: Check Stripe webhook logs
Debug: Verify checkout.session.completed event received
Check: Database for stripeSubscriptionId update
```

---

## Support Contacts

- **Database Issues**: DBA team
- **Stripe Issues**: Stripe support + payments team
- **Application Issues**: Development team
- **User Issues**: Customer support team

---

## Success Metrics

Track these metrics post-deployment:

1. **Technical Metrics**
   - Webhook success rate (target: >99%)
   - API response times (target: <200ms)
   - Database query performance
   - Cron job success rate (target: 100%)

2. **Business Metrics**
   - Free → Pro conversion rate
   - Monthly recurring revenue (MRR)
   - Churn rate
   - Average requests per free user
   - Failed payment recovery rate

3. **User Experience Metrics**
   - Time to upgrade
   - Support tickets related to limits
   - User satisfaction scores
   - Feature adoption rate

---

## Conclusion

This deployment guide covers all aspects of rolling out the subscription system. Follow each phase carefully, verify at each step, and monitor closely post-deployment.

For questions or issues, refer to:

- [Subscription System PRD](./subscription-system-prd.md)
- [Testing Guide](./subscription-testing-guide.md)
- Development team documentation
