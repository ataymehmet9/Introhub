# Subscription System Testing Guide

This document outlines the testing strategy for the subscription system implementation.

## Testing Overview

The subscription system requires comprehensive testing across multiple layers:

1. **Unit Tests** - Test individual functions and services
2. **Integration Tests** - Test API endpoints and database interactions
3. **End-to-End Tests** - Test complete user flows
4. **Manual Testing** - Verify UI/UX and edge cases

## Unit Tests (Task 5.2)

### Location

`src/__tests__/subscription.test.ts`

### Coverage Areas

#### Subscription Service Tests

- ✅ `calculateNextResetDate()` - Anniversary-based reset logic
- ✅ `canCreateRequest()` - Request limit checking
- ✅ `getUserSubscription()` - Plan details retrieval
- ✅ `incrementRequestCount()` - Counter updates
- ⚠️ `upgradeToPro()` - Plan upgrade logic (to implement)
- ⚠️ `downgradeToFree()` - Plan downgrade logic (to implement)

#### Usage Tracking Service Tests

- ⚠️ `getUsageStats()` - Statistics calculation
- ⚠️ `getUsersApproachingLimit()` - Warning threshold detection
- ⚠️ `getCycleProgress()` - Cycle percentage calculation

### Running Unit Tests

```bash
# Run all tests
npm test

# Run subscription tests only
npm test subscription

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Integration Tests (Task 5.3)

### Test Scenarios

#### Request Limit Enforcement

```typescript
describe('Request Limit Enforcement', () => {
  it('should prevent request creation when limit reached', async () => {
    // 1. Create test user with 5 requests used
    const user = await createTestUser({ requestsUsed: 5 })

    // 2. Attempt to create request
    const response = await trpcClient.introductionRequests.create.mutate({
      targetContactId: testContact.id,
      message: 'Test message',
    })

    // 3. Verify rejection
    expect(response).toThrow('Monthly request limit reached')
  })

  it('should allow request after monthly reset', async () => {
    // 1. Create user at limit
    const user = await createTestUser({
      requestsUsed: 5,
      freeTierStartDate: new Date('2024-01-15'),
    })

    // 2. Run reset job
    await runMonthlyReset()

    // 3. Verify counter reset
    const updatedUser = await getUser(user.id)
    expect(updatedUser.requestsUsedThisCycle).toBe(0)

    // 4. Create request successfully
    const response = await trpcClient.introductionRequests.create.mutate({
      targetContactId: testContact.id,
      message: 'Test message',
    })

    expect(response).toBeDefined()
  })
})
```

#### Stripe Webhook Processing

```typescript
describe('Stripe Webhooks', () => {
  it('should upgrade user on successful checkout', async () => {
    // 1. Create free tier user
    const user = await createTestUser({ planType: 'free' })

    // 2. Simulate Stripe checkout.session.completed webhook
    await processWebhook({
      type: 'checkout.session.completed',
      data: {
        customer: user.stripeCustomerId,
        subscription: 'sub_123',
      },
    })

    // 3. Verify upgrade
    const updatedUser = await getUser(user.id)
    expect(updatedUser.planType).toBe('pro')
    expect(updatedUser.freeTierStartDate).toBeNull()
  })

  it('should downgrade user on subscription cancellation', async () => {
    // 1. Create pro tier user
    const user = await createTestUser({
      planType: 'pro',
      stripeSubscriptionId: 'sub_123',
    })

    // 2. Simulate subscription.deleted webhook
    await processWebhook({
      type: 'customer.subscription.deleted',
      data: {
        id: 'sub_123',
      },
    })

    // 3. Verify downgrade
    const updatedUser = await getUser(user.id)
    expect(updatedUser.planType).toBe('free')
    expect(updatedUser.freeTierStartDate).toBeDefined()
    expect(updatedUser.requestsUsedThisCycle).toBe(0)
  })
})
```

## End-to-End Tests (Task 5.4)

### Complete Upgrade Flow

```typescript
describe('E2E: Upgrade Flow', () => {
  it('should complete full upgrade to Pro', async () => {
    // 1. Login as free tier user
    await login(testUser)

    // 2. Navigate to billing page
    await page.goto('/me/billing')

    // 3. Verify free tier status
    await expect(page.locator('[data-testid="current-plan"]')).toContainText(
      'Free',
    )

    // 4. Click upgrade button
    await page.click('[data-testid="upgrade-button"]')

    // 5. Complete Stripe checkout (use test mode)
    await completeStripeCheckout({
      cardNumber: '4242424242424242',
      expiry: '12/34',
      cvc: '123',
    })

    // 6. Verify redirect back to billing page
    await expect(page).toHaveURL('/me/billing?success=true')

    // 7. Verify pro status
    await expect(page.locator('[data-testid="current-plan"]')).toContainText(
      'Pro',
    )

    // 8. Verify unlimited requests
    await expect(
      page.locator('[data-testid="requests-remaining"]'),
    ).toContainText('Unlimited')

    // 9. Create multiple requests to verify no limit
    for (let i = 0; i < 10; i++) {
      await createIntroductionRequest()
    }

    // All should succeed
  })
})
```

### Complete Downgrade Flow

```typescript
describe('E2E: Downgrade Flow', () => {
  it('should complete full downgrade to Free', async () => {
    // 1. Login as pro tier user
    await login(proUser)

    // 2. Navigate to billing page
    await page.goto('/me/billing')

    // 3. Open Stripe portal
    await page.click('[data-testid="manage-subscription"]')

    // 4. Cancel subscription in portal
    await cancelSubscriptionInPortal()

    // 5. Return to app
    await page.goto('/me/billing')

    // 6. Verify free tier status
    await expect(page.locator('[data-testid="current-plan"]')).toContainText(
      'Free',
    )

    // 7. Verify request limits enforced
    await expect(
      page.locator('[data-testid="requests-remaining"]'),
    ).toContainText('5')

    // 8. Create 5 requests
    for (let i = 0; i < 5; i++) {
      await createIntroductionRequest()
    }

    // 9. Attempt 6th request - should show limit modal
    await createIntroductionRequest()
    await expect(page.locator('[data-testid="limit-modal"]')).toBeVisible()
  })
})
```

### Failed Payment Handling

```typescript
describe('E2E: Failed Payment', () => {
  it('should handle failed payment correctly', async () => {
    // 1. Login as pro user
    await login(proUser)

    // 2. Simulate failed payment webhook
    await simulateWebhook({
      type: 'invoice.payment_failed',
      subscription: proUser.stripeSubscriptionId,
    })

    // 3. Verify notification received
    await page.goto('/dashboard')
    await expect(
      page.locator('[data-testid="notification-badge"]'),
    ).toBeVisible()

    // 4. Check notification content
    await page.click('[data-testid="notifications-dropdown"]')
    await expect(
      page.locator('[data-testid="notification-item"]'),
    ).toContainText('payment failed')

    // 5. Verify subscription status updated
    await page.goto('/me/billing')
    await expect(
      page.locator('[data-testid="subscription-status"]'),
    ).toContainText('past_due')
  })
})
```

## Manual Testing Checklist

### UI/UX Testing

#### User Dropdown

- [ ] Free tier badge displays correctly
- [ ] Pro tier badge displays correctly
- [ ] Request counter shows correct remaining requests
- [ ] Upgrade CTA appears for free tier users
- [ ] Counter updates after creating request

#### Billing Page

- [ ] Usage stats card displays for free tier
- [ ] Progress bar shows correct percentage
- [ ] Next reset date is accurate
- [ ] Warning appears when >80% used
- [ ] Pro tier shows unlimited message
- [ ] Upgrade button works
- [ ] Stripe portal opens correctly

#### Limit Reached Modal

- [ ] Modal appears when limit hit
- [ ] Shows correct usage stats
- [ ] Displays next reset date
- [ ] Upgrade button redirects to billing
- [ ] "Maybe Later" closes modal

#### Toast Notifications

- [ ] Warning toast appears at 1 request remaining
- [ ] Toast includes upgrade button
- [ ] Toast auto-dismisses after 8 seconds
- [ ] Multiple toasts don't overlap

### Functional Testing

#### Request Creation

- [ ] Free tier: Can create up to 5 requests
- [ ] Free tier: 6th request shows limit modal
- [ ] Pro tier: Can create unlimited requests
- [ ] Counter increments correctly
- [ ] Limit check happens before creation

#### Monthly Reset

- [ ] Reset job runs successfully
- [ ] Counters reset to 0 for eligible users
- [ ] Cycle start date updates
- [ ] Only free tier users are reset
- [ ] Anniversary dates are respected

#### Stripe Integration

- [ ] Checkout session creates successfully
- [ ] Payment completes in test mode
- [ ] Webhook processes upgrade
- [ ] User upgraded immediately
- [ ] Subscription ID stored correctly
- [ ] Portal session opens
- [ ] Cancellation processes correctly
- [ ] Downgrade happens immediately
- [ ] Failed payments handled

### Edge Cases

- [ ] User with no freeTierStartDate
- [ ] User downgrades mid-cycle
- [ ] User upgrades with requests used
- [ ] Month-end anniversary dates (Jan 31 → Feb 28/29)
- [ ] Year transition (Dec → Jan)
- [ ] Concurrent request creation
- [ ] Webhook replay attacks
- [ ] Database connection failures
- [ ] Stripe API errors

## Test Data Setup

### Test Users

```typescript
// Free tier user - no requests
const freeUserNew = {
  email: 'free-new@test.com',
  planType: 'free',
  requestsUsedThisCycle: 0,
  freeTierStartDate: new Date(),
}

// Free tier user - at limit
const freeUserAtLimit = {
  email: 'free-limit@test.com',
  planType: 'free',
  requestsUsedThisCycle: 5,
  freeTierStartDate: new Date('2024-01-15'),
}

// Pro tier user
const proUser = {
  email: 'pro@test.com',
  planType: 'pro',
  requestsUsedThisCycle: 50,
  stripeCustomerId: 'cus_test123',
  stripeSubscriptionId: 'sub_test123',
}
```

### Stripe Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Subscription Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

## Test Coverage Goals

- **Unit Tests**: >80% coverage
- **Integration Tests**: All critical paths
- **E2E Tests**: Complete user journeys
- **Manual Tests**: All UI components

## Notes

- Tests use Vitest framework
- E2E tests use Playwright
- Stripe webhooks tested with test mode
- Database uses test instance
- All tests should be idempotent
- Clean up test data after each run
