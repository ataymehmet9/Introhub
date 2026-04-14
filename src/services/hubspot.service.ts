import { Client } from '@hubspot/api-client'
import { tokenStorage } from './token-storage.service'
import type { OAuthToken } from '@/schemas'

/**
 * HubSpot Contact from API
 * Represents the structure of a contact returned from HubSpot API
 */
export interface HubSpotContact {
  id: string
  properties: {
    email?: string
    firstname?: string
    lastname?: string
    company?: string
    jobtitle?: string
    phone?: string
    mobilephone?: string
    website?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    lifecyclestage?: string
    hs_lead_status?: string
    notes_last_updated?: string
    notes_last_contacted?: string
    notes_next_activity_date?: string
    createdate?: string
    lastmodifieddate?: string
    [key: string]: string | undefined // Allow additional properties
  }
  createdAt: Date | string
  updatedAt: Date | string
  archived: boolean
}

/**
 * HubSpot OAuth Response
 */
export interface HubSpotOAuthResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

/**
 * HubSpot Service
 *
 * Handles all interactions with the HubSpot API including:
 * - OAuth authentication
 * - Fetching contacts
 * - Token refresh
 * - Rate limit handling
 */
export class HubSpotService {
  private clientId: string
  private clientSecret: string
  private redirectUri: string

  constructor() {
    this.clientId = process.env.HUBSPOT_CLIENT_ID || ''
    this.clientSecret = process.env.HUBSPOT_CLIENT_SECRET || ''
    this.redirectUri = process.env.HUBSPOT_REDIRECT_URI || ''

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error(
        'HubSpot credentials not configured. Please set HUBSPOT_CLIENT_ID, HUBSPOT_CLIENT_SECRET, and HUBSPOT_REDIRECT_URI environment variables.',
      )
    }
  }

  /**
   * Get OAuth authorization URL
   *
   * @param state - Optional state parameter for CSRF protection
   * @returns Authorization URL to redirect user to
   */
  getAuthorizationUrl(state?: string): string {
    const scopes = [
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
    ].join(' ')

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes,
    })

    if (state) {
      params.append('state', state)
    }

    return `https://app.hubspot.com/oauth/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   *
   * @param code - Authorization code from OAuth callback
   * @returns OAuth tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthToken> {
    try {
      const hubspotClient = new Client()

      const response = await hubspotClient.oauth.tokensApi.create(
        'authorization_code',
        code,
        this.redirectUri,
        this.clientId,
        this.clientSecret,
      )

      const expiresAt = new Date()
      expiresAt.setSeconds(expiresAt.getSeconds() + response.expiresIn)

      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt,
      }
    } catch (error) {
      throw new Error(
        `Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Refresh access token using refresh token
   *
   * @param refreshToken - The refresh token
   * @returns New OAuth tokens
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthToken> {
    try {
      const hubspotClient = new Client()

      const response = await hubspotClient.oauth.tokensApi.create(
        'refresh_token',
        undefined,
        this.redirectUri,
        this.clientId,
        this.clientSecret,
        refreshToken,
      )

      const expiresAt = new Date()
      expiresAt.setSeconds(expiresAt.getSeconds() + response.expiresIn)

      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt,
      }
    } catch (error) {
      throw new Error(
        `Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get HubSpot client with valid access token
   * Automatically refreshes token if expired
   *
   * @param userId - User ID to get tokens for
   * @returns Authenticated HubSpot client
   */
  async getClient(userId: string): Promise<Client> {
    try {
      let tokens = await tokenStorage.getTokens(userId, 'hubspot')

      if (!tokens) {
        throw new Error('No HubSpot integration found for user')
      }

      // Check if token is expired or about to expire (within 5 minutes)
      const now = new Date()
      const expiresAt = tokens.expiresAt ? new Date(tokens.expiresAt) : null
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

      if (expiresAt && expiresAt < fiveMinutesFromNow && tokens.refreshToken) {
        // Token is expired or about to expire, refresh it
        tokens = await this.refreshAccessToken(tokens.refreshToken)
        await tokenStorage.refreshTokens(userId, 'hubspot', tokens)
      }

      return new Client({ accessToken: tokens.accessToken })
    } catch (error) {
      throw new Error(
        `Failed to get HubSpot client: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Fetch all contacts from HubSpot
   * Handles pagination automatically
   *
   * @param userId - User ID to fetch contacts for
   * @param batchSize - Number of contacts to fetch per request (max 100)
   * @returns Array of HubSpot contacts
   */
  async fetchAllContacts(
    userId: string,
    batchSize: number = 100,
  ): Promise<Array<HubSpotContact>> {
    try {
      const client = await this.getClient(userId)
      const allContacts: Array<HubSpotContact> = []
      let after: string | undefined = undefined

      // Properties to fetch
      const properties = [
        'email',
        'firstname',
        'lastname',
        'company',
        'jobtitle',
        'phone',
        'mobilephone',
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
      ]

      do {
        const response = await client.crm.contacts.basicApi.getPage(
          batchSize,
          after,
          properties,
          undefined,
          undefined,
          false,
        )

        allContacts.push(
          ...(response.results as unknown as Array<HubSpotContact>),
        )
        after = response.paging?.next?.after
      } while (after)

      return allContacts
    } catch (error) {
      throw new Error(
        `Failed to fetch contacts from HubSpot: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Fetch contacts in batches with progress callback
   * Useful for showing progress to users during sync
   *
   * @param userId - User ID to fetch contacts for
   * @param onProgress - Callback function called after each batch
   * @param batchSize - Number of contacts to fetch per request (max 100)
   * @returns Array of HubSpot contacts
   */
  async fetchContactsWithProgress(
    userId: string,
    onProgress: (fetched: number, total?: number) => void,
    batchSize: number = 100,
  ): Promise<Array<HubSpotContact>> {
    try {
      const client = await this.getClient(userId)
      const allContacts: Array<HubSpotContact> = []
      let after: string | undefined = undefined
      let totalFetched = 0

      const properties = [
        'email',
        'firstname',
        'lastname',
        'company',
        'jobtitle',
        'phone',
        'mobilephone',
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
      ]

      do {
        const response = await client.crm.contacts.basicApi.getPage(
          batchSize,
          after,
          properties,
          undefined,
          undefined,
          false,
        )

        const contacts = response.results as unknown as Array<HubSpotContact>
        allContacts.push(...contacts)
        totalFetched += contacts.length

        // Call progress callback
        onProgress(
          totalFetched,
          response.paging?.next?.after ? undefined : totalFetched,
        )

        after = response.paging?.next?.after
      } while (after)

      return allContacts
    } catch (error) {
      throw new Error(
        `Failed to fetch contacts from HubSpot: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Revoke HubSpot access token
   *
   * @param userId - User ID to revoke tokens for
   */
  async revokeAccess(userId: string): Promise<void> {
    try {
      const tokens = await tokenStorage.getTokens(userId, 'hubspot')

      if (!tokens) {
        throw new Error('No HubSpot integration found for user')
      }

      // Remove from our storage
      // Note: HubSpot doesn't provide a direct token revocation endpoint
      // The token will expire naturally or user can disconnect from HubSpot settings
      await tokenStorage.revokeTokens(userId, 'hubspot')
    } catch (error) {
      // Even if HubSpot revocation fails, remove from our storage
      await tokenStorage.revokeTokens(userId, 'hubspot')

      throw new Error(
        `Failed to revoke HubSpot access: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}

// Export singleton instance
export const hubspotService = new HubSpotService()

// Made with Bob
