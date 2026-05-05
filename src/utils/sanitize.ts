/**
 * Input Sanitization Utility
 * Removes malicious content from user input to prevent XSS attacks
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - Potentially unsafe HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
    KEEP_CONTENT: true, // Keep text content
  })
}

/**
 * Sanitize plain text input
 * Removes control characters and normalizes whitespace
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return (
    input
      // Remove control characters except newlines and tabs
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize multiple spaces to single space
      .replace(/\s+/g, ' ')
      // Trim whitespace
      .trim()
  )
}

/**
 * Sanitize email address
 * Validates and normalizes email format
 * @param email - Email address
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return ''
  }

  const sanitized = sanitizeText(email).toLowerCase()

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    return ''
  }

  return sanitized
}

/**
 * Sanitize form data object
 * Applies appropriate sanitization to each field
 * @param data - Form data object
 * @returns Sanitized form data
 */
export function sanitizeFormData<T extends Record<string, unknown>>(
  data: T,
): T {
  const sanitized = {} as T

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Apply text sanitization to all string fields
      sanitized[key as keyof T] = sanitizeText(value) as T[keyof T]
    } else {
      sanitized[key as keyof T] = value as T[keyof T]
    }
  }

  return sanitized
}

/**
 * Check if input contains suspicious patterns
 * @param input - User input string
 * @returns True if suspicious patterns detected
 */
export function containsSuspiciousPatterns(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false
  }

  const suspiciousPatterns = [
    /<script/i, // Script tags
    /javascript:/i, // JavaScript protocol
    /on\w+\s*=/i, // Event handlers (onclick, onload, etc.)
    /<iframe/i, // Iframe tags
    /eval\(/i, // Eval function
    /expression\(/i, // CSS expressions
    /vbscript:/i, // VBScript protocol
    /data:text\/html/i, // Data URLs with HTML
  ]

  return suspiciousPatterns.some((pattern) => pattern.test(input))
}

/**
 * Validate and sanitize URL
 * @param url - URL string
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return ''
  }

  const sanitized = sanitizeText(url)

  try {
    const urlObj = new URL(sanitized)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return ''
    }
    return urlObj.toString()
  } catch {
    return ''
  }
}

// Made with Bob
