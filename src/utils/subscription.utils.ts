/**
 * Subscription Utility Functions
 *
 * Pure functions for subscription calculations that don't require database access.
 * These can be easily unit tested without mocking.
 */

import type { UserSubscriptionData } from '@/types/subscription.types'
import { PLAN_TYPES } from '@/configs/subscription.config'

/**
 * Calculate the next reset date based on the free tier start date
 * Resets on the same day of each month (anniversary date)
 */
export function calculateNextResetDate(freeTierStartDate: Date): Date {
  const now = new Date()
  const startDay = freeTierStartDate.getDate()

  // Create a date for this month's reset
  const thisMonthReset = new Date(
    now.getFullYear(),
    now.getMonth(),
    startDay,
    0,
    0,
    0,
    0,
  )

  // If this month's reset has already passed, use next month
  if (now >= thisMonthReset) {
    return new Date(now.getFullYear(), now.getMonth() + 1, startDay, 0, 0, 0, 0)
  }

  return thisMonthReset
}

/**
 * Check if a user needs their cycle reset
 * Returns true if the current date is past their reset date
 */
export function needsCycleReset(user: UserSubscriptionData): boolean {
  // Pro users don't need resets
  if (user.planType === PLAN_TYPES.PRO) {
    return false
  }

  // No free tier start date means no reset needed
  if (!user.freeTierStartDate) {
    return false
  }

  const now = new Date()
  const nextReset = calculateNextResetDate(user.freeTierStartDate)

  return now >= nextReset
}

// Made with Bob
