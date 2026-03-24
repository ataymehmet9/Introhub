import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { and, count, desc, eq } from 'drizzle-orm'
import { protectedProcedure } from '../init'
import type { TRPCRouterRecord } from '@trpc/server'
import {
  createNotificationInputSchema,
  getNotificationsSchema,
  markAsReadSchema,
} from '@/schemas'
import { notifications } from '@/db/schema'
import { notificationEmitter } from '@/lib/notification-emitter'

export const notificationRouter = {
  /**
   * Get notifications for the current user with pagination
   */
  list: protectedProcedure
    .input(getNotificationsSchema)
    .query(async ({ input, ctx }) => {
      const { user: currentUser, db } = ctx

      if (!currentUser) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Apply defaults for optional parameters
      const page = input.page ?? 1
      const pageSize = input.pageSize ?? 5
      const unreadOnly = input.unreadOnly ?? false

      // Build query conditions
      const conditions = [eq(notifications.userId, currentUser.id)]

      if (unreadOnly) {
        conditions.push(eq(notifications.read, false))
      }

      // Calculate offset from page number
      const offset = (page - 1) * pageSize

      // Get total count and notifications concurrently
      const [totalCountResult, notificationList] = await Promise.all([
        db
          .select({ count: count() })
          .from(notifications)
          .where(and(...conditions)),
        db
          .select()
          .from(notifications)
          .where(and(...conditions))
          .orderBy(desc(notifications.createdAt))
          .limit(pageSize)
          .offset(offset),
      ])

      const totalItems = totalCountResult[0]?.count ?? 0
      const totalPages = Math.ceil(totalItems / pageSize)

      // Parse metadata for each notification
      const parsedNotifications = notificationList.map((notification) => ({
        ...notification,
        parsedMetadata: notification.metadata
          ? JSON.parse(notification.metadata)
          : null,
      }))

      // Return paginated response
      return {
        data: parsedNotifications,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      }
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const { user: currentUser, db } = ctx

    if (!currentUser) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, currentUser.id),
          eq(notifications.read, false),
        ),
      )

    return {
      count: result.length,
      hasUnread: result.length > 0,
    }
  }),

  /**
   * Mark a notification as read
   */
  markAsRead: protectedProcedure
    .input(markAsReadSchema)
    .mutation(async ({ input, ctx }) => {
      const { user: currentUser, db } = ctx

      if (!currentUser) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { id } = input

      // Update with user check in WHERE clause - no race condition
      const updated = await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.id, id),
            eq(notifications.userId, currentUser.id),
          ),
        )
        .returning()

      if (updated.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            'Notification not found or you do not have permission to update it',
        })
      }

      // Emit SSE event for real-time update
      notificationEmitter.emit('notification:read', {
        userId: currentUser.id,
        notificationId: id,
      })

      return updated[0]
    }),

  /**
   * Mark all notifications as read for the current user
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const { user: currentUser, db } = ctx

    if (!currentUser) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, currentUser.id),
          eq(notifications.read, false),
        ),
      )

    // Emit SSE event for real-time update
    notificationEmitter.emit('notification:all-read', {
      userId: currentUser.id,
    })

    return { success: true }
  }),

  /**
   * Create a notification (internal use)
   */
  create: protectedProcedure
    .input(createNotificationInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { db } = ctx

      const { userId, type, title, message, relatedRequestId, metadata } = input

      // Create the notification
      const newNotification = await db
        .insert(notifications)
        .values({
          userId,
          type,
          title,
          message,
          relatedRequestId,
          metadata: metadata ? JSON.stringify(metadata) : null,
          read: false,
        })
        .returning()

      // Parse metadata for the SSE event
      const parsedNotification = {
        ...newNotification[0],
        parsedMetadata: metadata || undefined,
      }

      // Emit SSE event for real-time notification delivery
      notificationEmitter.emit('notification:created', {
        userId,
        notification: parsedNotification,
      })

      return newNotification[0]
    }),

  /**
   * Delete a notification
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { user: currentUser, db } = ctx

      if (!currentUser) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { id } = input

      // Delete with user check in WHERE clause - no race condition
      const deleted = await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, id),
            eq(notifications.userId, currentUser.id),
          ),
        )
        .returning()

      if (deleted.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message:
            'Notification not found or you do not have permission to delete it',
        })
      }

      // Emit SSE event for real-time update
      notificationEmitter.emit('notification:deleted', {
        userId: currentUser.id,
        notificationId: id,
      })

      return { success: true }
    }),

  /**
   * Delete all read notifications for the current user
   */
  deleteAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const { user: currentUser, db } = ctx

    if (!currentUser) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.userId, currentUser.id),
          eq(notifications.read, true),
        ),
      )

    return { success: true }
  }),
} satisfies TRPCRouterRecord
