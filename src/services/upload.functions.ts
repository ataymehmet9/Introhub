import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { deleteObject } from '@better-upload/server/helpers'
import { db } from '@/db'
import { user } from '@/db/schema'
import { router } from '@/integrations/better-upload/init'

const deleteProfileImageSchema = z.object({ userId: z.string() })

export const deleteProfileImage = createServerFn({ method: 'POST' })
  .inputValidator(deleteProfileImageSchema)
  .handler(async ({ data }) => {
    const { userId } = data

    try {
      // Check if user exists and has a profile image
      const existingUser = await db.query.user.findFirst({
        where: eq(user.id, userId),
        columns: {
          id: true,
          image: true,
        },
      })

      if (!existingUser) {
        throw new Error('User not found')
      }

      if (!existingUser.image) {
        return // Nothing to delete
      }

      // Extract the S3 key from the URL
      let key = ''

      try {
        const imageUrl = new URL(existingUser.image)
        const pathname = imageUrl.pathname
        key = pathname.startsWith('/') ? pathname.slice(1) : pathname
      } catch {
        console.error('Error retrieving imageUrl for user', existingUser.image)
        key = existingUser.image
      }

      // Delete from S3
      await deleteObject(router.client, {
        bucket: router.bucketName,
        key,
      })

      // Update the user record to remove the image URL
      await db
        .update(user)
        .set({
          image: null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId))

      console.log(`Successfully deleted profile image for user ${userId}`)
    } catch (error) {
      console.error('Error deleting profile image:', error)
      throw error
    }
  })
