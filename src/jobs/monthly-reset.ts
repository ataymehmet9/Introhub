/**
 * Monthly Reset Background Job
 *
 * This job runs daily to check for free tier users whose monthly cycle has ended
 * and resets their request counters. It uses the anniversary-based reset logic
 * where each user's cycle resets on their signup/downgrade date.
 *
 * Usage:
 * - Can be run manually: `tsx src/jobs/monthly-reset.ts`
 * - Should be scheduled via cron to run daily (e.g., at midnight)
 */

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { user as userTable } from '@/db/schema'
import { PLAN_TYPES } from '@/configs/subscription.config'
import { calculateNextResetDate } from '@/utils/subscription.utils'

interface ResetResult {
  totalProcessed: number
  totalReset: number
  errors: Array<{ userId: string; error: string }>
}

/**
 * Process monthly resets for all eligible free tier users
 */
export async function runMonthlyReset(): Promise<ResetResult> {
  const result: ResetResult = {
    totalProcessed: 0,
    totalReset: 0,
    errors: [],
  }

  console.log('[Monthly Reset] Starting monthly reset job...')
  const startTime = Date.now()

  try {
    // Get all free tier users with a freeTierStartDate
    const freeUsers = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        freeTierStartDate: userTable.freeTierStartDate,
        currentCycleStartDate: userTable.currentCycleStartDate,
        requestsUsedThisCycle: userTable.requestsUsedThisCycle,
      })
      .from(userTable)
      .where(eq(userTable.planType, PLAN_TYPES.FREE))

    console.log(`[Monthly Reset] Found ${freeUsers.length} free tier users`)

    const now = new Date()

    for (const user of freeUsers) {
      result.totalProcessed++

      try {
        // Skip users without a freeTierStartDate (shouldn't happen, but safety check)
        if (!user.freeTierStartDate) {
          console.warn(
            `[Monthly Reset] User ${user.id} has no freeTierStartDate, skipping`,
          )
          continue
        }

        // Calculate when this user's cycle should reset
        const nextResetDate = calculateNextResetDate(user.freeTierStartDate)

        // Check if the reset date has passed
        if (now >= nextResetDate) {
          console.log(
            `[Monthly Reset] Resetting user ${user.id} (${user.email})`,
          )
          console.log(
            `  Previous cycle: ${user.currentCycleStartDate?.toISOString()}`,
          )
          console.log(`  Requests used: ${user.requestsUsedThisCycle}`)
          console.log(`  Next reset was: ${nextResetDate.toISOString()}`)

          // Reset the counter and update the cycle start date
          await db
            .update(userTable)
            .set({
              requestsUsedThisCycle: 0,
              currentCycleStartDate: now,
            })
            .where(eq(userTable.id, user.id))

          result.totalReset++
          console.log(`  ✓ Reset complete`)
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        console.error(
          `[Monthly Reset] Error processing user ${user.id}:`,
          errorMessage,
        )
        result.errors.push({
          userId: user.id,
          error: errorMessage,
        })
      }
    }

    const duration = Date.now() - startTime
    console.log('[Monthly Reset] Job complete')
    console.log(`  Total processed: ${result.totalProcessed}`)
    console.log(`  Total reset: ${result.totalReset}`)
    console.log(`  Errors: ${result.errors.length}`)
    console.log(`  Duration: ${duration}ms`)

    return result
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('[Monthly Reset] Fatal error:', errorMessage)
    throw error
  }
}

/**
 * Run the job if this file is executed directly
 */
if (require.main === module) {
  runMonthlyReset()
    .then((result) => {
      console.log('\n[Monthly Reset] Summary:')
      console.log(JSON.stringify(result, null, 2))
      process.exit(result.errors.length > 0 ? 1 : 0)
    })
    .catch((error) => {
      console.error('[Monthly Reset] Fatal error:', error)
      process.exit(1)
    })
}

// Made with Bob
