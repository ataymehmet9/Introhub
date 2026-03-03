import type { JSX, ReactNode } from 'react'
import type { View } from '@/@types/common'

export type HorizontalMenuMeta =
  | {
      layout: 'default'
    }
  | {
      layout: 'columns'
      showColumnTitle?: boolean
      columns: 1 | 2 | 3 | 4 | 5
    }
  | {
      layout: 'tabs'
      columns: 1 | 2 | 3 | 4 | 5
    }

export interface NavigationTree {
  key: string
  path: string
  isExternalLink?: boolean
  title: string
  translateKey: string
  icon: string
  type: 'title' | 'collapse' | 'item'
  authority: Array<string>
  subMenu: Array<NavigationTree>
  description?: string
  meta?: {
    horizontalMenu?: HorizontalMenuMeta
    description?: {
      translateKey: string
      label: string
    }
  }
}

export interface UserSettingsNavigation {
  label: string
  path: string
  icon: JSX.Element
}

export interface UserMainSettingsNavigation {
  label: string
  value: View
  icon: ReactNode
  path: string
}
