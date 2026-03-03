import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import type { z } from 'zod'
import { contacts } from '@/db/schema'

/**
 * Contact Schema - Validation for contacts table
 */
export const contactSchema = createSelectSchema(contacts)

/**
 * Contact Insert Schema - For creating new contacts
 */
export const insertContactSchema = createInsertSchema(contacts)

/**
 * Contact Update Schema - For updating existing contacts
 */
export const updateContactSchema = createUpdateSchema(contacts)

// Type exports
export type Contact = z.infer<typeof contactSchema>
export type InsertContact = z.infer<typeof insertContactSchema>
export type UpdateContact = z.infer<typeof updateContactSchema>
