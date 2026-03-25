import type { CommonProps } from '@/@types/common'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { useThemeStore } from '@/store/themeStore'
import useResponsive from '@/utils/hooks/useResponsive'
import NavToggle from '@/components/shared/NavToggle'

// eslint-disable-next-line react-refresh/only-export-components
const SideNavToggle = ({ className }: CommonProps) => {
  const { layout, setSideNavCollapse } = useThemeStore((state) => state)

  const sideNavCollapse = layout.sideNavCollapse

  const { larger } = useResponsive()

  const onCollapse = () => {
    setSideNavCollapse(!sideNavCollapse)
  }

  return (
    <>
      {larger.md && (
        <div className={className} role="button" onClick={onCollapse}>
          <NavToggle className="text-2xl" toggled={sideNavCollapse} />
        </div>
      )}
    </>
  )
}

const _SideNavToggle = withHeaderItem(SideNavToggle)

export default _SideNavToggle
