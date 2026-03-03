import { z } from 'zod'
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import { user } from '@/db/schema'

/**
 * User Schema - Validation for user table
 */
export const userSchema = createSelectSchema(user)
export const insertUserSchema = createInsertSchema(user)

export const userSignupSchema = insertUserSchema
  .omit({
    id: true,
  })
  .extend({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z
      .string()
      .min(8, { message: 'Confirm password must be at least 8 characters' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type UserSignup = z.infer<typeof userSignupSchema>

/**
 * User Update Schema - For updating existing users
 */
export const updateUserSchema = createUpdateSchema(user)

/**
 * User Public Schema - For public user data (excludes sensitive fields)
 */
export const publicUserSchema = userSchema.pick({
  id: true,
  name: true,
  email: true,
  image: true,
})

export const userEmailSchema = userSchema.pick({
  email: true,
})

export const userResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' }),
    confirmPassword: z
      .string()
      .min(8, { message: 'Confirm password must be at least 8 characters' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Type exports
export type User = z.infer<typeof userSchema>
export type InsertUser = z.infer<typeof insertUserSchema>
export type UpdateUser = z.infer<typeof updateUserSchema>
export type PublicUser = z.infer<typeof publicUserSchema>
export type UserEmail = z.infer<typeof userEmailSchema>
export type UserResetPassword = z.infer<typeof userResetPasswordSchema>
