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
      return { plan: 'free' as const, status: null, currentPeriodEnd: null }
    }

    const [dbUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, user.id))
      .limit(1)

    if (!dbUser.stripeSubscriptionId) {
      return { plan: 'free' as const, status: null, currentPeriodEnd: null }
    }

    const subscription: Stripe.Subscription =
      await stripe.subscriptions.retrieve(dbUser.stripeSubscriptionId)

    // As of March 31, 2025, current_period_end is accessed via subscription items
    // See: https://docs.stripe.com/billing/subscriptions/billing-cycle
    const currentPeriodEnd =
      subscription.items.data[0]?.current_period_end ?? null

    return {
      plan:
        subscription.status === 'active' ? ('pro' as const) : ('free' as const),
      status: subscription.status,
      currentPeriodEnd,
    }
  }),

  createCheckoutSession: protectedProcedure.mutation(async ({ ctx }) => {
    const { user, db } = ctx

    if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
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

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
      success_url: `${process.env.APP_URL}/me/billing?success=true`,
      cancel_url: `${process.env.APP_URL}/me/billing?canceled=true`,
    })

    return { url: session.url! }
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
