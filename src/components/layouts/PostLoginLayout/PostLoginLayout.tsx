import CollapsibleSide from './components/CollapsibleSide'
import StackedSide from './components/StackedSide'
import TopBarClassic from './components/TopBarClassic'
import FrameLessSide from './components/FrameLessSide'
import ContentOverlay from './components/ContentOverlay'
import Blank from './components/Blank'
import type { CommonProps } from '@/@types/common'
import type { ComponentType } from 'react'
import type { LayoutType } from '@/@types/theme'
import {
  LAYOUT_BLANK,
  LAYOUT_COLLAPSIBLE_SIDE,
  LAYOUT_CONTENT_OVERLAY,
  LAYOUT_FRAMELESS_SIDE,
  LAYOUT_STACKED_SIDE,
  LAYOUT_TOP_BAR_CLASSIC,
} from '@/constants/theme.constant'

type Layouts = Record<string, ComponentType<CommonProps>>

interface PostLoginLayoutProps extends CommonProps {
  layoutType: LayoutType
}

const layouts: Layouts = {
  [LAYOUT_COLLAPSIBLE_SIDE]: CollapsibleSide,
  [LAYOUT_STACKED_SIDE]: StackedSide,
  [LAYOUT_TOP_BAR_CLASSIC]: TopBarClassic,
  [LAYOUT_FRAMELESS_SIDE]: FrameLessSide,
  [LAYOUT_CONTENT_OVERLAY]: ContentOverlay,
  [LAYOUT_BLANK]: Blank,
}

const PostLoginLayout = ({ layoutType, children }: PostLoginLayoutProps) => {
  const AppLayout = layouts[layoutType] ?? layouts[Object.keys(layouts)[0]]

  return <AppLayout>{children}</AppLayout>
}

export default PostLoginLayout
