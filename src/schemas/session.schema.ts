import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import type { z } from 'zod'
import { session } from '@/db/schema'

/**
 * Session Schema - Validation for session table
 */
export const sessionSchema = createSelectSchema(session)

/**
 * Session Insert Schema - For creating new sessions
 */
export const insertSessionSchema = createInsertSchema(session)

/**
 * Session Update Schema - For updating existing sessions
 */
export const updateSessionSchema = createUpdateSchema(session)

// Type exports
export type Session = z.infer<typeof sessionSchema>
export type InsertSession = z.infer<typeof insertSessionSchema>
export type UpdateSession = z.infer<typeof updateSessionSchema>
