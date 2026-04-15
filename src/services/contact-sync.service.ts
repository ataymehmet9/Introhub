/**
 * Contact Sync Service
 *
 * Handles syncing contacts from CRM platforms to our database.
 * Includes duplicate detection, conflict resolution, and batch operations.
 */

import { and, eq } from 'drizzle-orm'
import type { MappedContact } from './field-mapping.service'
import { db } from '@/db'
import { contacts } from '@/db/schema'

/**
 * Result of a single contact sync operation
 */
export interface ContactSyncResult {
  success: boolean
  action: 'created' | 'updated' | 'skipped' | 'error'
  contactId?: number
  email: string
  error?: string
}

/**
 * Summary of a batch sync operation
 */
export interface BatchSyncResult {
  total: number
  created: number
  updated: number
  skipped: number
  errors: number
  results: Array<ContactSyncResult>
}

/**
 * Options for syncing contacts
 */
export interface SyncOptions {
  /**
   * If true, update existing contacts with new data from CRM
   * If false, skip contacts that already exist
   */
  updateExisting?: boolean

  /**
   * If true, only sync contacts that don't exist in the database
   * Useful for initial sync to avoid overwriting manual changes
   */
  onlyNew?: boolean

  /**
   * User ID to associate contacts with
   */
  userId: string

  /**
   * CRM provider (e.g., 'hubspot')
   */
  provider: 'hubspot' | 'salesforce'
}

/**
 * Checks if a contact already exists in the database
 *
 * @param userId - User ID
 * @param email - Contact email
 * @param crmContactId - External CRM contact ID
 * @returns Existing contact or null
 */
export async function findExistingContact(
  userId: string,
  email: string,
  crmContactId: string,
) {
  // First try to find by CRM ID (most reliable)
  const byId = await db.query.contacts.findFirst({
    where: and(
      eq(contacts.userId, userId),
      eq(contacts.crmContactId, crmContactId),
    ),
  })

  if (byId) return byId

  // Fallback to email match
  const byEmail = await db.query.contacts.findFirst({
    where: and(eq(contacts.userId, userId), eq(contacts.email, email)),
  })

  return byEmail || null
}

/**
 * Syncs a single contact to the database
 *
 * @param contact - Mapped contact data
 * @param options - Sync options
 * @returns Sync result
 */
export async function syncContact(
  contact: MappedContact,
  options: SyncOptions,
): Promise<ContactSyncResult> {
  try {
    // Check if contact already exists
    const existing = await findExistingContact(
      options.userId,
      contact.email,
      contact.crmContactId,
    )

    if (existing) {
      // Contact exists - decide whether to update or skip
      if (options.onlyNew) {
        return {
          success: true,
          action: 'skipped',
          contactId: existing.id,
          email: contact.email,
        }
      }

      if (options.updateExisting) {
        // Update existing contact
        const [updated] = await db
          .update(contacts)
          .set({
            name: contact.name,
            company: contact.company,
            position: contact.position,
            phone: contact.phone,
            linkedinUrl: contact.linkedinUrl,
            notes: contact.notes,
            source: contact.source,
            crmContactId: contact.crmContactId,
            metadata: JSON.stringify(contact.metadata),
            updatedAt: new Date(),
          })
          .where(eq(contacts.id, existing.id))
          .returning()

        return {
          success: true,
          action: 'updated',
          contactId: updated.id,
          email: contact.email,
        }
      }

      // Skip if not updating
      return {
        success: true,
        action: 'skipped',
        contactId: existing.id,
        email: contact.email,
      }
    }

    // Create new contact
    const [created] = await db
      .insert(contacts)
      .values({
        userId: options.userId,
        email: contact.email,
        name: contact.name,
        company: contact.company,
        position: contact.position,
        phone: contact.phone,
        linkedinUrl: contact.linkedinUrl,
        notes: contact.notes,
        source: contact.source,
        crmContactId: contact.crmContactId,
        metadata: JSON.stringify(contact.metadata),
      })
      .returning()

    return {
      success: true,
      action: 'created',
      contactId: created.id,
      email: contact.email,
    }
  } catch (error) {
    console.error(`Error syncing contact ${contact.email}:`, error)
    return {
      success: false,
      action: 'error',
      email: contact.email,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Syncs multiple contacts in batch
 *
 * @param contacts - Array of mapped contacts
 * @param options - Sync options
 * @param onProgress - Optional progress callback
 * @returns Batch sync result
 */
export async function syncContactsBatch(
  contacts: Array<MappedContact>,
  options: SyncOptions,
  onProgress?: (current: number, total: number) => void,
): Promise<BatchSyncResult> {
  const results: Array<ContactSyncResult> = []
  let created = 0
  let updated = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i]
    const result = await syncContact(contact, options)

    results.push(result)

    // Update counters
    if (result.success) {
      switch (result.action) {
        case 'created':
          created++
          break
        case 'updated':
          updated++
          break
        case 'skipped':
          skipped++
          break
      }
    } else {
      errors++
    }

    // Report progress
    if (onProgress) {
      onProgress(i + 1, contacts.length)
    }
  }

  return {
    total: contacts.length,
    created,
    updated,
    skipped,
    errors,
    results,
  }
}

/**
 * Gets sync statistics for a user's contacts from a specific CRM
 *
 * @param userId - User ID
 * @param provider - CRM provider
 * @returns Statistics about synced contacts
 */
export async function getSyncStats(
  userId: string,
  provider: 'hubspot' | 'salesforce',
) {
  const sourceMap = {
    hubspot: 'hubspot',
    salesforce: 'salesforce',
  } as const

  const source = sourceMap[provider]

  const allContacts = await db.query.contacts.findMany({
    where: and(eq(contacts.userId, userId), eq(contacts.source, source)),
  })

  return {
    total: allContacts.length,
    withPhone: allContacts.filter((c: typeof contacts.$inferSelect) => c.phone)
      .length,
    withCompany: allContacts.filter(
      (c: typeof contacts.$inferSelect) => c.company,
    ).length,
    withPosition: allContacts.filter(
      (c: typeof contacts.$inferSelect) => c.position,
    ).length,
    withLinkedIn: allContacts.filter(
      (c: typeof contacts.$inferSelect) => c.linkedinUrl,
    ).length,
  }
}

/**
 * Removes contacts that no longer exist in the CRM
 * (Useful for keeping data in sync when contacts are deleted in CRM)
 *
 * @param userId - User ID
 * @param provider - CRM provider
 * @param currentCrmIds - Array of current CRM contact IDs
 * @returns Number of contacts removed
 */
export async function removeDeletedContacts(
  userId: string,
  provider: 'hubspot' | 'salesforce',
  currentCrmIds: Array<string>,
): Promise<number> {
  const sourceMap = {
    hubspot: 'hubspot',
    salesforce: 'salesforce',
  } as const

  const source = sourceMap[provider]

  // Get all contacts from this CRM
  const existingContacts = await db.query.contacts.findMany({
    where: and(eq(contacts.userId, userId), eq(contacts.source, source)),
  })

  // Find contacts that no longer exist in CRM
  const toDelete = existingContacts.filter(
    (c: typeof contacts.$inferSelect) =>
      c.crmContactId && !currentCrmIds.includes(c.crmContactId),
  )

  if (toDelete.length === 0) {
    return 0
  }

  // Delete them
  for (const contact of toDelete) {
    await db.delete(contacts).where(eq(contacts.id, contact.id))
  }

  return toDelete.length
}

// Made with Bob
