import { Suspense, lazy, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import classNames from 'classnames'
import type { WithHeaderItemProps } from '@/utils/hoc/withHeaderItem'
import Drawer from '@/components/ui/Drawer'
import NavToggle from '@/components/shared/NavToggle'
import { DIR_RTL } from '@/constants/theme.constant'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import navigationConfig from '@/configs/navigation.config'
import appConfig from '@/configs/app.config'
import { useThemeStore } from '@/store/themeStore'
import { useSessionUser } from '@/store/authStore'
import getLastPath from '@/utils/getLastPath'

const VerticalMenuContent = lazy(
  () => import('@/components/template/VerticalMenuContent'),
)

type MobileNavToggleProps = {
  toggled?: boolean
}

type MobileNavProps = {
  translationSetup?: boolean
}

const MobileNavToggle = withHeaderItem<
  MobileNavToggleProps & WithHeaderItemProps
>(NavToggle)

const MobileNav = ({
  translationSetup = appConfig.activeNavTranslation,
}: MobileNavProps) => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const handleOpenDrawer = () => {
    setIsOpen(true)
  }

  const handleDrawerClose = () => {
    setIsOpen(false)
  }

  const direction = useThemeStore((state) => state.direction)
  const currentRouteKey = getLastPath(location.pathname)

  const { user } = useSessionUser()

  return (
    <>
      <div className="text-2xl" onClick={handleOpenDrawer}>
        <MobileNavToggle toggled={isOpen} />
      </div>
      <Drawer
        title="Navigation"
        isOpen={isOpen}
        bodyClass={classNames('p-0')}
        width={330}
        placement={direction === DIR_RTL ? 'right' : 'left'}
        onClose={handleDrawerClose}
        onRequestClose={handleDrawerClose}
      >
        <Suspense fallback={<></>}>
          {isOpen && (
            <VerticalMenuContent
              collapsed={false}
              navigationTree={navigationConfig}
              routeKey={currentRouteKey}
              userAuthority={user?.userAuthority ?? []}
              direction={direction}
              translationSetup={translationSetup}
              onMenuItemClick={handleDrawerClose}
            />
          )}
        </Suspense>
      </Drawer>
    </>
  )
}

export default MobileNav
