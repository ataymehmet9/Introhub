import { z } from 'zod'

export const forgotPasswordEmailSchema = z.object({
  to: z.email({ message: 'Please enter a valid email address' }),
  url: z.url({ message: 'Please enter a valid URL' }),
  token: z.string().min(1, { message: 'Please enter a valid token' }),
  from: z.email({ message: 'Invalid from email address' }).optional(),
})

export type ForgotPasswordEmail = z.infer<typeof forgotPasswordEmailSchema>

/**
 * Introduction Request Email Schema
 * Email sent to contact owner when someone requests an introduction
 */
export const introductionRequestEmailSchema = z.object({
  to: z.string().email({ message: 'Valid email address required' }),
  approverName: z.string().min(1, { message: 'Approver name is required' }),
  requesterName: z.string().min(1, { message: 'Requester name is required' }),
  requesterEmail: z
    .string()
    .email({ message: 'Valid requester email required' }),
  requesterCompany: z.string().nullable().optional(),
  requesterPosition: z.string().nullable().optional(),
  contactName: z.string().min(1, { message: 'Contact name is required' }),
  contactEmail: z.string().email({ message: 'Valid contact email required' }),
  message: z.string().min(1, { message: 'Message is required' }),
  dashboardUrl: z.string().url({ message: 'Valid dashboard URL required' }),
  from: z.string().email().optional(),
})

export type IntroductionRequestEmail = z.infer<
  typeof introductionRequestEmailSchema
>

/**
 * Introduction Response Email Schema
 * Email sent to requester when their request is approved or declined
 */
export const introductionResponseEmailSchema = z.object({
  to: z.string().email({ message: 'Valid email address required' }),
  requesterName: z.string().min(1, { message: 'Requester name is required' }),
  approverName: z.string().min(1, { message: 'Approver name is required' }),
  contactName: z.string().min(1, { message: 'Contact name is required' }),
  status: z.enum(['approved', 'declined'], {
    message: 'Status must be approved or declined',
  }),
  responseMessage: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactCompany: z.string().nullable().optional(),
  contactPosition: z.string().nullable().optional(),
  from: z.string().email().optional(),
})

export type IntroductionResponseEmail = z.infer<
  typeof introductionResponseEmailSchema
>

/**
 * Introduction Email Schema
 * Email sent to both contact (TO) and requester (CC) when request is approved
 */
export const introductionEmailSchema = z.object({
  to: z.string().email({ message: 'Valid contact email required' }),
  cc: z.string().email({ message: 'Valid requester email required' }),
  approverName: z.string().min(1, { message: 'Approver name is required' }),
  requesterName: z.string().min(1, { message: 'Requester name is required' }),
  requesterEmail: z
    .string()
    .email({ message: 'Valid requester email required' }),
  requesterCompany: z.string().nullable().optional(),
  requesterPosition: z.string().nullable().optional(),
  contactName: z.string().min(1, { message: 'Contact name is required' }),
  contactEmail: z.string().email({ message: 'Valid contact email required' }),
  contactCompany: z.string().nullable().optional(),
  contactPosition: z.string().nullable().optional(),
  customMessage: z
    .string()
    .min(1, { message: 'Custom introduction message is required' }),
  from: z.string().email().optional(),
})

export type IntroductionEmail = z.infer<typeof introductionEmailSchema>

/**
 * Welcome Email Schema
 * Email sent to new users when they successfully sign up
 */
export const welcomeEmailSchema = z.object({
  to: z.email({ message: 'Valid email address required' }),
  userName: z.string().min(1, { message: 'User name is required' }),
  userEmail: z.email({ message: 'Valid user email required' }),
  dashboardUrl: z.string().url({ message: 'Valid dashboard URL required' }),
  from: z.email().optional(),
})

export type WelcomeEmail = z.infer<typeof welcomeEmailSchema>
