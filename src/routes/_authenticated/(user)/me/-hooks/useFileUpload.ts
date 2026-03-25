import { uploadFile } from '@better-upload/client'
import { useMutation } from '@tanstack/react-query'
import { BETTER_UPLOAD_PROFILE_PIC_NAME } from '@/constants/app.constant'
import { deleteProfileImage } from '@/services/upload.functions'
import { useSessionUser } from '@/store/authStore'

type UseFileUploadProps = {
  onError?: () => void
}

export const useFileUpload = (props: UseFileUploadProps = {}) => {
  const { onError } = props
  const { user } = useSessionUser()

  const { mutate: upload, isPending } = useMutation({
    onMutate: async () => {
      if (user) {
        try {
          deleteProfileImage({ data: { userId: user?.id ?? '' } })
        } catch (_) {}
      }
    },
    mutationFn: async (file: File) =>
      uploadFile({
        file,
        route: BETTER_UPLOAD_PROFILE_PIC_NAME,
      }),
    onError: () => {
      onError?.()
    },
  })

  return { upload, isPending }
}
