import { Link, useLocation } from '@tanstack/react-router'
import type { Mode } from '@/@types/theme'
import classNames from '@/utils/classNames'
import getLastPath from '@/utils/getLastPath'
import ScrollBar from '@/components/ui/ScrollBar'
import Logo from '@/components/template/Logo'
import VerticalMenuContent from '@/components/template/VerticalMenuContent'
import { useThemeStore } from '@/store/themeStore'
import { useSessionUser } from '@/store/authStore'
import navigationConfig from '@/configs/navigation.config'
import appConfig from '@/configs/app.config'
import {
  HEADER_HEIGHT,
  LOGO_X_GUTTER,
  SIDE_NAV_COLLAPSED_WIDTH,
  SIDE_NAV_CONTENT_GUTTER,
  SIDE_NAV_WIDTH,
} from '@/constants/theme.constant'

type SideNavProps = {
  translationSetup?: boolean
  background?: boolean
  className?: string
  contentClass?: string
  mode?: Mode
}

const sideNavStyle = {
  width: SIDE_NAV_WIDTH,
  minWidth: SIDE_NAV_WIDTH,
}

const sideNavCollapseStyle = {
  width: SIDE_NAV_COLLAPSED_WIDTH,
  minWidth: SIDE_NAV_COLLAPSED_WIDTH,
}

const SideNav = ({
  translationSetup = appConfig.activeNavTranslation,
  background = true,
  className,
  contentClass,
  mode,
}: SideNavProps) => {
  const location = useLocation()
  const defaultMode = useThemeStore((state) => state.mode)
  const direction = useThemeStore((state) => state.direction)
  const sideNavCollapse = useThemeStore((state) => state.layout.sideNavCollapse)

  const currentRouteKey = getLastPath(location.pathname)

  const { user } = useSessionUser()

  return (
    <div
      style={sideNavCollapse ? sideNavCollapseStyle : sideNavStyle}
      className={classNames(
        'side-nav',
        background && 'side-nav-bg',
        !sideNavCollapse && 'side-nav-expand',
        className,
      )}
    >
      <Link
        to={appConfig.authenticatedEntryPath}
        className="side-nav-header flex flex-col justify-center"
        style={{ height: HEADER_HEIGHT }}
      >
        <Logo
          imgClass="max-h-10"
          mode={mode || defaultMode}
          type={sideNavCollapse ? 'streamline' : 'full'}
          className={classNames(
            sideNavCollapse && 'ltr:ml-[11.5px] ltr:mr-[11.5px]',
            sideNavCollapse ? SIDE_NAV_CONTENT_GUTTER : LOGO_X_GUTTER,
          )}
        />
      </Link>
      <div className={classNames('side-nav-content', contentClass)}>
        <ScrollBar style={{ height: '100%' }} direction={direction}>
          <VerticalMenuContent
            collapsed={sideNavCollapse}
            navigationTree={navigationConfig}
            routeKey={currentRouteKey}
            direction={direction}
            translationSetup={translationSetup}
            userAuthority={user?.userAuthority ?? []}
          />
        </ScrollBar>
      </div>
    </div>
  )
}

export default SideNav
