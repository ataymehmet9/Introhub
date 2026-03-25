import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import { z } from 'zod'
import { contacts } from '@/db/schema'

/**
 * Contact Schema - Validation for contacts table
 */
export const contactSchema = createSelectSchema(contacts)

/**
 * Contact Insert Schema - For creating new contacts
 * Enhanced with proper validation rules
 */
export const insertContactSchema = createInsertSchema(contacts, {
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  company: z
    .string()
    .max(255, 'Company must be less than 255 characters')
    .optional()
    .nullable(),
  position: z
    .string()
    .max(255, 'Position must be less than 255 characters')
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(50, 'Phone must be less than 50 characters')
    .optional()
    .nullable(),
  linkedinUrl: z
    .string()
    .url('Invalid LinkedIn URL')
    .max(255, 'LinkedIn URL must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  notes: z.string().optional().nullable(),
})

/**
 * Contact Update Schema - For updating existing contacts
 */
export const updateContactSchema = createUpdateSchema(contacts, {
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional(),
  name: z.string().max(255, 'Name must be less than 255 characters').optional(),
  company: z
    .string()
    .max(255, 'Company must be less than 255 characters')
    .optional()
    .nullable(),
  position: z
    .string()
    .max(255, 'Position must be less than 255 characters')
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(50, 'Phone must be less than 50 characters')
    .optional()
    .nullable(),
  linkedinUrl: z
    .string()
    .url('Invalid LinkedIn URL')
    .max(255, 'LinkedIn URL must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  notes: z.string().optional().nullable(),
})

// Type exports
export type Contact = z.infer<typeof contactSchema>
export type InsertContact = z.infer<typeof insertContactSchema>
export type UpdateContact = z.infer<typeof updateContactSchema>
