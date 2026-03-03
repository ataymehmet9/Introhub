import { useLocation } from '@tanstack/react-router'
import AuthLayout from './AuthLayout'
import type { CommonProps } from '@/@types/common'
import authRoute from '@/configs/routes.config/authRoute'

const PreLoginLayout = ({ children }: CommonProps) => {
  const location = useLocation()

  const { pathname } = location

  const isAuthPath = authRoute.some((route) => route.path === pathname)

  return (
    <div
      className="app-layout-blank layout-stable flex flex-auto flex-col min-h-screen"
      data-layout="pre-login"
    >
      {isAuthPath ? <AuthLayout>{children}</AuthLayout> : children}
    </div>
  )
}

export default PreLoginLayout
