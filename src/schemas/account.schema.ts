import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import type { z } from 'zod'
import { account } from '@/db/schema'

/**
 * Account Schema - Validation for account table
 */
export const accountSchema = createSelectSchema(account)

/**
 * Account Insert Schema - For creating new accounts
 */
export const insertAccountSchema = createInsertSchema(account)

/**
 * Account Update Schema - For updating existing accounts
 */
export const updateAccountSchema = createUpdateSchema(account)

// Type exports
export type Account = z.infer<typeof accountSchema>
export type InsertAccount = z.infer<typeof insertAccountSchema>
export type UpdateAccount = z.infer<typeof updateAccountSchema>
