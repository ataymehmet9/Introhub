import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '@/db'
import {
  sendForgotPasswordEmail,
  sendWelcomeEmail,
} from '@/services/email.functions'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['linkedin', 'google', 'microsoft'],
    },
  },
  user: {
    additionalFields: {
      company: {
        type: 'string',
        required: false,
      },
      position: {
        type: 'string',
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      sendForgotPasswordEmail({ data: { to: user.email, url, token } })
    },
  },
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      authority: 'https://login.microsoftonline.com',
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID as string,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [tanstackStartCookies()],
  onAfterSignUp: async (user: { email: string; name: string }) => {
    // Send welcome email to new user
    try {
      const dashboardUrl = `${process.env.APP_URL || 'http://localhost:3000'}/dashboard`
      await sendWelcomeEmail({
        data: {
          to: user.email,
          userName: user.name,
          userEmail: user.email,
          dashboardUrl,
        },
      })
      console.log('Welcome email sent to:', user.email)
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      // Don't throw error to prevent signup failure
    }
  },
})
