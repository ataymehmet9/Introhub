/**
 * Script to clear stuck CRM sync jobs from BullMQ
 *
 * Run with: pnpm tsx scripts/clear-crm-queue.ts
 */

import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

async function clearQueue() {
  console.log('Connecting to Redis...')
  const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
  })

  const queue = new Queue('crm-sync', { connection })

  try {
    console.log('Clearing all jobs from crm-sync queue...')

    // Get all job counts
    const counts = await queue.getJobCounts()
    console.log('Current job counts:', counts)

    // Clean all jobs
    await queue.drain() // Remove all waiting jobs
    await queue.clean(0, 1000, 'active') // Clean active jobs
    await queue.clean(0, 1000, 'completed') // Clean completed jobs
    await queue.clean(0, 1000, 'failed') // Clean failed jobs
    await queue.clean(0, 1000, 'delayed') // Clean delayed jobs

    console.log('✅ Queue cleared successfully')

    // Get updated counts
    const newCounts = await queue.getJobCounts()
    console.log('New job counts:', newCounts)
  } catch (error) {
    console.error('❌ Error clearing queue:', error)
    process.exit(1)
  } finally {
    await queue.close()
    await connection.quit()
    process.exit(0)
  }
}

clearQueue()

// Made with Bob
