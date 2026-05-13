import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { protectedProcedure } from '../init'
import type Stripe from 'stripe'
import type { TRPCRouterRecord } from '@trpc/server'
import { stripe } from '@/integrations/stripe/init'
import { user as userTable } from '@/db/schema'
import {
  canCreateRequest,
  getUserSubscription,
} from '@/services/subscription.service'
import { getUsageStats } from '@/services/usage-tracking.service'

export const billingRouter = {
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const { user, db } = ctx

    if (!user) {
      return {
        plan: 'free' as const,
        status: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }
    }

    const dbUsers = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, user.id))
      .limit(1)

    if (!dbUsers.length) {
      return {
        plan: 'free' as const,
        status: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }
    }

    const dbUser = dbUsers[0]

    // If no subscription ID yet, check database plan type
    // This handles the case where webhook hasn't fired yet after checkout
    if (!dbUser.stripeSubscriptionId) {
      // Check if user has been upgraded to pro in the database
      const isPro = dbUser.planType === 'pro'
      return {
        plan: isPro ? ('pro' as const) : ('free' as const),
        status: dbUser.stripeSubscriptionStatus as
          | 'active'
          | 'past_due'
          | 'canceled'
          | 'unpaid'
          | 'incomplete'
          | 'incomplete_expired'
          | 'trialing'
          | null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }
    }

    // Fetch subscription details from Stripe
    try {
      const subscription: Stripe.Subscription =
        await stripe.subscriptions.retrieve(dbUser.stripeSubscriptionId, {
          expand: ['latest_invoice', 'customer'],
        })

      // As of March 31, 2025, current_period_end is accessed via subscription items
      // See: https://docs.stripe.com/billing/subscriptions/billing-cycle
      const currentPeriodEnd =
        subscription.items.data[0]?.current_period_end ?? null

      // User is considered Pro if subscription is active OR trialing
      // Even if cancel_at_period_end is true, they keep access until period ends
      const isPro =
        subscription.status === 'active' || subscription.status === 'trialing'

      // Check if subscription is scheduled to cancel
      // Stripe uses either cancel_at_period_end OR cancel_at (timestamp)
      // Only show as "scheduled to cancel" if the cancellation date is in the future
      const cancelDate = subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000)
        : currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000)
          : null

      const isCanceled =
        (subscription.cancel_at_period_end ||
          subscription.cancel_at !== null) &&
        cancelDate !== null &&
        cancelDate > new Date()

      return {
        plan: isPro ? ('pro' as const) : ('free' as const),
        status: subscription.status,
        currentPeriodEnd,
        cancelAtPeriodEnd: isCanceled,
        cancelAt: subscription.cancel_at,
      }
    } catch {
      // If Stripe API fails, fall back to database values
      const isPro = dbUser.planType === 'pro'
      return {
        plan: isPro ? ('pro' as const) : ('free' as const),
        status: dbUser.stripeSubscriptionStatus as
          | 'active'
          | 'past_due'
          | 'canceled'
          | 'unpaid'
          | 'incomplete'
          | 'incomplete_expired'
          | 'trialing'
          | null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }
    }
  }),

  createCheckoutSession: protectedProcedure.mutation(async ({ ctx }) => {
    const { user, db } = ctx

    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    // Validate Stripe Price ID is configured
    if (!process.env.STRIPE_PRO_PRICE_ID) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Stripe is not properly configured. Please contact support.',
      })
    }

    const [dbUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, user.id))
      .limit(1)

    let customerId = dbUser.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await db
        .update(userTable)
        .set({ stripeCustomerId: customerId })
        .where(eq(userTable.id, user.id))
    }

    // Create checkout session with proper line_items structure
    // According to Stripe API docs, each line item must have either:
    // - price: A Price ID (recommended for recurring subscriptions)
    // - price_data: An object to create a price on the fly
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL}/me/billing?success=true`,
      cancel_url: `${process.env.APP_URL}/me/billing?canceled=true`,
      // Allow promotion codes
      allow_promotion_codes: false,
      // Collect billing address
      billing_address_collection: 'auto',
    })

    if (!session.url) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create checkout session',
      })
    }

    return { url: session.url }
  }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const { user, db } = ctx

    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const [dbUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, user.id))
      .limit(1)

    if (!dbUser.stripeCustomerId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No billing account found',
      })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${process.env.APP_URL}/me/billing`,
    })

    return { url: session.url }
  }),

  // Get detailed plan information including usage
  getPlanDetails: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx

    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const subscription = await getUserSubscription(user.id)
    const usageStats = await getUsageStats(user.id)

    return {
      ...subscription,
      usageStats,
    }
  }),

  // Check if user can create a request
  canCreateRequest: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx

    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return await canCreateRequest(user.id)
  }),
} satisfies TRPCRouterRecord
