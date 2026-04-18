import { z } from 'zod'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { aiGenerations } from '@/db/schema'

/**
 * AI Generation Schema - Validation for ai_generations table
 */
export const aiGenerationSchema = createSelectSchema(aiGenerations)
export const insertAiGenerationSchema = createInsertSchema(aiGenerations)

/**
 * Generate Introduction Message Input Schema
 */
export const generateIntroductionMessageInputSchema = z.object({
  targetContactId: z
    .number({ message: 'Target contact ID must be a number' })
    .int({ message: 'Target contact ID must be an integer' })
    .positive({ message: 'Target contact ID must be positive' }),
  previousMessages: z
    .array(z.string())
    .optional()
    .describe('Previous AI-generated messages to avoid repetition'),
})

/**
 * Generate Introduction Message Response Schema
 */
export const generateIntroductionMessageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
  tokensUsed: z.number().int().optional(),
  responseTimeMs: z.number().int().optional(),
})

/**
 * AI Generation Metadata Schema
 */
export const aiGenerationMetadataSchema = z.object({
  model: z.string(),
  temperature: z.number().optional(),
  maxTokens: z.number().int().optional(),
  promptLength: z.number().int().optional(),
  requesterName: z.string().optional(),
  requesterCompany: z.string().optional(),
  requesterPosition: z.string().optional(),
  targetContactName: z.string().optional(),
  targetContactCompany: z.string().optional(),
  targetContactPosition: z.string().optional(),
  ownerName: z.string().optional(),
  ownerCompany: z.string().optional(),
})

/**
 * Check Rate Limit Response Schema
 */
export const checkRateLimitResponseSchema = z.object({
  allowed: z.boolean(),
  remaining: z.number().int(),
  resetAt: z.date(),
  generationsThisHour: z.number().int(),
})

// Type exports
export type AiGeneration = z.infer<typeof aiGenerationSchema>
export type InsertAiGeneration = z.infer<typeof insertAiGenerationSchema>
export type GenerateIntroductionMessageInput = z.infer<
  typeof generateIntroductionMessageInputSchema
>
export type GenerateIntroductionMessageResponse = z.infer<
  typeof generateIntroductionMessageResponseSchema
>
export type AiGenerationMetadata = z.infer<typeof aiGenerationMetadataSchema>
export type CheckRateLimitResponse = z.infer<
  typeof checkRateLimitResponseSchema
>

// Made with Bob
