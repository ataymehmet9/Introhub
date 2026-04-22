import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, like, or } from 'drizzle-orm'
import { protectedProcedure } from '../init'
import type { TRPCRouterRecord } from '@trpc/server'
import type { InsertContact } from '@/schemas'
import {
  contactSchema,
  insertContactSchema,
  updateContactSchema,
} from '@/schemas'
import { contacts } from '@/db/schema'
import { parseCSV } from '@/utils/fileUtils'
import { trackServerEvent } from '@/integrations/posthog'
import { contactLogger, errorLogger } from '@/integrations/opentelemetry'

const listContactsSchema = contactSchema
  .pick({
    company: true,
  })
  .extend({
    search: z.string().optional(),
  })

const getContactByIdSchema = contactSchema.pick({
  id: true,
})

const createContactSchema = insertContactSchema.omit({
  userId: true,
})

const updateContactInputSchema = z.object({
  id: z.number(),
  data: updateContactSchema.omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
  }),
})

export const contactRouter = {
  getById: protectedProcedure
    .input(getContactByIdSchema)
    .query(async ({ input, ctx }) => {
      const { user, db } = ctx

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { id } = input

      try {
        const existingContact = await db
          .select()
          .from(contacts)
          .where(and(eq(contacts.id, id), eq(contacts.userId, user.id)))
          .limit(1)

        if (!existingContact.length) {
          trackServerEvent(user.id, 'contact_read_failed', {
            contactId: id,
            reason: 'not_found',
            userId: user.id,
            userEmail: user.email,
            timestamp: new Date().toISOString(),
          })
          throw new TRPCError({
            code: 'NOT_FOUND',
            message:
              'Contact not found or you do not have permission to view it',
          })
        }

        const [contact] = existingContact

        trackServerEvent(user.id, 'contact_read_success', {
          contactId: id,
          contactName: contact.name,
          contactEmail: contact.email,
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })

        return { success: true, data: contact }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        trackServerEvent(user.id, 'contact_read_error', {
          contactId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })
        throw error
      }
    }),
  list: protectedProcedure
    .input(listContactsSchema)
    .query(async ({ input, ctx }) => {
      const { user, db } = ctx

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { company, search } = input

      try {
        const conditions = [eq(contacts.userId, user.id)]

        if (search) {
          conditions.push(
            or(
              like(contacts.name, `%${search}%`),
              like(contacts.email, `%${search}%`),
              like(contacts.company, `%${search}%`),
            )!,
          )
        }

        if (company) {
          conditions.push(like(contacts.company, `%${company}%`))
        }

        const results = await db
          .select()
          .from(contacts)
          .where(and(...conditions))
          .orderBy(desc(contacts.createdAt))

        trackServerEvent(user.id, 'contact_list_success', {
          resultCount: results.length,
          hasSearch: !!search,
          hasCompanyFilter: !!company,
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })

        return { success: true, data: results }
      } catch (error) {
        trackServerEvent(user.id, 'contact_list_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })
        throw error
      }
    }),
  create: protectedProcedure
    .input(createContactSchema)
    .mutation(async ({ input, ctx }) => {
      const { user, db } = ctx

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      try {
        const newContact = await db
          .insert(contacts)
          .values({
            ...input,
            userId: user.id,
          })
          .returning()

        // Log contact creation
        contactLogger.created({
          posthogDistinctId: user.id,
          contact_id: newContact[0].id,
          source: 'manual',
        })

        trackServerEvent(user.id, 'contact_create_success', {
          contactId: newContact[0].id,
          contactName: newContact[0].name,
          contactEmail: newContact[0].email,
          contactCompany: newContact[0].company || null,
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })

        return { success: true, data: newContact[0] }
      } catch (error) {
        // Log error
        errorLogger.database({
          posthogDistinctId: user.id,
          error_type: 'contact_create_failed',
          error_message:
            error instanceof Error ? error.message : 'Unknown error',
          stack_trace: error instanceof Error ? error.stack : undefined,
          context: { contactEmail: input.email },
        })

        trackServerEvent(user.id, 'contact_create_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          contactEmail: input.email,
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })
        throw error
      }
    }),
  update: protectedProcedure
    .input(updateContactInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { user, db } = ctx

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { id, data } = input

      try {
        // Update with user check in WHERE clause - no race condition
        const updatedContact = await db
          .update(contacts)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(and(eq(contacts.id, id), eq(contacts.userId, user.id)))
          .returning()

        if (!updatedContact.length) {
          trackServerEvent(user.id, 'contact_update_failed', {
            contactId: id,
            reason: 'not_found',
            userId: user.id,
            userEmail: user.email,
            timestamp: new Date().toISOString(),
          })
          throw new TRPCError({
            code: 'NOT_FOUND',
            message:
              'Contact not found or you do not have permission to update it',
          })
        }

        // Log contact update
        contactLogger.updated({
          posthogDistinctId: user.id,
          contact_id: id,
        })

        trackServerEvent(user.id, 'contact_update_success', {
          contactId: id,
          contactName: updatedContact[0].name,
          contactEmail: updatedContact[0].email,
          updatedFields: Object.keys(data),
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })

        return { success: true, data: updatedContact[0] }
      } catch (error) {
        if (error instanceof TRPCError) throw error

        // Log error
        errorLogger.database({
          posthogDistinctId: user.id,
          error_type: 'contact_update_failed',
          error_message:
            error instanceof Error ? error.message : 'Unknown error',
          stack_trace: error instanceof Error ? error.stack : undefined,
          context: { contactId: id },
        })

        trackServerEvent(user.id, 'contact_update_error', {
          contactId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })
        throw error
      }
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { user, db } = ctx

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { id } = input

      try {
        // Delete with user check in WHERE clause - no race condition
        const deletedContact = await db
          .delete(contacts)
          .where(and(eq(contacts.id, id), eq(contacts.userId, user.id)))
          .returning()

        if (!deletedContact.length) {
          trackServerEvent(user.id, 'contact_delete_failed', {
            contactId: id,
            reason: 'not_found',
            userId: user.id,
            userEmail: user.email,
            timestamp: new Date().toISOString(),
          })
          throw new TRPCError({
            code: 'NOT_FOUND',
            message:
              'Contact not found or you do not have permission to delete it',
          })
        }

        // Log contact deletion
        contactLogger.deleted({
          posthogDistinctId: user.id,
          contact_id: id,
        })

        trackServerEvent(user.id, 'contact_delete_success', {
          contactId: id,
          contactName: deletedContact[0].name,
          contactEmail: deletedContact[0].email,
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })

        return { success: true, id }
      } catch (error) {
        if (error instanceof TRPCError) throw error

        // Log error
        errorLogger.database({
          posthogDistinctId: user.id,
          error_type: 'contact_delete_failed',
          error_message:
            error instanceof Error ? error.message : 'Unknown error',
          stack_trace: error instanceof Error ? error.stack : undefined,
          context: { contactId: id },
        })

        trackServerEvent(user.id, 'contact_delete_error', {
          contactId: id,
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })
        throw error
      }
    }),
  batchDelete: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.number()).min(1, 'At least one ID is required'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, db } = ctx

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { ids } = input

      try {
        // Verify all contacts belong to the user
        const existingContacts = await db
          .select()
          .from(contacts)
          .where(and(eq(contacts.userId, user.id)))

        const existingIds = existingContacts.map((contact) => contact.id)
        const validIds = ids.filter((id) => existingIds.includes(id))

        if (validIds.length === 0) {
          trackServerEvent(user.id, 'contact_batch_delete_failed', {
            requestedCount: ids.length,
            reason: 'no_valid_contacts',
            userId: user.id,
            userEmail: user.email,
            timestamp: new Date().toISOString(),
          })
          throw new TRPCError({
            code: 'NOT_FOUND',
            message:
              'No valid contacts found or you do not have permission to delete them',
          })
        }

        // Delete all valid contacts
        const deletedContacts = await db
          .delete(contacts)
          .where(
            and(
              eq(contacts.userId, user.id),
              or(...validIds.map((id) => eq(contacts.id, id))),
            ),
          )
          .returning()

        // Log batch deletion
        contactLogger.batchDeleted({
          posthogDistinctId: user.id,
          count: deletedContacts.length,
        })

        trackServerEvent(user.id, 'contact_batch_delete_success', {
          requestedCount: ids.length,
          deletedCount: deletedContacts.length,
          invalidCount: ids.length - validIds.length,
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })

        return {
          success: true,
          data: {
            deletedCount: deletedContacts.length,
            deletedIds: deletedContacts.map((contact) => contact.id),
            invalidIds: ids.filter((id) => !validIds.includes(id)),
          },
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error

        // Log error
        errorLogger.database({
          posthogDistinctId: user.id,
          error_type: 'contact_batch_delete_failed',
          error_message:
            error instanceof Error ? error.message : 'Unknown error',
          stack_trace: error instanceof Error ? error.stack : undefined,
          context: { requestedCount: ids.length },
        })

        trackServerEvent(user.id, 'contact_batch_delete_error', {
          requestedCount: ids.length,
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })
        throw error
      }
    }),
  batchUpload: protectedProcedure
    .input(
      z.object({
        csvContent: z.string().min(1, 'CSV content cannot be empty'),
        skipDuplicates: z.boolean().optional().default(true),
        updateExisting: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, db } = ctx

      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { csvContent, skipDuplicates, updateExisting } = input

      try {
        // Parse CSV content
        const rows = parseCSV(csvContent)

        if (rows.length === 0) {
          trackServerEvent(user.id, 'contact_batch_upload_failed', {
            reason: 'no_valid_rows',
            userId: user.id,
            userEmail: user.email,
            timestamp: new Date().toISOString(),
          })
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No valid data rows found in CSV file',
          })
        }

        // Get existing contacts for this user to check for duplicates
        const existingContacts = await db
          .select()
          .from(contacts)
          .where(eq(contacts.userId, user.id))

        const existingEmailMap = new Map(
          existingContacts.map((c) => [c.email.toLowerCase(), c]),
        )

        // Validate and prepare contacts for insertion/update
        const contactsToInsert: Array<InsertContact> = []
        const contactsToUpdate: Array<{
          id: number
          data: Partial<InsertContact>
        }> = []

        const errors: Array<{ row: number; error: string }> = []
        let skippedCount = 0

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          const rowNumber = i + 2 // +2 because row 1 is header, and we're 0-indexed

          try {
            // Validate required fields
            if (!row.email || !row.name) {
              errors.push({
                row: rowNumber,
                error: 'Missing required fields: email and name are required',
              })
              continue
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(row.email)) {
              errors.push({
                row: rowNumber,
                error: `Invalid email format: ${row.email}`,
              })
              continue
            }

            // Check if contact already exists
            const existingContact = existingEmailMap.get(
              row.email.toLowerCase(),
            )

            if (existingContact) {
              if (updateExisting) {
                // Update existing contact
                const updateData: Partial<InsertContact> = {
                  name: row.name,
                }
                if (row.company) updateData.company = row.company
                if (row.position) updateData.position = row.position
                if (row.notes) updateData.notes = row.notes
                if (row.phone) updateData.phone = row.phone
                if (row.linkedinUrl) updateData.linkedinUrl = row.linkedinUrl

                contactsToUpdate.push({
                  id: existingContact.id,
                  data: updateData,
                })
              } else if (skipDuplicates) {
                // Skip duplicate
                skippedCount++
                continue
              } else {
                // Neither skip nor update - report as error
                errors.push({
                  row: rowNumber,
                  error: `Duplicate email: ${row.email} already exists`,
                })
                continue
              }
            } else {
              // Prepare contact object for insertion
              const contact: InsertContact = {
                userId: user.id,
                email: row.email,
                name: row.name,
              }

              // Add optional fields if present
              if (row.company) contact.company = row.company
              if (row.position) contact.position = row.position
              if (row.notes) contact.notes = row.notes
              if (row.phone) contact.phone = row.phone
              if (row.linkedinUrl) contact.linkedinUrl = row.linkedinUrl

              contactsToInsert.push(contact)
            }
          } catch (error) {
            errors.push({
              row: rowNumber,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }

        // Insert new contacts
        let insertedCount = 0
        if (contactsToInsert.length > 0) {
          const inserted = await db
            .insert(contacts)
            .values(contactsToInsert)
            .returning()
          insertedCount = inserted.length
        }

        // Update existing contacts
        let updatedCount = 0
        if (contactsToUpdate.length > 0) {
          for (const { id, data } of contactsToUpdate) {
            await db
              .update(contacts)
              .set({
                ...data,
                updatedAt: new Date(),
              })
              .where(and(eq(contacts.id, id), eq(contacts.userId, user.id)))
          }
          updatedCount = contactsToUpdate.length
        }

        // Log batch upload
        contactLogger.batchUploaded({
          posthogDistinctId: user.id,
          total_rows: rows.length,
          created_count: insertedCount,
          updated_count: updatedCount,
          skipped_count: skippedCount,
          error_count: errors.length,
        })

        trackServerEvent(user.id, 'contact_batch_upload_success', {
          totalRows: rows.length,
          insertedCount,
          updatedCount,
          skippedCount,
          errorCount: errors.length,
          successRate: (
            ((insertedCount + updatedCount) / rows.length) *
            100
          ).toFixed(2),
          skipDuplicates,
          updateExisting,
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })

        return {
          success: true,
          data: {
            totalRows: rows.length,
            insertedCount,
            updatedCount,
            skippedCount,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined,
          },
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }

        // Log error
        errorLogger.database({
          posthogDistinctId: user.id,
          error_type: 'contact_batch_upload_failed',
          error_message:
            error instanceof Error ? error.message : 'Unknown error',
          stack_trace: error instanceof Error ? error.stack : undefined,
        })

        trackServerEvent(user.id, 'contact_batch_upload_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? `Failed to process CSV: ${error.message}`
              : 'Failed to process CSV file',
        })
      }
    }),
} satisfies TRPCRouterRecord
