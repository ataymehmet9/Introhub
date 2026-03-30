/**
 * Subscription Type Definitions
 *
 * Type definitions for subscription-related data structures.
 */

import type { PlanType } from '@/configs/subscription.config'

// Subscription status from Stripe
export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | null

// Complete subscription details for a user
export interface SubscriptionDetails {
  planType: PlanType
  status: SubscriptionStatus
  requestsUsed: number
  requestsLimit: number | null // null = unlimited
  nextResetDate: Date | null
  stripeSubscriptionId: string | null
  currentPeriodEnd: Date | null
}

// Usage statistics for analytics
export interface UsageStats {
  requestsThisCycle: number
  requestsLastCycle: number
  totalRequests: number
  averagePerMonth: number
  cycleStartDate: Date
  cycleEndDate: Date
}

// Result of checking if user can create a request
export interface CanCreateRequestResult {
  allowed: boolean
  reason?: string
  remainingRequests?: number
}

// User subscription data from database
export interface UserSubscriptionData {
  id: string
  planType: PlanType
  freeTierStartDate: Date | null
  requestsUsedThisCycle: number
  currentCycleStartDate: Date | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripeSubscriptionStatus: string | null
  createdAt: Date
}

// Plan upgrade/downgrade event
export interface PlanChangeEvent {
  userId: string
  fromPlan: PlanType
  toPlan: PlanType
  timestamp: Date
  reason?: string
}

// Monthly reset event
export interface MonthlyResetEvent {
  userId: string
  previousCount: number
  newCount: number
  cycleStartDate: Date
  timestamp: Date
}

// Made with Bob
