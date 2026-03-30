/**
 * Update Cycle Dates Script
 *
 * This script sets default currentCycleStartDate and freeTierStartDate
 * for existing users who don't have these values set.
 *
 * Run with: tsx scripts/update-cycle-dates.ts
 */

import { eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { user as userTable } from '@/db/schema'

async function updateCycleDates() {
  console.log('🚀 Starting cycle date update...\n')

  try {
    // Find users without currentCycleStartDate
    const usersToUpdate = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        planType: userTable.planType,
        createdAt: userTable.createdAt,
        currentCycleStartDate: userTable.currentCycleStartDate,
        freeTierStartDate: userTable.freeTierStartDate,
      })
      .from(userTable)
      .where(isNull(userTable.currentCycleStartDate))

    console.log(`📊 Found ${usersToUpdate.length} users without cycle dates\n`)

    if (usersToUpdate.length === 0) {
      console.log('✅ All users already have cycle dates set!')
      return
    }

    let successCount = 0
    let errorCount = 0

    for (const user of usersToUpdate) {
      try {
        const startDate = user.createdAt

        await db
          .update(userTable)
          .set({
            currentCycleStartDate: startDate,
            freeTierStartDate: startDate,
          })
          .where(eq(userTable.id, user.id))

        console.log(`✓ Updated ${user.email} (${user.planType})`)
        successCount++
      } catch (error) {
        console.error(`✗ Failed to update ${user.email}:`, error)
        errorCount++
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📈 Update Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Total users processed: ${usersToUpdate.length}`)
    console.log(`✅ Successfully updated: ${successCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Verify the update
    const remainingNull = await db
      .select({
        id: userTable.id,
      })
      .from(userTable)
      .where(isNull(userTable.currentCycleStartDate))

    if (remainingNull.length === 0) {
      console.log('✅ Verification passed: All users now have cycle dates!')
    } else {
      console.warn(
        `⚠️  Warning: ${remainingNull.length} users still have NULL cycle dates`,
      )
    }
  } catch (error) {
    console.error('💥 Update failed:', error)
    process.exit(1)
  }
}

// Run the update
updateCycleDates()
  .then(() => {
    console.log('\n✨ Update completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Update failed:', error)
    process.exit(1)
  })

// Made with Bob
