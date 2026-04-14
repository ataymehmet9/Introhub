import crypto from 'node:crypto'

/**
 * Encryption Service
 *
 * Provides AES-256-GCM encryption/decryption for sensitive data like OAuth tokens.
 * Uses Node.js built-in crypto module for security without additional dependencies.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // For AES, this is always 16
const KEY_LENGTH = 32

/**
 * Get encryption key from environment variable
 * The key should be a 64-character hex string (32 bytes)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. Generate one with: openssl rand -hex 32',
    )
  }

  if (key.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be 64 characters (32 bytes in hex). Generate with: openssl rand -hex 32',
    )
  }

  return Buffer.from(key, 'hex')
}

/**
 * Encrypt a string using AES-256-GCM
 *
 * @param text - The plaintext to encrypt
 * @returns Encrypted string in format: iv:encrypted:authTag (all hex encoded)
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey()

    // Generate random IV (initialization vector)
    const iv = crypto.randomBytes(IV_LENGTH)

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get authentication tag
    const authTag = cipher.getAuthTag()

    // Return format: iv:encrypted:authTag (all hex encoded)
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Decrypt a string encrypted with AES-256-GCM
 *
 * @param encryptedData - Encrypted string in format: iv:encrypted:authTag
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey()

    // Split the encrypted data
    const parts = encryptedData.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const [ivHex, encryptedHex, authTagHex] = parts

    // Convert from hex
    const iv = Buffer.from(ivHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    // Decrypt the text
    let decrypted = decipher.update(encrypted)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString('utf8')
  } catch (error) {
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Generate a secure encryption key
 * This is a utility function for generating keys, not for production use
 *
 * @returns A 64-character hex string (32 bytes)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}

/**
 * Validate if a string is properly encrypted
 *
 * @param data - String to validate
 * @returns true if the string appears to be encrypted data
 */
export function isEncrypted(data: string): boolean {
  const parts = data.split(':')
  if (parts.length !== 3) return false

  // Check if all parts are valid hex strings
  const hexRegex = /^[0-9a-f]+$/i
  return parts.every((part) => hexRegex.test(part))
}

// Made with Bob
