import { and, eq, gte, sql } from 'drizzle-orm'
import { db } from '@/db'
import { aiGenerations } from '@/db/schema'

/**
 * AI Rate Limiting Service - Enforces rate limits for AI generation
 */

// Rate limit: 10 generations per hour per user
const RATE_LIMIT_PER_HOUR = parseInt(
  process.env.AI_RATE_LIMIT_PER_HOUR || '10',
  10,
)

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  generationsThisHour: number
}

/**
 * Check if user has exceeded rate limit
 */
export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  // Calculate the start of the current hour
  const now = new Date()
  const hourStart = new Date(now)
  hourStart.setMinutes(0, 0, 0)

  // Calculate when the rate limit resets (start of next hour)
  const resetAt = new Date(hourStart)
  resetAt.setHours(resetAt.getHours() + 1)

  // Count generations in the current hour
  const result = await db
    .select({
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(aiGenerations)
    .where(
      and(
        eq(aiGenerations.userId, userId),
        gte(aiGenerations.createdAt, hourStart),
      ),
    )

  const generationsThisHour = result[0]?.count || 0
  const remaining = Math.max(0, RATE_LIMIT_PER_HOUR - generationsThisHour)
  const allowed = generationsThisHour < RATE_LIMIT_PER_HOUR

  return {
    allowed,
    remaining,
    resetAt,
    generationsThisHour,
  }
}

/**
 * Record an AI generation attempt
 */
export async function recordGeneration(
  userId: string,
  data: {
    generationType: 'introduction_message'
    targetContactId: number | null
    success: boolean
    errorMessage?: string
    tokensUsed?: number
    responseTimeMs?: number
    metadata?: Record<string, unknown>
  },
): Promise<void> {
  await db.insert(aiGenerations).values({
    userId,
    generationType: data.generationType,
    targetContactId: data.targetContactId,
    success: data.success,
    errorMessage: data.errorMessage || null,
    tokensUsed: data.tokensUsed || null,
    responseTimeMs: data.responseTimeMs || null,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  })
}

/**
 * Get user's generation history for the current hour
 */
export async function getGenerationHistory(
  userId: string,
  hours = 1,
): Promise<
  Array<{
    id: number
    generationType: string
    success: boolean
    createdAt: Date
    responseTimeMs: number | null
  }>
> {
  const hoursAgo = new Date()
  hoursAgo.setHours(hoursAgo.getHours() - hours)

  const history = await db
    .select({
      id: aiGenerations.id,
      generationType: aiGenerations.generationType,
      success: aiGenerations.success,
      createdAt: aiGenerations.createdAt,
      responseTimeMs: aiGenerations.responseTimeMs,
    })
    .from(aiGenerations)
    .where(
      and(
        eq(aiGenerations.userId, userId),
        gte(aiGenerations.createdAt, hoursAgo),
      ),
    )
    .orderBy(sql`${aiGenerations.createdAt} DESC`)

  return history
}

/**
 * Get rate limit info for display
 */
export function getRateLimitInfo(): {
  limit: number
  window: string
} {
  return {
    limit: RATE_LIMIT_PER_HOUR,
    window: '1 hour',
  }
}

// Made with Bob
