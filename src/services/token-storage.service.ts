import { and, eq } from 'drizzle-orm'
import { decrypt, encrypt } from './encryption.service'
import type { OAuthToken } from '@/schemas'
import { db } from '@/db'
import { crmIntegrations } from '@/db/schema'

/**
 * Token Storage Service Interface
 *
 * This interface defines the contract for token storage implementations.
 * It allows easy swapping between database storage and secrets manager services.
 */
export interface TokenStorageService {
  /**
   * Store OAuth tokens for a user and provider
   */
  storeTokens: (
    userId: string,
    provider: 'hubspot' | 'salesforce',
    tokens: OAuthToken,
  ) => Promise<void>

  /**
   * Retrieve OAuth tokens for a user and provider
   */
  getTokens: (
    userId: string,
    provider: 'hubspot' | 'salesforce',
  ) => Promise<OAuthToken | null>

  /**
   * Update OAuth tokens (typically after refresh)
   */
  refreshTokens: (
    userId: string,
    provider: 'hubspot' | 'salesforce',
    newTokens: OAuthToken,
  ) => Promise<void>

  /**
   * Revoke/delete OAuth tokens
   */
  revokeTokens: (
    userId: string,
    provider: 'hubspot' | 'salesforce',
  ) => Promise<void>

  /**
   * Check if user has active integration
   */
  hasActiveIntegration: (
    userId: string,
    provider: 'hubspot' | 'salesforce',
  ) => Promise<boolean>
}

/**
 * Database Token Storage Implementation
 *
 * Stores encrypted OAuth tokens in the database.
 * Tokens are encrypted using AES-256-GCM before storage.
 */
export class DatabaseTokenStorage implements TokenStorageService {
  async storeTokens(
    userId: string,
    provider: 'hubspot' | 'salesforce',
    tokens: OAuthToken,
  ): Promise<void> {
    try {
      // Encrypt tokens before storage
      const encryptedAccessToken = encrypt(tokens.accessToken)
      const encryptedRefreshToken = tokens.refreshToken
        ? encrypt(tokens.refreshToken)
        : null

      // Check if integration already exists
      const existing = await db.query.crmIntegrations.findFirst({
        where: and(
          eq(crmIntegrations.userId, userId),
          eq(crmIntegrations.provider, provider),
        ),
      })

      if (existing) {
        // Update existing integration
        await db
          .update(crmIntegrations)
          .set({
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            expiresAt: tokens.expiresAt,
            status: 'active',
            updatedAt: new Date(),
          })
          .where(eq(crmIntegrations.id, existing.id))
      } else {
        // Create new integration
        await db.insert(crmIntegrations).values({
          userId,
          provider,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt: tokens.expiresAt,
          status: 'active',
        })
      }
    } catch (error) {
      throw new Error(
        `Failed to store tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async getTokens(
    userId: string,
    provider: 'hubspot' | 'salesforce',
  ): Promise<OAuthToken | null> {
    try {
      const integration = await db.query.crmIntegrations.findFirst({
        where: and(
          eq(crmIntegrations.userId, userId),
          eq(crmIntegrations.provider, provider),
          eq(crmIntegrations.status, 'active'),
        ),
      })

      if (!integration) {
        return null
      }

      // Decrypt tokens
      const accessToken = decrypt(integration.accessToken)
      const refreshToken = integration.refreshToken
        ? decrypt(integration.refreshToken)
        : undefined

      return {
        accessToken,
        refreshToken,
        expiresAt: integration.expiresAt ?? undefined,
      }
    } catch (error) {
      throw new Error(
        `Failed to retrieve tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async refreshTokens(
    userId: string,
    provider: 'hubspot' | 'salesforce',
    newTokens: OAuthToken,
  ): Promise<void> {
    try {
      // Encrypt new tokens
      const encryptedAccessToken = encrypt(newTokens.accessToken)
      const encryptedRefreshToken = newTokens.refreshToken
        ? encrypt(newTokens.refreshToken)
        : null

      await db
        .update(crmIntegrations)
        .set({
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt: newTokens.expiresAt,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(crmIntegrations.userId, userId),
            eq(crmIntegrations.provider, provider),
          ),
        )
    } catch (error) {
      throw new Error(
        `Failed to refresh tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async revokeTokens(
    userId: string,
    provider: 'hubspot' | 'salesforce',
  ): Promise<void> {
    try {
      await db
        .update(crmIntegrations)
        .set({
          status: 'inactive',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(crmIntegrations.userId, userId),
            eq(crmIntegrations.provider, provider),
          ),
        )
    } catch (error) {
      throw new Error(
        `Failed to revoke tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  async hasActiveIntegration(
    userId: string,
    provider: 'hubspot' | 'salesforce',
  ): Promise<boolean> {
    try {
      const integration = await db.query.crmIntegrations.findFirst({
        where: and(
          eq(crmIntegrations.userId, userId),
          eq(crmIntegrations.provider, provider),
          eq(crmIntegrations.status, 'active'),
        ),
      })

      return !!integration
    } catch (error) {
      throw new Error(
        `Failed to check integration status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}

/**
 * Get the token storage service instance
 *
 * Currently returns DatabaseTokenStorage.
 * In the future, this can be modified to return different implementations
 * based on environment variables or configuration.
 */
export function getTokenStorageService(): TokenStorageService {
  // For now, always use database storage
  // In the future, you can add logic here to switch implementations:
  // if (process.env.USE_SECRETS_MANAGER === 'true') {
  //   return new SecretsManagerTokenStorage()
  // }
  return new DatabaseTokenStorage()
}

// Export a singleton instance for convenience
export const tokenStorage = getTokenStorageService()

// Made with Bob
