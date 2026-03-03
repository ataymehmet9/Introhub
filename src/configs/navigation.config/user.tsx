import { PiUserDuotone } from 'react-icons/pi'
import { TbBell, TbLock, TbUserSquare } from 'react-icons/tb'
import type {
  UserMainSettingsNavigation,
  UserSettingsNavigation,
} from '@/@types/navigation'

export const dropdownItemList: Array<UserSettingsNavigation> = [
  {
    label: 'Profile',
    path: '/me',
    icon: <PiUserDuotone />,
  },
]

export const userSettingsMenu: Array<UserMainSettingsNavigation> = [
  {
    label: 'Profile',
    value: 'me',
    path: '/me',
    icon: <TbUserSquare />,
  },
  {
    label: 'Security',
    value: 'security',
    path: '/me/security',
    icon: <TbLock />,
  },
  {
    label: 'Notifications',
    value: 'notifications',
    path: '/me/notifications',
    icon: <TbBell />,
  },
]
