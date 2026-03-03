import { useMutation } from '@tanstack/react-query'
import type { UpdateUser } from '@/schemas'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { Notification, toast } from '@/components/ui'
import { useSession } from '@/lib/auth-client'

type UseUserOptions = {
  onUpdateSuccess?: () => void
}

export function useUser(options: UseUserOptions = {}) {
  const { onUpdateSuccess } = options
  const session = useSession()

  const updateUserMutation = useMutation({
    mutationFn: (data: UpdateUser) => trpcClient.users.update.mutate(data),
    onError: (error: Error) => {
      toast.push(
        <Notification type="danger" title="Error">
          {error.message || 'Failed to update profile'}
        </Notification>,
      )
    },
    onSuccess: async () => {
      // Refetch the session using the useSession hook's refetch method
      await session.refetch()

      toast.push(
        <Notification type="success" title="Profile updated">
          Profile has been successfully updated
        </Notification>,
      )

      onUpdateSuccess?.()
    },
  })

  return {
    updateUser: updateUserMutation.mutateAsync,
    isUpdating: updateUserMutation.isPending,
  }
}
