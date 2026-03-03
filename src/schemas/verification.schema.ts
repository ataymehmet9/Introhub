import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import type { z } from 'zod'
import { verification } from '@/db/schema'

/**
 * Verification Schema - Validation for verification table
 */
export const verificationSchema = createSelectSchema(verification)

/**
 * Verification Insert Schema - For creating new verifications
 */
export const insertVerificationSchema = createInsertSchema(verification)

/**
 * Verification Update Schema - For updating existing verifications
 */
export const updateVerificationSchema = createUpdateSchema(verification)

// Type exports
export type Verification = z.infer<typeof verificationSchema>
export type InsertVerification = z.infer<typeof insertVerificationSchema>
export type UpdateVerification = z.infer<typeof updateVerificationSchema>
