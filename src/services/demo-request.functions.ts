/**
 * Demo Request Server Functions
 * Handles demo request submissions with security checks
 */

import { createServerFn } from '@tanstack/react-start'
import { render, toPlainText } from '@react-email/render'
import { checkRateLimit } from './rate-limit.service'
import { DemoRequestEmail } from '@/components/template/email'
import {
  demoRequestFormSchema,
  demoRequestResponseSchema,
  recaptchaVerificationSchema,
} from '@/schemas'
import { getResendInstance } from '@/integrations/resend'
import { containsSuspiciousPatterns, sanitizeFormData } from '@/utils/sanitize'

/**
 * Verify reCAPTCHA token with Google
 */
async function verifyRecaptcha(token: string): Promise<{
  success: boolean
  score?: number
  error?: string
}> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY not configured')
    return { success: false, error: 'reCAPTCHA not configured' }
  }

  try {
    const response = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${secretKey}&response=${token}`,
      },
    )

    const data = await response.json()
    const verification = recaptchaVerificationSchema.parse(data)

    if (!verification.success) {
      console.error(
        'reCAPTCHA verification failed:',
        verification['error-codes'],
      )
      return {
        success: false,
        error: 'reCAPTCHA verification failed',
      }
    }

    // For reCAPTCHA v3, check the score (0.0 - 1.0)
    // Score of 0.5 or higher is generally considered human
    if (verification.score !== undefined && verification.score < 0.5) {
      console.warn('Low reCAPTCHA score:', verification.score)
      return {
        success: false,
        score: verification.score,
        error: 'Suspicious activity detected',
      }
    }

    return {
      success: true,
      score: verification.score,
    }
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error)
    return {
      success: false,
      error: 'Failed to verify reCAPTCHA',
    }
  }
}

/**
 * Submit demo request with security checks
 */
export const submitDemoRequest = createServerFn({ method: 'POST' })
  .inputValidator(demoRequestFormSchema)
  .handler(async ({ data }) => {
    try {
      // 1. Check honeypot field
      if (data.website && data.website.length > 0) {
        console.warn('Honeypot triggered - potential bot submission')
        return demoRequestResponseSchema.parse({
          success: false,
          message: 'Invalid submission',
          error: 'Spam detected',
        })
      }

      // 2. Verify reCAPTCHA
      const recaptchaResult = await verifyRecaptcha(data.recaptchaToken)
      if (!recaptchaResult.success) {
        return demoRequestResponseSchema.parse({
          success: false,
          message: recaptchaResult.error || 'reCAPTCHA verification failed',
          error: recaptchaResult.error,
        })
      }

      // 3. Get IP address for rate limiting (use timestamp as fallback for local dev)
      const ip = `demo-${Date.now()}`

      // 4. Check rate limit (3 submissions per hour)
      const rateLimitResult = checkRateLimit(ip, {
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000, // 1 hour
      })

      if (!rateLimitResult.allowed) {
        const resetTime = new Date(rateLimitResult.resetTime)
        return demoRequestResponseSchema.parse({
          success: false,
          message: `Too many requests. Please try again after ${resetTime.toLocaleTimeString()}`,
          error: 'Rate limit exceeded',
        })
      }

      // 5. Sanitize input data
      const sanitizedData = sanitizeFormData({
        name: data.name,
        email: data.email,
        company: data.company,
        message: data.message || '',
      })

      // 6. Check for suspicious patterns
      const allText = `${sanitizedData.name} ${sanitizedData.email} ${sanitizedData.company} ${sanitizedData.message}`
      if (containsSuspiciousPatterns(allText)) {
        console.warn('Suspicious patterns detected in demo request')
        return demoRequestResponseSchema.parse({
          success: false,
          message: 'Invalid content detected',
          error: 'Suspicious content',
        })
      }

      // 7. Send email to sales team
      const resend = await getResendInstance()
      const submittedAt = new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'long',
      })

      const emailHtml = await render(
        DemoRequestEmail({
          name: sanitizedData.name,
          email: sanitizedData.email,
          company: sanitizedData.company,
          message: sanitizedData.message,
          submittedAt,
        }),
      )
      const plainText = toPlainText(emailHtml)

      const salesEmail = process.env.SALES_EMAIL || 'sales@intro-hub.com'

      const { data: emailData, error } = await resend.emails.send({
        from: 'Intro Hub <no-reply@intro-hub.com>',
        to: [salesEmail],
        subject: `New Demo Request from ${sanitizedData.company}`,
        html: emailHtml,
        text: plainText,
        replyTo: sanitizedData.email,
      })

      if (error) {
        console.error('Error sending demo request email:', error)
        return demoRequestResponseSchema.parse({
          success: false,
          message: 'Failed to send demo request',
          error: 'Email delivery failed',
        })
      }

      console.log('Demo request email sent successfully:', {
        emailId: emailData.id,
        company: sanitizedData.company,
        email: sanitizedData.email,
        timestamp: new Date().toISOString(),
      })

      return demoRequestResponseSchema.parse({
        success: true,
        message: 'Thank you! We will contact you soon to schedule your demo.',
        emailId: emailData.id,
      })
    } catch (error) {
      console.error('Error processing demo request:', error)
      return demoRequestResponseSchema.parse({
        success: false,
        message: 'An error occurred while processing your request',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

// Made with Bob
