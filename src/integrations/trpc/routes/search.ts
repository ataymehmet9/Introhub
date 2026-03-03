import { TRPCError } from '@trpc/server'
import { and, desc, eq, ilike, ne, or } from 'drizzle-orm'
import { protectedProcedure } from '../init'
import type { TRPCRouterRecord} from '@trpc/server';
import { globalSearchInputSchema } from '@/schemas'
import { contacts, introductionRequests, user } from '@/db/schema'

export const searchRouter = {
  globalSearch: protectedProcedure
    .input(globalSearchInputSchema)
    .query(async ({ input, ctx }) => {
      const { user: currentUser, db } = ctx

      if (!currentUser) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { query, fields, page, pageSize } = input

      // Build search conditions based on selected fields
      // Use ilike for case-insensitive search
      const searchConditions = []

      if (fields.includes('name')) {
        searchConditions.push(ilike(contacts.name, `%${query}%`))
      }
      if (fields.includes('company')) {
        searchConditions.push(ilike(contacts.company, `%${query}%`))
      }
      if (fields.includes('position')) {
        searchConditions.push(ilike(contacts.position, `%${query}%`))
      }

      // If no search conditions, return empty results
      if (searchConditions.length === 0) {
        return {
          success: true,
          data: [],
          total: 0,
        }
      }

      // Calculate offset for pagination
      const offset = (page - 1) * pageSize

      // First, get the total count of matching records
      const countQuery = await db
        .select({
          count: contacts.id,
        })
        .from(contacts)
        .innerJoin(user, eq(contacts.userId, user.id))
        .where(
          and(
            // Exclude current user's own contacts
            ne(contacts.userId, currentUser.id),
            // Apply search conditions (at least one must match)
            searchConditions.length > 0 ? or(...searchConditions) : undefined,
          ),
        )

      const totalCount = countQuery.length

      // Query contacts with owner information and pending request status
      // Exclude current user's own contacts
      const results = await db
        .select({
          // Contact fields
          id: contacts.id,
          name: contacts.name,
          email: contacts.email,
          company: contacts.company,
          position: contacts.position,
          phone: contacts.phone,
          linkedinUrl: contacts.linkedinUrl,
          createdAt: contacts.createdAt,

          // Owner fields
          ownerId: user.id,
          ownerName: user.name,
          ownerEmail: user.email,
          ownerCompany: user.company,
          ownerPosition: user.position,

          // Pending request fields
          pendingRequestId: introductionRequests.id,
        })
        .from(contacts)
        .innerJoin(user, eq(contacts.userId, user.id))
        .leftJoin(
          introductionRequests,
          and(
            eq(introductionRequests.targetContactId, contacts.id),
            eq(introductionRequests.requesterId, currentUser.id),
            eq(introductionRequests.status, 'pending'),
          ),
        )
        .where(
          and(
            // Exclude current user's own contacts
            ne(contacts.userId, currentUser.id),
            // Apply search conditions (at least one must match)
            searchConditions.length > 0 ? or(...searchConditions) : undefined,
          ),
        )
        .orderBy(desc(contacts.createdAt))
        .limit(pageSize)
        .offset(offset)

      // Transform results to include hasPendingRequest boolean
      const transformedResults = results.map((result) => ({
        ...result,
        hasPendingRequest: result.pendingRequestId !== null,
      }))

      return {
        success: true,
        data: transformedResults,
        total: totalCount,
        page,
        pageSize,
      }
    }),
} satisfies TRPCRouterRecord
