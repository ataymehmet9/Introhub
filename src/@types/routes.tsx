import type { LayoutType } from './theme'
import type { JSX, LazyExoticComponent, ReactNode } from 'react'

export type PageHeaderProps = {
  title?: string | ReactNode | LazyExoticComponent<() => JSX.Element>
  description?: string | ReactNode
  contained?: boolean
  extraHeader?: string | ReactNode | LazyExoticComponent<() => JSX.Element>
}

export interface Meta {
  pageContainerType?: 'default' | 'gutterless' | 'contained'
  pageBackgroundType?: 'default' | 'plain'
  header?: PageHeaderProps
  footer?: boolean
  layout?: LayoutType
}

export type Route = {
  key: string
  path: string
  authority: Array<string>
  meta?: Meta
}

export type Routes = Array<Route>
