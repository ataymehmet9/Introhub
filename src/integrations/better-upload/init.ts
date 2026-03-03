import { RejectUpload,  route } from '@better-upload/server'
import { aws } from '@better-upload/server/clients'
import type {Router} from '@better-upload/server';
import { auth } from '@/lib/auth'
import { BETTER_UPLOAD_PROFILE_PIC_NAME } from '@/constants/app.constant'

export const router: Router = {
  client: aws({
    accessKeyId: process.env.BETTER_UPLOAD_ACCESS_KEY as string,
    secretAccessKey: process.env.BETTER_UPLOAD_SECRET_KEY as string,
    region: process.env.VITE_BETTER_UPLOAD_BUCKET_REGION as string,
  }),
  bucketName: process.env.VITE_BETTER_UPLOAD_BUCKET_NAME as string,
  routes: {
    [BETTER_UPLOAD_PROFILE_PIC_NAME]: route({
      fileTypes: ['image/*'],
      multipleFiles: false,
      onBeforeUpload: async ({ req }) => {
        const user = await auth.api.getSession({
          headers: req.headers,
        })

        if (!user) {
          throw new RejectUpload('Unauthorized')
        }
      },
    }),
  },
}
