/**
 * Field Mapping Service
 *
 * Maps HubSpot contact properties to our database schema.
 * Handles field transformations and stores unmapped fields in metadata.
 */

import type { HubSpotContact } from './hubspot.service'

/**
 * HubSpot contact properties we want to fetch
 * These are the standard properties available in HubSpot
 */
export const HUBSPOT_CONTACT_PROPERTIES = [
  'firstname',
  'lastname',
  'email',
  'phone',
  'mobilephone',
  'company',
  'jobtitle',
  'website',
  'address',
  'city',
  'state',
  'zip',
  'country',
  'lifecyclestage',
  'hs_lead_status',
  'createdate',
  'lastmodifieddate',
  'notes_last_updated',
  'num_notes',
] as const

/**
 * Mapped contact data ready for database insertion
 */
export interface MappedContact {
  email: string
  name: string
  company: string | null
  position: string | null
  phone: string | null
  linkedinUrl: string | null
  notes: string | null
  source: 'hubspot'
  crmContactId: string
  metadata: Record<string, unknown>
}

/**
 * Maps a HubSpot contact to our database schema
 *
 * @param hubspotContact - The contact object from HubSpot API
 * @returns Mapped contact data ready for database insertion
 */
export function mapHubSpotContactToDb(
  hubspotContact: HubSpotContact,
): MappedContact | null {
  const props = hubspotContact.properties

  // Email is required - skip if missing
  if (!props.email) {
    console.warn(
      `Skipping HubSpot contact ${hubspotContact.id} - missing email`,
    )
    return null
  }

  // Combine firstname and lastname into name
  const firstname = props.firstname || ''
  const lastname = props.lastname || ''
  const name = `${firstname} ${lastname}`.trim() || props.email

  // Map primary fields
  const mappedContact: MappedContact = {
    email: props.email,
    name,
    company: props.company || null,
    position: props.jobtitle || null,
    phone: props.phone || props.mobilephone || null,
    linkedinUrl: null, // HubSpot doesn't have a standard LinkedIn field
    notes: null, // We'll handle notes separately if needed
    source: 'hubspot',
    crmContactId: hubspotContact.id,
    metadata: {},
  }

  // Store additional HubSpot fields in metadata
  const metadataFields: Record<string, unknown> = {}

  // Add all other properties to metadata
  for (const [key, value] of Object.entries(props)) {
    // Skip fields we've already mapped
    if (
      [
        'firstname',
        'lastname',
        'email',
        'phone',
        'mobilephone',
        'company',
        'jobtitle',
      ].includes(key)
    ) {
      continue
    }

    // Store the rest in metadata
    if (value !== null && value !== undefined && value !== '') {
      metadataFields[key] = value
    }
  }

  // Add HubSpot-specific metadata
  metadataFields.hubspot_created_at = hubspotContact.createdAt
  metadataFields.hubspot_updated_at = hubspotContact.updatedAt
  metadataFields.hubspot_archived = hubspotContact.archived

  mappedContact.metadata = metadataFields

  return mappedContact
}

/**
 * Batch maps multiple HubSpot contacts
 *
 * @param hubspotContacts - Array of HubSpot contact objects
 * @returns Array of mapped contacts (excluding any that failed validation)
 */
export function mapHubSpotContactsBatch(
  hubspotContacts: Array<HubSpotContact>,
): Array<MappedContact> {
  const mappedContacts: Array<MappedContact> = []

  for (const contact of hubspotContacts) {
    const mapped = mapHubSpotContactToDb(contact)
    if (mapped) {
      mappedContacts.push(mapped)
    }
  }

  return mappedContacts
}

/**
 * Validates if a contact has all required fields for our database
 *
 * @param contact - Mapped contact data
 * @returns True if valid, false otherwise
 */
export function validateMappedContact(contact: MappedContact): boolean {
  // Email and name are required
  if (!contact.email || !contact.name) {
    return false
  }

  // Email should be valid format (basic check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(contact.email)) {
    return false
  }

  return true
}

/**
 * Filters out invalid contacts from a batch
 *
 * @param contacts - Array of mapped contacts
 * @returns Array of valid contacts only
 */
export function filterValidContacts(
  contacts: Array<MappedContact>,
): Array<MappedContact> {
  return contacts.filter(validateMappedContact)
}

/**
 * Gets a summary of field mapping statistics
 *
 * @param hubspotContacts - Array of HubSpot contacts
 * @returns Statistics about the mapping process
 */
export function getMappingStats(hubspotContacts: Array<HubSpotContact>): {
  total: number
  withEmail: number
  withPhone: number
  withCompany: number
  withPosition: number
  skipped: number
} {
  let withEmail = 0
  let withPhone = 0
  let withCompany = 0
  let withPosition = 0
  let skipped = 0

  for (const contact of hubspotContacts) {
    const props = contact.properties

    if (!props.email) {
      skipped++
      continue
    }

    withEmail++
    if (props.phone || props.mobilephone) withPhone++
    if (props.company) withCompany++
    if (props.jobtitle) withPosition++
  }

  return {
    total: hubspotContacts.length,
    withEmail,
    withPhone,
    withCompany,
    withPosition,
    skipped,
  }
}

// Made with Bob
