import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import { z } from 'zod'
import { crmIntegrations } from '@/db/schema'

/**
 * CRM Integration Schema - Validation for crm_integrations table
 */
export const crmIntegrationSchema = createSelectSchema(crmIntegrations)

/**
 * CRM Integration Insert Schema - For creating new CRM integrations
 */
export const insertCrmIntegrationSchema = createInsertSchema(crmIntegrations, {
  provider: z.enum(['hubspot', 'salesforce']),
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'error']).default('active'),
})

/**
 * CRM Integration Update Schema - For updating existing CRM integrations
 */
export const updateCrmIntegrationSchema = createUpdateSchema(crmIntegrations, {
  provider: z.enum(['hubspot', 'salesforce']).optional(),
  accessToken: z.string().min(1, 'Access token is required').optional(),
  refreshToken: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'error']).optional(),
  expiresAt: z.date().optional().nullable(),
  lastSyncedAt: z.date().optional().nullable(),
})

/**
 * OAuth Token Schema - For storing OAuth tokens
 */
export const oauthTokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.date().optional(),
})

// Type exports
export type CrmIntegration = z.infer<typeof crmIntegrationSchema>
export type InsertCrmIntegration = z.infer<typeof insertCrmIntegrationSchema>
export type UpdateCrmIntegration = z.infer<typeof updateCrmIntegrationSchema>
export type OAuthToken = z.infer<typeof oauthTokenSchema>

// Made with Bob
