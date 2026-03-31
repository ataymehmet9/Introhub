/**
 * Usage Tracking Service
 *
 * Service for tracking and analyzing user usage patterns,
 * providing statistics and insights.
 */

import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import type { UsageStats } from '@/types/subscription.types'
import { calculateNextResetDate } from '@/utils/subscription.utils'
import { db } from '@/db'
import { introductionRequests, user as userTable } from '@/db/schema'

/**
 * Get detailed usage statistics for a user
 */
export async function getUsageStats(userId: string): Promise<UsageStats> {
  // Get user data
  const users = await db
    .select({
      freeTierStartDate: userTable.freeTierStartDate,
      currentCycleStartDate: userTable.currentCycleStartDate,
      requestsUsedThisCycle: userTable.requestsUsedThisCycle,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)

  if (users.length === 0) {
    throw new Error('User not found')
  }

  const user = users[0]

  // Determine cycle dates
  const cycleStartDate = user.currentCycleStartDate || user.createdAt
  const cycleEndDate = user.freeTierStartDate
    ? calculateNextResetDate(user.freeTierStartDate)
    : new Date(cycleStartDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

  // Get requests for this cycle
  const requestsThisCycle = user.requestsUsedThisCycle

  // Get requests for last cycle (previous month)
  const lastCycleStart = new Date(cycleStartDate)
  lastCycleStart.setMonth(lastCycleStart.getMonth() - 1)
  const lastCycleEnd = cycleStartDate

  const [lastCycleResult] = await db
    .select({ count: count() })
    .from(introductionRequests)
    .where(
      and(
        eq(introductionRequests.requesterId, userId),
        gte(introductionRequests.createdAt, lastCycleStart),
        lte(introductionRequests.createdAt, lastCycleEnd),
      ),
    )

  const requestsLastCycle = lastCycleResult.count

  // Get total requests ever
  const [totalResult] = await db
    .select({ count: count() })
    .from(introductionRequests)
    .where(eq(introductionRequests.requesterId, userId))

  const totalRequests = totalResult.count

  // Calculate average per month
  const accountAgeMs = Date.now() - user.createdAt.getTime()
  const accountAgeMonths = Math.max(
    1,
    accountAgeMs / (30 * 24 * 60 * 60 * 1000),
  )
  const averagePerMonth = totalRequests / accountAgeMonths

  return {
    requestsThisCycle,
    requestsLastCycle,
    totalRequests,
    averagePerMonth: Math.round(averagePerMonth * 10) / 10, // Round to 1 decimal
    cycleStartDate,
    cycleEndDate,
  }
}

/**
 * Get usage summary for multiple users (admin/analytics)
 */
export async function getUsageSummary() {
  const result = await db
    .select({
      planType: userTable.planType,
      totalUsers: count(),
      avgRequestsUsed: sql<number>`AVG(${userTable.requestsUsedThisCycle})`,
    })
    .from(userTable)
    .groupBy(userTable.planType)

  return result
}

/**
 * Get users approaching their limit (for proactive notifications)
 */
export async function getUsersApproachingLimit(threshold: number = 4) {
  const users = await db
    .select({
      id: userTable.id,
      email: userTable.email,
      name: userTable.name,
      requestsUsedThisCycle: userTable.requestsUsedThisCycle,
    })
    .from(userTable)
    .where(
      and(
        eq(userTable.planType, 'free'),
        gte(userTable.requestsUsedThisCycle, threshold),
      ),
    )

  return users
}

/**
 * Track a request creation event (for analytics)
 */
export function trackRequestCreation(
  userId: string,
  targetContactId: number,
  metadata?: Record<string, unknown>,
) {
  // This could be extended to log to an analytics service
  console.log('Request created:', {
    userId,
    targetContactId,
    timestamp: new Date().toISOString(),
    ...metadata,
  })
}

/**
 * Get current cycle progress for a user (percentage)
 */
export async function getCycleProgress(userId: string): Promise<number> {
  const users = await db
    .select({
      freeTierStartDate: userTable.freeTierStartDate,
      currentCycleStartDate: userTable.currentCycleStartDate,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)

  if (users.length === 0) {
    return 0
  }

  const user = users[0]
  if (!user.currentCycleStartDate || !user.freeTierStartDate) {
    return 0
  }

  const now = new Date()
  const cycleStart = user.currentCycleStartDate
  const cycleEnd = calculateNextResetDate(user.freeTierStartDate)

  const totalDuration = cycleEnd.getTime() - cycleStart.getTime()
  const elapsed = now.getTime() - cycleStart.getTime()

  const progress = (elapsed / totalDuration) * 100
  return Math.min(100, Math.max(0, Math.round(progress)))
}

// Made with Bob
