/**
 * AI Validation Service - Validates AI-generated content for quality
 */

interface ValidationResult {
  isValid: boolean
  errors: Array<string>
}

/**
 * Validate AI-generated introduction message
 */
export function validateIntroductionMessage(
  message: string,
  context: {
    requesterName: string
    targetContactName: string
    ownerName: string
  },
): ValidationResult {
  const errors: Array<string> = []

  // Check minimum length
  if (message.length < 50) {
    errors.push('Message is too short (minimum 50 characters)')
  }

  // Check maximum length
  if (message.length > 2000) {
    errors.push('Message is too long (maximum 2000 characters)')
  }

  // Check if message contains target contact name
  if (!message.includes(context.targetContactName)) {
    errors.push(
      `Message must mention the target contact: ${context.targetContactName}`,
    )
  }

  // Check if message contains requester name
  if (!message.includes(context.requesterName)) {
    errors.push(`Message must mention your name: ${context.requesterName}`)
  }

  // Check for placeholder text (common AI mistakes)
  const placeholders = [
    '[Your Name]',
    '[Your Company]',
    '[Contact Name]',
    '[Company Name]',
    '[Position]',
    'PLACEHOLDER',
    '[INSERT',
    '[ADD',
  ]

  for (const placeholder of placeholders) {
    if (message.includes(placeholder)) {
      errors.push(`Message contains placeholder text: ${placeholder}`)
    }
  }

  // Check for email headers (AI sometimes adds these)
  const emailHeaders = ['Subject:', 'To:', 'From:', 'Dear Sir/Madam']
  for (const header of emailHeaders) {
    if (message.includes(header)) {
      errors.push(`Message should not contain email headers like: ${header}`)
    }
  }

  // Check for proper greeting (should address the owner)
  const greetingPatterns = [
    new RegExp(`Hi ${context.ownerName}`, 'i'),
    new RegExp(`Hello ${context.ownerName}`, 'i'),
    new RegExp(`Dear ${context.ownerName}`, 'i'),
  ]

  const hasProperGreeting = greetingPatterns.some((pattern) =>
    pattern.test(message),
  )

  if (!hasProperGreeting) {
    errors.push(`Message should start with a greeting to ${context.ownerName}`)
  }

  // Check for closing
  const closingPatterns = [
    /best regards/i,
    /kind regards/i,
    /sincerely/i,
    /thank you/i,
    /thanks/i,
  ]

  const hasClosing = closingPatterns.some((pattern) => pattern.test(message))

  if (!hasClosing) {
    errors.push('Message should have a professional closing')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Sanitize AI-generated message (remove common issues)
 */
export function sanitizeIntroductionMessage(message: string): string {
  let sanitized = message.trim()

  // Remove email subject lines
  sanitized = sanitized.replace(/^Subject:.*\n/gim, '')

  // Remove email headers
  sanitized = sanitized.replace(/^(To|From|Date|CC|BCC):.*\n/gim, '')

  // Remove multiple consecutive newlines
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n')

  // Remove leading/trailing whitespace from each line
  sanitized = sanitized
    .split('\n')
    .map((line) => line.trim())
    .join('\n')

  return sanitized
}

/**
 * Estimate word count
 */
export function getWordCount(text: string): number {
  return text.trim().split(/\s+/).length
}

/**
 * Check if message is within acceptable word count range
 */
export function isWithinWordCountRange(
  text: string,
  min = 50,
  max = 300,
): boolean {
  const wordCount = getWordCount(text)
  return wordCount >= min && wordCount <= max
}

// Made with Bob
