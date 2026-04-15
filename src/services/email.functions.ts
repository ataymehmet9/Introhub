import { createServerFn } from '@tanstack/react-start'
import { pretty, render, toPlainText } from '@react-email/render'
import {
  CRMSyncFailureEmail,
  ForgotPasswordEmail,
  IntroductionEmail,
  IntroductionRequestApprovedEmail,
  IntroductionRequestDeclinedEmail,
  IntroductionRequestEmail,
  WelcomeEmail,
} from '@/components/template/email'
import {
  crmSyncFailureEmailSchema,
  forgotPasswordEmailSchema,
  introductionEmailSchema,
  introductionRequestEmailSchema,
  introductionResponseEmailSchema,
  welcomeEmailSchema,
} from '@/schemas'
import { getResendInstance } from '@/integrations/resend'

export const sendForgotPasswordEmail = createServerFn({ method: 'POST' })
  .inputValidator(forgotPasswordEmailSchema)
  .handler(async ({ data }) => {
    const { to, url, from } = data
    const resend = getResendInstance()
    const emailHtml = await pretty(
      await render(ForgotPasswordEmail({ to, url })),
    )
    const plainText = toPlainText(emailHtml)

    try {
      const { data: emailData, error } = await resend.emails.send({
        from: from ?? 'Intro Hub <no-reply@intro-hub.com>',
        to: [to],
        subject: 'Reset your password',
        html: emailHtml,
        text: plainText,
      })

      if (error) {
        console.error('Error sending email:', error)

        return { success: false, message: 'Failed to send email' }
      }

      return {
        success: true,
        message: 'Email sent successfully',
        emailId: emailData.id,
      }
    } catch (error) {
      console.error('Error sending email:', error)

      return { success: false, message: 'Unknown error sending email' }
    }
  })

/**
 * Send introduction request email to contact owner
 */
export const sendIntroductionRequestEmail = createServerFn({ method: 'POST' })
  .inputValidator(introductionRequestEmailSchema)
  .handler(async ({ data }) => {
    const {
      to,
      approverName,
      requesterName,
      requesterEmail,
      requesterCompany,
      requesterPosition,
      contactName,
      contactEmail,
      message,
      dashboardUrl,
      from,
    } = data

    const resend = getResendInstance()

    try {
      const emailHtml = await pretty(
        await render(
          IntroductionRequestEmail({
            approverName,
            requesterName,
            requesterEmail,
            requesterCompany,
            requesterPosition,
            contactName,
            contactEmail,
            message,
            dashboardUrl,
          }),
        ),
      )
      const plainText = toPlainText(emailHtml)

      const { data: emailData, error } = await resend.emails.send({
        from: from ?? 'Intro Hub <no-reply@intro-hub.com>',
        to: [to],
        subject: `Introduction Request: ${contactName}`,
        html: emailHtml,
        text: plainText,
      })

      if (error) {
        console.error('Error sending introduction request email:', {
          error,
          to,
          contactName,
          timestamp: new Date().toISOString(),
        })

        return { success: false, message: 'Failed to send email', error }
      }

      console.log('Introduction request email sent successfully:', {
        emailId: emailData.id,
        to,
        contactName,
        timestamp: new Date().toISOString(),
      })

      return {
        success: true,
        message: 'Email sent successfully',
        emailId: emailData.id,
        emailHtml,
      }
    } catch (error) {
      console.error('Error sending introduction request email:', {
        error,
        to,
        contactName,
        timestamp: new Date().toISOString(),
      })

      return {
        success: false,
        message: 'Unknown error sending email',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

/**
 * Send introduction response email to requester (approved or declined)
 */
export const sendIntroductionResponseEmail = createServerFn({ method: 'POST' })
  .inputValidator(introductionResponseEmailSchema)
  .handler(async ({ data }) => {
    const {
      to,
      requesterName,
      approverName,
      contactName,
      status,
      responseMessage,
      contactEmail,
      contactCompany,
      contactPosition,
      from,
    } = data

    const resend = getResendInstance()

    try {
      // Render the appropriate template based on status
      let emailHtml: string

      if (status === 'approved') {
        emailHtml = await pretty(
          await render(
            IntroductionRequestApprovedEmail({
              requesterName,
              approverName,
              contactName,
              contactEmail: contactEmail!,
              contactCompany,
              contactPosition,
              responseMessage,
            }),
          ),
        )
      } else {
        emailHtml = await pretty(
          await render(
            IntroductionRequestDeclinedEmail({
              requesterName,
              approverName,
              contactName,
              responseMessage,
            }),
          ),
        )
      }
      const plainText = toPlainText(emailHtml)

      const subject =
        status === 'approved'
          ? `Introduction Request Approved: ${contactName}`
          : `Introduction Request Update: ${contactName}`

      const { data: emailData, error } = await resend.emails.send({
        from: from ?? 'Intro Hub <no-reply@intro-hub.com>',
        to: [to],
        subject,
        html: emailHtml,
        text: plainText,
      })

      if (error) {
        console.error('Error sending introduction response email:', {
          error,
          to,
          status,
          contactName,
          timestamp: new Date().toISOString(),
        })

        return { success: false, message: 'Failed to send email', error }
      }

      console.log('Introduction response email sent successfully:', {
        emailId: emailData.id,
        to,
        status,
        contactName,
        timestamp: new Date().toISOString(),
      })

      return {
        success: true,
        message: 'Email sent successfully',
        emailId: emailData.id,
        emailHtml,
      }
    } catch (error) {
      console.error('Error sending introduction response email:', {
        error,
        to,
        status,
        contactName,
        timestamp: new Date().toISOString(),
      })

      return {
        success: false,
        message: 'Unknown error sending email',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

/**
 * Send introduction email to both contact (TO) and requester (CC)
 * Used when an introduction request is approved
 */
export const sendIntroductionEmail = createServerFn({ method: 'POST' })
  .inputValidator(introductionEmailSchema)
  .handler(async ({ data }) => {
    const {
      to,
      cc,
      approverName,
      requesterName,
      requesterEmail,
      requesterCompany,
      requesterPosition,
      contactName,
      contactEmail,
      contactCompany,
      contactPosition,
      customMessage,
      from,
    } = data

    const resend = getResendInstance()

    try {
      const emailHtml = await pretty(
        await render(
          IntroductionEmail({
            approverName,
            requesterName,
            requesterEmail,
            requesterCompany,
            requesterPosition,
            contactName,
            contactEmail,
            contactCompany,
            contactPosition,
            customMessage,
          }),
        ),
      )
      const plainText = toPlainText(emailHtml)

      const { data: emailData, error } = await resend.emails.send({
        from: from ?? 'Intro Hub <no-reply@intro-hub.com>',
        to: [to], // Contact's email
        cc: [cc], // Requester's email
        subject: `Introduction: ${requesterName} <> ${contactName}`,
        html: emailHtml,
        text: plainText,
      })

      if (error) {
        console.error('Error sending introduction email:', {
          error,
          to,
          cc,
          contactName,
          requesterName,
          timestamp: new Date().toISOString(),
        })

        return { success: false, message: 'Failed to send email', error }
      }

      console.log('Introduction email sent successfully:', {
        emailId: emailData.id,
        to,
        cc,
        contactName,
        requesterName,
        timestamp: new Date().toISOString(),
      })

      return {
        success: true,
        message: 'Email sent successfully',
        emailId: emailData.id,
        emailHtml,
      }
    } catch (error) {
      console.error('Error sending introduction email:', {
        error,
        to,
        cc,
        contactName,
        requesterName,
        timestamp: new Date().toISOString(),
      })

      return {
        success: false,
        message: 'Unknown error sending email',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

/**
 * Send welcome email to new users after successful signup
 */
export const sendWelcomeEmail = createServerFn({ method: 'POST' })
  .inputValidator(welcomeEmailSchema)
  .handler(async ({ data }) => {
    const { to, userName, userEmail, dashboardUrl, from } = data

    const resend = getResendInstance()

    try {
      const emailHtml = await pretty(
        await render(
          WelcomeEmail({
            userName,
            userEmail,
            dashboardUrl,
          }),
        ),
      )
      const plainText = toPlainText(emailHtml)

      const { data: emailData, error } = await resend.emails.send({
        from: from ?? 'Intro Hub <no-reply@intro-hub.com>',
        to: [to],
        subject: 'Welcome to IntroHub! 🎉',
        html: emailHtml,
        text: plainText,
      })

      if (error) {
        console.error('Error sending welcome email:', {
          error,
          to,
          userName,
          timestamp: new Date().toISOString(),
        })

        return { success: false, message: 'Failed to send email', error }
      }

      console.log('Welcome email sent successfully:', {
        emailId: emailData.id,
        to,
        userName,
        timestamp: new Date().toISOString(),
      })

      return {
        success: true,
        message: 'Email sent successfully',
        emailId: emailData.id,
      }
    } catch (error) {
      console.error('Error sending welcome email:', {
        error,
        to,
        userName,
        timestamp: new Date().toISOString(),
      })

      return {
        success: false,
        message: 'Unknown error sending email',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

/**
 * Direct email sending function for CRM sync failures
 * Used by BullMQ worker (doesn't require TanStack Start context)
 */
export async function sendCRMSyncFailureEmailDirect(params: {
  to: string
  userName: string
  provider: string
  errorMessage: string
  syncStartedAt: string
  crmIntegrationsUrl: string
  from?: string
}) {
  const {
    to,
    userName,
    provider,
    errorMessage,
    syncStartedAt,
    crmIntegrationsUrl,
    from,
  } = params

  const resend = getResendInstance()

  try {
    const emailHtml = await pretty(
      await render(
        CRMSyncFailureEmail({
          userName,
          provider,
          errorMessage,
          syncStartedAt,
          crmIntegrationsUrl,
        }),
      ),
    )
    const plainText = toPlainText(emailHtml)

    const providerName = provider === 'hubspot' ? 'HubSpot' : provider

    const { data: emailData, error } = await resend.emails.send({
      from: from ?? 'Intro Hub <no-reply@intro-hub.com>',
      to: [to],
      subject: `${providerName} Sync Failed`,
      html: emailHtml,
      text: plainText,
    })

    if (error) {
      console.error('Error sending CRM sync failure email:', {
        error,
        to,
        provider,
        timestamp: new Date().toISOString(),
      })

      return { success: false, message: 'Failed to send email', error }
    }

    console.log('CRM sync failure email sent successfully:', {
      emailId: emailData.id,
      to,
      provider,
      timestamp: new Date().toISOString(),
    })

    return {
      success: true,
      message: 'Email sent successfully',
      emailId: emailData.id,
    }
  } catch (error) {
    console.error('Exception sending CRM sync failure email:', error)
    return {
      success: false,
      message: 'Failed to send email',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send CRM sync failure email to user (Server Function wrapper)
 * Used when a CRM contact sync fails from client-side
 */
export const sendCRMSyncFailureEmail = createServerFn({ method: 'POST' })
  .inputValidator(crmSyncFailureEmailSchema)
  .handler(async ({ data }) => {
    return sendCRMSyncFailureEmailDirect(data)
  })
