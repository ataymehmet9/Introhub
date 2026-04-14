import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import { z } from 'zod'
import { syncLogs } from '@/db/schema'

/**
 * Sync Log Schema - Validation for sync_logs table
 */
export const syncLogSchema = createSelectSchema(syncLogs)

/**
 * Sync Log Insert Schema - For creating new sync logs
 */
export const insertSyncLogSchema = createInsertSchema(syncLogs, {
  provider: z.enum(['hubspot', 'salesforce']),
  status: z
    .enum(['in_progress', 'completed', 'failed', 'partial'])
    .default('in_progress'),
  totalContacts: z.number().int().min(0).default(0),
  successCount: z.number().int().min(0).default(0),
  errorCount: z.number().int().min(0).default(0),
  skippedCount: z.number().int().min(0).default(0),
  updatedCount: z.number().int().min(0).default(0),
  errors: z.string().optional().nullable(), // JSONB string
})

/**
 * Sync Log Update Schema - For updating existing sync logs
 */
export const updateSyncLogSchema = createUpdateSchema(syncLogs, {
  status: z.enum(['in_progress', 'completed', 'failed', 'partial']).optional(),
  totalContacts: z.number().int().min(0).optional(),
  successCount: z.number().int().min(0).optional(),
  errorCount: z.number().int().min(0).optional(),
  skippedCount: z.number().int().min(0).optional(),
  updatedCount: z.number().int().min(0).optional(),
  errors: z.string().optional().nullable(),
  completedAt: z.date().optional().nullable(),
})

/**
 * Sync Error Schema - For individual sync errors
 */
export const syncErrorSchema = z.object({
  contactId: z.string().optional(),
  email: z.string().optional(),
  error: z.string(),
  timestamp: z.string(),
})

/**
 * Sync Result Schema - For sync operation results
 */
export const syncResultSchema = z.object({
  totalContacts: z.number().int().min(0),
  successCount: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  skippedCount: z.number().int().min(0),
  updatedCount: z.number().int().min(0),
  errors: z.array(syncErrorSchema),
})

// Type exports
export type SyncLog = z.infer<typeof syncLogSchema>
export type InsertSyncLog = z.infer<typeof insertSyncLogSchema>
export type UpdateSyncLog = z.infer<typeof updateSyncLogSchema>
export type SyncError = z.infer<typeof syncErrorSchema>
export type SyncResult = z.infer<typeof syncResultSchema>

// Made with Bob
