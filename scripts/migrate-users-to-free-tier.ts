/**
 * User Migration Script: Free Tier Initialization
 *
 * This script migrates existing users to the free tier subscription plan.
 * It sets up the necessary subscription fields for users who existed before
 * the subscription system was implemented.
 *
 * Usage:
 *   tsx scripts/migrate-users-to-free-tier.ts
 *
 * Environment Variables Required:
 *   DATABASE_URL - PostgreSQL connection string
 */

import { eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { user as userTable } from '@/db/schema'

interface MigrationStats {
  total: number
  success: number
  errors: number
  skipped: number
}

async function migrateUsersToFreeTier(): Promise<MigrationStats> {
  console.log('🚀 Starting user migration to free tier...\n')

  const stats: MigrationStats = {
    total: 0,
    success: 0,
    errors: 0,
    skipped: 0,
  }

  try {
    // Find all users without a plan type set
    const usersToMigrate = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        createdAt: userTable.createdAt,
        planType: userTable.planType,
      })
      .from(userTable)

    stats.total = usersToMigrate.length
    console.log(`📊 Found ${stats.total} total users in database`)

    // Filter users that need migration
    const needsMigration = usersToMigrate.filter((user) => !user.planType)

    console.log(`✨ ${needsMigration.length} users need migration`)
    console.log(
      `⏭️  ${stats.total - needsMigration.length} users already have plan type\n`,
    )

    if (needsMigration.length === 0) {
      console.log(
        '✅ No users need migration. All users already have plan types.',
      )
      return stats
    }

    // Confirm migration
    console.log('⚠️  This will update the following fields for each user:')
    console.log('   - planType: "free"')
    console.log('   - freeTierStartDate: user.createdAt (or current date)')
    console.log('   - requestsUsedThisCycle: 0')
    console.log(
      '   - currentCycleStartDate: user.createdAt (or current date)\n',
    )

    // Process users in batches
    const BATCH_SIZE = 100
    const batches = Math.ceil(needsMigration.length / BATCH_SIZE)

    console.log(
      `📦 Processing ${batches} batches of ${BATCH_SIZE} users each...\n`,
    )

    for (let i = 0; i < batches; i++) {
      const start = i * BATCH_SIZE
      const end = Math.min(start + BATCH_SIZE, needsMigration.length)
      const batch = needsMigration.slice(start, end)

      console.log(
        `Processing batch ${i + 1}/${batches} (users ${start + 1}-${end})...`,
      )

      for (const user of batch) {
        try {
          await db
            .update(userTable)
            .set({
              planType: 'free',
              freeTierStartDate: user.createdAt,
              requestsUsedThisCycle: 0,
              currentCycleStartDate: user.createdAt,
            })
            .where(eq(userTable.id, user.id))

          stats.success++
        } catch (error) {
          console.error(
            `   ❌ Error migrating user ${user.id} (${user.email}):`,
            error,
          )
          stats.errors++
        }
      }

      console.log(`   ✓ Batch ${i + 1} complete\n`)
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📈 Migration Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Total users in database: ${stats.total}`)
    console.log(`Users needing migration: ${needsMigration.length}`)
    console.log(`✅ Successfully migrated: ${stats.success}`)
    console.log(`❌ Errors: ${stats.errors}`)
    console.log(
      `⏭️  Skipped (already migrated): ${stats.total - needsMigration.length}`,
    )
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (stats.errors > 0) {
      console.warn('⚠️  Some users failed to migrate. Check error logs above.')
      return stats
    }

    console.log('✅ Migration completed successfully!')
    return stats
  } catch (error) {
    console.error('💥 Migration failed with critical error:', error)
    throw error
  }
}

async function verifyMigration(): Promise<void> {
  console.log('\n🔍 Verifying migration...\n')

  try {
    // Check for users without plan type
    const usersWithoutPlan = await db
      .select({
        id: userTable.id,
        email: userTable.email,
      })
      .from(userTable)
      .where(isNull(userTable.planType))

    if (usersWithoutPlan.length > 0) {
      console.error(
        `❌ Found ${usersWithoutPlan.length} users without plan type:`,
      )
      usersWithoutPlan.forEach((user) => {
        console.error(`   - ${user.email} (${user.id})`)
      })
      throw new Error('Migration verification failed')
    }

    // Get plan distribution
    const planDistribution = await db
      .select({
        planType: userTable.planType,
      })
      .from(userTable)

    const distribution = planDistribution.reduce(
      (acc, user) => {
        const plan = user.planType || 'unknown'
        acc[plan] = (acc[plan] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    console.log('📊 Plan Distribution:')
    Object.entries(distribution).forEach(([plan, count]) => {
      console.log(`   ${plan}: ${count} users`)
    })

    // Sample check
    const sampleUsers = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        planType: userTable.planType,
        freeTierStartDate: userTable.freeTierStartDate,
        requestsUsedThisCycle: userTable.requestsUsedThisCycle,
      })
      .from(userTable)
      .limit(5)

    console.log('\n📋 Sample Users (first 5):')
    sampleUsers.forEach((user) => {
      console.log(`   ${user.email}:`)
      console.log(`      Plan: ${user.planType}`)
      console.log(`      Start Date: ${user.freeTierStartDate?.toISOString()}`)
      console.log(`      Requests Used: ${user.requestsUsedThisCycle}`)
    })

    console.log('\n✅ Migration verification passed!')
  } catch (error) {
    console.error('❌ Migration verification failed:', error)
    throw error
  }
}

// Main execution
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║   User Migration Script: Free Tier Initialization      ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  try {
    // Run migration
    await migrateUsersToFreeTier()

    // Verify migration
    await verifyMigration()

    console.log('\n🎉 Migration process completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Review the migration summary above')
    console.log('2. Test user login and subscription features')
    console.log('3. Monitor application logs for any issues')
    console.log('4. Proceed with production deployment if staging looks good\n')

    process.exit(0)
  } catch (error) {
    console.error('\n💥 Migration process failed:', error)
    console.error('\nRollback steps:')
    console.error('1. Restore database from backup')
    console.error('2. Review error logs above')
    console.error('3. Fix issues and retry migration\n')

    process.exit(1)
  }
}

// Run the script
main()

// Made with Bob
