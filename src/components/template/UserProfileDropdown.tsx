import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { useSessionUser } from '@/store/authStore'
import { Link, useNavigate } from '@tanstack/react-router'
import { PiUserDuotone, PiSignOutDuotone } from 'react-icons/pi'
import { signOut } from '@/lib/auth-client'
import { User } from '@/@types/auth'
import { dropdownItemList } from '@/configs/navigation.config/user'
import { generateFileCloudUrl } from '@/utils/fileUtils'

const UserDropdown = () => {
  const { user = {} } = useSessionUser()
  const navigate = useNavigate()
  const mainUser: User | null = user as User | null

  // Handle null user during SSR or before session loads
  if (!mainUser) {
    return null
  }

  const { image: avatar, name: userName, email } = mainUser

  const handleSignOut = () => {
    signOut()
    navigate({ to: '/login' })
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
          <div>
            <div className="font-bold text-gray-900 dark:text-gray-100">
              {userName || 'Anonymous'}
            </div>
            <div className="text-xs">{email || 'No email available'}</div>
          </div>
        </div>
      </Dropdown.Item>
      <Dropdown.Item variant="divider" />
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
      {dropdownItemList.length && <Dropdown.Item variant="divider" />}
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
