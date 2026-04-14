/**
 * Sync Worker Entry Point
 *
 * Starts the BullMQ worker for processing CRM sync jobs.
 * This should be run as a separate process in production.
 */

import { hubspotSyncWorker } from '../services/sync-queue.service'

console.log('🚀 Starting CRM Sync Worker...')

// Worker event listeners
hubspotSyncWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`)
})

hubspotSyncWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message)
})

hubspotSyncWorker.on('progress', (job, progress) => {
  const p = progress as { stage: string; percentage: number }
  console.log(`⏳ Job ${job.id} progress: ${p.stage} - ${p.percentage}%`)
})

hubspotSyncWorker.on('error', (err) => {
  console.error('Worker error:', err)
})

console.log('✅ CRM Sync Worker started and listening for jobs')

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...')
  await hubspotSyncWorker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...')
  await hubspotSyncWorker.close()
  process.exit(0)
})

// Made with Bob
