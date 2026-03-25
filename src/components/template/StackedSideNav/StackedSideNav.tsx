import { useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import isEmpty from 'lodash/isEmpty'
import StackedSideNavMini from './StackedSideNavMini'
import StackedSideNavSecondary from './StackedSideNavSecondary'
import type { SelectedMenuItem } from './StackedSideNavMini'
import type { TraslationFn } from '@/@types/common'
import {
  DIR_LTR,
  DIR_RTL,
  SPLITTED_SIDE_NAV_MINI_WIDTH,
  STACKED_SIDE_NAV_SECONDARY_WIDTH,
} from '@/constants/theme.constant'
import useResponsive from '@/utils/hooks/useResponsive'
import { useThemeStore } from '@/store/themeStore'
import { useSessionUser } from '@/store/authStore'
import navigationConfig from '@/configs/navigation.config'
import appConfig from '@/configs/app.config'
import useTranslation from '@/utils/hooks/useTranslation'
import getLastPath from '@/utils/getLastPath'

const stackedSideNavDefaultStyle = {
  width: SPLITTED_SIDE_NAV_MINI_WIDTH,
}

const StackedSideNav = ({
  translationSetup = appConfig.activeNavTranslation,
}: {
  translationSetup?: boolean
}) => {
  const location = useLocation()
  const { t } = useTranslation(!translationSetup)

  const [selectedMenu, setSelectedMenu] = useState<SelectedMenuItem>({})
  const [activeKeys, setActiveKeys] = useState<Array<string>>([])

  const mode = useThemeStore((state) => state.mode)
  const direction = useThemeStore((state) => state.direction)

  const currentRouteKey = getLastPath(location.pathname)

  const { user } = useSessionUser()

  const { larger } = useResponsive()

  const navColor = (navType: string, navMode: string) => {
    return `${navType}-${navMode}`
  }

  const handleChange = (selected: SelectedMenuItem) => {
    setSelectedMenu(selected)
  }

  const handleCollpase = () => {
    setSelectedMenu({})
    setActiveKeys([])
  }

  const handleSetActiveKey = (key: Array<string>) => {
    setActiveKeys(key)
  }

  const stackedSideNavSecondaryDirStyle = () => {
    let style = {}
    const marginValue = `${-STACKED_SIDE_NAV_SECONDARY_WIDTH}px`
    if (direction === DIR_LTR) {
      style = { marginLeft: marginValue }
    }

    if (direction === DIR_RTL) {
      style = { marginRight: marginValue }
    }

    return style
  }

  return (
    <>
      {larger.md && (
        <div className={`stacked-side-nav`}>
          <StackedSideNavMini
            className={`stacked-side-nav-mini ${navColor(
              'stacked-side-nav-mini',
              mode,
            )}`}
            style={stackedSideNavDefaultStyle}
            routeKey={currentRouteKey}
            activeKeys={activeKeys}
            mode={mode}
            direction={direction}
            navigationTree={navigationConfig}
            userAuthority={user?.userAuthority ?? []}
            selectedMenu={selectedMenu}
            t={t as TraslationFn}
            onChange={handleChange}
            onSetActiveKey={handleSetActiveKey}
          />
          <div
            className={`stacked-side-nav-secondary ${navColor(
              'stacked-side-nav-secondary',
              mode,
            )}`}
            style={{
              width: STACKED_SIDE_NAV_SECONDARY_WIDTH,
              ...(isEmpty(selectedMenu)
                ? stackedSideNavSecondaryDirStyle()
                : {}),
            }}
          >
            {!isEmpty(selectedMenu) && (
              <StackedSideNavSecondary
                title={t(
                  selectedMenu.translateKey as string,
                  selectedMenu.title as string,
                )}
                menu={selectedMenu.menu}
                routeKey={currentRouteKey}
                direction={direction}
                translationSetup={translationSetup}
                userAuthority={user?.userAuthority ?? []}
                onCollapse={handleCollpase}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default StackedSideNav
