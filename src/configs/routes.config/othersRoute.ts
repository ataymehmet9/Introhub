import type { Routes } from '@/@types/routes'
import { ADMIN, USER } from '@/constants/roles.constant'

const othersRoute: Routes = [
  {
    key: 'accessDenied',
    path: `/access-denied`,
    authority: [ADMIN, USER],
    meta: {
      pageBackgroundType: 'plain',
      pageContainerType: 'contained',
    },
  },
]

export default othersRoute
