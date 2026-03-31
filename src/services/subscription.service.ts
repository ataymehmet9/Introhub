/**
 * Subscription Service
 *
 * Core business logic for managing user subscriptions, plan detection,
 * and usage limit enforcement.
 */

import { eq } from 'drizzle-orm'
import type {
  CanCreateRequestResult,
  SubscriptionDetails,
} from '@/types/subscription.types'
import type { PlanType } from '@/configs/subscription.config'
import { db } from '@/db'
import { user as userTable } from '@/db/schema'
import { PLAN_TYPES, SUBSCRIPTION_CONFIG } from '@/configs/subscription.config'
import { calculateNextResetDate } from '@/utils/subscription.utils'

/**
 * Get user's complete subscription details
 */
export async function getUserSubscription(
  userId: string,
): Promise<SubscriptionDetails> {
  const users = await db
    .select({
      planType: userTable.planType,
      freeTierStartDate: userTable.freeTierStartDate,
      requestsUsedThisCycle: userTable.requestsUsedThisCycle,
      currentCycleStartDate: userTable.currentCycleStartDate,
      stripeSubscriptionId: userTable.stripeSubscriptionId,
      stripeSubscriptionStatus: userTable.stripeSubscriptionStatus,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)

  if (users.length === 0) {
    throw new Error('User not found')
  }

  const dbUser = users[0]

  // Determine request limit based on plan
  const requestsLimit =
    dbUser.planType === PLAN_TYPES.PRO
      ? null // unlimited
      : SUBSCRIPTION_CONFIG.FREE_TIER.REQUEST_LIMIT

  // Calculate next reset date for free tier
  let nextResetDate: Date | null = null
  if (dbUser.planType === PLAN_TYPES.FREE && dbUser.freeTierStartDate) {
    nextResetDate = calculateNextResetDate(dbUser.freeTierStartDate)
  }

  // Determine current period end for pro tier
  const currentPeriodEnd: Date | null = null
  // This will be populated from Stripe subscription data in the billing router

  return {
    planType: dbUser.planType as PlanType,
    status: dbUser.stripeSubscriptionStatus
      ? (dbUser.stripeSubscriptionStatus as
          | 'active'
          | 'past_due'
          | 'canceled'
          | 'unpaid'
          | 'incomplete'
          | 'incomplete_expired'
          | 'trialing')
      : null,
    requestsUsed: dbUser.requestsUsedThisCycle,
    requestsLimit,
    nextResetDate,
    stripeSubscriptionId: dbUser.stripeSubscriptionId,
    currentPeriodEnd,
  }
}

/**
 * Check if user can create an introduction request
 */
export async function canCreateRequest(
  userId: string,
): Promise<CanCreateRequestResult> {
  const subscription = await getUserSubscription(userId)

  // Pro users have unlimited requests
  if (subscription.planType === PLAN_TYPES.PRO) {
    return {
      allowed: true,
    }
  }

  // Free tier users have a limit
  const limit = SUBSCRIPTION_CONFIG.FREE_TIER.REQUEST_LIMIT
  const used = subscription.requestsUsed

  if (used >= limit) {
    return {
      allowed: false,
      reason: `You've reached your monthly limit of ${limit} introduction requests. Upgrade to Pro for unlimited requests.`,
      remainingRequests: 0,
    }
  }

  return {
    allowed: true,
    remainingRequests: limit - used,
  }
}

/**
 * Get remaining requests for a user
 */
export async function getRemainingRequests(userId: string): Promise<number> {
  const subscription = await getUserSubscription(userId)

  // Pro users have unlimited
  if (subscription.planType === PLAN_TYPES.PRO) {
    return Infinity
  }

  // Free tier
  const limit = SUBSCRIPTION_CONFIG.FREE_TIER.REQUEST_LIMIT
  const remaining = limit - subscription.requestsUsed
  return Math.max(0, remaining)
}

/**
 * Increment the request counter for a user
 */
export async function incrementRequestCount(userId: string): Promise<void> {
  const users = await db
    .select({
      planType: userTable.planType,
      requestsUsedThisCycle: userTable.requestsUsedThisCycle,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)

  if (users.length === 0) {
    throw new Error('User not found')
  }

  const dbUser = users[0]

  // Only increment for free tier users
  if (dbUser.planType === PLAN_TYPES.FREE) {
    await db
      .update(userTable)
      .set({
        requestsUsedThisCycle: dbUser.requestsUsedThisCycle + 1,
      })
      .where(eq(userTable.id, userId))
  }
}

/**
 * Handle upgrade to Pro plan
 */
export async function upgradeToPro(
  userId: string,
  stripeSubscriptionId: string,
): Promise<void> {
  await db
    .update(userTable)
    .set({
      planType: PLAN_TYPES.PRO,
      freeTierStartDate: null, // Clear free tier tracking
      requestsUsedThisCycle: 0, // Reset counter
      stripeSubscriptionId,
      stripeSubscriptionStatus: 'active',
    })
    .where(eq(userTable.id, userId))
}

/**
 * Handle downgrade to Free plan
 */
export async function downgradeToFree(userId: string): Promise<void> {
  const now = new Date()

  await db
    .update(userTable)
    .set({
      planType: PLAN_TYPES.FREE,
      freeTierStartDate: now, // Set new free tier start date
      currentCycleStartDate: now,
      requestsUsedThisCycle: 0, // Reset counter
      stripeSubscriptionId: null,
      stripeSubscriptionStatus: null,
    })
    .where(eq(userTable.id, userId))
}

// calculateNextResetDate and needsCycleReset moved to @/utils/subscription.utils
// for easier testing without database dependencies

/**
 * Reset monthly counters for users who need it
 * This should be called by a background job
 */
export async function resetMonthlyCounters(): Promise<number> {
  const now = new Date()
  const currentDay = now.getDate()

  // Find all free tier users whose anniversary day matches today
  const usersToReset = await db
    .select({
      id: userTable.id,
      freeTierStartDate: userTable.freeTierStartDate,
      requestsUsedThisCycle: userTable.requestsUsedThisCycle,
    })
    .from(userTable)
    .where(eq(userTable.planType, PLAN_TYPES.FREE))

  let resetCount = 0

  for (const user of usersToReset) {
    if (user.freeTierStartDate) {
      const startDay = user.freeTierStartDate.getDate()

      // Reset if the anniversary day matches
      if (startDay === currentDay) {
        await db
          .update(userTable)
          .set({
            requestsUsedThisCycle: 0,
            currentCycleStartDate: now,
          })
          .where(eq(userTable.id, user.id))

        resetCount++
      }
    }
  }

  return resetCount
}

// Made with Bob
