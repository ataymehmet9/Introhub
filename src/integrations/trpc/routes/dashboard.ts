import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, gte, lte, or, sql } from 'drizzle-orm'
import { protectedProcedure } from '../init'
import type { TRPCRouterRecord } from '@trpc/server'
import type {
  Granularity,
  PeriodStats,
  ResponseTime,
  StatsComparison,
  StatusBreakdown,
  TopContact,
  TrendDataPoint,
} from '@/schemas'
import { dashboardQuerySchema } from '@/schemas'
import { contacts, introductionRequests } from '@/db/schema'

/**
 * Helper function to format response time
 */
function formatResponseTime(avgSeconds: number): ResponseTime {
  const avgHours = avgSeconds / 3600
  const avgDays = avgHours / 24

  let formatted: string
  if (avgHours < 24) {
    formatted = `${Math.round(avgHours)} hours`
  } else {
    const days = Math.floor(avgDays)
    const hours = Math.round((avgDays - days) * 24)
    formatted = hours > 0 ? `${days} days ${hours} hours` : `${days} days`
  }

  return {
    avgSeconds,
    avgHours,
    avgDays,
    formatted,
  }
}

/**
 * Helper function to calculate percentage change
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return ((current - previous) / previous) * 100
}

/**
 * Helper function to determine granularity based on date range
 */
function determineGranularity(
  startDate: Date,
  endDate: Date,
  explicitGranularity?: Granularity,
): Granularity {
  if (explicitGranularity) {
    return explicitGranularity
  }

  const diffDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (diffDays <= 30) return 'daily'
  if (diffDays <= 90) return 'weekly'
  return 'monthly'
}

/**
 * Helper function to get previous period dates
 */
function getPreviousPeriod(startDate: Date, endDate: Date) {
  const duration = endDate.getTime() - startDate.getTime()
  const previousEnd = new Date(startDate.getTime() - 1)
  const previousStart = new Date(previousEnd.getTime() - duration)

  return { previousStart, previousEnd }
}

/**
 * Calculate statistics for a given period
 */
async function calculatePeriodStats(
  db: any,
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<PeriodStats> {
  // Run all queries concurrently
  const [
    contactsResult,
    requestsMadeResult,
    requestsReceivedResult,
    statusBreakdownResult,
    avgResponseReceivedResult,
    avgResponseMadeResult,
  ] = await Promise.all([
    // Get total contacts count
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(
        and(
          eq(contacts.userId, userId),
          gte(contacts.createdAt, startDate),
          lte(contacts.createdAt, endDate),
        ),
      ),
    // Get requests made (user is requester)
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(introductionRequests)
      .where(
        and(
          eq(introductionRequests.requesterId, userId),
          eq(introductionRequests.deleted, false),
          gte(introductionRequests.createdAt, startDate),
          lte(introductionRequests.createdAt, endDate),
        ),
      ),
    // Get requests received (user is approver)
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(introductionRequests)
      .where(
        and(
          eq(introductionRequests.approverId, userId),
          eq(introductionRequests.deleted, false),
          gte(introductionRequests.createdAt, startDate),
          lte(introductionRequests.createdAt, endDate),
        ),
      ),
    // Get status breakdown for received requests
    db
      .select({
        status: introductionRequests.status,
        count: sql<number>`count(*)::int`,
      })
      .from(introductionRequests)
      .where(
        and(
          eq(introductionRequests.approverId, userId),
          eq(introductionRequests.deleted, false),
          gte(introductionRequests.createdAt, startDate),
          lte(introductionRequests.createdAt, endDate),
        ),
      )
      .groupBy(introductionRequests.status),
    // Calculate average response time for requests received (as approver)
    db
      .select({
        avgSeconds: sql<number>`AVG(EXTRACT(EPOCH FROM (${introductionRequests.updatedAt} - ${introductionRequests.createdAt})))`,
      })
      .from(introductionRequests)
      .where(
        and(
          eq(introductionRequests.approverId, userId),
          eq(introductionRequests.deleted, false),
          or(
            eq(introductionRequests.status, 'approved'),
            eq(introductionRequests.status, 'declined'),
          ),
          gte(introductionRequests.createdAt, startDate),
          lte(introductionRequests.createdAt, endDate),
        ),
      ),
    // Calculate average response time for requests made (as requester)
    db
      .select({
        avgSeconds: sql<number>`AVG(EXTRACT(EPOCH FROM (${introductionRequests.updatedAt} - ${introductionRequests.createdAt})))`,
      })
      .from(introductionRequests)
      .where(
        and(
          eq(introductionRequests.requesterId, userId),
          eq(introductionRequests.deleted, false),
          or(
            eq(introductionRequests.status, 'approved'),
            eq(introductionRequests.status, 'declined'),
          ),
          gte(introductionRequests.createdAt, startDate),
          lte(introductionRequests.createdAt, endDate),
        ),
      ),
  ])

  const totalContacts = contactsResult[0]?.count || 0
  const requestsMade = requestsMadeResult[0]?.count || 0
  const requestsReceived = requestsReceivedResult[0]?.count || 0

  let requestsApproved = 0
  let requestsDeclined = 0
  let requestsPending = 0

  statusBreakdownResult.forEach((row: { status: string; count: number }) => {
    if (row.status === 'approved') requestsApproved = row.count
    if (row.status === 'declined') requestsDeclined = row.count
    if (row.status === 'pending') requestsPending = row.count
  })

  // Calculate rates
  const approvalRate =
    requestsReceived > 0 ? (requestsApproved / requestsReceived) * 100 : 0
  const rejectionRate =
    requestsReceived > 0 ? (requestsDeclined / requestsReceived) * 100 : 0

  const avgResponseTimeReceived =
    avgResponseReceivedResult[0]?.avgSeconds != null
      ? formatResponseTime(avgResponseReceivedResult[0].avgSeconds)
      : null

  const avgResponseTimeMade =
    avgResponseMadeResult[0]?.avgSeconds != null
      ? formatResponseTime(avgResponseMadeResult[0].avgSeconds)
      : null

  return {
    totalContacts,
    requestsMade,
    requestsReceived,
    requestsApproved,
    requestsDeclined,
    requestsPending,
    approvalRate,
    rejectionRate,
    avgResponseTimeReceived,
    avgResponseTimeMade,
  }
}

export const dashboardRouter = {
  /**
   * Get dashboard statistics with comparison to previous period
   */
  getStats: protectedProcedure
    .input(dashboardQuerySchema)
    .query(async ({ input, ctx }) => {
      const { user: currentUser, db } = ctx

      if (!currentUser) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { startDate, endDate } = input

      // Validate date range
      if (startDate > endDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Start date must be before end date',
        })
      }

      // Calculate current and previous period stats concurrently
      const { previousStart, previousEnd } = getPreviousPeriod(
        startDate,
        endDate,
      )

      const [currentStats, previousStats] = await Promise.all([
        calculatePeriodStats(db, currentUser.id, startDate, endDate),
        calculatePeriodStats(db, currentUser.id, previousStart, previousEnd),
      ])

      // Calculate percentage changes
      const changes = {
        totalContacts: calculatePercentageChange(
          currentStats.totalContacts,
          previousStats.totalContacts,
        ),
        requestsMade: calculatePercentageChange(
          currentStats.requestsMade,
          previousStats.requestsMade,
        ),
        requestsReceived: calculatePercentageChange(
          currentStats.requestsReceived,
          previousStats.requestsReceived,
        ),
        approvalRate: calculatePercentageChange(
          currentStats.approvalRate,
          previousStats.approvalRate,
        ),
        rejectionRate: calculatePercentageChange(
          currentStats.rejectionRate,
          previousStats.rejectionRate,
        ),
        avgResponseTimeReceived:
          currentStats.avgResponseTimeReceived &&
          previousStats.avgResponseTimeReceived
            ? calculatePercentageChange(
                currentStats.avgResponseTimeReceived.avgHours,
                previousStats.avgResponseTimeReceived.avgHours,
              )
            : null,
        avgResponseTimeMade:
          currentStats.avgResponseTimeMade && previousStats.avgResponseTimeMade
            ? calculatePercentageChange(
                currentStats.avgResponseTimeMade.avgHours,
                previousStats.avgResponseTimeMade.avgHours,
              )
            : null,
      }

      const statsComparison: StatsComparison = {
        current: currentStats,
        previous: previousStats,
        changes,
      }

      // Calculate status breakdown
      const statusBreakdown: StatusBreakdown = {
        pending: currentStats.requestsPending,
        approved: currentStats.requestsApproved,
        declined: currentStats.requestsDeclined,
        total:
          currentStats.requestsPending +
          currentStats.requestsApproved +
          currentStats.requestsDeclined,
        pendingPercentage:
          currentStats.requestsReceived > 0
            ? (currentStats.requestsPending / currentStats.requestsReceived) *
              100
            : 0,
        approvedPercentage: currentStats.approvalRate,
        declinedPercentage: currentStats.rejectionRate,
      }

      return {
        success: true,
        data: {
          dateRange: {
            start: startDate,
            end: endDate,
          },
          stats: statsComparison,
          statusBreakdown,
        },
      }
    }),

  /**
   * Get trend data for charts (time-series)
   */
  getTrendData: protectedProcedure
    .input(dashboardQuerySchema)
    .query(async ({ input, ctx }) => {
      const { user: currentUser, db } = ctx

      if (!currentUser) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { startDate, endDate, granularity: inputGranularity } = input

      const granularity = determineGranularity(
        startDate,
        endDate,
        inputGranularity,
      )

      // Determine SQL date truncation based on granularity
      let dateTrunc: string
      switch (granularity) {
        case 'daily':
          dateTrunc = 'day'
          break
        case 'weekly':
          dateTrunc = 'week'
          break
        case 'monthly':
          dateTrunc = 'month'
          break
      }

      // Get requests made and received trends concurrently
      const [requestsMadeTrend, requestsReceivedTrend] = await Promise.all([
        // Get requests made trend
        db
          .select({
            date: sql<string>`DATE_TRUNC(${sql.raw(`'${dateTrunc}'`)}, ${introductionRequests.createdAt})::date`,
            status: introductionRequests.status,
            count: sql<number>`count(*)::int`,
          })
          .from(introductionRequests)
          .where(
            and(
              eq(introductionRequests.requesterId, currentUser.id),
              eq(introductionRequests.deleted, false),
              gte(introductionRequests.createdAt, startDate),
              lte(introductionRequests.createdAt, endDate),
            ),
          )
          .groupBy(
            sql`DATE_TRUNC(${sql.raw(`'${dateTrunc}'`)}, ${introductionRequests.createdAt})::date`,
            introductionRequests.status,
          )
          .orderBy(
            sql`DATE_TRUNC(${sql.raw(`'${dateTrunc}'`)}, ${introductionRequests.createdAt})::date`,
          ),
        // Get requests received trend
        db
          .select({
            date: sql<string>`DATE_TRUNC(${sql.raw(`'${dateTrunc}'`)}, ${introductionRequests.createdAt})::date`,
            status: introductionRequests.status,
            count: sql<number>`count(*)::int`,
          })
          .from(introductionRequests)
          .where(
            and(
              eq(introductionRequests.approverId, currentUser.id),
              eq(introductionRequests.deleted, false),
              gte(introductionRequests.createdAt, startDate),
              lte(introductionRequests.createdAt, endDate),
            ),
          )
          .groupBy(
            sql`DATE_TRUNC(${sql.raw(`'${dateTrunc}'`)}, ${introductionRequests.createdAt})::date`,
            introductionRequests.status,
          )
          .orderBy(
            sql`DATE_TRUNC(${sql.raw(`'${dateTrunc}'`)}, ${introductionRequests.createdAt})::date`,
          ),
      ])

      // Aggregate data by date
      const dataPointsMap = new Map<string, TrendDataPoint>()

      // Process requests made
      requestsMadeTrend.forEach((row) => {
        const dateStr = row.date
        if (!dataPointsMap.has(dateStr)) {
          dataPointsMap.set(dateStr, {
            date: dateStr,
            requestsMade: 0,
            requestsReceived: 0,
            requestsApproved: 0,
            requestsDeclined: 0,
            requestsPending: 0,
          })
        }
        const point = dataPointsMap.get(dateStr)!
        point.requestsMade += row.count
      })

      // Process requests received
      requestsReceivedTrend.forEach((row) => {
        const dateStr = row.date
        if (!dataPointsMap.has(dateStr)) {
          dataPointsMap.set(dateStr, {
            date: dateStr,
            requestsMade: 0,
            requestsReceived: 0,
            requestsApproved: 0,
            requestsDeclined: 0,
            requestsPending: 0,
          })
        }
        const point = dataPointsMap.get(dateStr)!
        point.requestsReceived += row.count

        if (row.status === 'approved') point.requestsApproved += row.count
        if (row.status === 'declined') point.requestsDeclined += row.count
        if (row.status === 'pending') point.requestsPending += row.count
      })

      const dataPoints = Array.from(dataPointsMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      )

      return {
        success: true,
        data: {
          granularity,
          dataPoints,
        },
      }
    }),

  /**
   * Get top contacts by request count
   */
  getTopContacts: protectedProcedure
    .input(
      dashboardQuerySchema.extend({
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { user: currentUser, db } = ctx

      if (!currentUser) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { startDate, endDate, limit } = input

      // Get contacts with request counts
      const topContactsResult = await db
        .select({
          contactId: contacts.id,
          contactName: contacts.name,
          contactEmail: contacts.email,
          contactCompany: contacts.company,
          totalRequests: sql<number>`count(*)::int`,
          approvedCount: sql<number>`count(*) FILTER (WHERE ${introductionRequests.status} = 'approved')::int`,
          declinedCount: sql<number>`count(*) FILTER (WHERE ${introductionRequests.status} = 'declined')::int`,
          pendingCount: sql<number>`count(*) FILTER (WHERE ${introductionRequests.status} = 'pending')::int`,
        })
        .from(introductionRequests)
        .innerJoin(
          contacts,
          eq(introductionRequests.targetContactId, contacts.id),
        )
        .where(
          and(
            eq(contacts.userId, currentUser.id),
            eq(introductionRequests.deleted, false),
            gte(introductionRequests.createdAt, startDate),
            lte(introductionRequests.createdAt, endDate),
          ),
        )
        .groupBy(contacts.id, contacts.name, contacts.email, contacts.company)
        .orderBy(desc(sql`count(*)`))
        .limit(limit)

      const topContacts: Array<TopContact> = topContactsResult.map((row) => ({
        contactId: row.contactId,
        contactName: row.contactName,
        contactEmail: row.contactEmail,
        contactCompany: row.contactCompany,
        requestCount: row.totalRequests,
        approvedCount: row.approvedCount,
        declinedCount: row.declinedCount,
        pendingCount: row.pendingCount,
      }))

      return {
        success: true,
        data: {
          contacts: topContacts,
          limit,
        },
      }
    }),
} satisfies TRPCRouterRecord
