import type { CSSProperties, ReactNode } from 'react'

export interface CommonProps {
  id?: string
  className?: string
  children?: ReactNode
  style?: CSSProperties
}

export type TableQueries = {
  total?: number
  pageIndex?: number
  pageSize?: number
  query?: string
  sort?: {
    order: 'asc' | 'desc' | ''
    key: string | number
  }
}

export type TraslationFn = (
  key: string,
  fallback?: string | Record<string, string | number>,
) => string

export type View = 'me' | 'security' | 'billing' | 'notifications'
