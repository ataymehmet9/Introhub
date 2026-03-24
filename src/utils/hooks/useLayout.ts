import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type {
  PageContainerBody,
  PageContainerFooter,
  PageContainerHeader,
  PageContainerProps,
} from '@/components/template/PageContainer'
import type { LayoutType } from '@/@types/theme'
import { LAYOUT_COLLAPSIBLE_SIDE } from '@/constants/theme.constant'

export type PageContainerReassembleProps = {
  defaultClass: string
  pageContainerGutterClass: string
  pageContainerDefaultClass: string
  PageContainerHeader: typeof PageContainerHeader
  PageContainerBody: typeof PageContainerBody
  PageContainerFooter: typeof PageContainerFooter
} & PageContainerProps

export interface LayoutContextProps {
  type: LayoutType
  adaptiveCardActive?: boolean
  pageContainerReassemble?: (props: PageContainerReassembleProps) => ReactNode
}

export const LayoutContext = createContext<LayoutContextProps | undefined>(
  undefined,
)

const useLayout = (): LayoutContextProps => {
  const context = useContext(LayoutContext)
  if (!context) {
    // Return default values for SSR or when context is not available
    return {
      type: LAYOUT_COLLAPSIBLE_SIDE,
      adaptiveCardActive: false,
    }
  }
  return context
}

export default useLayout
