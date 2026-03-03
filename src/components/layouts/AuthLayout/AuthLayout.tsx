import { useMemo } from 'react'
import Simple from './Simple'
import Split from './Split'
import Side from './Side'
import type { ComponentType } from 'react'
import type { CommonProps } from '@/@types/common'

type LayoutType = 'simple' | 'split' | 'side'

type Layouts = Record<LayoutType, ComponentType<CommonProps>>

const currentLayoutType: LayoutType = 'side'

const layouts: Layouts = {
  simple: Simple,
  split: Split,
  side: Side,
}

const AuthLayout = ({ children }: CommonProps) => {
  const Layout = useMemo(() => {
    return layouts[currentLayoutType]
  }, [])

  return <Layout>{children}</Layout>
}

export default AuthLayout
