import { chat } from '@tanstack/ai'
import { createGroqText } from '@tanstack/ai-groq'
import * as Sentry from '@sentry/tanstackstart-react'
import type { SearchResult, User } from '@/schemas'

/**
 * AI Service - Handles AI generation using TanStack AI + Groq
 */

// Configuration from environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY
const AI_MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || '500', 10)
const AI_TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE || '0.7')

// Use the exact model name as a const to satisfy TypeScript
const GROQ_MODEL = 'llama-3.3-70b-versatile' as const

if (!GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is required')
}

/**
 * Create Groq adapter with API key
 */
const createGroqAdapter = () => {
  return createGroqText(GROQ_MODEL, GROQ_API_KEY, {
    // Optional: custom base URL if needed
    // baseURL: 'https://api.groq.com/openai/v1',
  })
}

/**
 * Generate system prompt for introduction messages
 */
function generateSystemPrompt(): string {
  return `You are a professional introduction message writer. Your task is to write concise, personalized introduction request messages.

TONE: Professional yet personable. Be clear and direct while remaining warm and respectful.

Guidelines:
- Keep the message concise (80-120 words for the BODY only)
- Be professional and direct without being overly formal
- Clearly state who you are and why you want the introduction
- Be respectful of the recipient's time
- Include a polite call-to-action
- Do NOT include greetings (like "Hi [name]") or signatures (like "Best regards") - these will be added automatically
- Do NOT include subject lines or email headers
- Do NOT use placeholder text like [Your Name] - use the actual provided information
- Write in first person from the requester's perspective
- Write ONLY the body content - no greeting, no signature
- Structure your response with 2-3 paragraphs, each separated by a blank line (\\n\\n)
- First paragraph: Brief intro of who you are (1-2 sentences)
- Second paragraph: Why you want the introduction and context (2-3 sentences)
- Optional third paragraph: Simple call-to-action if needed (1 sentence)

Example structure: "I'm [name] from [company], working as [position]. I'm reaching out because [reason for introduction]. [Additional context about why this connection matters]. Would you be willing to make an introduction?"

Be professional, clear, and personable.`
}

/**
 * Generate user prompt with context
 */
function generateUserPrompt(
  requester: {
    name: string
    company?: string | null
    position?: string | null
  },
  targetContact: {
    name: string
    company?: string | null
    position?: string | null
    notes?: string | null
    linkedinUrl?: string | null
  },
  owner: {
    name: string
    company?: string | null
    position?: string | null
  },
  previousMessages?: Array<string>,
): string {
  let prompt = `Write an introduction request message with the following context:\n\n`

  // Requester information
  prompt += `I am ${requester.name}`
  if (requester.position && requester.company) {
    prompt += `, ${requester.position} at ${requester.company}`
  } else if (requester.position) {
    prompt += `, working as ${requester.position}`
  } else if (requester.company) {
    prompt += ` from ${requester.company}`
  }
  prompt += `.\n\n`

  // Target contact information
  prompt += `I want to be introduced to ${targetContact.name}`
  if (targetContact.position && targetContact.company) {
    prompt += `, who is ${targetContact.position} at ${targetContact.company}`
  } else if (targetContact.position) {
    prompt += `, who works as ${targetContact.position}`
  } else if (targetContact.company) {
    prompt += ` at ${targetContact.company}`
  }
  prompt += `.\n\n`

  // Owner information
  prompt += `This message will be sent to ${owner.name}`
  if (owner.company) {
    prompt += ` at ${owner.company}`
  }
  prompt += `, who knows ${targetContact.name} and can make the introduction.\n\n`

  // Additional context
  if (targetContact.notes) {
    prompt += `Additional context about ${targetContact.name}: ${targetContact.notes}\n\n`
  }

  if (targetContact.linkedinUrl) {
    prompt += `${targetContact.name}'s LinkedIn: ${targetContact.linkedinUrl}\n\n`
  }

  prompt += `Write a professional introduction request message that ${owner.name} will receive, asking them to introduce me to ${targetContact.name}.`

  // Add previous messages to avoid repetition
  if (previousMessages && previousMessages.length > 0) {
    prompt += `\n\nIMPORTANT: I have previously generated the following message(s). You MUST create a COMPLETELY DIFFERENT message with:\n`
    prompt += `- Different opening approach\n`
    prompt += `- Different reasoning or angle\n`
    prompt += `- Different phrasing and word choices\n`
    prompt += `- Different structure or flow\n\n`
    prompt += `Previous message(s) to AVOID repeating:\n`
    previousMessages.forEach((msg, index) => {
      prompt += `\n--- Previous Message ${index + 1} ---\n${msg}\n`
    })
    prompt += `\n--- End of Previous Messages ---\n\n`
    prompt += `Generate a FRESH, UNIQUE message that takes a different approach while maintaining the same professional tone.\n\n`
  }

  prompt += `IMPORTANT: Write ONLY the body content. Do NOT include:
- Greeting (no "Hi", "Hello", "Dear", etc.)
- Signature (no "Best regards", "Sincerely", etc.)
- Your name at the end

The greeting and signature will be added automatically.

FORMATTING REQUIREMENTS:
- Keep it concise - aim for 80-120 words total
- Structure with 2-3 paragraphs separated by blank lines (\\n\\n)
- Paragraph 1: Who you are (1-2 sentences)
- Paragraph 2: Why you want the introduction with context (2-3 sentences)
- Optional Paragraph 3: Simple call-to-action if needed (1 sentence)
- Be clear and professional without unnecessary elaboration`

  return prompt
}

/**
 * Format AI-generated message with proper email structure
 * Adds greeting, ensures proper line breaks, and adds signature
 */
function formatEmailMessage(
  aiGeneratedBody: string,
  requesterName: string,
  ownerName: string,
): string {
  // Remove any accidental greetings or signatures that AI might have added
  let body = aiGeneratedBody.trim()

  // Remove common greeting patterns if AI included them
  body = body.replace(/^(Hi|Hello|Dear)\s+[^,\n]+,?\s*/i, '')

  // Remove common signature patterns if AI included them
  body = body.replace(
    /\n*(Best regards|Sincerely|Thanks|Thank you|Cheers|Warm regards|Kind regards)[,\s]*\n*[^\n]*$/i,
    '',
  )

  // Normalize line breaks: ensure paragraphs are separated by exactly one blank line
  // First, normalize all multiple newlines to double newlines
  body = body.replace(/\n{3,}/g, '\n\n')

  // Then ensure single newlines within paragraphs are preserved
  // but paragraphs are properly separated
  // Split by double newlines to get paragraphs
  const paragraphs = body.split(/\n\n+/).filter((p) => p.trim().length > 0)

  // Join paragraphs with double newlines for proper spacing
  body = paragraphs.join('\n\n')

  // Trim again after formatting
  body = body.trim()

  // Construct the full email message with greeting and signature
  const greeting = `Hi ${ownerName},`
  const signature = `Best regards,\n${requesterName}`

  return `${greeting}\n\n${body}\n\n${signature}`
}

/**
 * Generate introduction message using AI
 */
export async function generateIntroductionMessage(
  requester: User,
  targetContact: SearchResult,
  previousMessages?: Array<string>,
): Promise<{
  success: boolean
  message?: string
  error?: string
  tokensUsed?: number
  responseTimeMs?: number
}> {
  const startTime = Date.now()

  try {
    // Create Groq adapter
    const adapter = createGroqAdapter()

    // Prepare context
    const requesterContext = {
      name: requester.name,
      company: requester.company,
      position: requester.position,
    }

    const targetContactContext = {
      name: targetContact.name,
      company: targetContact.company,
      position: targetContact.position,
      notes: null, // Notes are not available in SearchResult
      linkedinUrl: targetContact.linkedinUrl,
    }

    const ownerContext = {
      name: targetContact.ownerName,
      company: targetContact.ownerCompany,
      position: targetContact.ownerPosition,
    }

    // Generate prompts
    const systemPrompt = generateSystemPrompt()
    const userPrompt = generateUserPrompt(
      requesterContext,
      targetContactContext,
      ownerContext,
      previousMessages,
    )

    // Generate text using TanStack AI (non-streaming)
    const text = await chat({
      adapter,
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompts: [systemPrompt],
      modelOptions: {
        temperature: AI_TEMPERATURE,
        max_completion_tokens: AI_MAX_TOKENS,
      },
      stream: false, // Get complete response as string
    })

    const responseTimeMs = Date.now() - startTime

    // Validate response
    let message = text?.trim()

    if (!message) {
      throw new Error('AI generated empty response')
    }

    // Format the message with proper email structure
    message = formatEmailMessage(
      message,
      requesterContext.name,
      ownerContext.name,
    )

    return {
      success: true,
      message,
      // Note: Groq doesn't provide token usage in non-streaming mode
      // We can estimate based on response length if needed
      tokensUsed: undefined,
      responseTimeMs,
    }
  } catch (error) {
    const responseTimeMs = Date.now() - startTime
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    // Log error to Sentry
    Sentry.captureException(error, {
      tags: {
        service: 'ai',
        operation: 'generateIntroductionMessage',
      },
      extra: {
        requesterId: requester.id,
        targetContactId: targetContact.id,
        responseTimeMs,
      },
    })

    console.error('AI generation error:', error)

    return {
      success: false,
      error: errorMessage,
      responseTimeMs,
    }
  }
}

/**
 * Generate introduction message with retry logic
 */
export async function generateIntroductionMessageWithRetry(
  requester: User,
  targetContact: SearchResult,
  previousMessages?: Array<string>,
  maxRetries = 1,
): Promise<{
  success: boolean
  message?: string
  error?: string
  tokensUsed?: number
  responseTimeMs?: number
}> {
  let lastError: string | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await generateIntroductionMessage(
      requester,
      targetContact,
      previousMessages,
    )

    if (result.success) {
      return result
    }

    lastError = result.error
    console.log(`AI generation attempt ${attempt + 1} failed, retrying...`)

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }

  return {
    success: false,
    error: lastError || 'AI generation failed after retries',
  }
}

// Made with Bob
