import { Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PiSignOutDuotone, PiUserDuotone } from 'react-icons/pi'
import { TbCrown } from 'react-icons/tb'
import type { User } from '@/@types/auth'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { useSessionUser } from '@/store/authStore'
import { useLogout } from '@/lib/logout'
import { dropdownItemList } from '@/configs/navigation.config/user'
import { generateFileCloudUrl } from '@/utils/fileUtils'
import { useTRPC } from '@/integrations/trpc/react'

const UserDropdown = () => {
  const { user = {} } = useSessionUser()
  const navigate = useNavigate()
  const { logout } = useLogout()
  const trpc = useTRPC()
  const mainUser: User | null = user as User | null

  // Fetch plan details
  const { data: planDetails } = useQuery({
    ...trpc.billing.getPlanDetails.queryOptions(),
    enabled: !!mainUser,
  })

  // Handle null user during SSR or before session loads
  if (!mainUser) {
    return null
  }

  const { image: avatar, name: userName, email } = mainUser
  const isPro = planDetails?.planType === 'pro'
  const isFree = planDetails?.planType === 'free'

  // Get request usage from subscription details
  const requestsUsed = planDetails?.requestsUsed ?? 0
  const requestLimit = planDetails?.requestsLimit
  const requestsRemaining =
    requestLimit !== null && requestLimit !== undefined
      ? requestLimit - requestsUsed
      : 0

  const handleSignOut = async () => {
    try {
      // Use the secure logout handler that clears all caches
      await logout()
      // Navigate to login after successful logout
      navigate({ to: '/login' })
    } catch (error) {
      console.error('Logout failed:', error)
      // Still navigate to login even if there's an error
      navigate({ to: '/login' })
    }
  }

  const avatarProps = {
    ...(avatar
      ? { src: generateFileCloudUrl(avatar) }
      : { icon: <PiUserDuotone /> }),
  }

  return (
    <Dropdown
      className="flex"
      toggleClassName="flex items-center"
      renderTitle={
        <div className="cursor-pointer flex items-center">
          <Avatar size={32} {...avatarProps} />
        </div>
      }
      placement="bottom-end"
    >
      <Dropdown.Item variant="header">
        <div className="py-2 px-3 flex items-center gap-3">
          <Avatar {...avatarProps} />
          <div className="flex-1">
            <div className="font-bold text-gray-900 dark:text-gray-100">
              {userName || 'Anonymous'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {email || 'No email available'}
            </div>
            {/* Plan Badge */}
            <div className="mt-2 flex items-center gap-2">
              {isPro ? (
                <Badge
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold"
                  innerClass="bg-amber-500 text-white"
                >
                  <TbCrown className="text-sm" />
                  Pro
                </Badge>
              ) : (
                <Badge
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold"
                  innerClass="bg-gray-500 text-white"
                >
                  Free
                </Badge>
              )}
              {/* Show remaining requests for free tier */}
              {isFree && (
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {requestsRemaining}/{requestLimit} requests left
                </span>
              )}
            </div>
          </div>
        </div>
      </Dropdown.Item>
      <Dropdown.Item variant="divider" />
      {/* Upgrade CTA for free tier users */}
      {isFree && (
        <>
          <Dropdown.Item eventKey="upgrade" className="px-0">
            <Link
              className="flex h-full w-full px-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20"
              to="/me/billing"
            >
              <span className="flex gap-2 items-center w-full">
                <span className="text-xl text-amber-600 dark:text-amber-400">
                  <TbCrown />
                </span>
                <span className="font-medium text-amber-700 dark:text-amber-300">
                  Upgrade to Pro
                </span>
              </span>
            </Link>
          </Dropdown.Item>
          <Dropdown.Item variant="divider" />
        </>
      )}
      {dropdownItemList.map((item) => (
        <Dropdown.Item key={item.label} eventKey={item.label} className="px-0">
          <Link className="flex h-full w-full px-2" to={item.path}>
            <span className="flex gap-2 items-center w-full">
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </span>
          </Link>
        </Dropdown.Item>
      ))}
      {dropdownItemList.length > 0 && <Dropdown.Item variant="divider" />}
      <Dropdown.Item
        eventKey="Sign Out"
        className="gap-2"
        onClick={handleSignOut}
      >
        <span className="text-xl">
          <PiSignOutDuotone />
        </span>
        <span>Sign Out</span>
      </Dropdown.Item>
    </Dropdown>
  )
}

const MainUserDropdown = withHeaderItem(UserDropdown)

export default MainUserDropdown
