/**
 * Subscription Configuration
 * 
 * Centralized configuration for subscription plans and restrictions.
 * This file defines the limits and features for each subscription tier.
 */

export const SUBSCRIPTION_CONFIG = {
  FREE_TIER: {
    REQUEST_LIMIT: 5,
    CONTACT_LIMIT: null, // unlimited
    RESET_FREQUENCY: 'monthly' as const,
  },
  PRO_TIER: {
    REQUEST_LIMIT: null, // unlimited
    CONTACT_LIMIT: null, // unlimited
    PRICE: 99,
    CURRENCY: 'USD',
  },
  NOTIFICATIONS: {
    WARN_AT_REMAINING: 1, // Warn when 1 request left
    NOTIFY_ON_LIMIT: true,
  },
  // Feature flags for future restrictions
  FEATURE_RESTRICTIONS: {
    FREE_TIER: {
      // Add future restrictions here
      // Example: MAX_STORAGE_MB: 100,
      // Example: ADVANCED_ANALYTICS: false,
    },
    PRO_TIER: {
      // Pro tier has no restrictions
    },
  },
} as const

// Helper type for adding new restrictions
export type FeatureRestriction = {
  name: string
  freeTierLimit: number | boolean | null
  proTierLimit: number | boolean | null
  description: string
}

// Registry for managing restrictions dynamically
export const RESTRICTION_REGISTRY: Array<FeatureRestriction> = [
  {
    name: 'introduction_requests',
    freeTierLimit: 5,
    proTierLimit: null,
    description: 'Monthly introduction request limit',
  },
  {
    name: 'contacts',
    freeTierLimit: null,
    proTierLimit: null,
    description: 'Total contacts allowed',
  },
  // Add new restrictions here as needed
]

// Plan type constants
export const PLAN_TYPES = {
  FREE: 'free',
  PRO: 'pro',
} as const

export type PlanType = typeof PLAN_TYPES[keyof typeof PLAN_TYPES]

// Made with Bob
