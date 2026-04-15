/**
 * CRM Field Mapping Unit Tests
 *
 * Tests the field mapping logic between HubSpot contacts and our database schema
 */

import { describe, expect, it } from 'vitest'
import type { HubSpotContact } from '@/services/hubspot.service'
import {
  getMappingStats,
  mapHubSpotContactToDb,
  mapHubSpotContactsBatch,
  validateMappedContact,
} from '@/services/field-mapping.service'

describe('CRM Field Mapping', () => {
  describe('mapHubSpotContactToDb', () => {
    it('should map all standard HubSpot fields correctly', () => {
      const hubspotContact: HubSpotContact = {
        id: '12345',
        properties: {
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          company: 'Acme Corp',
          jobtitle: 'CEO',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        archived: false,
      }

      const result = mapHubSpotContactToDb(hubspotContact)

      expect(result).toMatchObject({
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Acme Corp',
        position: 'CEO',
        source: 'hubspot',
        crmContactId: '12345',
      })
      expect(result?.linkedinUrl).toBeNull()
      expect(result?.notes).toBeNull()
    })

    it('should handle missing optional fields', () => {
      const hubspotContact: HubSpotContact = {
        id: '12345',
        properties: {
          firstname: 'Jane',
          lastname: 'Smith',
          email: 'jane@example.com',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        archived: false,
      }

      const result = mapHubSpotContactToDb(hubspotContact)

      expect(result).toMatchObject({
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: null,
        company: null,
        position: null,
        source: 'hubspot',
        crmContactId: '12345',
      })
    })

    it('should handle contacts with only first name', () => {
      const hubspotContact: HubSpotContact = {
        id: '12345',
        properties: {
          firstname: 'Madonna',
          email: 'madonna@example.com',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        archived: false,
      }

      const result = mapHubSpotContactToDb(hubspotContact)

      expect(result?.name).toBe('Madonna')
    })

    it('should handle contacts with only last name', () => {
      const hubspotContact: HubSpotContact = {
        id: '12345',
        properties: {
          lastname: 'Prince',
          email: 'prince@example.com',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        archived: false,
      }

      const result = mapHubSpotContactToDb(hubspotContact)

      expect(result?.name).toBe('Prince')
    })

    it('should use email as name fallback when no name provided', () => {
      const hubspotContact: HubSpotContact = {
        id: '12345',
        properties: {
          email: 'contact@example.com',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        archived: false,
      }

      const result = mapHubSpotContactToDb(hubspotContact)

      expect(result?.name).toBe('contact@example.com')
    })

    it('should return null for contacts without email', () => {
      const hubspotContact: HubSpotContact = {
        id: '12345',
        properties: {
          firstname: 'John',
          lastname: 'Doe',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        archived: false,
      }

      const result = mapHubSpotContactToDb(hubspotContact)

      expect(result).toBeNull()
    })

    it('should prefer phone over mobilephone', () => {
      const hubspotContact: HubSpotContact = {
        id: '12345',
        properties: {
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
          phone: '+1111111111',
          mobilephone: '+2222222222',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        archived: false,
      }

      const result = mapHubSpotContactToDb(hubspotContact)

      expect(result?.phone).toBe('+1111111111')
    })

    it('should use mobilephone when phone is not available', () => {
      const hubspotContact: HubSpotContact = {
        id: '12345',
        properties: {
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
          mobilephone: '+2222222222',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        archived: false,
      }

      const result = mapHubSpotContactToDb(hubspotContact)

      expect(result?.phone).toBe('+2222222222')
    })

    it('should store additional fields in metadata', () => {
      const hubspotContact: HubSpotContact = {
        id: '12345',
        properties: {
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
          website: 'https://example.com',
          city: 'New York',
          lifecyclestage: 'customer',
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        archived: false,
      }

      const result = mapHubSpotContactToDb(hubspotContact)

      expect(result?.metadata).toMatchObject({
        website: 'https://example.com',
        city: 'New York',
        lifecyclestage: 'customer',
      })
    })
  })

  describe('mapHubSpotContactsBatch', () => {
    it('should map multiple contacts', () => {
      const contacts: Array<HubSpotContact> = [
        {
          id: '1',
          properties: {
            firstname: 'John',
            lastname: 'Doe',
            email: 'john@example.com',
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          archived: false,
        },
        {
          id: '2',
          properties: {
            firstname: 'Jane',
            lastname: 'Smith',
            email: 'jane@example.com',
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          archived: false,
        },
      ]

      const result = mapHubSpotContactsBatch(contacts)

      expect(result).toHaveLength(2)
      expect(result[0].email).toBe('john@example.com')
      expect(result[1].email).toBe('jane@example.com')
    })

    it('should skip contacts without email', () => {
      const contacts: Array<HubSpotContact> = [
        {
          id: '1',
          properties: {
            firstname: 'John',
            lastname: 'Doe',
            email: 'john@example.com',
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          archived: false,
        },
        {
          id: '2',
          properties: {
            firstname: 'Jane',
            lastname: 'Smith',
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          archived: false,
        },
      ]

      const result = mapHubSpotContactsBatch(contacts)

      expect(result).toHaveLength(1)
      expect(result[0].email).toBe('john@example.com')
    })
  })

  describe('validateMappedContact', () => {
    it('should validate contact with required fields', () => {
      const contact = {
        email: 'john@example.com',
        name: 'John Doe',
        company: null,
        position: null,
        phone: null,
        linkedinUrl: null,
        notes: null,
        source: 'hubspot' as const,
        crmContactId: '12345',
        metadata: {},
      }

      expect(validateMappedContact(contact)).toBe(true)
    })

    it('should reject contact without email', () => {
      const contact = {
        email: '',
        name: 'John Doe',
        company: null,
        position: null,
        phone: null,
        linkedinUrl: null,
        notes: null,
        source: 'hubspot' as const,
        crmContactId: '12345',
        metadata: {},
      }

      expect(validateMappedContact(contact)).toBe(false)
    })

    it('should reject contact with invalid email format', () => {
      const contact = {
        email: 'invalid-email',
        name: 'John Doe',
        company: null,
        position: null,
        phone: null,
        linkedinUrl: null,
        notes: null,
        source: 'hubspot' as const,
        crmContactId: '12345',
        metadata: {},
      }

      expect(validateMappedContact(contact)).toBe(false)
    })
  })

  describe('getMappingStats', () => {
    it('should calculate mapping statistics', () => {
      const contacts: Array<HubSpotContact> = [
        {
          id: '1',
          properties: {
            email: 'john@example.com',
            phone: '+1111111111',
            company: 'Acme',
            jobtitle: 'CEO',
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          archived: false,
        },
        {
          id: '2',
          properties: {
            email: 'jane@example.com',
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          archived: false,
        },
        {
          id: '3',
          properties: {
            firstname: 'No Email',
          },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          archived: false,
        },
      ]

      const stats = getMappingStats(contacts)

      expect(stats).toEqual({
        total: 3,
        withEmail: 2,
        withPhone: 1,
        withCompany: 1,
        withPosition: 1,
        skipped: 1,
      })
    })
  })
})

// Made with Bob
