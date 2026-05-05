/**
 * Rate Limiting Service
 * Prevents spam by limiting submissions per IP address
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  },
  5 * 60 * 1000,
)

export interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

/**
 * Check if a request is allowed based on rate limiting
 * @param identifier - Unique identifier (e.g., IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // No previous entry or window expired
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowMs
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
    })

    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetTime,
    }
  }

  // Within rate limit window
  if (entry.count < config.maxAttempts) {
    entry.count++
    rateLimitStore.set(identifier, entry)

    return {
      allowed: true,
      remaining: config.maxAttempts - entry.count,
      resetTime: entry.resetTime,
    }
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
  }
}

/**
 * Reset rate limit for a specific identifier
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * Get current rate limit status without incrementing
 * @param identifier - Unique identifier to check
 * @param config - Rate limit configuration
 * @returns Current rate limit status
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || entry.resetTime < now) {
    return {
      allowed: true,
      remaining: config.maxAttempts,
      resetTime: now + config.windowMs,
    }
  }

  return {
    allowed: entry.count < config.maxAttempts,
    remaining: Math.max(0, config.maxAttempts - entry.count),
    resetTime: entry.resetTime,
  }
}

// Made with Bob
