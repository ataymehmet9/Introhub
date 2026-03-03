import type { ControlSize, Direction, LayoutType, Mode } from '@/@types/theme'
import { THEME_ENUM } from '@/constants/theme.constant'

export type ThemeConfig = {
  themeSchema: string
  direction: Direction
  mode: Mode
  panelExpand: boolean
  controlSize: ControlSize
  layout: {
    type: LayoutType
    sideNavCollapse: boolean
  }
}

/**
 * Since some configurations need to be match with specific themes,
 * we recommend to use the configuration that generated from demo.
 */
export const themeConfig: ThemeConfig = {
  themeSchema: 'orange',
  direction: THEME_ENUM.DIR_LTR,
  mode: THEME_ENUM.MODE_DARK,
  panelExpand: false,
  controlSize: 'md',
  layout: {
    type: THEME_ENUM.LAYOUT_FRAMELESS_SIDE,
    sideNavCollapse: false,
  },
}
