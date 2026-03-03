import type { User } from '@/@types/auth'
import { useSession } from '@/lib/auth-client'
import { ADMIN, USER } from '@/constants/roles.constant'

type AuthState = {
  user: (User & { userAuthority: Array<string> }) | null
}

export const useSessionUser = (): AuthState => {
  const { data: session } = useSession()

  return {
    user: session?.user
      ? { ...session.user, userAuthority: [USER, ADMIN] }
      : null,
  }
}
