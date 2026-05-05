/**
 * Demo Request Schemas
 * Validation schemas for demo request form submissions
 */

import { z } from 'zod'

/**
 * Demo request form data schema
 */
export const demoRequestFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .toLowerCase(),
  company: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters')
    .trim(),
  message: z
    .string()
    .max(1000, 'Message must be less than 1000 characters')
    .trim()
    .optional()
    .default(''),
  // Honeypot field - should be empty
  website: z.string().max(0, 'Invalid submission').optional().default(''),
  // reCAPTCHA token
  recaptchaToken: z.string().min(1, 'reCAPTCHA verification required'),
})

export type DemoRequestForm = z.infer<typeof demoRequestFormSchema>

/**
 * Demo request email schema
 */
export const demoRequestEmailSchema = z.object({
  to: z.string().email(),
  name: z.string(),
  email: z.string().email(),
  company: z.string(),
  message: z.string(),
  submittedAt: z.string(),
  from: z.string().email().optional(),
})

export type DemoRequestEmail = z.infer<typeof demoRequestEmailSchema>

/**
 * reCAPTCHA verification response schema
 */
export const recaptchaVerificationSchema = z.object({
  success: z.boolean(),
  score: z.number().min(0).max(1).optional(),
  action: z.string().optional(),
  challenge_ts: z.string().optional(),
  hostname: z.string().optional(),
  'error-codes': z.array(z.string()).optional(),
})

export type RecaptchaVerification = z.infer<typeof recaptchaVerificationSchema>

/**
 * Demo request submission response schema
 */
export const demoRequestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  emailId: z.string().optional(),
  error: z.string().optional(),
})

export type DemoRequestResponse = z.infer<typeof demoRequestResponseSchema>

// Made with Bob
