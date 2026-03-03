import type { CommonProps } from '@/@types/common'
import useAuthority from '@/utils/hooks/useAuthority'

interface AuthorityCheckProps extends CommonProps {
  userAuthority: Array<string>
  authority: Array<string>
}

const AuthorityCheck = (props: AuthorityCheckProps) => {
  const { userAuthority = [], authority = [], children } = props

  const roleMatched = useAuthority(userAuthority, authority)

  return <>{roleMatched ? children : null}</>
}

export default AuthorityCheck
