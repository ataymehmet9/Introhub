import type { NavigationTree } from '@/@types/navigation'
import { NAV_ITEM_TYPE_ITEM } from '@/constants/navigation.constant'

const navigationConfig: Array<NavigationTree> = [
  {
    key: 'dashboard',
    path: '/dashboard',
    title: 'Dashboard',
    translateKey: 'nav.home',
    icon: 'home',
    type: NAV_ITEM_TYPE_ITEM,
    authority: [],
    subMenu: [],
  },
  {
    key: 'contacts',
    path: '/contacts',
    title: 'Contacts',
    translateKey: 'nav.contacts',
    icon: 'contacts',
    type: NAV_ITEM_TYPE_ITEM,
    authority: [],
    subMenu: [],
  },
  {
    key: 'search',
    path: '/search',
    title: 'Find Connections',
    translateKey: 'nav.search',
    icon: 'search',
    type: NAV_ITEM_TYPE_ITEM,
    authority: [],
    subMenu: [],
  },
  {
    key: 'requests',
    path: '/requests',
    title: 'Requests',
    translateKey: 'nav.requests',
    icon: 'requests',
    type: NAV_ITEM_TYPE_ITEM,
    authority: [],
    subMenu: [],
  },
]

export default navigationConfig
