import { z } from 'zod'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { notifications } from '@/db/schema'

/**
 * Notification Type Enum
 */
export const notificationTypeEnum = z.enum([
  'introduction_request',
  'introduction_approved',
  'introduction_declined',
])

/**
 * Base notification schema (from database)
 */
export const notificationSchema = createSelectSchema(notifications)

/**
 * Insert notification schema
 */
export const insertNotificationSchema = createInsertSchema(notifications, {
  type: notificationTypeEnum,
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  read: z.boolean().default(false),
  metadata: z.string().optional(),
  emailContent: z.string().optional(),
})

/**
 * Update notification schema
 */
export const updateNotificationSchema = notificationSchema
  .pick({
    read: true,
  })
  .partial()

/**
 * Mark notification as read schema
 */
export const markAsReadSchema = z.object({
  id: z.number(),
})

/**
 * Mark all notifications as read schema
 */
export const markAllAsReadSchema = z.object({
  userId: z.string(),
})

/**
 * Notification metadata schema for type safety
 */
export const notificationMetadataSchema = z.object({
  requesterName: z.string().optional(),
  requesterEmail: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  requestId: z.number().optional(),
})

/**
 * Notification with metadata parsed
 */
export const notificationWithMetadataSchema = notificationSchema.extend({
  parsedMetadata: notificationMetadataSchema.optional(),
})

/**
 * Get notifications query schema
 */
export const getNotificationsSchema = z
  .object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(5),
    unreadOnly: z.boolean().default(false),
  })
  .partial()
  .default({ page: 1, pageSize: 5, unreadOnly: false })

/**
 * Paginated notifications response schema
 */
export const paginatedNotificationsSchema = z.object({
  data: z.array(notificationWithMetadataSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
})

/**
 * Create notification input schema
 */
export const createNotificationInputSchema = z.object({
  userId: z.string(),
  type: notificationTypeEnum,
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  relatedRequestId: z.number().optional(),
  metadata: notificationMetadataSchema.optional(),
})

export const notificationSearchSchema = z.object({
  p: z.number().optional().catch(1),
  c: z.number().optional().catch(10),
  unreadOnly: z.boolean().optional().catch(false),
})

// ============================================================================
// TypeScript Types
// ============================================================================

export type Notification = z.infer<typeof notificationSchema>
export type InsertNotification = z.infer<typeof insertNotificationSchema>
export type UpdateNotification = z.infer<typeof updateNotificationSchema>
export type MarkAsRead = z.infer<typeof markAsReadSchema>
export type MarkAllAsRead = z.infer<typeof markAllAsReadSchema>
export type GetNotifications = z.infer<typeof getNotificationsSchema>
export type NotificationMetadata = z.infer<typeof notificationMetadataSchema>
export type CreateNotificationInput = z.infer<
  typeof createNotificationInputSchema
>
export type NotificationWithMetadata = z.infer<
  typeof notificationWithMetadataSchema
>
export type NotificationType = z.infer<typeof notificationTypeEnum>
export type PaginatedNotifications = z.infer<
  typeof paginatedNotificationsSchema
>
export type NotificationSearchParams = z.infer<typeof notificationSearchSchema>
